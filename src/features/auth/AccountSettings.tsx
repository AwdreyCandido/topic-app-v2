"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase } from "@/src/lib/supabase/client";
import { flushAllSaves } from "@/data/domain/autosave";
import { useUI } from "@/data/contexts/UIContext";
export function AccountSettings() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const ui = useUI();
  useEffect(() => {
    void getSupabase()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);
  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.04rem] [&_p]:mt-[0.5rem] [&_p]:text-sm [&_p]:text-muted">
        <h2>Sua conta</h2>
        <p>{email}</p>
      </div>
      <div className="flex items-center gap-3">
        <a
          className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] border-border bg-surface text-foreground hover:enabled:border-border-strong hover:enabled:bg-surface-hover"
          href="/auth/forgot-password"
        >
          Alterar senha
        </a>
        <button
          className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] border-border bg-surface text-foreground hover:enabled:border-border-strong hover:enabled:bg-surface-hover"
          disabled={busy}
          onClick={() =>
            void ui.perform(async () => {
              setBusy(true);
              try {
                await flushAllSaves();
                const { error } = await getSupabase().auth.signOut();
                if (error) throw error;
                router.replace("/auth/login");
              } finally {
                setBusy(false);
              }
            })
          }
        >
          {busy ? "Saindo…" : "Sair da conta"}
        </button>
      </div>
    </section>
  );
}
