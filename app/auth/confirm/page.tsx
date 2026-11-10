"use client";
import { cn } from "@/src/lib/cn";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/src/lib/supabase/client";
import { AuthLayout } from "@/src/features/auth/AuthLayout";
export default function Confirm() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState(
    "Estamos verificando a confirmação do seu e-mail.",
  );
  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    if (params.has("error")) {
      setStatus("error");
      setMessage(
        "O link expirou ou não é válido. Faça login para solicitar um novo e-mail de confirmação.",
      );
      return;
    }
    try {
      void getSupabase()
        .auth.getSession()
        .then(({ data }) => {
          if (data.session) {
            location.replace("/dashboard");
          } else {
            setStatus("success");
            setMessage(
              "Se você confirmou seu e-mail, já pode entrar usando sua senha.",
            );
          }
        })
        .catch(() => {
          setStatus("error");
          setMessage(
            "Não foi possível verificar sua confirmação. Tente entrar novamente.",
          );
        });
    } catch {
      setStatus("error");
      setMessage("Não foi possível conectar ao serviço de autenticação.");
    }
  }, []);
  return (
    <AuthLayout>
      <div className="mb-7 sm:mb-[3.4rem] [&_h1]:font-heading [&_h1]:text-[clamp(2.6rem,2.5vw,3.4rem)] [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:tracking-[-0.12rem] [&_p]:mt-3 [&_p]:text-[1.5rem] [&_p]:leading-relaxed [&_p]:text-muted">
        <h1>
          {status === "loading"
            ? "Confirmando seu e-mail…"
            : status === "success"
              ? "Verifique sua conta."
              : "Não conseguimos confirmar."}
        </h1>

        <p>Estamos cuidando do acesso ao seu espaço de estudos.</p>
      </div>

      <div
        role="status"
        className={cn(
          "mt-[0.5rem] rounded-lg border border-border px-[1.5rem] py-[1.3rem] text-sm leading-relaxed",
          status === "error"
            ? "border-danger bg-danger-soft text-danger"
            : "bg-surface-muted text-muted",
        )}
      >
        {message}
      </div>

      <Link
        className="inline-flex min-h-[4.9rem] w-full items-center justify-center gap-3 rounded-lg border border-transparent bg-primary px-[1.7rem] py-3 text-center text-sm font-semibold text-white transition-colors hover:enabled:bg-primary-hover active:enabled:translate-y-[0.1rem] [&_span]:text-xl [&_span]:font-normal [&_span]:leading-none mt-6"
        href="/auth/login"
      >
        Ir para o login
        <span aria-hidden="true">→</span>
      </Link>
    </AuthLayout>
  );
}
