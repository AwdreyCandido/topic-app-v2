"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
type Preferences = {
  sidebar: "expanded" | "collapsed";
  view: "grid" | "list";
};
const defaults: Preferences = { sidebar: "expanded", view: "grid" };
const storageKey = "topic-ui-preferences";
const Context = createContext<{
  values: Preferences;
  ready: boolean;
  save: (patch: Partial<Preferences>) => Promise<void>;
} | null>(null);
function readPreferences(): Preferences {
  try {
    const saved = JSON.parse(
      localStorage.getItem(storageKey) ?? "null",
    ) as Partial<Preferences> | null;
    return {
      sidebar:
        (saved?.sidebar ?? localStorage.getItem("topic-sidebar")) ===
        "collapsed"
          ? "collapsed"
          : "expanded",
      view:
        (saved?.view ?? localStorage.getItem("topic-view")) === "list"
          ? "list"
          : "grid",
    };
  } catch {
    return defaults;
  }
}
export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [values, setValues] = useState(defaults);
  const [ready, setReady] = useState(false);
  const current = useRef(defaults);
  useEffect(() => {
    const load = () => {
      current.current = readPreferences();
      setValues(current.current);
    };
    load();
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const save = useCallback(async (patch: Partial<Preferences>) => {
    const next = { ...current.current, ...patch };
    current.current = next;
    setValues(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  }, []);
  return (
    <Context.Provider value={{ values, ready, save }}>
      {children}
    </Context.Provider>
  );
}
export function usePreferences() {
  const context = useContext(Context);
  if (!context) throw new Error("PreferencesProvider ausente.");
  return context;
}
