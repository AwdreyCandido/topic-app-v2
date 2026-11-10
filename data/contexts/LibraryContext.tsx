"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { LibraryData } from "../types";
import { libraryEvents, repository } from "../storage/repository";
import {
  applyLibraryChange,
  preserveLoadedDocuments,
  type LibraryChange,
} from "../storage/records";
import { getSupabase } from "@/src/lib/supabase/client";
import { hasPendingSaves } from "../domain/autosave";
interface LibraryState {
  data: LibraryData | undefined;
  error: string | null;
  retry: () => void;
}
const LibraryContext = createContext<LibraryState | undefined>(undefined);
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<LibraryData>();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let owner: string | undefined;
    let loading = false;
    let buffered: LibraryChange[] = [];
    const load = async () => {
      if (loading) return;
      loading = true;
      buffered = [];
      try {
        const { data: auth } = await getSupabase().auth.getSession();
        owner = auth.session?.user.id;
        const value = await repository.snapshot();
        if (active) {
          const patches = [...buffered];
          setData((previous) =>
            preserveLoadedDocuments(
              previous,
              patches.reduce(applyLibraryChange, value),
            ),
          );
          setError(null);
        }
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar seus dados.",
          );
      } finally {
        loading = false;
      }
    };
    const update = (event: Event) => {
      const change = (event as CustomEvent<LibraryChange>).detail;
      if (active && change.userId === owner) {
        if (loading) buffered.push(change);
        setData((value) => (value ? applyLibraryChange(value, change) : value));
      }
    };
    const onFocus = () => {
      if (!hasPendingSaves()) void load();
    };
    void load();
    libraryEvents.addEventListener("change", update);
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      libraryEvents.removeEventListener("change", update);
      window.removeEventListener("focus", onFocus);
    };
  }, [attempt]);
  return (
    <LibraryContext.Provider
      value={{ data, error, retry: () => setAttempt((n) => n + 1) }}
    >
      {children}
    </LibraryContext.Provider>
  );
}
export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context)
    throw new Error("useLibrary precisa estar dentro de LibraryProvider.");
  return context;
}
