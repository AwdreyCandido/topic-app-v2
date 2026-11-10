
"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  HiEllipsisHorizontal,
  HiPencilSquare,
  HiStar,
  HiOutlineStar,
  HiArchiveBox,
  HiArrowUturnLeft,
  HiTrash,
  HiDocumentDuplicate,
  HiPlus,
} from "react-icons/hi2";
import { useUI } from "@/data/contexts/UIContext";
import { useLibrary } from "@/data/contexts/LibraryContext";
import { repository } from "@/data/storage/repository";
import { flushAllSaves } from "@/data/domain/autosave";
import type {
  EntityKind,
  Flashcard,
  Subject,
  Topic,
} from "@/data/types";

type EntityActionsProps = {
  kind: EntityKind;
  item: Subject | Topic | Flashcard;
  archived?: boolean;
  onFavorite?: (value: boolean) => void;
};

const itemClass =
  "group flex min-h-[3.8rem] w-full cursor-pointer select-none items-center gap-[1.1rem] rounded-[0.6rem] px-[1.1rem] text-[1.3rem] font-medium text-foreground outline-none transition-colors duration-150 data-[highlighted]:bg-surface-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-40 [&_svg]:size-[1.7rem] [&_svg]:shrink-0 [&_svg]:text-muted";

const dangerClass =
  "text-danger data-[highlighted]:bg-danger-soft [&_svg]:text-danger";

export function EntityActions({
  kind,
  item,
  archived = false,
  onFavorite,
}: EntityActionsProps) {
  const ui = useUI();
  const { data } = useLibrary();

  const label =
    kind === "subject"
      ? "matéria"
      : kind === "topic"
        ? "tópico"
        : "flashcard";

  const handleEdit = () => {
    if (kind === "flashcard") {
      ui.setEditorId(item.id);
      return;
    }

    if (kind === "subject") {
      ui.setEntityDialog({
        kind: "subject",
        id: item.id,
      });
      return;
    }

    ui.setEntityDialog({
      kind: "topic",
      id: item.id,
      subjectId: (item as Topic).subjectId,
    });
  };

  const handleFavorite = () => {
    const next = !item.favorite;

    if (onFavorite) {
      onFavorite(next);
      return;
    }

    void ui.perform(() =>
      repository.setFavorite(kind, item.id, next),
    );
  };

  const handleCreate = () => {
    if (kind === "subject") {
      ui.setEntityDialog({
        kind: "topic",
        subjectId: item.id,
      });
      return;
    }

    if (kind === "topic") {
      void ui.perform(async () => {
        const card = await repository.createFlashcard(item.id);
        ui.setEditorId(card.id);
      });
    }
  };

  const handleDuplicate = () => {
    void ui.perform(async () => {
      await flushAllSaves();

      const copy = await repository.duplicateFlashcard(item.id);

      ui.setEditorId(copy.id);
      ui.notify("Flashcard duplicado.");
    });
  };

  const handleArchive = () => {
    void ui.perform(async () => {
      if (archived) {
        const confirmed = await ui.confirm({
          title: "Restaurar conteúdo?",
          description:
            "O item voltará à biblioteca. Matérias e tópicos superiores arquivados também serão restaurados quando necessário.",
          label: "Restaurar",
        });

        if (!confirmed) return;
      }

      await ui.closeEditor();

      await repository.setArchived(
        kind,
        item.id,
        !archived,
      );

      ui.notify(
        archived
          ? "Conteúdo restaurado."
          : "Conteúdo arquivado.",
      );
    });
  };

  const handleDelete = () => {
    void ui.perform(async () => {
      const topics =
        kind === "subject"
          ? data?.topics.filter(
              (topic) => topic.subjectId === item.id,
            ) ?? []
          : [];

      const topicIds =
        kind === "topic"
          ? [item.id]
          : topics.map((topic) => topic.id);

      const cardCount =
        kind === "flashcard"
          ? 1
          : data?.flashcards.filter((card) =>
              topicIds.includes(card.topicId),
            ).length ?? 0;

      const description =
        kind === "flashcard"
          ? "Esta ação remove permanentemente este flashcard."
          : `Esta ação remove permanentemente este conteúdo e ${cardCount} ${
              cardCount === 1
                ? "flashcard relacionado"
                : "flashcards relacionados"
            }.`;

      const confirmed = await ui.confirm({
        title: `Excluir ${label}?`,
        description:
          `${description} As avaliações anteriores ficam no histórico. ` +
          "Exporte um backup se quiser guardar uma cópia.",
        label: "Excluir permanentemente",
        danger: true,
      });

      if (!confirmed) return;

      await ui.closeEditor();
      await repository.remove(kind, item.id);

      ui.notify("Conteúdo excluído.");
    });
  };

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          type="button"
          aria-label={`Mais ações para ${label}`}
          className="inline-flex size-[3.2rem] shrink-0 items-center justify-center rounded-[0.7rem] text-muted outline-none transition-colors duration-150 hover:bg-surface-hover hover:text-foreground focus-visible:bg-surface-hover focus-visible:text-foreground focus-visible:ring-[0.2rem] focus-visible:ring-primary/30 data-[state=open]:bg-surface-hover data-[state=open]:text-foreground"
        >
          <HiEllipsisHorizontal
            className="size-[2rem]"
            aria-hidden="true"
          />
        </button>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          avoidCollisions
          className="z-[100] min-w-[20rem] max-w-[calc(100vw-2.4rem)] overflow-hidden rounded-[1rem] border border-border bg-surface p-[0.6rem] text-foreground shadow-[0_1.2rem_4rem_-1.5rem_rgba(0,0,0,0.2)] outline-none"
        >
          {!archived && (
            <Dropdown.Item
              className={itemClass}
              onSelect={handleEdit}
            >
              <HiPencilSquare aria-hidden="true" />
              <span>Editar</span>
            </Dropdown.Item>
          )}

          <Dropdown.Item
            className={itemClass}
            onSelect={handleFavorite}
          >
            {item.favorite ? (
              <HiStar aria-hidden="true" />
            ) : (
              <HiOutlineStar aria-hidden="true" />
            )}

            <span>
              {item.favorite
                ? "Remover favorito"
                : "Adicionar aos favoritos"}
            </span>
          </Dropdown.Item>

          {!archived &&
            (kind === "subject" || kind === "topic") && (
              <Dropdown.Item
                className={itemClass}
                onSelect={handleCreate}
              >
                <HiPlus aria-hidden="true" />
                <span>
                  {kind === "subject"
                    ? "Novo tópico"
                    : "Novo flashcard"}
                </span>
              </Dropdown.Item>
            )}

          {!archived && kind === "flashcard" && (
            <Dropdown.Item
              className={itemClass}
              onSelect={handleDuplicate}
            >
              <HiDocumentDuplicate aria-hidden="true" />
              <span>Duplicar</span>
            </Dropdown.Item>
          )}

          <Dropdown.Separator className="my-[0.6rem] h-[0.1rem] bg-border" />

          <Dropdown.Item
            className={itemClass}
            onSelect={handleArchive}
          >
            {archived ? (
              <HiArrowUturnLeft aria-hidden="true" />
            ) : (
              <HiArchiveBox aria-hidden="true" />
            )}

            <span>
              {archived ? "Restaurar" : "Arquivar"}
            </span>
          </Dropdown.Item>

          <Dropdown.Item
            className={`${itemClass} ${dangerClass}`}
            onSelect={handleDelete}
          >
            <HiTrash aria-hidden="true" />
            <span>Excluir</span>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
