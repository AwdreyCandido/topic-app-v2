
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FiArchive,
  FiBookOpen,
  FiChevronRight,
  FiClock,
  FiFolder,
  FiHome,
  FiLayers,
  FiPlayCircle,
  FiPlus,
  FiSettings,
  FiStar,
} from "react-icons/fi";

import { cn } from "@/src/lib/cn";
import { useLibrary } from "@/data/contexts/LibraryContext";
import { useUI } from "@/data/contexts/UIContext";
import { topicIsArchived } from "@/data/domain/filters";

const links = [
  {
    href: "/dashboard",
    label: "Visão geral",
    icon: FiHome,
  },
  {
    href: "/dashboard/flashcards",
    label: "Todos os flashcards",
    icon: FiLayers,
  },
  {
    href: "/dashboard/study",
    label: "Estudar",
    icon: FiPlayCircle,
  },
  {
    href: "/dashboard/favorites",
    label: "Favoritos",
    icon: FiStar,
  },
  {
    href: "/dashboard/history",
    label: "Histórico",
    icon: FiClock,
  },
];

const footerLinks = [
  {
    href: "/dashboard/archived",
    label: "Arquivados",
    icon: FiArchive,
  },
  {
    href: "/dashboard/settings",
    label: "Configurações",
    icon: FiSettings,
  },
];

const focusClass =
  "focus-visible:outline-[0.2rem] focus-visible:outline-offset-[0.2rem] focus-visible:outline-primary";

const navigationClass =
  "flex min-h-[4.2rem] min-w-0 items-center gap-[1.2rem] rounded-[0.8rem] px-[1.2rem] text-[1.35rem] font-medium transition-colors duration-150";

