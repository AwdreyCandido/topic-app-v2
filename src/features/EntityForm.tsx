"use client";
import { cn } from "@/src/lib/cn";
import { formControl } from "@/src/components/ui/variants";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { entitySchema } from "@/src/lib/schemas";
import { useLibrary } from "@/data/contexts/LibraryContext";
import { useUI, type EntityDialog } from "@/data/contexts/UIContext";
import { repository } from "@/data/storage/repository";
import { Modal } from "@/src/components/ui/Primitives";
function Form({ target }: { target: EntityDialog }) {
  const { data } = useLibrary();
  const ui = useUI();
  const existing =
    target.kind === "subject"
      ? data?.subjects.find((s) => s.id === target.id)
      : data?.topics.find((t) => t.id === target.id);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: busy },
  } = useForm({
    resolver: zodResolver(entitySchema),
    defaultValues: {
      name: existing?.name ?? "",
      description: existing?.description ?? "",
    },
  });
  const [error, setError] = useState("");
  const [expectedRevision] = useState(existing?.revision ?? 1);
  return (
    <form
      noValidate
      onSubmit={handleSubmit(async ({ name, description }) => {
        setError("");
        try {
          if (target.kind === "subject") {
            if (target.id)
              await repository.updateSubject(
                target.id,
                { name, description },
                expectedRevision,
              );
            else await repository.createSubject({ name, description });
          } else {
            if (target.id)
              await repository.updateTopic(
                target.id,
                { name, description },
                expectedRevision,
              );
            else
              await repository.createTopic(target.subjectId, {
                name,
                description,
              });
          }
          ui.setEntityDialog(null);
          ui.notify("Conteúdo salvo.");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Erro ao salvar.");
        }
      })}
      className="flex flex-col gap-5"
    >
      <label
        className="flex flex-col gap-2 text-sm font-medium text-foreground"
        htmlFor="entity-name"
      >
        Nome
        <input
          id="entity-name"
          required
          maxLength={120}
          autoFocus
          {...register("name")}
          aria-invalid={!!errors.name}
          placeholder={
            target.kind === "subject"
              ? "Ex.: Estruturas de dados"
              : "Ex.: Árvores binárias"
          }
          className={formControl}
        />
      </label>
      <label
        className="flex flex-col gap-2 text-sm font-medium text-foreground"
        htmlFor="entity-description"
      >
        Descrição <span className="text-muted font-normal">opcional</span>
        <textarea
          id="entity-description"
          rows={3}
          maxLength={2000}
          {...register("description")}
          aria-invalid={!!errors.description}
          placeholder="O que você vai aprender aqui?"
          className={cn(formControl, "min-h-[10rem]")}
        />
      </label>
      {errors.name && (
        <p className="text-sm text-danger" role="alert">
          {errors.name.message}
        </p>
      )}
      {errors.description && (
        <p className="text-sm text-danger" role="alert">
          {errors.description.message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2.5 border-t border-border pt-5">
        <button
          type="button"
          className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] border-border bg-surface text-foreground hover:enabled:border-border-strong hover:enabled:bg-surface-hover"
          onClick={() => ui.setEntityDialog(null)}
        >
          Cancelar
        </button>
        <button
          className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] bg-primary text-white shadow-sm hover:enabled:bg-primary-hover"
          disabled={busy}
        >
          {busy
            ? "Salvando…"
            : existing
              ? "Salvar alterações"
              : "Criar " + (target.kind === "subject" ? "matéria" : "tópico")}
        </button>
      </div>
    </form>
  );
}
export function EntityForm() {
  const ui = useUI();
  const target = ui.entityDialog;
  return (
    <Modal
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open) ui.setEntityDialog(null);
      }}
      title={
        (target?.id
          ? "Editar "
          : target?.kind === "subject"
            ? "Nova "
            : "Novo ") + (target?.kind === "subject" ? "matéria" : "tópico")
      }
      description="Dê um lugar para sua próxima descoberta."
    >
      {target && (
        <Form
          key={
            target.kind +
            (target.id ?? "new") +
            ("subjectId" in target ? target.subjectId : "")
          }
          target={target}
        />
      )}
    </Modal>
  );
}
