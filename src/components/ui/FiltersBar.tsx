"use client";
import { cn } from "@/src/lib/cn";
import { formControl } from "@/src/components/ui/variants";
import { useEffect, useState } from "react";
import {
  HiMagnifyingGlass,
  HiAdjustmentsHorizontal,
  HiSquares2X2,
  HiListBullet,
  HiXMark,
} from "react-icons/hi2";
import { useFilters } from "@/data/hooks/useFilters";
import { useLibrary } from "@/data/contexts/LibraryContext";
export function FiltersBar({
  entity = false,
  subjectId,
  topicId,
  count,
  total,
}: {
  entity?: boolean;
  subjectId?: string;
  topicId?: string;
  count: number;
  total: number;
}) {
  const { data } = useLibrary();
  const { filters, update, setView } = useFilters();
  const [advanced, setAdvanced] = useState(false);
  const [query, setQuery] = useState(filters.q);
  useEffect(() => setQuery(filters.q), [filters.q]);
  useEffect(() => {
    if (query === filters.q) return;
    const timeout = setTimeout(() => update({ q: query || null }, true), 300);
    return () => clearTimeout(timeout);
  }, [query, filters.q, update]);
  if (!data) return null;
  const chips: {
    label: string;
    key: string;
    value?: string;
  }[] = [];
  if (filters.q) chips.push({ label: "Busca: " + filters.q, key: "q" });
  if (filters.subject && !subjectId)
    chips.push({
      label:
        data.subjects.find((s) => s.id === filters.subject)?.name ?? "Matéria",
      key: "subject",
    });
  if (filters.topic && !topicId)
    chips.push({
      label: data.topics.find((t) => t.id === filters.topic)?.name ?? "Tópico",
      key: "topic",
    });
  filters.tags.forEach((id) =>
    chips.push({
      label: data.tags.find((t) => t.id === id)?.name ?? "Tag",
      key: "tag",
      value: id,
    }),
  );
  if (filters.status !== "all")
    chips.push({
      label: {
        draft: "Rascunhos",
        ready: "Prontos",
        new: "Não estudados",
        studied: "Estudados",
      }[filters.status],
      key: "status",
    });
  if (filters.favorite) chips.push({ label: "Favoritos", key: "favorite" });
  if (filters.archive !== "active")
    chips.push({
      label:
        filters.archive === "archived" ? "Arquivados" : "Ativos e arquivados",
      key: "archive",
    });
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[18rem] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 [&>svg]:size-4 [&>svg]:text-muted [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-sm [&_input]:outline-none [&_input:focus-visible]:outline-none">
          <HiMagnifyingGlass />
          <input
            aria-label="Buscar nesta página"
            placeholder={
              entity
                ? "Buscar por nome ou descrição…"
                : "Buscar perguntas, respostas ou tags…"
            }
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              className="inline-flex items-center justify-center rounded-lg border-0 bg-transparent p-[0.5rem] text-muted hover:bg-surface-hover hover:text-foreground size-[2.5rem] min-w-[2.5rem] [&_svg]:size-[1.5rem]"
              aria-label="Limpar busca"
              onClick={() => {
                setQuery("");
                update({ q: null }, true);
              }}
            >
              <HiXMark />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
          <button
            className={cn(
              "inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-[1.7rem] py-2.5 font-semibold [&_svg]:size-[1.7rem] border-border bg-surface text-foreground hover:enabled:border-border-strong hover:enabled:bg-surface-hover text-sm [&_small]:rounded-sm [&_small]:bg-primary-soft [&_small]:px-1 [&_small]:text-xs [&_small]:text-primary-ink",
              advanced
                ? "border-primary-border bg-primary-soft text-primary-ink"
                : "",
            )}
            aria-expanded={advanced}
            onClick={() => setAdvanced((value) => !value)}
          >
            <HiAdjustmentsHorizontal />
            <span>Filtros</span>
            {chips.length > 0 && <small>{chips.length}</small>}
          </button>
          <select
            className="min-h-[4.2rem] rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted max-sm:min-w-0 max-sm:flex-1"
            aria-label="Ordenar resultados"
            value={filters.sort + ":" + filters.direction}
            onChange={(event) => {
              const [sort, direction] = event.target.value.split(":");
              update({ sort, direction });
            }}
          >
            <option value="updatedAt:desc">Editados recentemente</option>
            <option value="updatedAt:asc">Edição mais antiga</option>
            <option value="createdAt:desc">Mais novos</option>
            <option value="createdAt:asc">Mais antigos</option>
            <option value="name:asc">Nome: A–Z</option>
            <option value="name:desc">Nome: Z–A</option>
          </select>
          <div
            className="flex items-center rounded-lg border border-border bg-surface p-1 [&>button]:grid [&>button]:size-8 [&>button]:place-items-center [&>button]:rounded-md [&>button]:bg-transparent [&>button]:text-muted [&_svg]:size-4 [&>button[aria-pressed=true]]:bg-primary-soft [&>button[aria-pressed=true]]:text-primary-ink"
            role="group"
            aria-label="Visualização"
          >
            <button
              className={cn(
                filters.view === "grid"
                  ? "border-primary-border bg-primary-soft text-primary-ink"
                  : "",
              )}
              aria-label="Visualização em grade"
              aria-pressed={filters.view === "grid"}
              onClick={() => setView("grid")}
            >
              <HiSquares2X2 />
            </button>
            <button
              className={cn(
                filters.view === "list"
                  ? "border-primary-border bg-primary-soft text-primary-ink"
                  : "",
              )}
              aria-label="Visualização em lista"
              aria-pressed={filters.view === "list"}
              onClick={() => setView("list")}
            >
              <HiListBullet />
            </button>
          </div>
        </div>
      </div>
      {advanced && (
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-3">
          {!entity && !subjectId && (
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Matéria
              <select
                value={filters.subject}
                onChange={(event) =>
                  update({ subject: event.target.value, topic: null })
                }
                className={formControl}
              >
                <option value="">Todas as matérias</option>
                {data.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!entity && !topicId && (
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Tópico
              <select
                value={filters.topic}
                onChange={(event) => update({ topic: event.target.value })}
                className={formControl}
              >
                <option value="">Todos os tópicos</option>
                {data.topics
                  .filter(
                    (t) =>
                      !(subjectId || filters.subject) ||
                      t.subjectId === (subjectId || filters.subject),
                  )
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {!entity && (
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Situação
              <select
                value={filters.status}
                onChange={(event) =>
                  update({
                    status:
                      event.target.value === "all" ? null : event.target.value,
                  })
                }
                className={formControl}
              >
                <option value="all">Todos os cartões</option>
                <option value="ready">Prontos para estudar</option>
                <option value="draft">Rascunhos</option>
                <option value="new">Ainda não estudados</option>
                <option value="studied">Já estudados</option>
              </select>
            </label>
          )}
          <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
            Conteúdo
            <select
              value={filters.archive}
              onChange={(event) =>
                update({
                  archive:
                    event.target.value === "active" ? null : event.target.value,
                })
              }
              className={formControl}
            >
              <option value="active">Ativos</option>
              <option value="archived">Arquivados</option>
              <option value="all">Ativos e arquivados</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted [&_input]:size-4">
            <input
              type="checkbox"
              checked={filters.favorite}
              onChange={(event) =>
                update({ favorite: event.target.checked ? "1" : null })
              }
            />
            Somente favoritos
          </label>
          {!entity && (
            <div className="col-span-full [&>.flex]:mb-3 [&_select]:rounded-md [&_select]:border [&_select]:border-border [&_select]:bg-surface [&_select]:px-2 [&_select]:py-1 [&_select]:text-xs">
              <div className="flex items-center justify-between">
                <span className="flex flex-col gap-2 text-sm font-medium text-foreground">
                  Tags
                </span>
                <select
                  aria-label="Combinação de tags"
                  value={filters.tagMode}
                  onChange={(event) => update({ tagMode: event.target.value })}
                >
                  <option value="any">Qualquer tag</option>
                  <option value="all">Todas as tags</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag) => (
                  <label
                    key={tag.id}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-[0.6rem] rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-muted [&_input]:size-[1.3rem]",
                      filters.tags.includes(tag.id)
                        ? "border-primary-border bg-primary-soft text-primary-ink"
                        : "",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={filters.tags.includes(tag.id)}
                      onChange={(event) =>
                        update({
                          tag: event.target.checked
                            ? [...filters.tags, tag.id]
                            : filters.tags.filter((id) => id !== tag.id),
                        })
                      }
                    />
                    <span
                      className="inline-block size-[0.6rem] shrink-0 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </label>
                ))}
                {!data.tags.length && (
                  <span className="text-muted text-sm">
                    Nenhuma tag cadastrada.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>
          {count} de {total} {entity ? "itens" : "flashcards"}
        </span>
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                className="inline-flex items-center gap-[0.5rem] rounded-md border border-primary-border bg-primary-soft px-2 py-1 text-xs text-primary-ink [&_svg]:size-3"
                key={chip.key + chip.label}
                onClick={() =>
                  update(
                    chip.key === "tag"
                      ? { tag: filters.tags.filter((id) => id !== chip.value) }
                      : chip.key === "subject"
                        ? { subject: null, topic: null }
                        : { [chip.key]: null },
                  )
                }
              >
                {chip.label}
                <HiXMark />
              </button>
            ))}
            <button
              className="inline-flex items-center gap-[0.7rem] border-0 bg-transparent py-[0.5rem] text-sm font-medium text-primary-ink hover:underline [&_svg]:size-[1.5rem]"
              onClick={() => {
                setQuery("");
                update({
                  q: null,
                  subject: null,
                  topic: null,
                  tag: [],
                  tagMode: null,
                  favorite: null,
                  status: null,
                  archive: null,
                });
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
