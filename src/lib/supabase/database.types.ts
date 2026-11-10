import type { Json } from "../../../data/types";

export type SubjectRow = {
  user_id: string;
  id: string;
  name: string;
  path: string;
  description: string;
  favorite: boolean;
  archived_at: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
};
export type TopicRow = SubjectRow & {
  subject_id: string;
  summary: Json;
  summary_text: string;
  summary_revision: number;
};
export type FlashcardRow = {
  user_id: string;
  id: string;
  topic_id: string;
  question: Json;
  answer: Json;
  question_text: string;
  answer_text: string;
  status: "draft" | "ready";
  favorite: boolean;
  archived_at: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
};
export type TagRow = {
  user_id: string;
  id: string;
  name: string;
  color: string;
};
export type SessionRow = {
  user_id: string;
  id: string;
  title: string;
  current_index: number;
  started_at: string;
  completed_at: string | null;
};
export type SessionCardRow = {
  user_id: string;
  session_id: string;
  position: number;
  card_id: string | null;
  card_key: string;
};
export type ReviewRow = {
  user_id: string;
  id: string;
  session_id: string;
  position: number;
  card_id: string | null;
  question_snapshot: string;
  topic_snapshot: string;
  subject_snapshot: string;
  rating: "again" | "hard" | "good" | "easy";
  reviewed_at: string;
};
export type FlashcardRecord = FlashcardRow & { tag_ids: string[] };
export type SessionRecord = SessionRow & { card_ids: string[] };
export type ReviewRecord = ReviewRow & { card_key: string };
type ReadTable<Row> = {
  Row: Row;
  Insert: never;
  Update: never;
  Relationships: [];
};
type ReadView<Row> = { Row: Row; Relationships: [] };
type Rpc<Args, Returns = Json> = {
  Args: Args & { p_expected_user?: string };
  Returns: Returns;
};
export type Database = {
  public: {
    Tables: {
      subjects: ReadTable<SubjectRow>;
      topics: ReadTable<TopicRow>;
      flashcards: ReadTable<FlashcardRow>;
      tags: ReadTable<TagRow>;
      flashcard_tags: ReadTable<{
        user_id: string;
        flashcard_id: string;
        tag_id: string;
      }>;
      study_sessions: ReadTable<SessionRow>;
      study_session_cards: ReadTable<SessionCardRow>;
      reviews: ReadTable<ReviewRow>;
    };
    Views: {
      flashcard_records: ReadView<FlashcardRecord>;
      session_records: ReadView<SessionRecord>;
      review_records: ReadView<ReviewRecord>;
    };
    Functions: {
      topic_create_subject: Rpc<{
        p_id: string;
        p_name: string;
        p_description?: string;
      }>;
      topic_update_subject: Rpc<{
        p_id: string;
        p_name: string;
        p_description: string;
        p_expected_revision: number;
      }>;
      topic_create_topic: Rpc<{
        p_id: string;
        p_subject_id: string;
        p_name: string;
        p_description?: string;
      }>;
      topic_update_topic: Rpc<{
        p_id: string;
        p_name: string;
        p_description: string;
        p_expected_revision: number;
      }>;
      topic_save_summary: Rpc<{
        p_id: string;
        p_summary: Json;
        p_expected_revision: number;
      }>;
      topic_save_flashcard: Rpc<{
        p_id: string;
        p_topic_id: string;
        p_question: Json;
        p_answer: Json;
        p_tag_ids: string[];
        p_status: string;
        p_favorite: boolean;
        p_archived_at: string | null;
        p_expected_revision?: number | null;
      }>;
      topic_duplicate_flashcard: Rpc<{ p_id: string; p_new_id: string }>;
      topic_set_favorite: Rpc<{
        p_kind: string;
        p_id: string;
        p_favorite: boolean;
      }>;
      topic_set_archived: Rpc<{
        p_kind: string;
        p_id: string;
        p_archived: boolean;
      }>;
      topic_delete_entity: Rpc<{ p_kind: string; p_id: string }>;
      topic_save_tag: Rpc<{ p_id: string; p_name: string; p_color: string }>;
      topic_delete_tag: Rpc<{ p_id: string }>;
      topic_create_session: Rpc<{
        p_id: string;
        p_card_ids: string[];
        p_title: string;
      }>;
      topic_rate: Rpc<{
        p_session_id: string;
        p_position: number;
        p_rating: string | null;
      }>;
      topic_end_session: Rpc<{ p_id: string }>;
      topic_export_backup: Rpc<{ p_expected_user?: string }>;
      topic_restore_backup: Rpc<{ p_payload: Json }, undefined>;
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
