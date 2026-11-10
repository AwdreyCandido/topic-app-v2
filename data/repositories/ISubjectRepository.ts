import type { Subject } from "../types";

export interface ISubjectRepository {
  createSubject(input: {
    name: string;
    description?: string;
  }): Promise<Subject>;
  updateSubject(
    id: string,
    input: { name: string; description: string },
    expectedRevision: number,
  ): Promise<void>;
}
