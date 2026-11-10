"use client";
import { cn } from "@/src/lib/cn";
import * as Dialog from "@radix-ui/react-dialog";
import {
  HiXMark,
  HiArrowPath,
  HiOutlineInbox,
  HiCheckCircle,
  HiExclamationCircle,
} from "react-icons/hi2";
import { useUI } from "@/data/contexts/UIContext";
import type { SaveStatus } from "@/data/domain/autosave";
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = "",
  variant = "default",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "editor";
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-appear motion-reduce:animate-none" />
        <Dialog.Content
          data-kind={variant}
          className={cn(
            "group/modal fixed left-1/2 top-1/2 z-50 max-h-[88dvh] w-[min(52rem,calc(100vw-3.2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-lg outline-none sm:p-7",
            className,
          )}
        >
          <div
            data-slot="dialog-heading"
            className="mb-6 flex items-start justify-between gap-4 [&_p]:mt-2 group-data-[kind=editor]/modal:mb-0 group-data-[kind=editor]/modal:border-b group-data-[kind=editor]/modal:border-border group-data-[kind=editor]/modal:px-6 group-data-[kind=editor]/modal:py-4"
          >
            <div>
              <Dialog.Title className="font-heading text-xl font-semibold tracking-[-0.04rem]">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="text-muted text-sm">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">
                  {title}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                className="inline-flex size-8 min-w-8 items-center justify-center rounded-lg border-0 bg-transparent p-[0.5rem] text-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-[1.8rem]"
                aria-label="Fechar"
              >
                <HiXMark />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Loading({
  label = "Abrindo seu espaço de estudos…",
}: {
  label?: string;
}) {
  return (
    <div
      className="flex items-center justify-center gap-3 p-8 text-sm text-muted"
      role="status"
    >
      <HiArrowPath className="animate-spin motion-reduce:animate-none" />
      <p>{label}</p>
    </div>
  );
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center [&_h3]:mt-4 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold [&_p]:mb-6 [&_p]:mt-3 [&_p]:max-w-[48rem] [&_p]:text-base [&_p]:text-muted">
      <div className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary-ink [&_svg]:size-7">
        <HiOutlineInbox />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function SaveIndicator({
  status,
  retry,
}: {
  status: SaveStatus;
  retry: () => void;
}) {
  const text = {
    saved: "Salvo",
    pending: "Alterações pendentes",
    saving: "Salvando…",
    error: "Erro ao salvar",
  }[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[0.6rem] text-xs text-muted [&_svg]:size-[1.3rem]",
        status === "error" ? "!text-danger" : "",
      )}
      role="status"
      aria-live="polite"
    >
      {status === "saved" ? (
        <HiCheckCircle />
      ) : status === "error" ? (
        <HiExclamationCircle />
      ) : (
        <HiArrowPath
          className={cn(
            status === "saving"
              ? "animate-spin motion-reduce:animate-none"
              : "",
          )}
        />
      )}
      {text}
      {status === "error" && (
        <button
          className="inline-flex items-center gap-[0.7rem] border-0 bg-transparent py-[0.5rem] text-sm font-medium text-primary-ink hover:underline [&_svg]:size-[1.5rem]"
          onClick={retry}
        >
          Tentar novamente
        </button>
      )}
    </span>
  );
}
export function ConfirmDialog() {
  const { confirmation, resolveConfirm } = useUI();
  return (
    <Modal
      open={Boolean(confirmation)}
      onOpenChange={(open) => {
        if (!open) resolveConfirm(false);
      }}
      title={confirmation?.title ?? "Confirmar"}
      description={confirmation?.description}
    >
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2.5 border-t border-border pt-5">
        <button
          className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] border-border bg-surface text-foreground hover:enabled:border-border-strong hover:enabled:bg-surface-hover"
          onClick={() => resolveConfirm(false)}
        >
          Cancelar
        </button>
        <button
          className={cn(
            "inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem]",
            confirmation?.danger
              ? "bg-danger text-white hover:enabled:brightness-95"
              : "bg-primary text-white shadow-sm hover:enabled:bg-primary-hover",
          )}
          onClick={() => resolveConfirm(true)}
        >
          {confirmation?.label ?? "Confirmar"}
        </button>
      </div>
    </Modal>
  );
}
export function Notice() {
  const { notice } = useUI();
  return (
    <div
      className="pointer-events-none fixed bottom-5 left-1/2 z-[100] w-[min(48rem,calc(100vw-3.2rem))] -translate-x-1/2"
      aria-live="polite"
      aria-atomic="true"
    >
      {notice && (
        <div
          key={notice.id}
          className={cn(
            "pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4 text-sm shadow-lg [&_svg]:size-4",
            notice.error ? "border-danger bg-danger-soft text-danger" : "",
          )}
        >
          {notice.error ? <HiExclamationCircle /> : <HiCheckCircle />}
          <span>{notice.message}</span>
        </div>
      )}
    </div>
  );
}
export function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        "input, textarea, select, [contenteditable='true'], [role='textbox']",
      ),
    )
  );
}
export function shortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}
export function longDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
