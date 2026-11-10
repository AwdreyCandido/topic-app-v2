"use client";

import { useEffect, useState } from "react";
import type { Flashcard, Topic } from "../types";
import { repository } from "../storage/repository";
const loadCard = (id: string) => repository.getFlashcard(id);
const loadTopic = (id: string) => repository.getTopic(id);

function useDocument(
  id: string | undefined,
  loaded: boolean,
  revision: number | undefined,
  load: (id: string) => Promise<unknown>,
) {
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!id || loaded) return;
    let active = true;
    setError("");
    void load(id).catch((cause) => {
      if (active)
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar o documento.",
        );
    });
    return () => {
      active = false;
    };
  }, [id, loaded, revision, load, attempt]);
  return {
    loading: !!id && !loaded,
    error,
    retry: () => setAttempt((n) => n + 1),
  };
}
export const useFlashcardContent = (card: Flashcard | undefined) =>
  useDocument(
    card?.id,
    card?.contentLoaded !== false,
    card?.revision,
    loadCard,
  );
export const useTopicContent = (topic: Topic) =>
  useDocument(
    topic.id,
    topic.summaryLoaded !== false,
    topic.summaryRevision,
    loadTopic,
  );
