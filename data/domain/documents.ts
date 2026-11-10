import type { DocumentBlock, Json, RichDocument } from "../types";

export const DOCUMENT_VERSION = 1 as const;
const supportedBlocks = new Set([
  "paragraph",
  "heading",
  "bulletListItem",
  "numberedListItem",
  "checkListItem",
  "quote",
  "divider",
  "codeBlock",
  "table",
  "toggleListItem",
]);

export function textDocument(text = ""): RichDocument {
  return {
    version: DOCUMENT_VERSION,
    blocks: text.split("\n").map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line, styles: {} }] : [],
    })),
  };
}

function inlineText(value: Json | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(inlineText).join("");
  if (value && typeof value === "object") {
    if (typeof value.text === "string") return value.text;
    if (value.type === "tableContent" && Array.isArray(value.rows)) {
      return value.rows
        .map((row) => {
          if (!row || typeof row !== "object" || Array.isArray(row)) return "";
          return Array.isArray(row.cells)
            ? row.cells.map(inlineText).join(" | ")
            : "";
        })
        .join("\n");
    }
    if (value.content !== undefined) return inlineText(value.content);
  }
  return "";
}

export function documentText(doc: RichDocument): string {
  function extract(blocks: DocumentBlock[]): string[] {
    return blocks.flatMap((block) => [
      inlineText(block.content),
      ...extract(block.children ?? []),
    ]);
  }
  return extract(doc.blocks).filter(Boolean).join("\n").trim();
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function slugify(value: string): string {
  return (
    normalizeText(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "sem-titulo"
  );
}

export function uniqueSlug(
  name: string,
  taken: string[],
  fallbackId: string,
): string {
  const base = slugify(name);
  if (!taken.includes(base)) return base;
  let suffix = 2;
  while (taken.includes(base + "-" + suffix)) suffix++;
  return base + "-" + (suffix || fallbackId);
}

function assertInline(value: unknown, depth = 0): asserts value is Json {
  if (depth > 24) throw new Error("Documento com aninhamento excessivo.");
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    value.forEach((item) => assertInline(item, depth + 1));
    return;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const [key, child] of Object.entries(record)) {
      if (["__proto__", "constructor", "prototype"].includes(key))
        throw new Error("Documento inválido.");
      assertInline(child, depth + 1);
    }
    if (
      record.type !== undefined &&
      !["text", "link", "tableContent", "tableCell"].includes(
        String(record.type),
      )
    )
      throw new Error("Conteúdo inline não suportado.");
    if (record.type === "text" && typeof record.text !== "string")
      throw new Error("Texto de bloco inválido.");
    if (record.type === "tableContent" && !Array.isArray(record.rows))
      throw new Error("Tabela inválida.");
    if (record.type === "link" && !Array.isArray(record.content))
      throw new Error("Texto de link inválido.");
    if (record.type === "link") {
      const href = record.href;
      if (
        typeof href !== "string" ||
        !/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href) ||
        href.startsWith("//")
      ) {
        throw new Error("O documento contém um link não permitido.");
      }
    }
    return;
  }
  throw new Error("Conteúdo de documento inválido.");
}

export function validateDocument(input: unknown): RichDocument {
  if (!input || typeof input !== "object")
    throw new Error("Documento ausente.");
  const doc = input as Record<string, unknown>;
  if (
    doc.version !== 1 ||
    !Array.isArray(doc.blocks) ||
    doc.blocks.length > 10000
  ) {
    throw new Error("Versão ou estrutura de documento não suportada.");
  }
  let total = 0;
  const blockIds = new Set<string>();
  function validateBlocks(items: unknown[], depth: number): DocumentBlock[] {
    if (depth > 16) throw new Error("Documento com muitos níveis.");
    return items.map((item) => {
      if (!item || typeof item !== "object" || ++total > 15000)
        throw new Error("Bloco inválido.");
      const block = item as Record<string, unknown>;
      if (typeof block.type !== "string" || !supportedBlocks.has(block.type)) {
        throw new Error("Tipo de bloco não suportado: " + String(block.type));
      }
      if (block.id !== undefined && typeof block.id !== "string")
        throw new Error("ID de bloco inválido.");
      if (typeof block.id === "string") {
        if (blockIds.has(block.id)) throw new Error("IDs de bloco duplicados.");
        blockIds.add(block.id);
      }
      if (
        block.content !== undefined &&
        block.type !== "table" &&
        typeof block.content !== "string" &&
        !Array.isArray(block.content)
      )
        throw new Error("Conteúdo de bloco inválido.");
      if (block.props !== undefined) {
        if (
          !block.props ||
          typeof block.props !== "object" ||
          Array.isArray(block.props)
        )
          throw new Error("Propriedades de bloco inválidas.");
        assertInline(block.props);
        const props = block.props as Record<string, unknown>;
        if (
          block.type === "heading" &&
          props.level !== undefined &&
          ![1, 2, 3].includes(Number(props.level))
        )
          throw new Error("Nível de título inválido.");
      }
      if (block.content !== undefined) assertInline(block.content);
      if (block.children !== undefined && !Array.isArray(block.children))
        throw new Error("Filhos de bloco inválidos.");
      const output: DocumentBlock = { type: block.type };
      if (block.id !== undefined) output.id = block.id as string;
      if (block.props !== undefined)
        output.props = block.props as Record<string, Json>;
      if (block.content !== undefined) output.content = block.content as Json;
      if (block.children !== undefined)
        output.children = validateBlocks(
          block.children as unknown[],
          depth + 1,
        );
      return output;
    });
  }
  const blocks = validateBlocks(doc.blocks, 0);
  return { version: 1, blocks: blocks.length ? blocks : textDocument().blocks };
}
