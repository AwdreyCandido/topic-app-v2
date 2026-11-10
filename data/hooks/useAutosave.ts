"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AutosaveQueue, registerAutosave } from "../domain/autosave";

export function useAutosave<T>(save: (snapshot: T) => Promise<unknown>) {
  const [queue] = useState(() => new AutosaveQueue(save));
  const status = useSyncExternalStore(
    queue.subscribe,
    queue.getStatus,
    () => "saved" as const,
  );
  useEffect(() => registerAutosave(queue), [queue]);
  return { queue, status };
}
