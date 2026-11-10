"use client";
import { cn } from "@/src/lib/cn";
import { formControl } from "@/src/components/ui/variants";
import { useFlashcardContent } from "@/data/hooks/useDocumentContent";
import { DocumentStatus } from "@/src/components/DocumentStatus";
import { useRef, useState } from "react";
import {
  HiArrowsPointingOut,
  HiArrowsPointingIn,
  HiCheck,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineStar,
  HiStar,
} from "react-icons/hi2";
import { useLibrary } from "@/data/contexts/LibraryContext";
import { useUI } from "@/data/contexts/UIContext";
import { repository } from "@/data/storage/repository";
import { useAutosave } from "@/data/hooks/useAutosave";
import { documentText } from "@/data/domain/documents";
import { isArchived, topicIsArchived } from "@/data/domain/filters";
import type { Flashcard, RichDocument } from "@/data/types";
import { RichEditor } from "@/src/components/editor/DynamicEditor";
import { Modal, SaveIndicator } from "@/src/components/ui/Primitives";
import { EntityActions } from "@/src/components/ui/EntityActions";
function Editor({
  initial,
  expanded,
  toggleExpanded,
}: {
  initial: Flashcard;
  expanded: boolean;
  toggleExpanded: () => void;
}) {
  const { data } = useLibrary();
  const ui = useUI();
  const [draft, setDraft] = useState(initial);
  const revision = useRef(initial.revision);
  const { queue, status } = useAutosave<Flashcard>(async (snapshot) => {
    const saved = await repository.saveFlashcard({
      ...snapshot,
      revision: revision.current,
    });
    revision.current = saved.revision;
  });
  if (!data) return null;
  const topic = data.topics.find((t) => t.id === draft.topicId);
  const subject = data.subjects.find((s) => s.id === topic?.subjectId);
  const activeTopics = data.topics.filter((t) => !topicIsArchived(t, data));
  const siblings = data.flashcards
    .filter(
      (card) => card.topicId === initial.topicId && !isArchived(card, data),
    )
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
  const index = siblings.findIndex((card) => card.id === initial.id);
  function change(patch: Partial<Flashcard>) {
    const next = { ...draft, ...patch };
    if (!documentText(next.question) || !documentText(next.answer))
      next.status = "draft";
    setDraft(next);
    queue.schedule(next);
  }
  function documentChange(field: "question" | "answer", value: RichDocument) {
    change({ [field]: value });
  }
  const switchCard = (direction: number) =>
    ui.perform(async () => {
      await queue.flush();
      const next = siblings[index + direction];
      if (next) ui.setEditorId(next.id);
    });
  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-5 py-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium",
              draft.status === "draft"
                ? "bg-warning-soft text-warning"
                : "bg-success-soft text-success",
            )}
          >
            {draft.status === "draft" ? "Rascunho" : "Pronto para estudar"}
          </span>
          <SaveIndicator
            status={status}
            retry={() => void ui.perform(queue.flush)}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            className={cn(
              "inline-flex size-8 min-w-8 items-center justify-center rounded-lg border-0 bg-transparent p-[0.5rem] text-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-[1.8rem]",
              draft.favorite ? "!text-warning" : "",
            )}
            aria-label={draft.favorite ? "Remover favorito" : "Favoritar"}
            onClick={() => change({ favorite: !draft.favorite })}
          >
            {draft.favorite ? <HiStar /> : <HiOutlineStar />}
          </button>
          <button
            className="inline-flex size-8 min-w-8 items-center justify-center rounded-lg border-0 bg-transparent p-[0.5rem] text-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-[1.8rem]"
            aria-label={expanded ? "Recolher editor" : "Expandir editor"}
            onClick={toggleExpanded}
          >
            {expanded ? <HiArrowsPointingIn /> : <HiArrowsPointingOut />}
          </button>
          <EntityActions
            kind="flashcard"
            item={draft}
            onFavorite={(favorite) => change({ favorite })}
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 [&>.text-muted]:mb-4">
        <p className="text-sm font-semibold tracking-[0.14rem] text-muted">
          {subject?.name} / {topic?.name}
        </p>
        <div className="mb-5">
          <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.1rem] text-muted">
            Pergunta
          </label>
          <RichEditor
            key={initial.id + "-question"}
            initialContent={initial.question}
            label="Pergunta do flashcard"
            onChange={(doc) => documentChange("question", doc)}
          />
        </div>
        <div className="mb-4 mt-6 flex items-center gap-3 border-t border-border pt-5 text-xs font-semibold uppercase tracking-[0.1rem] text-muted">
          <span>Resposta</span>
        </div>
        <div className="mb-5">
          <RichEditor
            key={initial.id + "-answer"}
            initialContent={initial.answer}
            label="Resposta do flashcard"
            onChange={(doc) => documentChange("answer", doc)}
          />
        </div>
        <p className="mb-6 mt-5 text-xs text-subtle">
          Digite <kbd>/</kbd> para inserir blocos. Selecione um trecho para
          formatar.
        </p>
        <div className="mt-7 grid grid-cols-1 gap-5 border-t border-border pt-5 sm:grid-cols-2 [&_fieldset]:min-w-0 [&_legend]:mb-2">
          <label
            className="flex flex-col gap-2 text-sm font-medium text-foreground"
            htmlFor="card-topic"
          >
            Tópico
            <select
              id="card-topic"
              value={draft.topicId}
              onChange={(event) => change({ topicId: event.target.value })}
              className={formControl}
            >
              {activeTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {data.subjects.find((s) => s.id === t.subjectId)?.name} /{" "}
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Tags
            </legend>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <label
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-[0.6rem] rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-muted [&_input]:size-[1.3rem]",
                    draft.tags.includes(tag.id)
                      ? "border-primary-border bg-primary-soft text-primary-ink"
                      : "",
                  )}
                  key={tag.id}
                >
                  <input
                    type="checkbox"
                    checked={draft.tags.includes(tag.id)}
                    onChange={(event) =>
                      change({
                        tags: event.target.checked
                          ? [...draft.tags, tag.id]
                          : draft.tags.filter((id) => id !== tag.id),
                      })
                    }
                  />
                  <span
                    className="inline-block size-[0.6rem] shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </label>
              ))}
              {!data.tags.length && (
                <p className="text-muted text-sm">
                  Crie tags em Configurações para organizar seus cartões.
                </p>
              )}
            </div>
          </fieldset>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-5 py-4">
        <div className="flex items-center gap-1">
          <button
            className="inline-flex size-8 min-w-8 items-center justify-center rounded-lg border-0 bg-transparent p-[0.5rem] text-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-[1.8rem]"
            disabled={index <= 0}
            aria-label="Cartão anterior"
            onClick={() => void switchCard(-1)}
          >
            <HiChevronLeft />
          </button>
          <span className="text-muted text-xs">
            {index + 1} de {siblings.length}
          </span>
          <button
            className="inline-flex size-8 min-w-8 items-center justify-center rounded-lg border-0 bg-transparent p-[0.5rem] text-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-[1.8rem]"
            disabled={index < 0 || index >= siblings.length - 1}
            aria-label="Próximo cartão"
            onClick={() => void switchCard(1)}
          >
            <HiChevronRight />
          </button>
        </div>
        <button
          className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] bg-primary text-white shadow-sm hover:enabled:bg-primary-hover"
          disabled={
            !documentText(draft.question) || !documentText(draft.answer)
          }
          onClick={() =>
            void ui.perform(async () => {
              const next = { ...draft, status: "ready" as const };
              setDraft(next);
              queue.schedule(next);
              await queue.flush();
              ui.notify("Flashcard pronto para estudar.");
              await ui.closeEditor();
            })
          }
        >
          <HiCheck />
          Concluir cartão
        </button>
      </div>
    </>
  );
}
export function CardEditor() {
  const { data } = useLibrary();
  const ui = useUI();
  const [expanded, setExpanded] = useState(false);
  const card = data?.flashcards.find((item) => item.id === ui.editorId);
  const content = useFlashcardContent(card);
  return (
    <Modal
      open={Boolean(card)}
      onOpenChange={(open) => {
        if (!open) void ui.perform(ui.closeEditor);
      }}
      title="Editar flashcard"
      variant="editor"
      className={cn(
        "group/editor flex h-[min(88dvh,90rem)] w-[min(96rem,calc(100vw-3.2rem))] flex-col overflow-hidden p-0 sm:p-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-screen max-sm:rounded-none",
        expanded ? "h-[94dvh] max-h-[94dvh] w-[calc(100vw-4rem)]" : "",
      )}
    >
      {content.loading ? (
        <DocumentStatus error={content.error} retry={content.retry} />
      ) : (
        card && (
          <Editor
            key={card.id}
            initial={card}
            expanded={expanded}
            toggleExpanded={() => setExpanded((value) => !value)}
          />
        )
      )}
    </Modal>
  );
}
function PreviewContent({ card }: { card: Flashcard }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <span className="text-sm font-semibold tracking-[0.14rem] text-muted">
        Pergunta
      </span>
      <RichEditor initialContent={card.question} readOnly label="Pergunta" />
      {revealed ? (
        <div className="mt-4 border-t border-border pt-5">
          <span className="text-sm font-semibold tracking-[0.14rem] text-muted">
            Resposta
          </span>
          <RichEditor initialContent={card.answer} readOnly label="Resposta" />
        </div>
      ) : (
        <button
          className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] bg-primary text-white shadow-sm hover:enabled:bg-primary-hover"
          onClick={() => setRevealed(true)}
        >
          Revelar resposta
        </button>
      )}
    </div>
  );
}
export function CardPreview() {
  const { data } = useLibrary();
  const ui = useUI();
  const card = data?.flashcards.find((item) => item.id === ui.previewId);
  const content = useFlashcardContent(card);
  return (
    <Modal
      open={Boolean(card)}
      onOpenChange={(open) => {
        if (!open) ui.setPreviewId(null);
      }}
      title="Visualizar flashcard"
      className="w-[min(72rem,calc(100vw-3.2rem))]"
    >
      {content.loading ? (
        <DocumentStatus error={content.error} retry={content.retry} />
      ) : (
        card && <PreviewContent key={card.id} card={card} />
      )}
    </Modal>
  );
}
