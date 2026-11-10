import type { ISubjectRepository } from "../repositories/ISubjectRepository";
import type { ITopicRepository } from "../repositories/ITopicRepository";
import type { IFlashcardRepository } from "../repositories/IFlashcardRepository";
import { getSupabase } from "../../src/lib/supabase/client";
import type { Database } from "../../src/lib/supabase/database.types";
import type {
  Backup,
  EntityKind,
  Flashcard,
  Json,
  LibraryData,
  Rating,
  RichDocument,
  Subject,
  Topic,
} from "../types";
import {
  documentText,
  textDocument,
  validateDocument,
} from "../domain/documents";
import { validateLibrary } from "../domain/backup";
import {
  changesFromRows,
  type RawChanges,
  type LibraryChange,
} from "./records";

type Client = ReturnType<typeof getSupabase>;
type Functions = Database["public"]["Functions"];
type Relation =
  | "subjects"
  | "topics"
  | "flashcard_records"
  | "tags"
  | "session_records"
  | "review_records";
export const libraryEvents = new EventTarget();
const asJson = (value: unknown) => value as Json;

function databaseError(error: { code?: string; message: string }) {
  if (["PGRST205", "PGRST202", "42P01", "42883"].includes(error.code ?? ""))
    return new Error(
      "O banco precisa ser atualizado. Execute a migration 202611090001_normalize_library.sql no Supabase.",
    );
  if (error.code === "23505")
    return new Error("Já existe um registro com esse nome ou identificador.");
  if (error.code === "23503")
    return new Error(
      "Um tópico, cartão ou tag foi excluído. Atualize seus dados e tente novamente.",
    );
  return new Error(error.message);
}

