"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiLayers,
  FiPlay,
} from "react-icons/fi";

import { cn } from "@/src/lib/cn";
import { ratingColors } from "@/src/components/ui/variants";
import { useLibrary } from "@/data/contexts/LibraryContext";
import { PageHeading } from "@/src/components/ui/PageHeading";
import { Empty, longDate } from "@/src/components/ui/Primitives";
import { ratingLabels } from "./Study";

const focusClass =
  "focus-visible:outline-[0.2rem] focus-visible:outline-offset-[0.2rem] focus-visible:outline-primary";

export function History() {
  const { data } = useLibrary();
  const [selected, setSelected] = useState("");
  const [limit, setLimit] = useState(30);

  if (!data) return null;

  const sessions = [...data.sessions].sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt),
  );

  const reviews = data.reviews
    .filter((review) => !selected || review.sessionId === selected)
    .sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt));

  const completedSessions = sessions.filter((session) =>
    Boolean(session.completedAt),
  ).length;

  const studyDays = new Set(
    data.reviews.map((review) =>
      new Date(review.reviewedAt).toLocaleDateString("pt-BR"),
    ),
  ).size;

  const reviewCounts = new Map<string, number>();

  for (const review of data.reviews) {
    if (!review.sessionId) continue;

    reviewCounts.set(
      review.sessionId,
      (reviewCounts.get(review.sessionId) ?? 0) + 1,
    );
  }

  const selectedSession = sessions.find((session) => session.id === selected);

  const selectSession = (id: string) => {
    setSelected(id);
    setLimit(30);
  };

  return (
    <div className="min-w-0">
      <PageHeading
        title="Histórico"
        description="Consulte suas sessões de estudo e as avaliações dos seus flashcards."
      />

      <section
        aria-label="Resumo dos estudos"
        className="mb-[3.2rem] grid grid-cols-1 gap-y-[2rem] border-b border-border pb-[2.8rem] sm:grid-cols-3 sm:gap-y-0"
      >
        <div className="flex min-w-0 items-start gap-[1.4rem] sm:pr-[2rem]">
          <div className="flex size-[3.8rem] shrink-0 items-center justify-center rounded-[0.9rem] bg-primary-soft text-primary-ink">
            <FiLayers aria-hidden="true" className="size-[1.8rem]" />
          </div>

          <div className="min-w-0">
            <strong className="block font-heading text-[2.6rem] font-semibold leading-[1.2] tracking-[-0.08rem] text-foreground">
              {data.reviews.length}
            </strong>

            <span className="mt-[0.5rem] block text-[1.25rem] text-muted">
              Avaliações registradas
            </span>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-[1.4rem] sm:border-l sm:border-border sm:px-[2rem]">
          <div className="flex size-[3.8rem] shrink-0 items-center justify-center rounded-[0.9rem] bg-surface-muted text-muted">
            <FiCheckCircle aria-hidden="true" className="size-[1.8rem]" />
          </div>

          <div className="min-w-0">
            <strong className="block font-heading text-[2.6rem] font-semibold leading-[1.2] tracking-[-0.08rem] text-foreground">
              {completedSessions}
            </strong>

            <span className="mt-[0.5rem] block text-[1.25rem] text-muted">
              Sessões concluídas
            </span>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-[1.4rem] sm:border-l sm:border-border sm:pl-[2rem]">
          <div className="flex size-[3.8rem] shrink-0 items-center justify-center rounded-[0.9rem] bg-surface-muted text-muted">
            <FiCalendar aria-hidden="true" className="size-[1.8rem]" />
          </div>

          <div className="min-w-0">
            <strong className="block font-heading text-[2.6rem] font-semibold leading-[1.2] tracking-[-0.08rem] text-foreground">
              {studyDays}
            </strong>

            <span className="mt-[0.5rem] block text-[1.25rem] text-muted">
              Dias com estudo
            </span>
          </div>
        </div>
      </section>

      {sessions.length === 0 ? (
        <div className="rounded-[1.2rem] border border-border bg-surface p-[2.4rem]">
          <Empty
            title="Nenhuma sessão registrada"
            description="Suas sessões e avaliações aparecerão aqui depois que você começar a estudar."
          >
            <Link
              href="/dashboard/study"
              className={cn(
                "inline-flex min-h-[4.2rem] items-center justify-center gap-[1rem] rounded-[0.8rem] bg-primary px-[1.8rem] text-[1.35rem] font-semibold text-white transition-colors hover:bg-primary-hover",
                focusClass,
              )}
            >
              <FiPlay aria-hidden="true" className="size-[1.6rem]" />
              Começar a estudar
            </Link>
          </Empty>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 items-start gap-[2.4rem] lg:grid-cols-[27rem_minmax(0,1fr)] lg:gap-[3rem]">
          <aside className="min-w-0">
            <div className="mb-[1.6rem] flex items-center justify-between gap-[1rem] px-[0.2rem]">
              <h2 className="font-heading text-[1.7rem] font-semibold tracking-[-0.04rem] text-foreground">
                Sessões
              </h2>

              <span className="text-[1.2rem] tabular-nums text-muted">
                {sessions.length}
              </span>
            </div>

            <nav
              aria-label="Filtrar avaliações por sessão"
              className="rounded-[1.2rem] border border-border bg-surface p-[0.7rem]"
            >
              <button
                type="button"
                onClick={() => selectSession("")}
                aria-pressed={!selected}
                className={cn(
                  "flex min-h-[5.6rem] w-full items-center gap-[1.1rem] rounded-[0.8rem] px-[1.2rem] py-[1rem] text-left transition-colors duration-150",
                  focusClass,
                  !selected
                    ? "bg-primary-soft text-primary-ink"
                    : "text-muted hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <FiLayers
                  aria-hidden="true"
                  className="size-[1.75rem] shrink-0"
                />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[1.3rem] font-semibold">
                    Todas as sessões
                  </span>

                  <span
                    className={cn(
                      "mt-[0.3rem] block text-[1.15rem]",
                      !selected ? "text-primary-ink/75" : "text-muted",
                    )}
                  >
                    {data.reviews.length} avaliações
                  </span>
                </span>
              </button>

              <div className="mx-[1.2rem] my-[0.6rem] h-[0.1rem] bg-border" />

              <div className="flex flex-col gap-[0.3rem]">
                {sessions.map((session) => {
                  const active = selected === session.id;
                  const count = reviewCounts.get(session.id) ?? 0;
                  const inProgress = !session.completedAt;

                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "group flex min-w-0 items-center rounded-[0.8rem] transition-colors duration-150",
                        active
                          ? "bg-primary-soft text-primary-ink"
                          : "text-foreground hover:bg-surface-hover",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => selectSession(session.id)}
                        aria-pressed={active}
                        className={cn(
                          "flex min-w-0 flex-1 items-start gap-[1.1rem] rounded-[0.8rem] px-[1.2rem] py-[1.3rem] text-left",
                          focusClass,
                        )}
                      >
                        <FiClock
                          aria-hidden="true"
                          className={cn(
                            "mt-[0.1rem] size-[1.65rem] shrink-0",
                            active ? "text-primary-ink" : "text-muted",
                          )}
                        />

                        <span className="min-w-0 flex-1">
                          <span className="block break-words text-[1.3rem] font-semibold leading-[1.45]">
                            {session.title}
                          </span>

                          <span
                            className={cn(
                              "mt-[0.5rem] block text-[1.15rem] leading-[1.5]",
                              active ? "text-primary-ink/75" : "text-muted",
                            )}
                          >
                            {longDate(session.startedAt)}
                          </span>

                          <span
                            className={cn(
                              "mt-[0.5rem] block text-[1.15rem] leading-[1.5]",
                              active ? "text-primary-ink/75" : "text-muted",
                            )}
                          >
                            {count} avaliações
                            <span className="mx-[0.6rem]" aria-hidden="true">
                              ·
                            </span>
                            {inProgress ? "Em andamento" : "Concluída"}
                          </span>
                        </span>
                      </button>

                      {inProgress && (
                        <Link
                          href={`/dashboard/study?session=${session.id}`}
                          aria-label={`Retomar sessão ${session.title}`}
                          title="Retomar sessão"
                          className={cn(
                            "mr-[0.8rem] flex size-[3.2rem] shrink-0 items-center justify-center rounded-[0.7rem] transition-colors hover:bg-surface hover:text-primary-ink",
                            focusClass,
                          )}
                        >
                          <FiArrowRight
                            aria-hidden="true"
                            className="size-[1.7rem]"
                          />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </nav>
          </aside>

          <section className="min-w-0 overflow-hidden rounded-[1.2rem] border border-border bg-surface">
            <div className="flex flex-wrap items-start justify-between gap-[1.5rem] border-b border-border px-[2.2rem] py-[2rem] sm:px-[2.8rem]">
              <div className="min-w-0">
                <h2 className="font-heading text-[1.7rem] font-semibold tracking-[-0.04rem] text-foreground">
                  {selected ? "Avaliações da sessão" : "Avaliações recentes"}
                </h2>

                {selectedSession && (
                  <p className="mt-[0.5rem] break-words text-[1.25rem] text-muted">
                    {selectedSession.title}
                  </p>
                )}
              </div>

              <span className="shrink-0 rounded-[0.6rem] bg-surface-muted px-[1rem] py-[0.5rem] text-[1.2rem] font-medium tabular-nums text-muted">
                {reviews.length}{" "}
                {reviews.length === 1 ? "avaliação" : "avaliações"}
              </span>
            </div>

            {reviews.length === 0 ? (
              <div className="px-[2.2rem] py-[5rem] text-center sm:px-[2.8rem]">
                <FiLayers
                  aria-hidden="true"
                  className="mx-auto mb-[1.6rem] size-[2.4rem] text-muted"
                />

                <p className="text-[1.4rem] font-medium text-foreground">
                  Nenhuma avaliação registrada
                </p>

                <p className="mt-[0.6rem] text-[1.3rem] text-muted">
                  Esta sessão ainda não possui avaliações.
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-border">
                  {reviews.slice(0, limit).map((review) => (
                    <article
                      key={review.id}
                      className="flex min-w-0 flex-col gap-[1.6rem] px-[2.2rem] py-[2rem] sm:flex-row sm:items-start sm:justify-between sm:px-[2.8rem]"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-[1.4rem] font-semibold leading-[1.55] text-foreground">
                          {review.question || "Flashcard sem título"}
                        </h3>

                        <p className="mt-[0.7rem] break-words text-[1.25rem] leading-[1.5] text-muted">
                          {review.subject}
                          {review.topic && (
                            <>
                              <span
                                className="mx-[0.7rem] text-subtle"
                                aria-hidden="true"
                              >
                                /
                              </span>
                              {review.topic}
                            </>
                          )}
                        </p>

                        <div className="mt-[1.1rem] flex flex-wrap items-center gap-x-[1.2rem] gap-y-[0.5rem] text-[1.15rem] text-subtle">
                          <span>{longDate(review.reviewedAt)}</span>

                          {review.cardId === null && (
                            <span className="text-muted">
                              Conteúdo excluído
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={cn(
                          "inline-flex min-h-[2.8rem] w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-[0.6rem] px-[1.1rem] text-[1.2rem] font-semibold",
                          ratingColors[review.rating],
                        )}
                      >
                        {ratingLabels[review.rating]}
                      </span>
                    </article>
                  ))}
                </div>

                {reviews.length > limit && (
                  <div className="flex justify-center border-t border-border px-[2.2rem] py-[1.8rem] sm:px-[2.8rem]">
                    <button
                      type="button"
                      onClick={() => setLimit((value) => value + 30)}
                      className={cn(
                        "inline-flex min-h-[3.8rem] items-center justify-center gap-[0.9rem] rounded-[0.8rem] border border-border bg-surface px-[1.6rem] text-[1.3rem] font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover",
                        focusClass,
                      )}
                    >
                      Mostrar mais
                      <span className="text-[1.15rem] font-normal text-muted">
                        {Math.min(30, reviews.length - limit)}
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
