import { Suspense } from "react";
import { Providers } from "@/src/components/Providers";
import { AppShell } from "@/src/components/AppShell";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background p-6 text-base text-muted">
          Abrindo seu espaço…
        </div>
      }
    >
      <Providers>
        <AppShell>{children}</AppShell>
      </Providers>
    </Suspense>
  );
}
