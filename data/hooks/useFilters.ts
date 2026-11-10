"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePreferences } from "../contexts/PreferencesContext";
import { useUI } from "../contexts/UIContext";
import { flushAllSaves } from "../domain/autosave";
import { parseFilters } from "../domain/filters";

export function useFilters() {
  const preferences = usePreferences();
  const params = useSearchParams();
  const url = params.toString();
  const pathname = usePathname();
  const router = useRouter();
  const { perform } = useUI();
  const [localParams, setLocalParams] = useState(url);
  useEffect(() => setLocalParams(url), [url]);
  const filters = parseFilters(new URLSearchParams(localParams));
  const update = useCallback(
    (patch: Record<string, string | string[] | null>, replace = false) => {
      const next = new URLSearchParams(localParams);
      for (const [key, value] of Object.entries(patch)) {
        next.delete(key);
        if (Array.isArray(value))
          value.forEach((item) => next.append(key, item));
        else if (value) next.set(key, value);
      }
      if (next.toString() === localParams) return;
      setLocalParams(next.toString());
      const target = pathname + (next.size ? "?" + next.toString() : "");
      void perform(async () => {
        try {
          await flushAllSaves();
          if (replace) router.replace(target, { scroll: false });
          else router.push(target, { scroll: false });
        } catch (error) {
          setLocalParams(url);
          throw error;
        }
      });
    },
    [localParams, url, pathname, router, perform],
  );
  useEffect(() => {
    if (!params.has("view")) {
      const saved = preferences.values.view;
      if (saved === "list") update({ view: saved }, true);
    }
  }, [params, update, preferences.values.view]);
  const setView = (view: "grid" | "list") => {
    void perform(() => preferences.save({ view }));
    update({ view });
  };
  return { filters, update, setView, params };
}
