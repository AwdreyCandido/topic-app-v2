"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiArrowRight,
  FiChevronLeft,
  FiCheckCircle,
  FiFlag,
  FiRotateCcw,
  FiSkipForward,
} from "react-icons/fi";

import { cn } from "@/src/lib/cn";
import { studySchema } from "@/src/lib/schemas";
import { formControl, ratingColors } from "@/src/components/ui/variants";
import { PageHeading } from "@/src/components/ui/PageHeading";
import { Empty, isTyping } from "@/src/components/ui/Primitives";
import { DocumentStatus } from "@/src/components/DocumentStatus";
import { RichEditor } from "@/src/components/editor/DynamicEditor";
import { useFlashcardContent } from "@/data/hooks/useDocumentContent";
import { useLibrary } from "@/data/contexts/LibraryContext";
import { useUI } from "@/data/contexts/UIContext";
import { repository } from "@/data/storage/repository";
import {
  filterCards,
  isArchived,
  parseFilters,
  topicIsArchived,
} from "@/data/domain/filters";
import { flushAllSaves } from "@/data/domain/autosave";
import type { Flashcard, Rating, StudySession } from "@/data/types";

const ratings: Rating[] = ["again", "hard", "good", "easy"];

export const ratingLabels: Record<Rating, string> = {
  again: "Errei",
  hard: "Difícil",
  good: "Bom",
  easy: "Fácil",
};

const focusClass =
  "focus-visible:outline-[0.2rem] focus-visible:outline-offset-[0.2rem] focus-visible:outline-primary";

const primaryButton =
  "inline-flex min-h-[4.2rem] items-center justify-center gap-[0.9rem] rounded-[0.8rem] bg-primary px-[1.8rem] text-[1.35rem] font-semibold text-white transition-colors hover:enabled:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex min-h-[4rem] items-center justify-center gap-[0.8rem] rounded-[0.8rem] border border-border bg-surface px-[1.4rem] text-[1.3rem] font-medium text-foreground transition-colors hover:enabled:border-border-strong hover:enabled:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40";

