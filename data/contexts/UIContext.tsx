"use client";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import { flushAllSaves, hasPendingSaves } from "../domain/autosave";
export type EntityDialog =
  | {
      kind: "subject";
      id?: string;
    }
  | {
      kind: "topic";
      id?: string;
      subjectId: string;
    };
export interface Confirmation {
  title: string;
  description: string;
  label?: string;
  danger?: boolean;
}
interface UIState {
  editorId: string | null;
  setEditorId: (id: string | null) => void;
  previewId: string | null;
  setPreviewId: (id: string | null) => void;
  entityDialog: EntityDialog | null;
  setEntityDialog: (value: EntityDialog | null) => void;
  searchOpen: boolean;
  setSearchOpen: (value: boolean) => void;
  notice: {
    id: number;
    message: string;
    error: boolean;
  } | null;
  notify: (message: string, error?: boolean) => void;
  perform: (action: () => Promise<unknown>) => Promise<void>;
  closeEditor: () => Promise<void>;
  confirmation: Confirmation | null;
  confirm: (value: Confirmation) => Promise<boolean>;
  resolveConfirm: (value: boolean) => void;
}
const UIContext = createContext<UIState | undefined>(undefined);
export function UIProvider({ children }: { children: React.ReactNode }) {
  const [editorId, setEditorId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [entityDialog, setEntityDialog] = useState<EntityDialog | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState<UIState["notice"]>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const noticeCounter = useRef(0);
  const notify = useCallback((message: string, error = false) => {
    setNotice({ id: ++noticeCounter.current, message, error });
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(
      () => setNotice(null),
      notice.error ? 9000 : 4500,
    );
    return () => clearTimeout(timeout);
  }, [notice]);
  const perform = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action();
      } catch (cause) {
        notify(
          cause instanceof Error
            ? cause.message
            : "Não foi possível concluir a ação.",
          true,
        );
      }
    },
    [notify],
  );
  const closeEditor = useCallback(async () => {
    await flushAllSaves();
    setEditorId(null);
  }, []);
  const confirm = useCallback((value: Confirmation) => {
    resolver.current?.(false);
    setConfirmation(value);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);
  const resolveConfirm = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setConfirmation(null);
  }, []);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (hasPendingSaves()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") {
        void flushAllSaves().catch((error: unknown) =>
          notify(
            error instanceof Error ? error.message : "Erro ao salvar.",
            true,
          ),
        );
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [notify]);
  return (
    <UIContext.Provider
      value={{
        editorId,
        setEditorId,
        previewId,
        setPreviewId,
        entityDialog,
        setEntityDialog,
        searchOpen,
        setSearchOpen,
        notice,
        notify,
        perform,
        closeEditor,
        confirmation,
        confirm,
        resolveConfirm,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}
export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI precisa estar dentro de UIProvider.");
  return context;
}
