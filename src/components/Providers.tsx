"use client";
import { AuthGate } from "@/src/features/auth/AuthGate";
import { PreferencesProvider } from "@/data/contexts/PreferencesContext";
import { ThemeProvider } from "next-themes";
import { LibraryProvider } from "@/data/contexts/LibraryContext";
import { UIProvider } from "@/data/contexts/UIContext";
export function Themes({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="topic-theme"
    >
      {children}
    </ThemeProvider>
  );
}
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <PreferencesProvider>
        <LibraryProvider>
          <UIProvider>{children}</UIProvider>
        </LibraryProvider>
      </PreferencesProvider>
    </AuthGate>
  );
}
