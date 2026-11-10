"use client";
import { cn } from "@/src/lib/cn";
import Link from "next/link";
import {
  HiOutlineBookOpen,
  HiOutlineFolder,
  HiArrowUpRight,
  HiOutlineSquare2Stack,
  HiStar,
  HiOutlineStar,
  HiOutlineEye,
  HiPencilSquare,
} from "react-icons/hi2";
import { useLibrary } from "@/data/contexts/LibraryContext";
import { useUI } from "@/data/contexts/UIContext";
import { repository } from "@/data/storage/repository";
import { isArchived, topicIsArchived } from "@/data/domain/filters";
import { EntityActions } from "./EntityActions";
import { shortDate } from "./Primitives";
import type { Flashcard, Subject, Tag, Topic } from "@/data/types";
export function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span className="inline-flex max-w-full items-center gap-[0.5rem] rounded-md bg-surface-muted px-2 py-1 text-xs text-muted">
      <span
        className="inline-block size-[0.6rem] shrink-0 rounded-full"
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
    </span>
  );
}
export function EntityCard({
  item,
  kind,
  index = 0,
}: {
  item: Subject | Topic;
  kind: "subject" | "topic";
  index?: number;
}) {
  const { data } = useLibrary();
  const ui = useUI();
  if (!data) return null;
  const topic = kind === "topic" ? (item as Topic) : undefined;
  const subject = topic
    ? data.subjects.find((s) => s.id === topic.subjectId)
    : (item as Subject);
  const topics =
    kind === "subject"
      ? data.topics.filter(
          (t) => t.subjectId === item.id && !topicIsArchived(t, data),
        )
      : [];
  const cards = data.flashcards.filter(
    (card) =>
      !isArchived(card, data) &&
      (kind === "subject"
        ? topics.some((t) => t.id === card.topicId)
        : card.topicId === item.id),
  );
  const href =
    "/dashboard/" + (topic ? subject?.path + "/" + item.path : item.path);
  const archived =
    kind === "subject"
      ? Boolean(item.archivedAt)
      : topicIsArchived(item as Topic, data);
  return (
    <article
      className="group/entity min-w-0 rounded-xl border border-border bg-surface px-5 pt-5 transition-shadow hover:shadow-sm group-data-[view=list]/collection:flex group-data-[view=list]/collection:items-center group-data-[view=list]/collection:gap-5 group-data-[view=list]/collection:py-4"
      data-accent={index % 4}
    >
      <div className="mb-4 flex items-center justify-between gap-2 group-data-[view=list]/collection:mb-0">
        <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary-ink group-data-[accent=1]/entity:bg-success-soft group-data-[accent=1]/entity:text-success group-data-[accent=2]/entity:bg-warning-soft group-data-[accent=2]/entity:text-warning group-data-[accent=3]/entity:bg-danger-soft group-data-[accent=3]/entity:text-danger [&_svg]:size-[2.2rem]">
          {kind === "subject" ? <HiOutlineBookOpen /> : <HiOutlineFolder />}
        </div>
        <div className="flex items-center gap-1">
          <button
            className={cn(
              "inline-flex size-8 min-w-8 items-center justify-center rounded-lg border-0 bg-transparent p-[0.5rem] hover:bg-surface-hover hover:text-foreground [&_svg]:size-[1.8rem] text-subtle",
              item.favorite ? "!text-warning" : "",
            )}
            aria-label={item.favorite ? "Remover favorito" : "Favoritar"}
            onClick={() =>
              void ui.perform(() =>
                repository.setFavorite(kind, item.id, !item.favorite),
              )
            }
          >
            {item.favorite ? <HiStar /> : <HiOutlineStar />}
          </button>
          <EntityActions kind={kind} item={item} archived={archived} />
        </div>
      </div>
      <Link
        href={href}
        className="block min-w-0 flex-1 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-[-0.03rem] group-data-[view=list]/collection:grid group-data-[view=list]/collection:grid-cols-[minmax(0,1fr)_auto] group-data-[view=list]/collection:items-center group-data-[view=list]/collection:gap-4"
      >
        <div className="flex items-center gap-3">
          <h3>{item.name}</h3>
          {archived && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium bg-surface-hover text-muted">
              Arquivado
            </span>
          )}
        </div>
        <p className="mb-5 mt-3 min-h-[4.6rem] text-sm leading-relaxed text-muted line-clamp-2 group-data-[view=list]/collection:hidden">
          {item.description ||
            (kind === "subject"
              ? "Um espaço para organizar seu conhecimento."
              : "Resumos e flashcards para conectar as ideias.")}
        </p>
        <div className="mb-5 flex flex-wrap items-center gap-4 text-sm text-muted [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[0.6rem] [&_svg]:size-[1.5rem] group-data-[view=list]/collection:mb-0 group-data-[view=list]/collection:justify-end">
          {kind === "subject" && (
            <span>
              <HiOutlineFolder />
              {topics.length} tópicos
            </span>
          )}
          <span>
            <HiOutlineSquare2Stack />
            {cards.length} cartões
          </span>
        </div>
        <div className="flex min-h-12 items-center justify-between gap-2 border-t border-border text-xs text-subtle [&>svg]:size-4 group-data-[view=list]/collection:hidden">
          <span>Editado em {shortDate(item.updatedAt)}</span>
          <HiArrowUpRight />
        </div>
      </Link>
    </article>
  );
}
export function FlashcardTile({ card }: { card: Flashcard }) {
  const { data } = useLibrary();
  const ui = useUI();
  if (!data) return null;
  const topic = data.topics.find((t) => t.id === card.topicId);
  const subject = data.subjects.find((s) => s.id === topic?.subjectId);
  const studied = data.reviews.some((review) => review.cardId === card.id);
  const archived = isArchived(card, data);
  return (
    <article className="min-w-0 rounded-xl border border-border bg-surface px-5 pt-4 transition-shadow hover:shadow-sm group-data-[view=list]/collection:grid group-data-[view=list]/collection:grid-cols-[9rem_minmax(0,1fr)_auto] group-data-[view=list]/collection:items-center group-data-[view=list]/collection:gap-4 group-data-[view=list]/collection:py-4">
      <div className="mb-4 flex items-center justify-between gap-2 group-data-[view=list]/collection:mb-0">
        <span
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium",
            archived
              ? "bg-surface-hover text-muted"
              : card.status === "draft"
                ? "bg-warning-soft text-warning"
                : studied
                  ? "bg-success-soft text-success"
                  : "bg-primary-soft text-primary-ink",
          )}
        >
          {archived
            ? "Arquivado"
            : card.status === "draft"
              ? "Rascunho"
              : studied
                ? "Estudado"
                : "Novo"}
        </span>
        <div className="flex items-center gap-1">
          <button
            className={cn(
              "inline-flex size-8 min-w-8 items-center justify-center rounded-lg border-0 bg-transparent p-[0.5rem] hover:bg-surface-hover hover:text-foreground [&_svg]:size-[1.8rem] text-subtle",
              card.favorite ? "!text-warning" : "",
            )}
            aria-label={card.favorite ? "Remover favorito" : "Favoritar"}
            onClick={() =>
              void ui.perform(() =>
                repository.setFavorite("flashcard", card.id, !card.favorite),
              )
            }
          >
            {card.favorite ? <HiStar /> : <HiOutlineStar />}
          </button>
          <EntityActions kind="flashcard" item={card} archived={archived} />
        </div>
      </div>
      <button
        className="block w-full min-w-0 border-0 bg-transparent text-left [&_h3]:mt-3 [&_h3]:min-h-[6rem] [&_h3]:text-lg [&_h3]:font-medium [&_h3]:leading-relaxed [&_h3]:line-clamp-3 group-data-[view=list]/collection:[&_h3]:min-h-0 group-data-[view=list]/collection:[&_h3]:mt-1"
        onClick={() =>
          archived ? ui.setPreviewId(card.id) : ui.setEditorId(card.id)
        }
      >
        <span className="font-semibold tracking-[0.14rem] block truncate text-xs text-muted [&>span]:mx-1 [&>span]:text-subtle">
          {subject?.name} <span>/</span> {topic?.name}
        </span>
        <h3>{card.questionText || "Flashcard sem título"}</h3>
      </button>
      <div className="mb-4 mt-4 flex flex-wrap items-center gap-[0.6rem] group-data-[view=list]/collection:hidden">
        {data.tags
          .filter((tag) => card.tags.includes(tag.id))
          .slice(0, 3)
          .map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        {card.tags.length > 3 && (
          <span className="text-muted text-xs">+{card.tags.length - 3}</span>
        )}
      </div>
      <div className="flex min-h-12 items-center justify-between gap-2 border-t border-border text-xs text-subtle [&>svg]:size-4 group-data-[view=list]/collection:hidden">
        <span>{shortDate(card.updatedAt)}</span>
        <div className="flex items-center gap-1">
          <button
            className="inline-flex size-8 min-w-8 items-center justify-center rounded-lg border-0 bg-transparent p-[0.5rem] text-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-[1.8rem]"
            aria-label="Visualizar flashcard"
            onClick={() => ui.setPreviewId(card.id)}
          >
            <HiOutlineEye />
          </button>
          {!archived && (
            <button
              className="inline-flex size-8 min-w-8 items-center justify-center rounded-lg border-0 bg-transparent p-[0.5rem] text-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-[1.8rem]"
              aria-label="Editar flashcard"
              onClick={() => ui.setEditorId(card.id)}
            >
              <HiPencilSquare />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
