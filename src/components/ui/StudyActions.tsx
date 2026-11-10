"use client";
import { cn } from "@/src/lib/cn";
import { formControl } from "@/src/components/ui/variants";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { destinationSchema } from "@/src/lib/schemas";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiPlay, HiPlus } from "react-icons/hi2";
import { useLibrary } from "@/data/contexts/LibraryContext";
import { useUI } from "@/data/contexts/UIContext";
import { repository } from "@/data/storage/repository";
import { flushAllSaves } from "@/data/domain/autosave";
import { isArchived, topicIsArchived } from "@/data/domain/filters";
import { Modal } from "./Primitives";
export function StudyButton({
  cardIds,
  title = "Sessão de estudo",
  label = "Estudar",
  className = "inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] bg-primary text-white shadow-sm hover:enabled:bg-primary-hover",
}: {
  cardIds: string[];
  title?: string;
  label?: string;
  className?: string;
}) {
  const ui = useUI();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={cn(className)}
      disabled={!cardIds.length || busy}
      onClick={() =>
        void ui.perform(async () => {
          setBusy(true);
          try {
            await flushAllSaves();
            const session = await repository.createSession(
              cardIds,
              title,
              false,
            );
            router.push("/dashboard/study?session=" + session.id);
          } finally {
            setBusy(false);
          }
        })
      }
    >
      <HiPlay />
      {busy ? "Preparando…" : label}
    </button>
  );
}
export function NewCardButton({
  topicId,
  compact = false,
}: {
  topicId?: string;
  compact?: boolean;
}) {
  const { data } = useLibrary();
  const ui = useUI();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(destinationSchema),
    defaultValues: { topicId: "" },
  });
  const selected = useWatch({ control, name: "topicId" });
  const topics =
    data?.topics.filter((topic) => !topicIsArchived(topic, data)) ?? [];
  const create = (destination: string) =>
    ui.perform(async () => {
      if (!destination) throw new Error("Escolha um tópico.");
      const card = await repository.createFlashcard(destination);
      setOpen(false);
      ui.setEditorId(card.id);
    });
  return (
    <>
      <button
        className={cn(
          "inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem]",
          compact
            ? "border-border bg-surface text-foreground hover:enabled:border-border-strong hover:enabled:bg-surface-hover"
            : "bg-primary text-white shadow-sm hover:enabled:bg-primary-hover",
        )}
        onClick={() => (topicId ? void create(topicId) : setOpen(true))}
      >
        <HiPlus />
        Novo flashcard
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Onde vamos guardar esta ideia?"
        description="Escolha um tópico para seu novo flashcard."
      >
        {topics.length ? (
          <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={handleSubmit(({ topicId }) => create(topicId))}
          >
            <label
              className="flex flex-col gap-2 text-sm font-medium text-foreground"
              htmlFor="new-card-topic"
            >
              Tópico
              <select
                id="new-card-topic"
                {...register("topicId")}
                aria-invalid={!!errors.topicId}
                required
                className={formControl}
              >
                <option value="">Selecione um tópico</option>
                {data?.subjects
                  .filter((s) => !s.archivedAt)
                  .map((subject) => (
                    <optgroup key={subject.id} label={subject.name}>
                      {topics
                        .filter((t) => t.subjectId === subject.id)
                        .map((topic) => (
                          <option key={topic.id} value={topic.id}>
                            {topic.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
              </select>
            </label>
            {errors.topicId && (
              <p className="text-sm text-danger" role="alert">
                {errors.topicId.message}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2.5 border-t border-border pt-5">
              <button
                className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] border-border bg-surface text-foreground hover:enabled:border-border-strong hover:enabled:bg-surface-hover"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] bg-primary text-white shadow-sm hover:enabled:bg-primary-hover"
                disabled={!selected || isSubmitting}
              >
                Criar flashcard
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-5">
            <p className="text-muted">
              Crie uma matéria e um tópico para organizar seus primeiros
              cartões.
            </p>
            <button
              className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] bg-primary text-white shadow-sm hover:enabled:bg-primary-hover"
              onClick={() => {
                setOpen(false);
                const subject = data?.subjects.find((s) => !s.archivedAt);
                ui.setEntityDialog(
                  subject
                    ? { kind: "topic", subjectId: subject.id }
                    : { kind: "subject" },
                );
              }}
            >
              <HiPlus />
              {data?.subjects.some((s) => !s.archivedAt)
                ? "Criar tópico"
                : "Criar matéria"}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
export function readyIds(
  cards: NonNullable<ReturnType<typeof useLibrary>["data"]>["flashcards"],
  data: NonNullable<ReturnType<typeof useLibrary>["data"]>,
) {
  return cards
    .filter((card) => card.status === "ready" && !isArchived(card, data))
    .map((card) => card.id);
}
