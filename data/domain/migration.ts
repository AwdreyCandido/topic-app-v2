import type { LegacySubject, LegacyTag, LibraryData } from "../types";
import { documentText, textDocument } from "./documents";

export function isoDate(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime()))
    throw new Error("Data inválida no arquivo.");
  return date.toISOString();
}

export function migrateLegacy(
  subjects: LegacySubject[],
  tags: LegacyTag[] = [],
): LibraryData {
  const data: LibraryData = {
    subjects: [],
    topics: [],
    flashcards: [],
    tags: [],
    reviews: [],
    sessions: [],
  };
  data.tags = tags.map((tag) => ({ ...tag, id: String(tag.id) }));
  const knownTags = new Set(data.tags.map((tag) => tag.id));
  for (const subject of subjects) {
    data.subjects.push({
      id: String(subject.id),
      name: subject.name,
      path: subject.path,
      description: subject.description ?? "",
      favorite: false,
      archivedAt: null,
      createdAt: isoDate(subject.createdAt),
      updatedAt: isoDate(subject.updatedAt),
    });
    for (const topic of subject.topics) {
      data.topics.push({
        id: String(topic.id),
        subjectId: String(subject.id),
        name: topic.name,
        path: topic.path,
        description: topic.description ?? "",
        favorite: false,
        archivedAt: null,
        summary: textDocument(),
        summaryText: "",
        createdAt: isoDate(topic.createdAt),
        updatedAt: isoDate(topic.updatedAt),
      });
      for (const card of topic.flashcards) {
        const question = textDocument(card.question);
        const answer = textDocument(card.answer);
        data.flashcards.push({
          id: String(card.id),
          topicId: String(topic.id),
          question,
          answer,
          questionText: documentText(question),
          answerText: documentText(answer),
          tags: card.tags.map(String).filter((tag) => knownTags.has(tag)),
          favorite: false,
          archivedAt: null,
          status:
            card.question.trim() && card.answer.trim() ? "ready" : "draft",
          revision: 1,
          createdAt: isoDate(card.createdAt),
          updatedAt: isoDate(card.updatedAt),
        });
      }
    }
  }
  return data;
}
