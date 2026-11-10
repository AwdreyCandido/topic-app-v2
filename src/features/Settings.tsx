"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import {
  FiChevronDown,
  FiDownload,
  FiEdit2,
  FiMonitor,
  FiMoon,
  FiPlus,
  FiSun,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import { cn } from "@/src/lib/cn";
import { formControl } from "@/src/components/ui/variants";
import { tagSchema } from "@/src/lib/schemas";
import { AccountSettings } from "./auth/AccountSettings";
import { useLibrary } from "@/data/contexts/LibraryContext";
import { useUI } from "@/data/contexts/UIContext";
import { repository } from "@/data/storage/repository";
import { parseBackup } from "@/data/domain/backup";
import { flushAllSaves } from "@/data/domain/autosave";
import { downloadBackup } from "@/src/lib/download";
import { PageHeading } from "@/src/components/ui/PageHeading";
import { Modal } from "@/src/components/ui/Primitives";
import type { Backup, Tag } from "@/data/types";

const button =
  "inline-flex min-h-[3.6rem] items-center justify-center gap-[0.8rem] rounded-[0.7rem] px-[1.3rem] text-[1.3rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-[0.2rem] focus-visible:outline-offset-[0.2rem] focus-visible:outline-primary [&_svg]:size-[1.6rem]";
const secondary = cn(button, "border border-border bg-surface text-foreground hover:bg-surface-hover");
const primary = cn(button, "bg-primary text-white hover:bg-primary-hover");
const iconButton =
  "inline-flex size-[2.7rem] shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-[0.2rem] focus-visible:outline-offset-[0.2rem] focus-visible:outline-primary [&_svg]:size-[1.4rem]";

const themes = [
  { value: "light", label: "Claro", icon: FiSun },
  { value: "dark", label: "Escuro", icon: FiMoon },
  { value: "system", label: "Sistema", icon: FiMonitor },
] as const;

function TagForm({ tag, onClose }: { tag?: Tag; onClose: () => void }) {
  const ui = useUI();
  const [error, setError] = useState("");
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: tag?.name ?? "", color: tag?.color ?? "#2133ff" },
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-[1.8rem]"
      onSubmit={handleSubmit(async ({ name, color }) => {
        setError("");
        try {
          await repository.saveTag(name, color, tag?.id);
          onClose();
          ui.notify("Tag salva.");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Não foi possível salvar a tag.");
        }
      })}
    >
      <div>
        <label htmlFor="settings-tag-name" className="mb-[0.7rem] block text-[1.3rem] font-medium text-foreground">
          Nome
        </label>
        <input
          id="settings-tag-name"
          autoFocus
          maxLength={120}
          required
          placeholder="Ex.: Revisar depois"
          aria-invalid={Boolean(errors.name)}
          className={cn(formControl, "w-full")}
          {...register("name")}
        />
        {errors.name && <p role="alert" className="mt-[0.5rem] text-[1.2rem] text-danger">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="settings-tag-color" className="mb-[0.7rem] block text-[1.3rem] font-medium text-foreground">
          Cor
        </label>
        <div className="flex items-center gap-[1rem]">
          <input
            id="settings-tag-color"
            type="color"
            aria-invalid={Boolean(errors.color)}
            className="size-[3.8rem] shrink-0 cursor-pointer rounded-[0.6rem] border border-border bg-surface p-[0.3rem]"
            {...register("color")}
          />
          <span className="font-mono text-[1.2rem] uppercase text-muted">{watch("color")}</span>
        </div>
        {errors.color && <p role="alert" className="mt-[0.5rem] text-[1.2rem] text-danger">{errors.color.message}</p>}
      </div>
      {error && <p role="alert" className="text-[1.2rem] text-danger">{error}</p>}
      <div className="flex justify-end gap-[0.8rem] border-t border-border pt-[1.6rem]">
        <button type="button" className={secondary} disabled={isSubmitting} onClick={onClose}>Cancelar</button>
        <button type="submit" className={primary} disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar tag"}
        </button>
      </div>
    </form>
  );
}

