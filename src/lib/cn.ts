import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"] },
      ],
    },
  },
});
export function cn(...values: ClassValue[]) {
  return merge(clsx(values));
}
