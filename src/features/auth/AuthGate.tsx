"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/src/lib/supabase/client";
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    try {
      const client = getSupabase();
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (!session) router.replace("/auth/login");
      });
      void client.auth
        .getUser()
        .then(({ data, error }) => {
          if (error || !data.user) router.replace("/auth/login");
          else setUser(data.user);
        })
        .catch(() => setError("Não foi possível verificar sua sessão."));
      return () => data.subscription.unsubscribe();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Erro ao abrir sua conta.",
      );
    }
  }, [router]);
  if (error)
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background p-6 text-base text-muted">
        <p role="alert">{error}</p>
      </main>
    );
  if (!user)
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background p-6 text-base text-muted">
        Verificando sua sessão…
      </main>
    );
  return <div key={user.id}>{children}</div>;
}
