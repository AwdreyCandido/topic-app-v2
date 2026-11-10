import Dexie, { type Table } from "dexie";
import type {
  Flashcard,
  Review,
  StudySession,
  Subject,
  Tag,
  Topic,
} from "../types";
import { textDocument, documentText } from "../domain/documents";
import { isoDate } from "../domain/migration";

interface Meta {
  key: string;
  value: string;
}

export class TopicDatabase extends Dexie {
  subjects!: Table<Subject, string>;
  topics!: Table<Topic, string, Omit<Topic, "summary"> & { summary: unknown }>;
  flashcards!: Table<
    Flashcard,
    string,
    Omit<Flashcard, "question" | "answer"> & {
      question: unknown;
      answer: unknown;
    }
  >;
  tags!: Table<Tag, string>;
  sessions!: Table<StudySession, string>;
  reviews!: Table<Review, string>;
  meta!: Table<Meta, string>;

  constructor(name = "topic-study") {
    super(name);
    this.version(1).stores({
      subjects: "id,&path,updatedAt",
      topics: "id,subjectId,&[subjectId+path],updatedAt",
      flashcards: "id,topicId,*tags,updatedAt",
      tags: "id,&name",
      sessions: "id,startedAt",
      reviews: "id,sessionId,cardId,&[sessionId+position],reviewedAt",
      meta: "key",
    });
    this.version(2)
      .stores({
        flashcards: "id,topicId,*tags,updatedAt,status",
      })
      .upgrade(async (tx) => {
        for (const tableName of ["subjects", "topics", "flashcards", "tags"]) {
          const table = tx.table(tableName);
          const values = (await table.toArray()) as Record<string, unknown>[];
          await table.clear();
          for (const item of values) {
            item.id = String(item.id);
            if (item.subjectId !== undefined)
              item.subjectId = String(item.subjectId);
            if (item.topicId !== undefined) item.topicId = String(item.topicId);
            if (Array.isArray(item.tags)) item.tags = item.tags.map(String);
            if (tableName !== "tags") {
              item.createdAt = isoDate(item.createdAt);
              item.updatedAt = isoDate(item.updatedAt);
              item.favorite ??= false;
              item.archivedAt ??= null;
            }
            if (tableName === "topics") {
              item.summary ??= textDocument();
              item.summaryText ??= "";
            }
            if (tableName === "flashcards") {
              if (typeof item.question === "string")
                item.question = textDocument(item.question);
              if (typeof item.answer === "string")
                item.answer = textDocument(item.answer);
              item.questionText = documentText(
                item.question as Flashcard["question"],
              );
              item.answerText = documentText(
                item.answer as Flashcard["answer"],
              );
              item.status ??=
                item.questionText && item.answerText ? "ready" : "draft";
              item.revision ??= 1;
            }
            await table.put(item);
          }
        }
      });
  }
}

export const database = new TopicDatabase();
