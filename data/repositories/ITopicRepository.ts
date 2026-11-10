import type { RichDocument, Topic } from "../types";

export interface ITopicRepository {
  createTopic(
    subjectId: string,
    input: { name: string; description?: string },
  ): Promise<Topic>;
  updateTopic(
    id: string,
    input: { name: string; description: string },
    expectedRevision: number,
  ): Promise<void>;
  saveSummary(
    id: string,
    summary: RichDocument,
    expectedRevision: number,
  ): Promise<Topic>;
}
