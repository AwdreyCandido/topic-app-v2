"use client";
import dynamic from "next/dynamic";
export const RichEditor = dynamic(() => import("./BlockEditor"), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-[12rem] animate-pulse rounded-lg bg-surface-muted px-5 py-6 text-sm text-muted motion-reduce:animate-none"
      role="status"
      aria-label="Carregando editor"
    >
      <span />
      <span />
      <span />
    </div>
  ),
});
