import type {
  Backup,
  Flashcard,
  LegacySubject,
  LegacyTag,
  LibraryData,
  Rating,
} from "../types";
import {
  documentText,
  normalizeText,
  slugify,
  validateDocument,
} from "./documents";
import { isoDate, migrateLegacy } from "./migration";

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(label + " inválido.");
  return value as Record<string, unknown>;
}
function list(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value) || value.length > 100000)
    throw new Error(label + " inválido ou grande demais.");
  return value;
}
function str(value: unknown, label: string, empty = false): string {
  if (
    typeof value !== "string" ||
    (!empty && !value.trim()) ||
    value.length > 2000000
  )
    throw new Error(label + " inválido.");
  return value;
}
function bool(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Valor booleano inválido.");
  return value;
}
function nullableDate(value: unknown): string | null {
  return value === null ? null : isoDate(str(value, "Data"));
}
function unique(items: { id: string }[], label: string) {
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error("IDs duplicados em " + label + ".");
}

function revision(value: unknown): number {
  if (value === undefined) return 1;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1)
    throw new Error("Revisão inválida.");
  return value;
}

export function validateLibrary(input: unknown): LibraryData {
  const data = record(input, "Dados");
  function entity(value: unknown) {
    const item = record(value, "Item");
    const name = str(item.name, "Nome").trim();
    const path = str(item.path, "Caminho");
    if (slugify(path) !== path || path.length > 200)
      throw new Error("Caminho inválido: " + path);
    return {
      id: str(item.id, "ID"),
      revision: revision(item.revision),
      name,
      path,
      description: str(item.description, "Descrição", true),
      favorite: bool(item.favorite),
      archivedAt: nullableDate(item.archivedAt),
      createdAt: isoDate(item.createdAt),
      updatedAt: isoDate(item.updatedAt),
    };
  }
  const subjects = list(data.subjects, "Matérias").map(entity);
  const topics = list(data.topics, "Tópicos").map((value) => {
    const item = record(value, "Tópico");
    const summary = validateDocument(item.summary);
    return {
      ...entity(item),
      summaryRevision: revision(item.summaryRevision),
      subjectId: str(item.subjectId, "Matéria do tópico"),
      summary,
      summaryText: documentText(summary),
    };
  });
  const tags = list(data.tags, "Tags").map((value) => {
    const item = record(value, "Tag");
    const color = str(item.color, "Cor");
    if (!/^#[a-f0-9]{6}$/i.test(color)) throw new Error("Cor de tag inválida.");
    return {
      id: str(item.id, "ID da tag"),
      name: str(item.name, "Nome da tag").trim(),
      color,
    };
  });
  const flashcards: Flashcard[] = list(data.flashcards, "Flashcards").map(
    (value) => {
      const item = record(value, "Flashcard");
      const question = validateDocument(item.question);
      const answer = validateDocument(item.answer);
      const questionText = documentText(question);
      const answerText = documentText(answer);
      if (!["draft", "ready"].includes(String(item.status)))
        throw new Error("Estado de cartão inválido.");
      if (item.status === "ready" && (!questionText || !answerText))
        throw new Error("Cartão pronto sem pergunta ou resposta.");
      const revision = item.revision;
      if (
        typeof revision !== "number" ||
        !Number.isInteger(revision) ||
        revision < 1
      )
        throw new Error("Revisão de cartão inválida.");
      return {
        id: str(item.id, "ID"),
        topicId: str(item.topicId, "Tópico do cartão"),
        question,
        answer,
        questionText,
        answerText,
        tags: [
          ...new Set(
            list(item.tags, "Tags do cartão").map((tag) => str(tag, "Tag")),
          ),
        ],
        favorite: bool(item.favorite),
        archivedAt: nullableDate(item.archivedAt),
        status: item.status as "draft" | "ready",
        revision,
        createdAt: isoDate(item.createdAt),
        updatedAt: isoDate(item.updatedAt),
      };
    },
  );
  const sessions = list(data.sessions, "Sessões").map((value) => {
    const item = record(value, "Sessão");
    const cardIds = list(item.cardIds, "Fila de estudo").map((id) =>
      str(id, "ID do cartão"),
    );
    if (new Set(cardIds).size !== cardIds.length)
      throw new Error("Cartões repetidos na sessão.");
    const currentIndex = item.currentIndex;
    if (
      typeof currentIndex !== "number" ||
      !Number.isInteger(currentIndex) ||
      currentIndex < 0 ||
      currentIndex > cardIds.length
    )
      throw new Error("Posição da sessão inválida.");
    return {
      id: str(item.id, "ID da sessão"),
      title: str(item.title, "Título da sessão"),
      cardIds,
      currentIndex,
      startedAt: isoDate(item.startedAt),
      completedAt: nullableDate(item.completedAt),
    };
  });
  const reviews = list(data.reviews, "Avaliações").map((value) => {
    const item = record(value, "Avaliação");
    if (!["again", "hard", "good", "easy"].includes(String(item.rating)))
      throw new Error("Avaliação inválida.");
    if (
      typeof item.position !== "number" ||
      !Number.isInteger(item.position) ||
      item.position < 0
    )
      throw new Error("Posição de avaliação inválida.");
    return {
      id: str(item.id, "ID da avaliação"),
      sessionId: str(item.sessionId, "Sessão da avaliação"),
      cardId:
        item.cardId === null ? null : str(item.cardId, "Cartão da avaliação"),
      cardKey: str(item.cardKey, "Referência histórica"),
      position: item.position,
      question: str(item.question, "Pergunta histórica", true),
      topic: str(item.topic, "Tópico histórico"),
      subject: str(item.subject, "Matéria histórica"),
      rating: item.rating as Rating,
      reviewedAt: isoDate(item.reviewedAt),
    };
  });
  for (const [name, items] of Object.entries({
    subjects,
    topics,
    flashcards,
    tags,
    sessions,
    reviews,
  }))
    unique(items, name);
  const subjectIds = new Set(subjects.map((item) => item.id));
  const topicIds = new Set(topics.map((item) => item.id));
  const cardIds = new Set(flashcards.map((item) => item.id));
  const tagIds = new Set(tags.map((item) => item.id));
  const sessionMap = new Map(sessions.map((item) => [item.id, item]));
  const reserved = new Set([
    "flashcards",
    "favorites",
    "archived",
    "study",
    "history",
    "settings",
    "search",
  ]);
  if (
    new Set(subjects.map((item) => item.path)).size !== subjects.length ||
    subjects.some((item) => reserved.has(item.path))
  )
    throw new Error("Caminhos de matérias duplicados ou reservados.");
  if (
    new Set(topics.map((item) => item.subjectId + "/" + item.path)).size !==
    topics.length
  )
    throw new Error("Caminhos de tópicos duplicados.");
  if (
    new Set(tags.map((item) => normalizeText(item.name))).size !== tags.length
  )
    throw new Error("Nomes de tags duplicados.");
  for (const topic of topics)
    if (!subjectIds.has(topic.subjectId))
      throw new Error("Tópico com matéria inexistente.");
  for (const card of flashcards) {
    if (!topicIds.has(card.topicId))
      throw new Error("Cartão com tópico inexistente.");
    if (card.tags.some((tag) => !tagIds.has(tag)))
      throw new Error("Cartão com tag inexistente.");
  }
  const positions = new Set<string>();
  for (const review of reviews) {
    const session = sessionMap.get(review.sessionId);
    if (
      !session ||
      review.position >= session.cardIds.length ||
      review.position >= session.currentIndex
    )
      throw new Error("Avaliação com sessão ou posição inválida.");
    if (review.cardId !== null && !cardIds.has(review.cardId))
      throw new Error("Avaliação com cartão inexistente.");
    if (session.cardIds[review.position] !== review.cardKey)
      throw new Error("Avaliação fora da fila de estudo.");
    const key = review.sessionId + ":" + review.position;
    if (positions.has(key)) throw new Error("Avaliação duplicada na sessão.");
    positions.add(key);
  }
  return { subjects, topics, flashcards, tags, sessions, reviews };
}

export function parseBackup(text: string): Backup {
  if (text.length > 30000000) throw new Error("O arquivo deve ter até 30 MB.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("O arquivo não contém JSON válido.");
  }
  if (Array.isArray(raw)) {
    return {
      format: "topic-backup",
      version: 2,
      exportedAt: new Date().toISOString(),
      data: validateLibrary(migrateLegacy(raw as LegacySubject[])),
    };
  }
  const root = record(raw, "Arquivo");
  if (root.version === 1 && Array.isArray(root.subjects)) {
    return {
      format: "topic-backup",
      version: 2,
      exportedAt: new Date().toISOString(),
      data: validateLibrary(
        migrateLegacy(
          root.subjects as LegacySubject[],
          (root.tags ?? []) as LegacyTag[],
        ),
      ),
    };
  }
  if (root.format !== "topic-backup" || root.version !== 2)
    throw new Error("Formato ou versão do backup não suportado.");
  return {
    format: "topic-backup",
    version: 2,
    exportedAt: isoDate(root.exportedAt),
    data: validateLibrary(root.data),
  };
}
