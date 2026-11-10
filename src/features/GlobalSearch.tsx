"use client";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { searchSchema } from "@/src/lib/schemas";
import { useRouter } from "next/navigation";
import {
  HiMagnifyingGlass,
  HiOutlineBookOpen,
  HiOutlineFolder,
  HiOutlineSquare2Stack,
  HiArrowRight,
} from "react-icons/hi2";
import { useLibrary } from "@/data/contexts/LibraryContext";
import { useUI } from "@/data/contexts/UIContext";
import { normalizeText } from "@/data/domain/documents";
import { isArchived, topicIsArchived } from "@/data/domain/filters";
import { flushAllSaves } from "@/data/domain/autosave";
import { Modal } from "@/src/components/ui/Primitives";
function SearchContent() {
  const { data } = useLibrary();
  const ui = useUI();
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: "" },
  });
  const query = useWatch({ control, name: "query" });
  if (!data) return null;
  const q = normalizeText(query.trim());
  const subjects = q
    ? data.subjects
        .filter(
          (s) =>
            !s.archivedAt &&
            normalizeText(s.name + " " + s.description).includes(q),
        )
        .slice(0, 3)
    : [];
  const topics = q
    ? data.topics
        .filter(
          (t) =>
            !topicIsArchived(t, data) &&
            normalizeText(t.name + " " + t.summaryText).includes(q),
        )
        .slice(0, 3)
    : [];
  const cards = data.flashcards
    .filter(
      (c) =>
        !isArchived(c, data) &&
        normalizeText(
          c.questionText +
            " " +
            c.answerText +
            " " +
            c.tags
              .map((id) => data.tags.find((t) => t.id === id)?.name)
              .join(" "),
        ).includes(q),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, q ? 5 : 4);
  const go = (href: string) =>
    ui.perform(async () => {
      await flushAllSaves();
      ui.setSearchOpen(false);
      router.push(href);
    });
  return (
    <>
      <form
        className="flex items-center gap-3 border-b border-border px-5 py-5 [&>svg]:size-5 [&>svg]:text-muted [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-base [&_input]:outline-none [&_input:focus-visible]:outline-none"
        noValidate
        onSubmit={handleSubmit(({ query }) =>
          go("/dashboard/search?q=" + encodeURIComponent(query)),
        )}
      >
        <HiMagnifyingGlass />
        <input
          autoFocus
          aria-label="Buscar em todo o espaço"
          placeholder="Busque uma ideia, matéria ou tag…"
          {...register("query")}
          aria-invalid={!!errors.query}
        />
      </form>
      {errors.query && (
        <p role="alert" className="text-sm text-danger">
          {errors.query.message}
        </p>
      )}
      <div className="max-h-[58dvh] overflow-y-auto p-3 [&>p:first-child]:px-3 [&>p:first-child]:py-3">
        {!q && (
          <p className="text-sm font-semibold tracking-[0.14rem] text-muted">
            Editados recentemente
          </p>
        )}
        {subjects.map((s) => (
          <button
            key={s.id}
            className="mb-1 flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-3 text-left hover:bg-surface-hover [&>svg]:size-5 [&>svg]:text-muted [&>svg:last-child]:ml-auto [&_span]:min-w-0 [&_strong]:block [&_strong]:truncate [&_strong]:text-sm [&_strong]:font-medium [&_small]:mt-1 [&_small]:block [&_small]:text-xs [&_small]:text-muted"
            onClick={() => void go("/dashboard/" + s.path)}
          >
            <HiOutlineBookOpen />
            <span>
              <strong>{s.name}</strong>
              <small>Matéria</small>
            </span>
            <HiArrowRight />
          </button>
        ))}
        {topics.map((t) => (
          <button
            key={t.id}
            className="mb-1 flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-3 text-left hover:bg-surface-hover [&>svg]:size-5 [&>svg]:text-muted [&>svg:last-child]:ml-auto [&_span]:min-w-0 [&_strong]:block [&_strong]:truncate [&_strong]:text-sm [&_strong]:font-medium [&_small]:mt-1 [&_small]:block [&_small]:text-xs [&_small]:text-muted"
            onClick={() =>
              void go(
                "/dashboard/" +
                  data.subjects.find((s) => s.id === t.subjectId)?.path +
                  "/" +
                  t.path +
                  "?tab=summary",
              )
            }
          >
            <HiOutlineFolder />
            <span>
              <strong>{t.name}</strong>
              <small>Tópico e resumo</small>
            </span>
            <HiArrowRight />
          </button>
        ))}
        {cards.map((card) => (
          <button
            key={card.id}
            className="mb-1 flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-3 text-left hover:bg-surface-hover [&>svg]:size-5 [&>svg]:text-muted [&>svg:last-child]:ml-auto [&_span]:min-w-0 [&_strong]:block [&_strong]:truncate [&_strong]:text-sm [&_strong]:font-medium [&_small]:mt-1 [&_small]:block [&_small]:text-xs [&_small]:text-muted"
            onClick={() =>
              void ui.perform(async () => {
                await flushAllSaves();
                ui.setSearchOpen(false);
                ui.setEditorId(card.id);
              })
            }
          >
            <HiOutlineSquare2Stack />
            <span>
              <strong>{card.questionText || "Rascunho sem título"}</strong>
              <small>Flashcard</small>
            </span>
            <HiArrowRight />
          </button>
        ))}
        {!subjects.length && !topics.length && !cards.length && (
          <p className="text-muted p-7 text-center text-sm">
            Nenhum resultado. Tente outro termo.
          </p>
        )}
      </div>
      {q && (
        <button
          className="block w-full border-t border-border bg-surface-muted px-5 py-4 text-left text-sm text-muted hover:text-primary-ink"
          onClick={() =>
            void go("/dashboard/search?q=" + encodeURIComponent(query))
          }
        >
          Ver todos os resultados
          <HiArrowRight />
        </button>
      )}
    </>
  );
}
export function GlobalSearch() {
  const ui = useUI();
  return (
    <Modal
      open={ui.searchOpen}
      onOpenChange={ui.setSearchOpen}
      title="Buscar no seu espaço"
      className="w-[min(68rem,calc(100vw-3.2rem))] overflow-hidden p-0 sm:p-0 [&>[data-slot=dialog-heading]]:sr-only"
    >
      <SearchContent key={String(ui.searchOpen)} />
    </Modal>
  );
}
