import type { Rating } from "@/data/types";
export const ratingColors: Record<Rating, string> = {
  again: "bg-danger-soft text-danger",
  hard: "bg-warning-soft text-warning",
  good: "bg-primary-soft text-primary-ink",
  easy: "bg-success-soft text-success",
};
export const formControl =
  "min-h-[4.2rem] w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-base font-normal text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft aria-[invalid=true]:border-danger";
