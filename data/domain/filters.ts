import type { Flashcard, LibraryData, Subject, Topic } from "../types";
import { normalizeText } from "./documents";

export interface Filters {
  q: string;
  subject: string;
  topic: string;
  tags: string[];
  tagMode: "any" | "all";
  favorite: boolean;
  status: "all" | "draft" | "ready" | "new" | "studied";
  archive: "active" | "archived" | "all";
  sort: "name" | "createdAt" | "updatedAt";
  direction: "asc" | "desc";
  view: "grid" | "list";
}

export function parseFilters(params: URLSearchParams): Filters {
  const status = params.get("status") ?? "";
  const sort = params.get("sort") ?? "";
  return {
    q: params.get("q") ?? "",
    subject: params.get("subject") ?? "",
    topic: params.get("topic") ?? "",
    tags: [...new Set(params.getAll("tag"))],
    tagMode: params.get("tagMode") === "all" ? "all" : "any",
    favorite: params.get("favorite") === "1",
    status: ["draft", "ready", "new", "studied"].includes(status)
      ? (status as Filters["status"])
      : "all",
    archive:
      params.get("archive") === "archived"
        ? "archived"
        : params.get("archive") === "all"
          ? "all"
          : "active",
    sort: ["name", "createdAt", "updatedAt"].includes(sort)
      ? (sort as Filters["sort"])
      : "updatedAt",
    direction: params.get("direction") === "asc" ? "asc" : "desc",
    view: params.get("view") === "list" ? "list" : "grid",
  };
}

export function isArchived(card: Flashcard, data: LibraryData): boolean {
  const topic = data.topics.find((item) => item.id === card.topicId);
  const subject = data.subjects.find((item) => item.id === topic?.subjectId);
  return Boolean(card.archivedAt || topic?.archivedAt || subject?.archivedAt);
}

export function topicIsArchived(topic: Topic, data: LibraryData): boolean {
  return Boolean(
    topic.archivedAt ||
    data.subjects.find((item) => item.id === topic.subjectId)?.archivedAt,
  );
}

export function filterCards(data: LibraryData, filters: Filters): Flashcard[] {
  const topicMap = new Map(data.topics.map((topic) => [topic.id, topic]));
  const subjectMap = new Map(
    data.subjects.map((subject) => [subject.id, subject]),
  );
  const tagMap = new Map(data.tags.map((tag) => [tag.id, tag.name]));
  const studied = new Set(
    data.reviews.map((review) => review.cardId).filter(Boolean),
  );
  const words = normalizeText(filters.q.trim()).split(/\s+/).filter(Boolean);
  return data.flashcards
    .filter((card) => {
      const topic = topicMap.get(card.topicId);
      const subject = topic ? subjectMap.get(topic.subjectId) : undefined;
      if (!topic || !subject) return false;
      const archived = isArchived(card, data);
      if (filters.archive === "active" && archived) return false;
      if (filters.archive === "archived" && !archived) return false;
      if (filters.subject && topic.subjectId !== filters.subject) return false;
      if (filters.topic && card.topicId !== filters.topic) return false;
      if (filters.favorite && !card.favorite) return false;
      if (filters.status === "draft" && card.status !== "draft") return false;
      if (filters.status === "ready" && card.status !== "ready") return false;
      if (filters.status === "new" && studied.has(card.id)) return false;
      if (filters.status === "studied" && !studied.has(card.id)) return false;
      if (filters.tags.length) {
        const predicate = (tag: string) => card.tags.includes(tag);
        if (
          filters.tagMode === "all"
            ? !filters.tags.every(predicate)
            : !filters.tags.some(predicate)
        )
          return false;
      }
      const haystack = normalizeText(
        [
          card.questionText,
          card.answerText,
          topic.name,
          subject.name,
          ...card.tags.map((tag) => tagMap.get(tag) ?? ""),
        ].join(" "),
      );
      return words.every((word) => haystack.includes(word));
    })
    .sort((a, b) => {
      const first = filters.sort === "name" ? a.questionText : a[filters.sort];
      const second = filters.sort === "name" ? b.questionText : b[filters.sort];
      const order = first.localeCompare(second, "pt-BR", {
        sensitivity: "base",
      });
      return (
        (filters.direction === "asc" ? order : -order) ||
        a.id.localeCompare(b.id)
      );
    });
}

export function filterEntities<T extends Subject | Topic>(
  items: T[],
  filters: Filters,
): T[] {
  const q = normalizeText(filters.q.trim());
  return items
    .filter(
      (item) =>
        (filters.archive === "all" ||
          Boolean(item.archivedAt) === (filters.archive === "archived")) &&
        (!filters.favorite || item.favorite) &&
        normalizeText(item.name + " " + item.description).includes(q),
    )
    .sort((a, b) => {
      const value = a[filters.sort].localeCompare(b[filters.sort], "pt-BR", {
        sensitivity: "base",
      });
      return filters.direction === "asc" ? value : -value;
    });
}
