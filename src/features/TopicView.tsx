"use client";
import { useTopicContent } from "@/data/hooks/useDocumentContent";
import { DocumentStatus } from "@/src/components/DocumentStatus";
import { useRef, useState } from "react";
import {
  HiPencilSquare,
  HiOutlineDocumentText,
  HiOutlineSquare2Stack,
} from "react-icons/hi2";
import { useLibrary } from "@/data/contexts/LibraryContext";
import { useUI } from "@/data/contexts/UIContext";
import { useFilters } from "@/data/hooks/useFilters";
import { useAutosave } from "@/data/hooks/useAutosave";
import { repository } from "@/data/storage/repository";
import { topicIsArchived } from "@/data/domain/filters";
import { documentText } from "@/data/domain/documents";
import type { RichDocument, Topic } from "@/data/types";
import { RichEditor } from "@/src/components/editor/DynamicEditor";
import { SaveIndicator } from "@/src/components/ui/Primitives";
import { PageHeading } from "@/src/components/ui/PageHeading";
import {
  NewCardButton,
  readyIds,
  StudyButton,
} from "@/src/components/ui/StudyActions";
import { FlashcardExplorer, Missing } from "./LibraryViews";
function SummaryContent({
  topic,
  archived,
}: {
  topic: Topic;
  archived: boolean;
}) {
  const ui = useUI();
  const [doc, setDoc] = useState(topic.summary);
  const revision = useRef(topic.summaryRevision ?? 1);
  const { queue, status } = useAutosave<RichDocument>(async (snapshot) => {
    const saved = await repository.saveSummary(
      topic.id,
      snapshot,
      revision.current,
    );
    revision.current = saved.summaryRevision ?? revision.current;
  });
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-muted px-5 py-4 text-sm font-medium text-muted">
        <div className="flex items-center gap-3">
          <HiOutlineDocumentText />
          <span>Seu resumo</span>
        </div>
        {archived ? (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium bg-surface-hover text-muted">
            Somente leitura
          </span>
        ) : (
          <SaveIndicator
            status={status}
            retry={() => void ui.perform(queue.flush)}
          />
        )}
      </div>
      <div className="px-5 py-7 sm:px-8 sm:py-9 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-[-0.07rem]">
        <h2>{topic.name}</h2>
        <p className="text-muted mb-7 mt-3 text-base leading-relaxed">
          {topic.description || "Conecte as ideias com suas próprias palavras."}
        </p>
        <RichEditor
          key={topic.id}
          initialContent={topic.summary}
          label="Resumo do tópico"
          readOnly={archived}
          onChange={(next) => {
            setDoc(next);
            queue.schedule(next);
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-subtle">
        <span>
          {documentText(doc).split(/\s+/).filter(Boolean).length} palavras
        </span>
        <span>Digite / para explorar os blocos</span>
      </div>
    </section>
  );
}
function Summary({ topic, archived }: { topic: Topic; archived: boolean }) {
  const content = useTopicContent(topic);
  return content.loading ? (
    <DocumentStatus error={content.error} retry={content.retry} />
  ) : (
    <SummaryContent topic={topic} archived={archived} />
  );
}
export function TopicView({
  subjectPath,
  topicPath,
}: {
  subjectPath: string;
  topicPath: string;
}) {
  const { data } = useLibrary();
  const ui = useUI();
  const { params, update } = useFilters();
  if (!data) return null;
  const subject = data.subjects.find((s) => s.path === subjectPath);
  const topic = data.topics.find(
    (t) => t.subjectId === subject?.id && t.path === topicPath,
  );
  if (!subject || !topic) return <Missing kind="Tópico" />;
  const cards = data.flashcards.filter((c) => c.topicId === topic.id);
  const archived = topicIsArchived(topic, data);
  const tab = params.get("tab") === "summary" ? "summary" : "cards";
  return (
    <>
      <PageHeading
        title={topic.name}
        description={
          topic.description || "Entenda o conceito. Transforme em memória."
        }
        breadcrumb={[
          { label: "Visão geral", href: "/dashboard" },
          { label: subject.name, href: "/dashboard/" + subject.path },
          { label: topic.name },
        ]}
      >
        <StudyButton
          cardIds={readyIds(cards, data)}
          title={topic.name}
          className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] border-border bg-surface text-foreground hover:enabled:border-border-strong hover:enabled:bg-surface-hover"
        />
        {!archived && <NewCardButton topicId={topic.id} />}
      </PageHeading>
      {archived && (
        <p className="mb-5 rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm text-warning">
          Este tópico está arquivado. Restaure-o para adicionar ou editar
          conteúdo.
        </p>
      )}
      <div
        className="mb-6 flex flex-wrap items-center gap-5 border-b border-border [&>button]:relative [&>button]:flex [&>button]:items-center [&>button]:gap-2 [&>button]:border-0 [&>button]:bg-transparent [&>button]:pb-4 [&>button]:pt-2 [&>button]:text-sm [&>button]:font-medium [&>button]:text-muted [&>button[aria-selected=true]]:text-primary-ink [&>button[aria-selected=true]]:after:absolute [&>button[aria-selected=true]]:after:inset-x-0 [&>button[aria-selected=true]]:after:bottom-0 [&>button[aria-selected=true]]:after:h-[0.2rem] [&>button[aria-selected=true]]:after:bg-primary [&>button[aria-selected=true]]:after:content-[''] [&_svg]:size-4 [&_button>span]:rounded-md [&_button>span]:bg-surface-hover [&_button>span]:px-[0.6rem] [&_button>span]:text-xs"
        role="tablist"
        aria-label="Conteúdo do tópico"
      >
        <button
          role="tab"
          aria-selected={tab === "cards"}
          onClick={() => update({ tab: null })}
        >
          <HiOutlineSquare2Stack />
          Flashcards<span>{cards.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === "summary"}
          onClick={() => update({ tab: "summary" })}
        >
          <HiOutlineDocumentText />
          Resumo
        </button>
        <button
          className="!ml-auto !text-muted hover:!text-primary-ink max-sm:!text-[0] max-sm:[&_svg]:size-5"
          onClick={() =>
            ui.setEntityDialog({
              kind: "topic",
              id: topic.id,
              subjectId: subject.id,
            })
          }
        >
          <HiPencilSquare />
          Editar tópico
        </button>
      </div>
      {tab === "summary" ? (
        <Summary key={topic.id} topic={topic} archived={archived} />
      ) : (
        <FlashcardExplorer topicId={topic.id} subjectId={subject.id} />
      )}
    </>
  );
}