export function Settings() {
  const { data } = useLibrary();
  const ui = useUI();
  const { theme, setTheme } = useTheme();
  const fileInput = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [tagTarget, setTagTarget] = useState<Tag | "new" | null>(null);
  const [imported, setImported] = useState<Backup | null>(null);
  const [importError, setImportError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!data) return null;

  const tagCounts = new Map<string, number>();
  for (const card of data.flashcards) {
    for (const id of card.tags) tagCounts.set(id, (tagCounts.get(id) ?? 0) + 1);
  }

  const deleteTag = (tag: Tag) => {
    void ui.perform(async () => {
      if (!(await ui.confirm({
        title: `Excluir a tag ${tag.name}?`,
        description: "A tag será removida dos cartões. Os flashcards serão preservados.",
        label: "Excluir tag",
        danger: true,
      }))) return;
      await flushAllSaves();
      await repository.removeTag(tag.id);
      ui.notify("Tag excluída.");
    });
  };

  const exportData = () => {
    void ui.perform(async () => {
      await flushAllSaves();
      downloadBackup(await repository.backup());
      ui.notify("Backup exportado.");
    });
  };

  const importLegacy = () => {
    setImportError("");
    void ui.perform(async () => {
      const { LegacyLibraryReader } = await import("@/data/storage/local-repository");
      const local = new LegacyLibraryReader();
      const snapshot = await local.snapshot();
      if (!snapshot.subjects.length && !snapshot.flashcards.length && !snapshot.tags.length && !snapshot.sessions.length && !snapshot.reviews.length) {
        throw new Error("Não há dados antigos neste navegador.");
      }
      setImported(await local.backup());
    });
  };

  const restoreData = () => {
    if (!imported || busy) return;
    const backup = imported;
    void ui.perform(async () => {
      setBusy(true);
      try {
        await ui.closeEditor();
        await flushAllSaves();
        downloadBackup(await repository.backup(), "topic-antes-da-importacao");
        await repository.restore(backup);
        setImported(null);
        ui.notify("Backup restaurado com sucesso.");
      } finally {
        setBusy(false);
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-[92rem] pb-[5rem]">
      <PageHeading
        title="Configurações"
        description="Gerencie suas preferências e seus dados."
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-x-[5rem] gap-y-[3rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="min-w-0">
          <div className="mb-[1.3rem]">
            <h2 className="font-heading text-[1.7rem] font-semibold tracking-[-0.04rem] text-foreground">Aparência</h2>
            <p className="mt-[0.4rem] text-[1.3rem] text-muted">Tema do aplicativo</p>
          </div>
          <div role="group" aria-label="Tema do aplicativo" className="inline-flex max-w-full flex-wrap items-center gap-[0.4rem] rounded-[0.9rem] border border-border bg-surface p-[0.4rem]">
            {themes.map(({ value, label, icon: Icon }) => {
              const active = mounted && theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!mounted}
                  aria-pressed={active}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "inline-flex h-[3.5rem] items-center justify-center gap-[0.7rem] rounded-[0.6rem] px-[1.2rem] text-[1.3rem] font-medium transition-colors focus-visible:outline-[0.2rem] focus-visible:outline-primary disabled:opacity-60 [&_svg]:size-[1.55rem]",
                    active ? "bg-primary-soft font-semibold text-primary-ink" : "text-muted hover:bg-surface-hover hover:text-foreground",
                  )}
                >
                  <Icon aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="min-w-0">
          <div className="mb-[1.3rem]">
            <h2 className="font-heading text-[1.7rem] font-semibold tracking-[-0.04rem] text-foreground">Conta</h2>
            <p className="mt-[0.4rem] text-[1.3rem] text-muted">Dados e segurança da sua conta</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAccount((value) => !value)}
            aria-expanded={showAccount}
            aria-controls="settings-account"
            className="inline-flex min-h-[3.5rem] items-center gap-[0.8rem] rounded-[0.7rem] border border-border bg-surface px-[1.3rem] text-[1.3rem] font-medium text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-[0.2rem] focus-visible:outline-offset-[0.2rem] focus-visible:outline-primary"
          >
            {showAccount ? "Ocultar opções da conta" : "Gerenciar conta"}
            <FiChevronDown aria-hidden="true" className={cn("size-[1.5rem] transition-transform", showAccount && "rotate-180")} />
          </button>
          {showAccount && (
            <div id="settings-account" className="mt-[1.6rem] w-full max-w-[44rem] [&_input]:max-w-full">
              <AccountSettings />
            </div>
          )}
        </section>
      </div>

      <section className="mt-[3.6rem] border-t border-border pt-[2.8rem]">
        <div className="mb-[1.8rem] flex flex-wrap items-center justify-between gap-[1.4rem]">
          <div>
            <h2 className="font-heading text-[1.7rem] font-semibold tracking-[-0.04rem] text-foreground">Tags</h2>
            <p className="mt-[0.4rem] text-[1.3rem] text-muted">Marcadores para organizar seus flashcards.</p>
          </div>
          <button type="button" onClick={() => setTagTarget("new")} className={secondary}>
            <FiPlus aria-hidden="true" /> Nova tag
          </button>
        </div>

        {data.tags.length ? (
          <div className="flex flex-wrap items-start gap-[0.8rem]">
            {data.tags.map((tag) => {
              const count = tagCounts.get(tag.id) ?? 0;
              return (
                <div key={tag.id} className="group inline-flex h-[3.5rem] max-w-full items-center gap-[0.65rem] rounded-full border border-border bg-surface pl-[1.2rem] pr-[0.35rem] transition-colors hover:border-border-strong">
                  <span aria-hidden="true" className="size-[0.75rem] shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span title={tag.name} className="max-w-[17rem] truncate text-[1.25rem] font-medium text-foreground">{tag.name}</span>
                  <span className="min-w-[1.4rem] text-center text-[1.1rem] tabular-nums text-muted" title={`${count} ${count === 1 ? "cartão" : "cartões"}`}>
                    {count}
                  </span>
                  <span aria-hidden="true" className="mx-[0.1rem] h-[1.4rem] w-[0.1rem] bg-border" />
                  <button type="button" onClick={() => setTagTarget(tag)} aria-label={`Editar tag ${tag.name}`} title="Editar tag" className={iconButton}>
                    <FiEdit2 aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => deleteTag(tag)} aria-label={`Excluir tag ${tag.name}`} title="Excluir tag" className={cn(iconButton, "hover:bg-danger-soft hover:text-danger")}>
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[1.3rem] text-muted">Você ainda não criou nenhuma tag.</p>
        )}
      </section>

      <section className="mt-[3.6rem] border-t border-border pt-[2.8rem]">
        <div className="mb-[1.7rem]">
          <h2 className="font-heading text-[1.7rem] font-semibold tracking-[-0.04rem] text-foreground">Seus dados</h2>
          <p className="mt-[0.4rem] text-[1.3rem] text-muted">Exporte ou restaure um backup de seus estudos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-[0.9rem]">
          <button type="button" className={primary} onClick={exportData}><FiDownload aria-hidden="true" /> Exportar backup</button>
          <button type="button" className={secondary} onClick={() => fileInput.current?.click()}><FiUpload aria-hidden="true" /> Importar backup</button>
          <button type="button" className="min-h-[3.6rem] rounded-[0.6rem] px-[0.8rem] text-[1.3rem] font-medium text-primary-ink hover:underline focus-visible:outline-[0.2rem] focus-visible:outline-primary" onClick={importLegacy}>Importar dados antigos</button>
        </div>
        <input
          type="file"
          ref={fileInput}
          accept=".json,application/json"
          aria-label="Selecionar arquivo de backup"
          className="sr-only"
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            setImportError("");
            if (!file) return;
            try {
              if (file.size > 30000000) throw new Error("O arquivo deve ter até 30 MB.");
              setImported(parseBackup(await file.text()));
            } catch (cause) {
              setImportError(cause instanceof Error ? cause.message : "Não foi possível ler o backup.");
            }
          }}
        />
        {importError && <p role="alert" className="mt-[1.2rem] text-[1.3rem] text-danger">{importError}</p>}
        <p className="mt-[1rem] text-[1.15rem] text-muted">Arquivo JSON de até 30 MB. Inclui matérias, tópicos, flashcards, tags e histórico.</p>
      </section>

      <div className="mt-[3.5rem] flex items-center justify-between gap-[1rem] border-t border-border pt-[1.6rem] text-[1.15rem] text-muted">
        <span>Topic</span><span>Versão 1.0.0</span>
      </div>

      <Modal
        open={tagTarget !== null}
        onOpenChange={(open) => { if (!open) setTagTarget(null); }}
        title={tagTarget === "new" ? "Nova tag" : "Editar tag"}
        className="w-[min(40rem,calc(100vw-3.2rem))] max-w-[40rem]"
      >
        {tagTarget && <TagForm key={typeof tagTarget === "string" ? "new" : tagTarget.id} tag={typeof tagTarget === "string" ? undefined : tagTarget} onClose={() => setTagTarget(null)} />}
      </Modal>

      <Modal
        open={imported !== null}
        onOpenChange={(open) => { if (!busy && !open) setImported(null); }}
        title="Restaurar este backup?"
        description="O conteúdo atual da sua conta será substituído pelos dados do arquivo."
        className="w-[min(48rem,calc(100vw-3.2rem))] max-w-[48rem]"
      >
        {imported && (
          <div className="flex flex-col gap-[1.8rem]">
            <div className="grid grid-cols-3 divide-x divide-border rounded-[0.8rem] border border-border bg-surface-muted py-[1.5rem] text-center">
              {[
                { label: "Matérias", value: imported.data.subjects.length },
                { label: "Tópicos", value: imported.data.topics.length },
                { label: "Flashcards", value: imported.data.flashcards.length },
              ].map(({ label, value }) => (
                <div key={label} className="min-w-0 px-[0.6rem]">
                  <strong className="block font-heading text-[2.1rem] font-semibold text-foreground">{value}</strong>
                  <span className="text-[1.15rem] text-muted">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-[1.3rem] leading-[1.6] text-muted">Antes da restauração, uma cópia dos dados atuais será baixada automaticamente.</p>
            <div className="flex flex-wrap justify-end gap-[0.8rem] border-t border-border pt-[1.7rem]">
              <button type="button" disabled={busy} onClick={() => setImported(null)} className={secondary}>Cancelar</button>
              <button type="button" disabled={busy} onClick={restoreData} className={primary}>{busy ? "Restaurando..." : "Substituir e restaurar"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