export default function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const { data } = useLibrary();
  const ui = useUI();
  const pathname = usePathname();

  const [open, setOpen] = useState<Record<string, boolean>>({});

  const subjects = data?.subjects.filter(
    (subject) => !subject.archivedAt,
  ) ?? [];

  return (
    <>
      <Link
        href="/dashboard"
        onClick={onNavigate}
        aria-label="Topic — Visão geral"
        className={cn(
          "flex h-[7.8rem] shrink-0 items-center gap-[1.2rem] border-b border-border transition-colors",
          focusClass,
          collapsed
            ? "justify-center px-[1rem]"
            : "px-[2.4rem]",
        )}
      >
        <span className="flex size-[3.4rem] shrink-0 items-center justify-center rounded-[0.9rem] bg-primary text-white">
          <span className="flex h-[3.4rem] w-8 shrink-0 flex-col justify-center gap-1 rounded-lg bg-primary p-2 [&>span]:h-[0.3rem] [&>span]:w-full [&>span]:rounded-[0.1rem] [&>span]:bg-white [&>span:nth-child(2)]:w-[78%] [&>span:nth-child(3)]:w-[55%]">
            <span />
            <span />
            <span />
          </span>
        </span>

        {!collapsed && (
          <span className="font-heading text-[2.5rem] font-bold leading-none tracking-[-0.12rem] text-foreground">
            topic
            <span className="text-primary-ink">.</span>
          </span>
        )}
      </Link>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain py-[1.6rem] [scrollbar-width:thin]",
          collapsed ? "px-[0.8rem]" : "px-[1.2rem]",
        )}
      >
        <nav
          aria-label="Navegação principal"
          className="flex flex-col gap-[0.3rem]"
        >
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  navigationClass,
                  focusClass,
                  collapsed
                    ? "justify-center px-0"
                    : "",
                  active
                    ? "bg-primary-soft font-semibold text-primary-ink"
                    : "text-muted hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className="size-[1.85rem] shrink-0"
                />

                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate">
                      {label}
                    </span>

                    {href === "/dashboard/flashcards" && (
                      <span
                        className={cn(
                          "flex min-w-[2.6rem] shrink-0 items-center justify-center rounded-[0.6rem] px-[0.7rem] py-[0.3rem] text-[1.15rem] font-medium tabular-nums",
                          active
                            ? "bg-surface text-primary-ink"
                            : "bg-surface-muted text-muted",
                        )}
                      >
                        {data?.flashcards.length ?? 0}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <section className="mt-[3.2rem]">
            <div className="mb-[1rem] flex items-center justify-between gap-[1rem] px-[1.1rem]">
              <h2 className="text-[1.15rem] font-semibold uppercase tracking-[0.1rem] text-subtle">
                Suas matérias
              </h2>

              <button
                type="button"
                onClick={() =>
                  ui.setEntityDialog({ kind: "subject" })
                }
                aria-label="Nova matéria"
                title="Nova matéria"
                className={cn(
                  "flex size-[2.8rem] shrink-0 items-center justify-center rounded-[0.6rem] text-muted transition-colors hover:bg-surface-hover hover:text-foreground",
                  focusClass,
                )}
              >
                <FiPlus
                  aria-hidden="true"
                  className="size-[1.7rem]"
                />
              </button>
            </div>

            <nav aria-label="Matérias e tópicos">
              <div className="flex flex-col gap-[0.3rem]">
                {subjects.map((subject) => {
                  const subjectHref =
                    `/dashboard/${subject.path}`;

                  const subjectActive =
                    pathname === subjectHref ||
                    pathname.startsWith(`${subjectHref}/`);

                  const subjectExact =
                    pathname === subjectHref;

                  const expanded =
                    open[subject.id] ?? subjectActive;

                  const topics = data?.topics.filter(
                    (topic) =>
                      topic.subjectId === subject.id &&
                      !topicIsArchived(topic, data),
                  ) ?? [];

                  return (
                    <div
                      key={subject.id}
                      className="min-w-0"
                    >
                      <div
                        className={cn(
                          "flex min-h-[4rem] min-w-0 items-center rounded-[0.8rem] transition-colors duration-150",
                          subjectExact
                            ? "bg-primary-soft text-primary-ink"
                            : subjectActive
                              ? "bg-surface-muted text-foreground"
                              : "text-muted hover:bg-surface-hover hover:text-foreground",
                        )}
                      >
                        <button
                          type="button"
                          aria-label={
                            `${expanded ? "Recolher" : "Expandir"} ${subject.name}`
                          }
                          aria-expanded={expanded}
                          aria-controls={`sidebar-topics-${subject.id}`}
                          onClick={() =>
                            setOpen((current) => ({
                              ...current,
                              [subject.id]: !expanded,
                            }))
                          }
                          className={cn(
                            "flex h-[4rem] w-[3.2rem] shrink-0 items-center justify-center rounded-[0.6rem] text-inherit",
                            focusClass,
                          )}
                        >
                          <FiChevronRight
                            aria-hidden="true"
                            className={cn(
                              "size-[1.4rem] transition-transform duration-200 motion-reduce:transition-none",
                              expanded ? "rotate-90" : "",
                            )}
                          />
                        </button>

                        <Link
                          href={subjectHref}
                          onClick={onNavigate}
                          aria-current={
                            subjectExact ? "page" : undefined
                          }
                          title={subject.name}
                          className={cn(
                            "flex h-[4rem] min-w-0 flex-1 items-center gap-[1rem] pr-[1.1rem] text-[1.3rem] font-medium",
                            focusClass,
                            subjectActive && "font-semibold",
                          )}
                        >
                          <FiBookOpen
                            aria-hidden="true"
                            className="size-[1.65rem] shrink-0"
                          />

                          <span className="truncate">
                            {subject.name}
                          </span>
                        </Link>
                      </div>

                      {expanded && (
                        <div
                          id={`sidebar-topics-${subject.id}`}
                          className="ml-[1.55rem] border-l border-border py-[0.5rem] pl-[1.65rem]"
                        >
                          <div className="flex flex-col gap-[0.2rem]">
                            {topics.map((topic) => {
                              const href =
                                `${subjectHref}/${topic.path}`;

                              const active =
                                pathname === href;

                              return (
                                <Link
                                  key={topic.id}
                                  href={href}
                                  onClick={onNavigate}
                                  title={topic.name}
                                  aria-current={
                                    active ? "page" : undefined
                                  }
                                  className={cn(
                                    "flex min-h-[3.6rem] min-w-0 items-center gap-[0.9rem] rounded-[0.7rem] px-[1rem] py-[0.6rem] text-[1.25rem] font-medium transition-colors duration-150",
                                    focusClass,
                                    active
                                      ? "bg-primary-soft font-semibold text-primary-ink"
                                      : "text-muted hover:bg-surface-hover hover:text-foreground",
                                  )}
                                >
                                  <FiFolder
                                    aria-hidden="true"
                                    className="size-[1.5rem] shrink-0"
                                  />

                                  <span className="truncate">
                                    {topic.name}
                                  </span>
                                </Link>
                              );
                            })}

                            <button
                              type="button"
                              onClick={() =>
                                ui.setEntityDialog({
                                  kind: "topic",
                                  subjectId: subject.id,
                                })
                              }
                              className={cn(
                                "flex min-h-[3.6rem] w-full items-center gap-[0.9rem] rounded-[0.7rem] px-[1rem] py-[0.6rem] text-left text-[1.25rem] text-muted transition-colors hover:bg-surface-hover hover:text-primary-ink",
                                focusClass,
                              )}
                            >
                              <FiPlus
                                aria-hidden="true"
                                className="size-[1.5rem] shrink-0"
                              />

                              <span>Adicionar tópico</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {subjects.length === 0 && (
                <button
                  type="button"
                  onClick={() =>
                    ui.setEntityDialog({ kind: "subject" })
                  }
                  className={cn(
                    "flex min-h-[4rem] w-full items-center gap-[1rem] rounded-[0.8rem] px-[1.2rem] text-left text-[1.3rem] text-muted transition-colors hover:bg-surface-hover hover:text-primary-ink",
                    focusClass,
                  )}
                >
                  <FiPlus
                    aria-hidden="true"
                    className="size-[1.7rem] shrink-0"
                  />

                  <span>Criar matéria</span>
                </button>
              )}
            </nav>
          </section>
        )}
      </div>

      <nav
        aria-label="Outras páginas"
        className={cn(
          "flex shrink-0 flex-col gap-[0.3rem] border-t border-border py-[1.2rem]",
          collapsed ? "px-[0.8rem]" : "px-[1.2rem]",
        )}
      >
        {footerLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                navigationClass,
                focusClass,
                collapsed
                  ? "justify-center px-0"
                  : "",
                active
                  ? "bg-primary-soft font-semibold text-primary-ink"
                  : "text-muted hover:bg-surface-hover hover:text-foreground",
              )}
            >
              <Icon
                aria-hidden="true"
                className="size-[1.85rem] shrink-0"
              />

              {!collapsed && (
                <span className="truncate">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