export class SupabaseLibraryRepository
  implements ISubjectRepository, ITopicRepository, IFlashcardRepository
{
  private pending: Promise<unknown> = Promise.resolve();
  constructor(private readonly client: () => Client = getSupabase) {}

  private async run<T>(
    work: (client: Client, owner: string) => Promise<T>,
  ): Promise<T> {
    const client = this.client();
    const { data: session } = await client.auth.getSession();
    const owner = session.session?.user.id;
    if (!owner) throw new Error("Entre para acessar seus dados.");
    const operation = this.pending.then(async () => {
      const { data, error } = await client.auth.getUser();
      if (error || data.user?.id !== owner)
        throw new Error("Sua sessão ou conta foi alterada. Entre novamente.");
      return work(client, owner);
    });
    this.pending = operation.catch(() => undefined);
    return operation;
  }

  private publish(owner: string, raw: RawChanges, replace = false) {
    const change: LibraryChange = {
      userId: owner,
      data: changesFromRows(raw),
      removed: raw.removed,
      replace,
    };
    libraryEvents.dispatchEvent(
      new CustomEvent<LibraryChange>("change", { detail: change }),
    );
    return change.data;
  }

  private async mutate<Name extends keyof Functions>(
    name: Name,
    args: Functions[Name]["Args"],
  ): Promise<LibraryData> {
    return this.run(async (client, owner) => {
      const { data, error } = await client.rpc(name, {
        ...args,
        p_expected_user: owner,
      });
      if (error) throw databaseError(error);
      return this.publish(owner, data as unknown as RawChanges);
    });
  }

  private async readRows(client: Client, owner: string, relation: Relation) {
    const rows: unknown[] = [];
    let cursor: string | undefined;
    while (true) {
      const source =
        relation === "subjects"
          ? client.from("subjects")
          : relation === "topics"
            ? client.from("topics")
            : relation === "flashcard_records"
              ? client.from("flashcard_records")
              : relation === "tags"
                ? client.from("tags")
                : relation === "session_records"
                  ? client.from("session_records")
                  : client.from("review_records");
      const columns =
        relation === "topics"
          ? "user_id,id,subject_id,name,path,description,summary_text,summary_revision,favorite,archived_at,revision,created_at,updated_at"
          : relation === "flashcard_records"
            ? "user_id,id,topic_id,question_text,answer_text,status,favorite,archived_at,revision,created_at,updated_at,tag_ids"
            : "*";
      let request = source
        .select(columns)
        .eq("user_id", owner)
        .order("id")
        .limit(500);
      if (cursor) request = request.gt("id", cursor);
      const { data, error } = await request;
      if (error) throw databaseError(error);
      if (!data?.length) break;
      rows.push(...data);
      cursor = (data[data.length - 1] as unknown as { id: string }).id;
      if (data.length < 500) break;
    }
    return rows;
  }

  async snapshot(): Promise<LibraryData> {
    return this.run(async (client, owner) => {
      const [subjects, topics, flashcards, tags, sessions, reviews] =
        await Promise.all([
          this.readRows(client, owner, "subjects"),
          this.readRows(client, owner, "topics"),
          this.readRows(client, owner, "flashcard_records"),
          this.readRows(client, owner, "tags"),
          this.readRows(client, owner, "session_records"),
          this.readRows(client, owner, "review_records"),
        ]);
      return changesFromRows({
        subjects,
        topics,
        flashcards,
        tags,
        sessions,
        reviews,
      } as RawChanges);
    });
  }

  async getFlashcard(id: string): Promise<Flashcard> {
    return this.run(async (client, owner) => {
      const { data, error } = await client
        .from("flashcard_records")
        .select("*")
        .eq("user_id", owner)
        .eq("id", id)
        .single();
      if (error) throw databaseError(error);
      return this.publish(owner, { flashcards: [data] }).flashcards[0];
    });
  }

  async getTopic(id: string): Promise<Topic> {
    return this.run(async (client, owner) => {
      const { data, error } = await client
        .from("topics")
        .select("*")
        .eq("user_id", owner)
        .eq("id", id)
        .single();
      if (error) throw databaseError(error);
      return this.publish(owner, { topics: [data] }).topics[0];
    });
  }

  async backup(): Promise<Backup> {
    return this.run(async (client, owner) => {
      const { data, error } = await client.rpc("topic_export_backup", {
        p_expected_user: owner,
      });
      if (error) throw databaseError(error);
      return {
        format: "topic-backup",
        version: 2,
        exportedAt: new Date().toISOString(),
        data: changesFromRows(data as unknown as RawChanges),
      };
    });
  }

  async restore(backup: Backup) {
    const validated = validateLibrary(backup.data);
    await this.run(async (client, owner) => {
      const { error } = await client.rpc("topic_restore_backup", {
        p_payload: asJson(validated),
        p_expected_user: owner,
      });
      if (error) throw databaseError(error);
      const { data, error: refreshError } = await client.rpc(
        "topic_export_backup",
        { p_expected_user: owner },
      );
      if (refreshError) throw databaseError(refreshError);
      this.publish(owner, data as unknown as RawChanges, true);
    });
  }

  async createSubject(input: {
    name: string;
    description?: string;
  }): Promise<Subject> {
    const data = await this.mutate("topic_create_subject", {
      p_id: crypto.randomUUID(),
      p_name: input.name,
      p_description: input.description ?? "",
    });
    return data.subjects[0];
  }

  async updateSubject(
    id: string,
    input: { name: string; description: string },
    expectedRevision: number,
  ) {
    await this.mutate("topic_update_subject", {
      p_id: id,
      p_name: input.name,
      p_description: input.description,
      p_expected_revision: expectedRevision,
    });
  }

  async createTopic(
    subjectId: string,
    input: { name: string; description?: string },
  ): Promise<Topic> {
    const data = await this.mutate("topic_create_topic", {
      p_id: crypto.randomUUID(),
      p_subject_id: subjectId,
      p_name: input.name,
      p_description: input.description ?? "",
    });
    return data.topics[0];
  }

  async updateTopic(
    id: string,
    input: { name: string; description: string },
    expectedRevision: number,
  ) {
    await this.mutate("topic_update_topic", {
      p_id: id,
      p_name: input.name,
      p_description: input.description,
      p_expected_revision: expectedRevision,
    });
  }

  async saveSummary(
    id: string,
    content: RichDocument,
    expectedRevision: number,
  ): Promise<Topic> {
    const summary = validateDocument(content);
    const data = await this.mutate("topic_save_summary", {
      p_id: id,
      p_summary: asJson(summary),
      p_expected_revision: expectedRevision,
    });
    return data.topics[0];
  }

  async createFlashcard(topicId: string): Promise<Flashcard> {
    const data = await this.mutate("topic_save_flashcard", {
      p_id: crypto.randomUUID(),
      p_topic_id: topicId,
      p_question: asJson(textDocument()),
      p_answer: asJson(textDocument()),
      p_tag_ids: [],
      p_status: "draft",
      p_favorite: false,
      p_archived_at: null,
      p_expected_revision: null,
    });
    return data.flashcards[0];
  }

  async saveFlashcard(input: Flashcard): Promise<Flashcard> {
    const question = validateDocument(input.question),
      answer = validateDocument(input.answer);
    const data = await this.mutate("topic_save_flashcard", {
      p_id: input.id,
      p_topic_id: input.topicId,
      p_question: asJson(question),
      p_answer: asJson(answer),
      p_tag_ids: [...new Set(input.tags)],
      p_status:
        input.status === "ready" &&
        documentText(question) &&
        documentText(answer)
          ? "ready"
          : "draft",
      p_favorite: input.favorite,
      p_archived_at: input.archivedAt,
      p_expected_revision: input.revision,
    });
    return data.flashcards[0];
  }

  async duplicateFlashcard(id: string): Promise<Flashcard> {
    const data = await this.mutate("topic_duplicate_flashcard", {
      p_id: id,
      p_new_id: crypto.randomUUID(),
    });
    return data.flashcards[0];
  }

  async setFavorite(kind: EntityKind, id: string, favorite: boolean) {
    await this.mutate("topic_set_favorite", {
      p_kind: kind,
      p_id: id,
      p_favorite: favorite,
    });
  }

  async setArchived(kind: EntityKind, id: string, archived: boolean) {
    await this.mutate("topic_set_archived", {
      p_kind: kind,
      p_id: id,
      p_archived: archived,
    });
  }

  async remove(kind: EntityKind, id: string) {
    await this.mutate("topic_delete_entity", { p_kind: kind, p_id: id });
  }

  async saveTag(name: string, color: string, id = crypto.randomUUID()) {
    await this.mutate("topic_save_tag", {
      p_id: id,
      p_name: name,
      p_color: color,
    });
  }

  async removeTag(id: string) {
    await this.mutate("topic_delete_tag", { p_id: id });
  }

  async createSession(cardIds: string[], title: string, shuffle: boolean) {
    const queue = [...new Set(cardIds)];
    if (shuffle)
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
    const data = await this.mutate("topic_create_session", {
      p_id: crypto.randomUUID(),
      p_card_ids: queue,
      p_title: title,
    });
    return data.sessions[0];
  }

  async rate(sessionId: string, position: number, rating: Rating | null) {
    await this.mutate("topic_rate", {
      p_session_id: sessionId,
      p_position: position,
      p_rating: rating,
    });
  }

  async endSession(id: string) {
    await this.mutate("topic_end_session", { p_id: id });
  }
}

export const repository = new SupabaseLibraryRepository();
