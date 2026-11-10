"use client";
import { cn } from "@/src/lib/cn";
import { usePreferences } from "@/data/contexts/PreferencesContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HiChevronRight,
  HiChevronLeft,
  HiMagnifyingGlass,
  HiBars3,
} from "react-icons/hi2";
import { useLibrary } from "@/data/contexts/LibraryContext";
import { useUI } from "@/data/contexts/UIContext";
import { flushAllSaves, hasPendingSaves } from "@/data/domain/autosave";
import {
  ConfirmDialog,
  Empty,
  Loading,
  Modal,
  Notice,
  isTyping,
} from "./ui/Primitives";
import { EntityForm } from "@/src/features/EntityForm";
import { CardEditor, CardPreview } from "@/src/features/CardEditor";
import { GlobalSearch } from "@/src/features/GlobalSearch";
import SidebarContent from "./ui/Sidebar";
import ThemeSwitcher from "./ui/ThemeSwitcher";
export function AppShell({ children }: { children: React.ReactNode }) {
  const { data, error, retry } = useLibrary();
  const ui = useUI();
  const router = useRouter();
  const preferences = usePreferences();
  const collapsed = preferences.values.sidebar === "collapsed";
  const [mobileOpen, setMobileOpen] = useState(false);
  const setSearchOpen = ui.setSearchOpen;
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k" &&
        !isTyping(event.target)
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setSearchOpen]);
  if (error)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background p-6 text-base text-muted">
        <Empty
          title="Não foi possível abrir seu espaço"
          description={
            error + " Verifique sua conexão e a configuração do Supabase."
          }
        >
          <button
            className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] bg-primary text-white shadow-sm hover:enabled:bg-primary-hover"
            onClick={retry}
          >
            Tentar novamente
          </button>
        </Empty>
      </div>
    );
  if (!data)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background p-6 text-base text-muted">
        <div className="flex items-center gap-3 font-heading text-3xl font-semibold text-foreground">
          <span className="flex h-[3.4rem] w-8 shrink-0 flex-col justify-center gap-1 rounded-lg bg-primary p-2 [&>span]:h-[0.3rem] [&>span]:w-full [&>span]:rounded-[0.1rem] [&>span]:bg-white [&>span:nth-child(2)]:w-[78%] [&>span:nth-child(3)]:w-[55%]">
            <span />
            <span />
            <span />
          </span>
          topic.
        </div>
        <Loading />
      </div>
    );
  return (
    <div
      className={cn(
        "group/shell min-h-screen [--sidebar-width:25.2rem]",
        collapsed ? "[--sidebar-width:8rem]" : "",
      )}
      data-collapsed={collapsed}
      onClickCapture={(event) => {
        if (
          !hasPendingSaves() ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.button !== 0
        )
          return;
        const anchor =
          event.target instanceof Element ? event.target.closest("a") : null;
        if (
          !anchor ||
          anchor.target === "_blank" ||
          anchor.hasAttribute("download")
        )
          return;
        const url = new URL(anchor.href);
        if (url.origin !== window.location.origin) return;
        event.preventDefault();
        event.stopPropagation();
        void ui.perform(async () => {
          await flushAllSaves();
          router.push(url.pathname + url.search + url.hash);
        });
      }}
    >
      <a
        href="#main-content"
        className="fixed -top-24 left-5 z-[500] rounded-lg bg-primary px-5 py-3 text-white focus:top-3"
      >
        Pular para o conteúdo
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex">
        <SidebarContent
          collapsed={collapsed}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>
      <Modal
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        title="Navegação"
        className="left-0 top-0 h-dvh max-h-dvh w-[28rem] translate-x-0 translate-y-0 rounded-none border-0 p-0 sm:p-0 [&>[data-slot=dialog-heading]]:sr-only"
      >
        <SidebarContent
          collapsed={false}
          onNavigate={() => setMobileOpen(false)}
        />
      </Modal>
      <div className="min-h-screen transition-[margin] duration-200 md:ml-[var(--sidebar-width)]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              className="size-8 min-w-8 items-center justify-center rounded-lg border-0 bg-transparent p-[0.5rem] text-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-[1.8rem] inline-flex md:hidden"
              aria-label="Abrir menu"
              onClick={() => setMobileOpen(true)}
            >
              <HiBars3 />
            </button>
            <button
              className="hidden size-[2.8rem] place-items-center rounded-lg border border-border bg-surface text-muted hover:bg-surface-hover md:grid [&_svg]:size-[1.5rem]"
              aria-label={
                collapsed ? "Expandir menu lateral" : "Recolher menu lateral"
              }
              onClick={() => {
                const next = !collapsed;
                void ui.perform(() =>
                  preferences.save({
                    sidebar: next ? "collapsed" : "expanded",
                  }),
                );
              }}
            >
              {collapsed ? <HiChevronRight /> : <HiChevronLeft />}
            </button>
          </div>
          <button
            className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-muted transition-colors hover:border-border-strong [&_svg]:size-4 [&_span]:truncate [&_kbd]:ml-5 max-sm:[&_kbd]:hidden max-sm:[&_span]:max-w-[14rem]"
            onClick={() => ui.setSearchOpen(true)}
          >
            <HiMagnifyingGlass />
            <span>Buscar no seu espaço</span>
            <kbd>Ctrl K</kbd>
          </button>
          <ThemeSwitcher />
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-[144rem] px-4 pb-0 pt-6 outline-none sm:px-8 sm:pt-9 lg:px-10"
          tabIndex={-1}
        >
          {children}
          <footer className="flex flex-wrap justify-between gap-3 border-t border-border pb-5 pt-6 mt-12 text-xs text-subtle">
            <span>Organize. Conecte. Aprenda.</span>
            <span>Feito para o seu ritmo.</span>
          </footer>
        </main>
      </div>
      <EntityForm />
      <CardPreview />
      <CardEditor />
      <GlobalSearch />
      <ConfirmDialog />
      <Notice />
    </div>
  );
}