function StudySetup() {
  const { data } = useLibrary();
  const ui = useUI();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(studySchema),
    defaultValues: {
      subject: "",
      topic: "",
      limit: "20" as const,
      shuffle: true,
    },
  });

  const { subject, topic, limit, shuffle } = useWatch({ control });

  const cards = useMemo(() => {
    if (!data) return [];
    return filterCards(data, {
      ...parseFilters(new URLSearchParams()),
      subject: subject ?? "",
      topic: topic ?? "",
      status: "ready",
    });
  }, [data, subject, topic]);

  if (!data) return null;

  const selectedLimit = limit ?? "20";
  const count =
    selectedLimit === "all"
      ? cards.length
      : Math.min(cards.length, Number(selectedLimit));
  const pending = [...data.sessions]
    .filter((session) => !session.completedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const startSession = async () => {
    if (busy || count === 0) return;
    setBusy(true);

    try {
      await ui.perform(async () => {
        await flushAllSaves();
        const chosen = [...cards];

        if (shuffle) {
          for (let index = chosen.length - 1; index > 0; index--) {
            const random = Math.floor(Math.random() * (index + 1));
            [chosen[index], chosen[random]] = [chosen[random], chosen[index]];
          }
        }

        if (selectedLimit !== "all") {
          chosen.splice(Number(selectedLimit));
        }

        const title =
          data.topics.find((item) => item.id === topic)?.name ??
          data.subjects.find((item) => item.id === subject)?.name ??
          "Todos os flashcards";

        const session = await repository.createSession(
          chosen.map((card) => card.id),
          title,
          false,
        );

        router.push(`/dashboard/study?session=${session.id}`);
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[100rem] min-w-0 pb-[3rem]">
      <PageHeading
        title="Estudar"
        description="Selecione os flashcards que deseja revisar."
      />

      {pending.length > 0 && (
        <section className="mb-[3.2rem]" aria-labelledby="pending-heading">
          <div className="mb-[1.4rem] flex items-center justify-between gap-[1rem]">
            <h2
              id="pending-heading"
              className="font-heading text-[1.7rem] font-semibold tracking-[-0.04rem] text-foreground"
            >
              Em andamento
            </h2>
            <span className="text-[1.2rem] text-muted">
              {pending.length} {pending.length === 1 ? "sessão" : "sessões"}
            </span>
          </div>

          <div className="overflow-hidden rounded-[1.2rem] border border-border bg-surface divide-y divide-border">
            {pending.slice(0, 3).map((session) => {
              const progress = session.cardIds.length
                ? Math.min(
                    100,
                    Math.round(
                      (session.currentIndex / session.cardIds.length) * 100,
                    ),
                  )
                : 0;

              return (
                <Link
                  key={session.id}
                  href={`/dashboard/study?session=${session.id}`}
                  className={cn(
                    "group flex min-w-0 items-center gap-[1.8rem] px-[2rem] py-[1.7rem] transition-colors hover:bg-surface-hover sm:px-[2.4rem]",
                    focusClass,
                  )}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-[0.4rem]">
                    <span className="truncate text-[1.4rem] font-semibold text-foreground">
                      {session.title}
                    </span>
                    <span className="text-[1.2rem] text-muted">
                      {session.currentIndex} de {session.cardIds.length} cartões
                    </span>
                  </div>
                  <div className="hidden w-[12rem] shrink-0 items-center gap-[1rem] sm:flex">
                    <div className="h-[0.4rem] flex-1 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="w-[3rem] text-right text-[1.15rem] tabular-nums text-muted">
                      {progress}%
                    </span>
                  </div>
                  <FiArrowRight
                    aria-hidden="true"
                    className="size-[1.7rem] shrink-0 text-muted transition-colors group-hover:text-primary-ink"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section
        aria-labelledby="new-session-heading"
        className="overflow-hidden rounded-[1.2rem] border border-border bg-surface"
      >
        <div className="flex flex-wrap items-center justify-between gap-[1.2rem] border-b border-border px-[2.4rem] py-[2rem] sm:px-[2.8rem]">
          <h2
            id="new-session-heading"
            className="font-heading text-[1.7rem] font-semibold tracking-[-0.04rem] text-foreground"
          >
            Nova sessão
          </h2>
          <span className="text-[1.25rem] text-muted">
            {cards.length}{" "}
            {cards.length === 1
              ? "flashcard disponível"
              : "flashcards disponíveis"}
          </span>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit(startSession)}
          className="px-[2.4rem] py-[2.4rem] sm:px-[2.8rem] sm:py-[2.8rem]"
        >
          <div className="grid grid-cols-1 gap-[2rem] sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex min-w-0 flex-col gap-[0.9rem] text-[1.3rem] font-medium text-foreground">
              Matéria
              <select
                {...register("subject", {
                  onChange: () => setValue("topic", ""),
                })}
                className={cn(
                  formControl,
                  "min-h-[4.4rem] w-full text-[1.35rem]",
                )}
              >
                <option value="">Todas as matérias</option>
                {data.subjects
                  .filter((item) => !item.archivedAt)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-[0.9rem] text-[1.3rem] font-medium text-foreground">
              Tópico
              <select
                {...register("topic")}
                className={cn(
                  formControl,
                  "min-h-[4.4rem] w-full text-[1.35rem]",
                )}
              >
                <option value="">Todos os tópicos</option>
                {data.topics
                  .filter(
                    (item) =>
                      !topicIsArchived(item, data) &&
                      (!subject || item.subjectId === subject),
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-[0.9rem] text-[1.3rem] font-medium text-foreground sm:col-span-2 lg:col-span-1">
              Quantidade
              <select
                {...register("limit")}
                className={cn(
                  formControl,
                  "min-h-[4.4rem] w-full text-[1.35rem]",
                )}
              >
                <option value="10">Até 10 cartões</option>
                <option value="20">Até 20 cartões</option>
                <option value="all">Todos os disponíveis</option>
              </select>
            </label>
          </div>

          {errors.limit && (
            <p className="mt-[1.2rem] text-[1.25rem] text-danger" role="alert">
              {errors.limit.message}
            </p>
          )}
          {count === 0 && (
            <p className="mt-[1.6rem] text-[1.3rem] text-muted">
              Nenhum flashcard pronto para a seleção atual.
            </p>
          )}

          <div className="mt-[2.8rem] flex flex-wrap items-center justify-between gap-[2rem] border-t border-border pt-[2.4rem]">
            <label className="inline-flex cursor-pointer items-center gap-[1rem] text-[1.3rem] text-foreground">
              <input
                type="checkbox"
                {...register("shuffle")}
                className="size-[1.6rem] accent-primary"
              />
              Embaralhar cartões
            </label>

            <div className="flex w-full flex-wrap items-center justify-between gap-[1.8rem] sm:w-auto sm:justify-end">
              <span className="text-[1.25rem] text-muted">
                {count} {count === 1 ? "cartão" : "cartões"} na sessão
              </span>
              <button
                type="submit"
                disabled={busy || count === 0}
                className={cn(primaryButton, focusClass, "max-sm:flex-1")}
              >
                {busy ? "Preparando..." : "Começar a estudar"}
                {!busy && (
                  <FiArrowRight className="size-[1.6rem]" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

type StudyCardProps = {
  card: Flashcard;
  canRate: boolean;
  onRate: (rating: Rating) => Promise<void>;
};

function StudyCard(props: StudyCardProps) {
  const content = useFlashcardContent(props.card);

  return content.loading ? (
    <DocumentStatus error={content.error} retry={content.retry} />
  ) : (
    <StudyCardContent {...props} />
  );
}

function StudyCardContent({ card, canRate, onRate }: StudyCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const ui = useUI();

  const rate = useCallback(
    (rating: Rating) => {
      if (busy || !canRate || !revealed) return;

      setBusy(true);
      void ui.perform(async () => {
        try {
          await onRate(rating);
        } finally {
          setBusy(false);
        }
      });
    },
    [busy, canRate, revealed, onRate, ui],
  );

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (
        isTyping(event.target) ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.repeat ||
        (event.target instanceof HTMLElement &&
          event.target.closest("button, a, [role='dialog']"))
      )
        return;

      if (event.code === "Space" && !revealed) {
        event.preventDefault();
        setRevealed(true);
        return;
      }

      const index = ["1", "2", "3", "4"].indexOf(event.key);
      if (index >= 0 && revealed && canRate && !busy) {
        event.preventDefault();
        rate(ratings[index]);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [revealed, canRate, busy, rate]);

  return (
    <article className="min-w-0 overflow-hidden rounded-[1.2rem] border border-border bg-surface">
      <section className="px-[2.4rem] py-[3rem] sm:px-[4rem] sm:py-[4rem]">
        <h2 className="mb-[2rem] text-[1.2rem] font-semibold uppercase tracking-[0.1rem] text-muted">
          Pergunta
        </h2>
        <div className="min-w-0 break-words font-heading text-foreground [&_.bn-editor]:text-[clamp(1.9rem,2.3vw,2.6rem)] [&_.bn-editor]:font-medium [&_.bn-editor]:leading-[1.55] [&_.ProseMirror]:min-h-0">
          <RichEditor
            initialContent={card.question}
            readOnly
            label="Pergunta de estudo"
          />
        </div>
      </section>

      {revealed ? (
        <>
          <section className="border-t border-border bg-surface-muted/50 px-[2.4rem] py-[3rem] sm:px-[4rem] sm:py-[3.5rem]">
            <h2 className="mb-[1.8rem] text-[1.2rem] font-semibold uppercase tracking-[0.1rem] text-muted">
              Resposta
            </h2>
            <div className="min-w-0 break-words text-foreground [&_.bn-editor]:text-[1.5rem] [&_.bn-editor]:leading-[1.7] [&_.ProseMirror]:min-h-0">
              <RichEditor
                initialContent={card.answer}
                readOnly
                label="Resposta de estudo"
              />
            </div>
          </section>

          {canRate && (
            <div className="border-t border-border px-[2.4rem] py-[2.4rem] sm:px-[4rem]">
              <h3 className="mb-[1.6rem] text-[1.3rem] font-medium text-foreground">
                Como foi sua resposta?
              </h3>
              <div className="grid grid-cols-2 gap-[1rem] sm:grid-cols-4">
                {ratings.map((rating, index) => (
                  <button
                    key={rating}
                    type="button"
                    disabled={busy}
                    onClick={() => rate(rating)}
                    className={cn(
                      "flex min-h-[4.4rem] items-center justify-between gap-[1rem] rounded-[0.8rem] border border-current px-[1.4rem] text-[1.3rem] font-semibold transition-[filter,opacity] hover:enabled:brightness-95 disabled:cursor-not-allowed disabled:opacity-50",
                      ratingColors[rating],
                      focusClass,
                    )}
                  >
                    {ratingLabels[rating]}
                    <kbd className="text-[1.15rem] font-medium opacity-60">
                      {index + 1}
                    </kbd>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="border-t border-border px-[2.4rem] py-[2rem] sm:px-[4rem]">
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className={cn(primaryButton, focusClass, "w-full sm:w-auto")}
          >
            Mostrar resposta
            <FiArrowRight aria-hidden="true" className="size-[1.6rem]" />
          </button>
        </div>
      )}
    </article>
  );
}

function Session({ session }: { session: StudySession }) {
  const { data } = useLibrary();
  const ui = useUI();
  const [previewPosition, setPreviewPosition] = useState<number | null>(null);

  if (!data) return null;

  const reviews = data.reviews.filter(
    (review) => review.sessionId === session.id,
  );

  if (session.completedAt) {
    return (
      <main className="mx-auto w-full max-w-[82rem] min-w-0 pb-[3rem]">
        <div className="mb-[1.8rem] flex size-[4.8rem] items-center justify-center rounded-[1.2rem] bg-success-soft text-success">
          <FiCheckCircle aria-hidden="true" className="size-[2.5rem]" />
        </div>
        <PageHeading
          title="Sessão concluída"
          description={`Você avaliou ${reviews.length} de ${session.cardIds.length} cartões selecionados.`}
        />

        <section
          aria-label="Resultados da sessão"
          className="mb-[3rem] grid grid-cols-2 gap-y-[2.4rem] border-y border-border py-[2.6rem] sm:grid-cols-4 sm:gap-y-0"
        >
          {ratings.map((rating, index) => (
            <div
              key={rating}
              className={cn(
                "min-w-0",
                index > 0 && "sm:border-l sm:border-border sm:pl-[2rem]",
                index % 2 === 1 &&
                  "max-sm:border-l max-sm:border-border max-sm:pl-[2rem]",
              )}
            >
              <strong className="block font-heading text-[2.7rem] font-semibold leading-[1.2] tracking-[-0.07rem] text-foreground">
                {reviews.filter((review) => review.rating === rating).length}
              </strong>
              <span className="mt-[0.6rem] block text-[1.25rem] text-muted">
                {ratingLabels[rating]}
              </span>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap items-center gap-[1rem]">
          <Link
            href="/dashboard/study"
            className={cn(primaryButton, focusClass)}
          >
            <FiRotateCcw aria-hidden="true" className="size-[1.6rem]" />
            Nova sessão
          </Link>
          <Link
            href="/dashboard/history"
            className={cn(secondaryButton, focusClass)}
          >
            Ver histórico
          </Link>
        </div>
      </main>
    );
  }

  const position = previewPosition ?? session.currentIndex;
  const card = data.flashcards.find(
    (item) => item.id === session.cardIds[position],
  );
  const available = Boolean(
    card && card.status === "ready" && !isArchived(card, data),
  );
  const percentage = session.cardIds.length
    ? Math.min(
        100,
        Math.round((session.currentIndex / session.cardIds.length) * 100),
      )
    : 0;

  return (
    <main className="mx-auto w-full max-w-[90rem] min-w-0 pb-[3rem]">
      <header className="mb-[2.8rem] flex flex-wrap items-start justify-between gap-[2rem]">
        <div className="min-w-0">
          <Link
            href="/dashboard/study"
            className={cn(
              "mb-[1.2rem] inline-flex items-center gap-[0.6rem] text-[1.25rem] text-muted transition-colors hover:text-primary-ink",
              focusClass,
            )}
          >
            <FiChevronLeft aria-hidden="true" className="size-[1.5rem]" />
            Estudar
          </Link>
          <h1 className="font-heading text-[clamp(2.4rem,2.7vw,3.2rem)] font-semibold leading-[1.3] tracking-[-0.08rem] text-foreground">
            {session.title}
          </h1>
        </div>

        <button
          type="button"
          className={cn(secondaryButton, focusClass, "shrink-0 text-muted")}
          onClick={() =>
            void ui.perform(async () => {
              const confirmed = await ui.confirm({
                title: "Encerrar esta sessão?",
                description:
                  "Suas avaliações ficam no histórico. Você pode iniciar outra sessão quando quiser.",
                label: "Encerrar sessão",
              });
              if (confirmed) await repository.endSession(session.id);
            })
          }
        >
          <FiFlag aria-hidden="true" className="size-[1.6rem]" />
          Encerrar
        </button>
      </header>

      <div className="mb-[2.4rem]">
        <div className="mb-[1.2rem] flex flex-wrap items-center justify-between gap-[0.8rem] text-[1.3rem] text-muted">
          <span>
            Cartão{" "}
            <strong className="font-semibold text-foreground">
              {position + 1}
            </strong>{" "}
            de {session.cardIds.length}
            {position !== session.currentIndex && (
              <span className="ml-[1rem] text-primary-ink">
                Revisão anterior
              </span>
            )}
          </span>
          <span className="tabular-nums">{percentage}% concluído</span>
        </div>
        <div
          role="progressbar"
          aria-label="Progresso da sessão"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          className="h-[0.5rem] overflow-hidden rounded-full bg-border"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {available && card ? (
        <StudyCard
          key={`${session.id}-${position}`}
          card={card}
          canRate={position === session.currentIndex}
          onRate={async (rating) => {
            await repository.rate(session.id, session.currentIndex, rating);
            setPreviewPosition(null);
          }}
        />
      ) : (
        <div className="rounded-[1.2rem] border border-border bg-surface px-[2rem] py-[4rem]">
          <Empty
            title="Este cartão não está disponível"
            description="Ele pode ter sido arquivado, excluído ou transformado em rascunho."
          >
            {position === session.currentIndex && (
              <button
                type="button"
                className={cn(primaryButton, focusClass)}
                onClick={() =>
                  void ui.perform(() =>
                    repository.rate(session.id, position, null),
                  )
                }
              >
                Pular cartão
              </button>
            )}
          </Empty>
        </div>
      )}

      <nav
        aria-label="Navegação entre cartões"
        className="mt-[1.8rem] flex flex-wrap items-center justify-between gap-[1rem]"
      >
        <button
          type="button"
          disabled={position <= 0}
          onClick={() => setPreviewPosition(position - 1)}
          className={cn(secondaryButton, focusClass)}
        >
          <FiChevronLeft aria-hidden="true" className="size-[1.6rem]" />
          Anterior
        </button>

        {position !== session.currentIndex ? (
          <button
            type="button"
            onClick={() => setPreviewPosition(null)}
            className={cn(secondaryButton, focusClass)}
          >
            Voltar ao atual
            <FiArrowRight aria-hidden="true" className="size-[1.6rem]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              void ui.perform(() => repository.rate(session.id, position, null))
            }
            className={cn(secondaryButton, focusClass)}
          >
            Pular sem avaliar
            <FiSkipForward aria-hidden="true" className="size-[1.6rem]" />
          </button>
        )}
      </nav>
    </main>
  );
}

export function Study() {
  const params = useSearchParams();
  const { data } = useLibrary();

  if (!data) return null;

  const sessionId = params.get("session");
  if (!sessionId) return <StudySetup />;

  const session = data.sessions.find((item) => item.id === sessionId);
  if (!session) {
    return (
      <div className="mx-auto w-full max-w-[90rem] rounded-[1.2rem] border border-border bg-surface p-[2.4rem]">
        <Empty
          title="Sessão não encontrada"
          description="Escolha seu conteúdo para começar uma nova sessão."
        >
          <Link
            href="/dashboard/study"
            className={cn(primaryButton, focusClass)}
          >
            Preparar sessão
          </Link>
        </Empty>
      </div>
    );
  }

  return <Session key={session.id} session={session} />;
}
