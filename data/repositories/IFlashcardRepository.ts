import type { Flashcard } from "../types";

export interface IFlashcardRepository {
  createFlashcard(topicId: string): Promise<Flashcard>;
  saveFlashcard(card: Flashcard): Promise<Flashcard>;
  duplicateFlashcard(id: string): Promise<Flashcard>;
}
