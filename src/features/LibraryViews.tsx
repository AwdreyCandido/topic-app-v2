"use client";
import { cn } from "@/src/lib/cn";
import Link from "next/link";
import {
  HiPlus,
  HiArrowRight,
  HiOutlineSquare2Stack,
  HiOutlineBookOpen,
  HiOutlineClock,
  HiOutlineBolt,
  HiPencilSquare,
} from "react-icons/hi2";
import { useLibrary } from "@/data/contexts/LibraryContext";
import { useUI } from "@/data/contexts/UIContext";
import { useFilters } from "@/data/hooks/useFilters";
import {
  filterCards,
  filterEntities,
  isArchived,
  topicIsArchived,
} from "@/data/domain/filters";
import { normalizeText } from "@/data/domain/documents";
import { PageHeading } from "@/src/components/ui/PageHeading";
import { EntityCard, FlashcardTile } from "@/src/components/ui/Cards";
import { FiltersBar } from "@/src/components/ui/FiltersBar";
import { Empty } from "@/src/components/ui/Primitives";
import {
  NewCardButton,
  readyIds,
  StudyButton,
} from "@/src/components/ui/StudyActions";
import type { Flashcard } from "@/data/types";
export function FlashcardExplorer({
  subjectId,
  topicId,
}: {
  subjectId?: string;
  topicId?: string;
}) {
  const { data } = useLibrary();
  const { filters } = useFilters();
  if (!data) return null;
  const scoped = data.flashcards.filter(
    (card) =>
      (!topicId || card.topicId === topicId) &&
      (!subjectId ||
        data.topics.find((topic) => topic.id === card.topicId)?.subjectId ===
          subjectId),
  );
  const cards = filterCards(
    { ...data, flashcards: scoped },
    {
      ...filters,
      subject: subjectId ?? filters.subject,
      topic: topicId ?? filters.topic,
    },
  );
  return (
    <>
      <FiltersBar
        subjectId={subjectId}
        topicId={topicId}
        count={cards.length}
        total={scoped.length}
      />
      <div className="mb-5 mt-6 flex flex-wrap items-center justify-between gap-3 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted">
        <span className="text-muted text-sm">
          Seu conhecimento, cartão por cartão
        </span>
        <StudyButton
          cardIds={readyIds(cards, data)}
          title="Seleção filtrada"
          label="Estudar seleção"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-semibold [&_svg]:size-[1.7rem] border-border bg-surface text-foreground hover:enabled:bg-surface-hover min-h-[3.4rem] px-3 py-[0.7rem] text-sm"
        />
      </div>
      <CardCollection cards={cards} view={filters.view} topicId={topicId} />
    </>
  );
}
function CardCollection({
  cards,
  view,
  topicId,
}: {
  cards: Flashcard[];
  view: "grid" | "list";
  topicId?: string;
}) {
  return cards.length ? (
    <div
      data-view={view}
      className={cn(
        "group/collection grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",
        view === "list" ? "!grid-cols-1" : "",
      )}
    >
      {cards.map((card) => (
        <FlashcardTile key={card.id} card={card} />
      ))}
    </div>
  ) : (
    <Empty
      title="Nenhum flashcard por aqui"
      description="Crie um cartão ou ajuste os filtros para encontrar o que procura."
    >
      <NewCardButton topicId={topicId} />
    </Empty>
  );
}
export function Dashboard() {
  const { data } = useLibrary();
  const ui = useUI();
  const { filters } = useFilters();
  if (!data) return null;
  const subjects = filterEntities(data.subjects, filters);
  const activeCards = data.flashcards.filter((card) => !isArchived(card, data));
  const studyReady = readyIds(activeCards, data);
  const recent = activeCards
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);
  const activeSession = data.sessions
    .filter((session) => !session.completedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const studied = new Set(data.reviews.map((review) => review.cardKey)).size;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    return {
      label: new Intl.DateTimeFormat("pt-BR", { weekday: "narrow" }).format(
        date,
      ),
      count: data.reviews.filter(
        (review) =>
          new Date(review.reviewedAt) >= date &&
          new Date(review.reviewedAt) < end,
      ).length,
    };
  });
  const weekCount = days.reduce((sum, day) => sum + day.count, 0);
  const max = Math.max(1, ...days.map((day) => day.count));
  return (
    <>
      <PageHeading
        title="Todo conhecimento começa com uma ideia."
        description="Organize suas matérias, conecte conceitos e aprenda no seu ritmo."
        eyebrow="SEU ESPAÇO DE APRENDIZADO"
      >
        <button
          className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] bg-primary text-white shadow-sm hover:enabled:bg-primary-hover"
          onClick={() => ui.setEntityDialog({ kind: "subject" })}
        >
          <HiPlus />
          Nova matéria
        </button>
      </PageHeading>
      <section className="mb-5 grid grid-cols-1 gap-7 rounded-2xl border border-primary-border bg-primary-soft p-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.65fr)] lg:p-9">
        <div className="min-w-0 [&_h2]:mt-4 [&_h2]:text-[clamp(2.8rem,2.6vw,4rem)] [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:tracking-[-0.1rem] [&_h2_span]:text-primary-ink [&>p]:mb-6 [&>p]:mt-4 [&>p]:max-w-[48rem] [&>p]:text-base [&>p]:text-muted [&>.flex]:flex-wrap">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1rem] text-primary-ink [&_svg]:size-4">
            <HiOutlineBolt />
            UM POUCO A CADA DIA
          </span>
          <h2>
            Pequenos passos.
            <br />
            <span>Grandes descobertas.</span>
          </h2>
          <p>
            {studyReady.length
              ? "Você tem " +
                studyReady.length +
                " cartões prontos. Que tal dar o próximo passo?"
              : "Uma pergunta bem feita é o começo. Crie seu primeiro flashcard."}
          </p>
          <div className="flex items-center gap-3">
            <StudyButton
              cardIds={studyReady}
              title="Todos os flashcards"
              label="Começar a estudar"
            />
            <Link
              className="inline-flex items-center gap-2 py-2 text-sm font-medium text-primary-ink hover:underline [&_svg]:size-4"
              href="/dashboard/flashcards"
            >
              Explorar cartões
              <HiArrowRight />
            </Link>
          </div>
        </div>
        <div className="border-t border-primary-border pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 [&>.flex>svg]:size-4 [&>.flex>svg]:text-primary-ink">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-[0.14rem] text-muted">
              ÚLTIMOS 7 DIAS
            </span>
            <HiOutlineClock />
          </div>
          <div className="mt-4 flex items-baseline gap-3 font-heading text-4xl font-semibold text-primary-ink [&_span]:font-sans [&_span]:text-sm [&_span]:font-normal [&_span]:text-muted">
            {weekCount}
            <span>
              {weekCount === 1 ? "cartão avaliado" : "cartões avaliados"}
            </span>
          </div>
          <div
            className="mt-5 grid grid-cols-7 items-end gap-3"
            role="img"
            aria-label={
              "Avaliações nos últimos sete dias: " +
              days.map((day) => day.label + " " + day.count).join(", ")
            }
          >
            {days.map((day, index) => (
              <div
                className={cn(
                  "flex min-w-0 flex-col items-center gap-2 text-xs text-muted",
                  index === 6 ? "font-semibold text-primary-ink" : "",
                )}
                key={index}
              >
                <span className="min-h-[1.8rem] text-xs">
                  {day.count || ""}
                </span>
                <div className="flex h-20 w-full max-w-8 items-end justify-center [&>div]:w-full [&>div]:rounded-t-md [&>div]:bg-primary-border">
                  <div
                    style={{
                      height: `${Math.max(0.4, (day.count / max) * 8)}rem`,
                    }}
                    className={cn(day.count ? "!bg-primary" : "")}
                  />
                </div>
                <span>{day.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
        className="mb-8 grid grid-cols-1 gap-3 min-[30rem]:grid-cols-3 sm:gap-4"
        aria-label="Resumo do seu espaço"
      >
        {[
          {
            icon: HiOutlineBookOpen,
            label: "Matérias ativas",
            value: data.subjects.filter((s) => !s.archivedAt).length,
          },
          {
            icon: HiOutlineSquare2Stack,
            label: "Flashcards ativos",
            value: activeCards.length,
          },
          {
            icon: HiOutlineBolt,
            label: "Cartões já estudados",
            value: studied,
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 max-sm:flex-col max-sm:items-start [&_strong]:mt-1 [&_strong]:block [&_strong]:font-heading [&_strong]:text-3xl [&_strong]:font-medium [&_div>span]:text-sm [&_div>span]:text-muted"
            key={label}
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-ink [&_svg]:size-5">
              <Icon />
            </div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </section>
      {activeSession && (
        <Link
          className="my-6 flex items-center gap-4 rounded-xl border border-primary-border bg-primary-soft p-5 [&>svg]:text-primary-ink [&>svg:last-child]:ml-auto [&_strong]:block [&_strong]:text-base [&_span]:mt-1 [&_span]:block [&_span]:text-sm [&_span]:text-muted"
          href={"/dashboard/study?session=" + activeSession.id}
        >
          <HiOutlineBolt />
          <div>
            <strong>Continue de onde parou</strong>
            <span>
              {activeSession.title} · {activeSession.currentIndex} de{" "}
              {activeSession.cardIds.length} cartões percorridos
            </span>
          </div>
          <HiArrowRight />
        </Link>
      )}
      <div className="mb-5 mt-6 flex flex-wrap items-center justify-between gap-3 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted">
        <div>
          <h2>
            Suas matérias{" "}
            <span className="inline-flex items-center rounded-md bg-surface-hover px-2 py-[0.2rem] font-sans text-xs font-medium text-muted">
              {data.subjects.filter((s) => !s.archivedAt).length}
            </span>
          </h2>
          <p>Um lugar para cada área do seu conhecimento.</p>
        </div>
      </div>
      <FiltersBar entity count={subjects.length} total={data.subjects.length} />
      {subjects.length ? (
        <div
          data-view={filters.view}
          className={cn(
            "group/collection grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",
            filters.view === "list" ? "!grid-cols-1" : "",
          )}
        >
          {subjects.map((subject, index) => (
            <EntityCard
              item={subject}
              kind="subject"
              key={subject.id}
              index={index}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="Abra espaço para aprender"
          description="Crie sua primeira matéria ou ajuste os filtros."
        >
          <button
            className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] bg-primary text-white shadow-sm hover:enabled:bg-primary-hover"
            onClick={() => ui.setEntityDialog({ kind: "subject" })}
          >
            <HiPlus />
            Nova matéria
          </button>
        </Empty>
      )}
      {recent.length > 0 && (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted mt-10">
            <div>
              <h2>Ideias recentes</h2>
              <p>Retome os conceitos que você está construindo.</p>
            </div>
            <Link
              className="inline-flex items-center gap-[0.7rem] border-0 bg-transparent py-[0.5rem] text-sm font-medium text-primary-ink hover:underline [&_svg]:size-[1.5rem]"
              href="/dashboard/flashcards"
            >
              Ver todos
              <HiArrowRight />
            </Link>
          </div>
          <div className="group/collection grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((card) => (
              <FlashcardTile key={card.id} card={card} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
export function SubjectView({ path }: { path: string }) {
  const { data } = useLibrary();
  const ui = useUI();
  const { filters, params, update } = useFilters();
  if (!data) return null;
  const subject = data.subjects.find((s) => s.path === path);
  if (!subject) return <Missing kind="Matéria" />;
  const scoped = data.topics.filter((topic) => topic.subjectId === subject.id);
  const topicFilters = {
    ...filters,
    archive: subject.archivedAt ? ("all" as const) : filters.archive,
  };
  const topics = filterEntities(
    scoped.map((topic) => ({
      ...topic,
      description: topic.description + " " + topic.summaryText,
    })),
    topicFilters,
  ).map((result) => scoped.find((topic) => topic.id === result.id)!);
  const cards = data.flashcards.filter((card) =>
    scoped.some((topic) => topic.id === card.topicId),
  );
  const tab = params.get("tab") === "cards" ? "cards" : "topics";
  return (
    <>
      <PageHeading
        title={subject.name}
        description={subject.description || "Cada tópico é uma nova conexão."}
        breadcrumb={[
          { label: "Visão geral", href: "/dashboard" },
          { label: subject.name },
        ]}
      >
        <StudyButton
          cardIds={readyIds(cards, data)}
          title={subject.name}
          className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] border-border bg-surface text-foreground hover:enabled:border-border-strong hover:enabled:bg-surface-hover"
        />
        <button
          className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] bg-primary text-white shadow-sm hover:enabled:bg-primary-hover"
          disabled={Boolean(subject.archivedAt)}
          onClick={() =>
            ui.setEntityDialog({ kind: "topic", subjectId: subject.id })
          }
        >
          <HiPlus />
          Novo tópico
        </button>
      </PageHeading>
      {subject.archivedAt && (
        <p className="mb-5 rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm text-warning">
          Esta matéria está arquivada. Restaure-a pelo menu de ações em
          Arquivados para voltar a editar.
        </p>
      )}
      <div
        className="mb-6 flex flex-wrap items-center gap-5 border-b border-border [&>button]:relative [&>button]:flex [&>button]:items-center [&>button]:gap-2 [&>button]:border-0 [&>button]:bg-transparent [&>button]:pb-4 [&>button]:pt-2 [&>button]:text-sm [&>button]:font-medium [&>button]:text-muted [&>button[aria-selected=true]]:text-primary-ink [&>button[aria-selected=true]]:after:absolute [&>button[aria-selected=true]]:after:inset-x-0 [&>button[aria-selected=true]]:after:bottom-0 [&>button[aria-selected=true]]:after:h-[0.2rem] [&>button[aria-selected=true]]:after:bg-primary [&>button[aria-selected=true]]:after:content-[''] [&_svg]:size-4 [&_button>span]:rounded-md [&_button>span]:bg-surface-hover [&_button>span]:px-[0.6rem] [&_button>span]:text-xs"
        role="tablist"
        aria-label="Conteúdo da matéria"
      >
        <button
          role="tab"
          aria-selected={tab === "topics"}
          onClick={() => update({ tab: null })}
        >
          Tópicos<span>{scoped.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === "cards"}
          onClick={() => update({ tab: "cards" })}
        >
          Flashcards<span>{cards.length}</span>
        </button>
        <button
          className="!ml-auto !text-muted hover:!text-primary-ink max-sm:!text-[0] max-sm:[&_svg]:size-5"
          onClick={() =>
            ui.setEntityDialog({ kind: "subject", id: subject.id })
          }
        >
          <HiPencilSquare />
          Editar matéria
        </button>
      </div>
      {tab === "cards" ? (
        <FlashcardExplorer subjectId={subject.id} />
      ) : (
        <>
          <FiltersBar entity count={topics.length} total={scoped.length} />
          {topics.length ? (
            <div
              className={cn(
                "group/collection grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",
                filters.view === "list" ? "!grid-cols-1" : "",
              )}
            >
              {topics.map((topic, index) => (
                <EntityCard
                  item={topic}
                  kind="topic"
                  key={topic.id}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <Empty
              title="Sua próxima descoberta mora aqui"
              description="Adicione um tópico para começar a organizar resumos e flashcards."
            >
              <button
                className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] bg-primary text-white shadow-sm hover:enabled:bg-primary-hover"
                disabled={Boolean(subject.archivedAt)}
                onClick={() =>
                  ui.setEntityDialog({ kind: "topic", subjectId: subject.id })
                }
              >
                <HiPlus />
                Novo tópico
              </button>
            </Empty>
          )}
        </>
      )}
    </>
  );
}
export function LibraryView({
  mode = "all",
}: {
  mode?: "all" | "favorite" | "archive" | "search";
}) {
  const { data } = useLibrary();
  const { filters } = useFilters();
  if (!data) return null;
  const titles = {
    all: "Todos os flashcards",
    favorite: "Suas ideias favoritas",
    archive: "Conteúdo arquivado",
    search: "Encontre uma conexão",
  };
  const descriptions = {
    all: "Tudo o que você está aprendendo, em um só lugar.",
    favorite: "O que merece estar sempre por perto.",
    archive: "Conteúdos guardados, prontos para voltar quando fizer sentido.",
    search:
      "Busque em matérias, tópicos, resumos, perguntas, respostas e tags.",
  };
  const effective = {
    ...filters,
    favorite: mode === "favorite" || filters.favorite,
    archive: mode === "archive" ? ("archived" as const) : filters.archive,
  };
  const cards = filterCards(data, effective);
  const q = normalizeText(filters.q.trim());
  const subjects = data.subjects.filter((s) => {
    if (mode === "archive")
      return (
        s.archivedAt && normalizeText(s.name + " " + s.description).includes(q)
      );
    if (s.archivedAt) return false;
    if (mode === "favorite")
      return (
        s.favorite && normalizeText(s.name + " " + s.description).includes(q)
      );
    return (
      mode === "search" &&
      q &&
      normalizeText(s.name + " " + s.description).includes(q)
    );
  });
  const topics = data.topics.filter((topic) => {
    if (filters.subject && filters.subject !== topic.subjectId) return false;
    if (mode === "archive")
      return (
        topicIsArchived(topic, data) &&
        normalizeText(topic.name + " " + topic.description).includes(q)
      );
    if (topicIsArchived(topic, data)) return false;
    if (mode === "favorite")
      return (
        topic.favorite &&
        normalizeText(topic.name + " " + topic.description).includes(q)
      );
    return (
      mode === "search" &&
      q &&
      normalizeText(
        topic.name + " " + topic.description + " " + topic.summaryText,
      ).includes(q)
    );
  });
  return (
    <>
      <PageHeading
        title={titles[mode]}
        description={descriptions[mode]}
        eyebrow={mode === "archive" ? "SEU ACERVO" : "BIBLIOTECA"}
      >
        <StudyButton
          cardIds={readyIds(cards, data)}
          title={mode === "favorite" ? "Favoritos" : "Seleção filtrada"}
          label="Estudar seleção"
          className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] border-border bg-surface text-foreground hover:enabled:border-border-strong hover:enabled:bg-surface-hover"
        />
        <NewCardButton />
      </PageHeading>
      <FiltersBar count={cards.length} total={data.flashcards.length} />
      {(subjects.length > 0 || topics.length > 0) && (
        <>
          <div className="mb-5 mt-6 flex flex-wrap items-center justify-between gap-3 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted">
            <h2>
              Matérias e tópicos{" "}
              <span className="inline-flex items-center rounded-md bg-surface-hover px-2 py-[0.2rem] font-sans text-xs font-medium text-muted">
                {subjects.length + topics.length}
              </span>
            </h2>
          </div>
          <div
            data-view={filters.view}
            className={cn(
              "group/collection grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",
              filters.view === "list" ? "!grid-cols-1" : "",
            )}
          >
            {subjects.map((s, index) => (
              <EntityCard
                key={"s-" + s.id}
                item={s}
                kind="subject"
                index={index}
              />
            ))}
            {topics.map((t, index) => (
              <EntityCard
                key={"t-" + t.id}
                item={t}
                kind="topic"
                index={index}
              />
            ))}
          </div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted mt-10">
            <h2>Flashcards</h2>
          </div>
        </>
      )}
      <CardCollection cards={cards} view={filters.view} />
    </>
  );
}
export function Missing({ kind }: { kind: string }) {
  return (
    <Empty
      title={kind + " não encontrado"}
      description="O conteúdo pode ter sido excluído ou o endereço não existe."
    >
      <Link
        className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] bg-primary text-white shadow-sm hover:enabled:bg-primary-hover"
        href="/dashboard"
      >
        Voltar à visão geral
      </Link>
    </Empty>
  );
}
