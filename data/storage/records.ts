import { isoDate } from "../domain/migration";
import { textDocument } from "../domain/documents";
import type {
  LibraryData,
  Subject,
  Topic,
  Flashcard,
  Tag,
  StudySession,
  Review,
  RichDocument,
} from "../types";
import type {
  SubjectRow,
  TopicRow,
  FlashcardRecord,
  TagRow,
  SessionRecord,
  ReviewRecord,
} from "../../src/lib/supabase/database.types";
type TopicListRecord = Omit<TopicRow, "summary"> & {
  summary?: TopicRow["summary"];
};
type FlashcardListRecord = Omit<FlashcardRecord, "question" | "answer"> & {
  question?: FlashcardRecord["question"];
  answer?: FlashcardRecord["answer"];
};
const optionalDate = (value: string | null) =>
  value === null ? null : isoDate(value);
export const emptyLibrary = (): LibraryData => ({
  subjects: [],
  topics: [],
  flashcards: [],
  tags: [],
  sessions: [],
  reviews: [],
});
export const subjectFromRow = (row: SubjectRow): Subject => ({
  id: row.id,
  name: row.name,
  path: row.path,
  description: row.description,
  favorite: row.favorite,
  archivedAt: optionalDate(row.archived_at),
  createdAt: isoDate(row.created_at),
  updatedAt: isoDate(row.updated_at),
  revision: row.revision,
});
export const topicFromRow = (row: TopicListRecord): Topic => ({
  ...subjectFromRow(row),
  subjectId: row.subject_id,
  summary: row.summary
    ? (row.summary as unknown as RichDocument)
    : textDocument(),
  summaryLoaded: !!row.summary,
  summaryText: row.summary_text,
  summaryRevision: row.summary_revision,
});
export const flashcardFromRow = (row: FlashcardListRecord): Flashcard => ({
  id: row.id,
  topicId: row.topic_id,
  question: row.question
    ? (row.question as unknown as RichDocument)
    : textDocument(),
  answer: row.answer ? (row.answer as unknown as RichDocument) : textDocument(),
  contentLoaded: !!row.question && !!row.answer,
  questionText: row.question_text,
  answerText: row.answer_text,
  tags: row.tag_ids,
  status: row.status,
  favorite: row.favorite,
  archivedAt: optionalDate(row.archived_at),
  revision: row.revision,
  createdAt: isoDate(row.created_at),
  updatedAt: isoDate(row.updated_at),
});
export const tagFromRow = (row: TagRow): Tag => ({
  id: row.id,
  name: row.name,
  color: row.color,
});
export const sessionFromRow = (row: SessionRecord): StudySession => ({
  id: row.id,
  title: row.title,
  cardIds: row.card_ids,
  currentIndex: row.current_index,
  startedAt: isoDate(row.started_at),
  completedAt: optionalDate(row.completed_at),
});
export const reviewFromRow = (row: ReviewRecord): Review => ({
  id: row.id,
  sessionId: row.session_id,
  position: row.position,
  cardId: row.card_id,
  cardKey: row.card_key,
  question: row.question_snapshot,
  topic: row.topic_snapshot,
  subject: row.subject_snapshot,
  rating: row.rating,
  reviewedAt: isoDate(row.reviewed_at),
});
export type RawChanges = {
  subjects?: SubjectRow[];
  topics?: TopicListRecord[];
  flashcards?: FlashcardListRecord[];
  tags?: TagRow[];
  sessions?: SessionRecord[];
  reviews?: ReviewRecord[];
  removed?: Partial<Record<keyof LibraryData, string[]>>;
};
export type LibraryChange = {
  userId: string;
  data: LibraryData;
  removed?: RawChanges["removed"];
  replace?: boolean;
};
export function changesFromRows(raw: RawChanges): LibraryData {
  return {
    subjects: (raw.subjects ?? []).map(subjectFromRow),
    topics: (raw.topics ?? []).map(topicFromRow),
    flashcards: (raw.flashcards ?? []).map(flashcardFromRow),
    tags: (raw.tags ?? []).map(tagFromRow),
    sessions: (raw.sessions ?? []).map(sessionFromRow),
    reviews: (raw.reviews ?? []).map(reviewFromRow),
  };
}
export function applyLibraryChange(
  current: LibraryData,
  change: LibraryChange,
): LibraryData {
  if (change.replace) return change.data;
  function merge<T extends { id: string }>(
    key: keyof LibraryData,
    rows: T[],
    incoming: T[],
  ): T[] {
    if (!incoming.length && !change.removed?.[key]?.length) return rows;
    const removed = new Set(change.removed?.[key] ?? []);
    const values = new Map(
      rows.filter((row) => !removed.has(row.id)).map((row) => [row.id, row]),
    );
    for (const row of incoming) values.set(row.id, row);
    return [...values.values()];
  }
  return {
    subjects: merge("subjects", current.subjects, change.data.subjects),
    topics: merge("topics", current.topics, change.data.topics),
    flashcards: merge("flashcards", current.flashcards, change.data.flashcards),
    tags: merge("tags", current.tags, change.data.tags),
    sessions: merge("sessions", current.sessions, change.data.sessions),
    reviews: merge("reviews", current.reviews, change.data.reviews),
  };
}

export function preserveLoadedDocuments(
  current: LibraryData | undefined,
  incoming: LibraryData,
): LibraryData {
  if (!current) return incoming;
  const cards = new Map(current.flashcards.map((card) => [card.id, card]));
  const topics = new Map(current.topics.map((topic) => [topic.id, topic]));
  return {
    ...incoming,
    flashcards: incoming.flashcards.map((card) => {
      const previous = cards.get(card.id);
      return !card.contentLoaded &&
        previous?.contentLoaded &&
        previous.revision === card.revision
        ? {
            ...card,
            question: previous.question,
            answer: previous.answer,
            contentLoaded: true,
          }
        : card;
    }),
    topics: incoming.topics.map((topic) => {
      const previous = topics.get(topic.id);
      return !topic.summaryLoaded &&
        previous?.summaryLoaded &&
        previous.summaryRevision === topic.summaryRevision
        ? { ...topic, summary: previous.summary, summaryLoaded: true }
        : topic;
    }),
  };
}
