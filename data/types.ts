export type Json =
  string | number | boolean | null | Json[] | { [key: string]: Json };

export interface DocumentBlock {
  id?: string;
  type: string;
  props?: Record<string, Json>;
  content?: Json;
  children?: DocumentBlock[];
}

export interface RichDocument {
  version: 1;
  blocks: DocumentBlock[];
}

export interface Entity {
  revision?: number;
  id: string;
  name: string;
  path: string;
  description: string;
  favorite: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Subject = Entity;

export interface Topic extends Entity {
  summaryLoaded?: boolean;
  summaryRevision?: number;
  subjectId: string;
  summary: RichDocument;
  summaryText: string;
}

export interface Flashcard {
  contentLoaded?: boolean;
  id: string;
  topicId: string;
  question: RichDocument;
  answer: RichDocument;
  questionText: string;
  answerText: string;
  tags: string[];
  favorite: boolean;
  status: "draft" | "ready";
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  revision: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type Rating = "again" | "hard" | "good" | "easy";

export interface Review {
  id: string;
  sessionId: string;
  cardId: string | null;
  cardKey: string;
  position: number;
  question: string;
  topic: string;
  subject: string;
  rating: Rating;
  reviewedAt: string;
}

export interface StudySession {
  id: string;
  cardIds: string[];
  currentIndex: number;
  title: string;
  startedAt: string;
  completedAt: string | null;
}

export interface LibraryData {
  subjects: Subject[];
  topics: Topic[];
  flashcards: Flashcard[];
  tags: Tag[];
  reviews: Review[];
  sessions: StudySession[];
}

export interface Backup {
  format: "topic-backup";
  version: 2;
  exportedAt: string;
  data: LibraryData;
}

export type EntityKind = "subject" | "topic" | "flashcard";

export interface LegacyFlashcard {
  id: string | number;
  topicId: string | number;
  question: string;
  answer: string;
  tags: (string | number)[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LegacyTopic {
  id: string | number;
  subjectId: string | number;
  name: string;
  path: string;
  description?: string;
  flashcards: LegacyFlashcard[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LegacySubject {
  id: string | number;
  name: string;
  path: string;
  description?: string;
  topics: LegacyTopic[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LegacyTag {
  id: string | number;
  name: string;
  color: string;
}
