import type { Backup, LibraryData } from "../types";
import { database, type TopicDatabase } from "./database";

export class LegacyLibraryReader {
  constructor(private readonly db: TopicDatabase = database) {}

  async snapshot(): Promise<LibraryData> {
    return this.db.transaction("r", this.db.tables, async () => {
      const [subjects, topics, flashcards, tags, sessions, reviews] =
        await Promise.all([
          this.db.subjects.toArray(),
          this.db.topics.toArray(),
          this.db.flashcards.toArray(),
          this.db.tags.toArray(),
          this.db.sessions.toArray(),
          this.db.reviews.toArray(),
        ]);
      return { subjects, topics, flashcards, tags, sessions, reviews };
    });
  }

  async backup(): Promise<Backup> {
    return {
      format: "topic-backup",
      version: 2,
      exportedAt: new Date().toISOString(),
      data: await this.snapshot(),
    };
  }
}
