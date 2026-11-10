
"use client";

import { cn } from "@/src/lib/cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getSupabase } from "@/src/lib/supabase/client";
import {
  emailSchema,
  loginSchema,
  passwordSchema,
  registerSchema,
} from "@/src/lib/schemas";
import { AuthLayout } from "./AuthLayout";

type Mode =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password";

type Field = "name" | "email" | "password" | "confirmation";

const schemas = {
  login: loginSchema,
  register: registerSchema,
  "forgot-password": emailSchema,
  "reset-password": passwordSchema,
};

const content: Record<
  Mode,
  {
    title: string;
    description: string;
    button: string;
  }
> = {
  login: {
    title: "Bem-vindo de volta.",
    description: "Entre na sua conta para continuar seus estudos.",
    button: "Entrar",
  },
  register: {
    title: "Crie sua conta.",
    description: "Comece a organizar seus estudos com o Topic.",
    button: "Criar conta",
  },
  "forgot-password": {
    title: "Recuperar senha.",
    description: "Enviaremos um link de recuperação para seu e-mail.",
    button: "Enviar link",
  },
  "reset-password": {
    title: "Nova senha.",
    description: "Escolha uma nova senha para acessar sua conta.",
    button: "Salvar senha",
  },
};

const labels: Record<Field, string> = {
  name: "Nome",
  email: "E-mail",
  password: "Senha",
  confirmation: "Confirmar senha",
};

const placeholders: Record<Field, string> = {
  name: "Seu nome",
  email: "voce@exemplo.com",
  password: "Sua senha",
  confirmation: "Repita sua senha",
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(mode !== "reset-password");
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  const schema = schemas[mode];

  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  useEffect(() => {
    if (mode !== "reset-password") return;

    let active = true;

    try {
      const client = getSupabase();

      const { data } = client.auth.onAuthStateChange(
        (event, session) => {
          if (
            active &&
            session &&
            (event === "PASSWORD_RECOVERY" ||
              event === "INITIAL_SESSION")
          ) {
            setReady(true);
            setMessage("");
          }
        },
      );

      void client.auth
        .getSession()
        .then(({ data }) => {
          if (!active) return;

          if (data.session) {
            setReady(true);
          } else {
            setMessage(
              "Abra o link de recuperação enviado ao seu e-mail.",
            );
          }
        })
        .catch(() => {
          if (active) {
            setMessage(
              "Não foi possível verificar o link de recuperação.",
            );
          }
        });

      return () => {
        active = false;
        data.subscription.unsubscribe();
      };
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Erro de configuração.",
      );
    }
  }, [mode]);

  const submit = handleSubmit(async (values) => {
    setMessage("");
    setConfirmationRequired(false);
    clearErrors("root");

    try {
      const client = getSupabase();

      if (
        mode === "login" &&
        "email" in values &&
        "password" in values
      ) {
        const { error } = await client.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) throw error;

        router.replace("/dashboard");
      } else if (mode === "register" && "name" in values) {
        const { data, error } = await client.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: { name: values.name },
            emailRedirectTo: location.origin + "/auth/confirm",
          },
        });

        if (error) throw error;

        if (data.session) {
          router.replace("/dashboard");
        } else {
          setMessage(
            "Conta criada! Confira seu e-mail para confirmar o cadastro.",
          );
        }
      } else if (
        mode === "forgot-password" &&
        "email" in values
      ) {
        const { error } = await client.auth.resetPasswordForEmail(
          values.email,
          {
            redirectTo:
              location.origin + "/auth/reset-password",
          },
        );

        if (error) throw error;

        setMessage(
          "Se esse e-mail estiver cadastrado, você receberá um link de recuperação.",
        );
      } else if (
        mode === "reset-password" &&
        "password" in values
      ) {
        const { error } = await client.auth.updateUser({
          password: values.password,
        });

        if (error) throw error;

        setMessage("Senha atualizada com sucesso.");
      }
    } catch (cause) {
      const error = cause as {
        code?: string;
        message?: string;
      };

      const messages: Record<string, string> = {
        invalid_credentials: "E-mail ou senha incorretos.",
        email_not_confirmed:
          "Confirme seu e-mail antes de entrar.",
        over_email_send_rate_limit:
          "Aguarde alguns minutos antes de solicitar outro e-mail.",
        user_already_exists:
          "Já existe uma conta com esse e-mail.",
        weak_password: "Escolha uma senha mais forte.",
      };

      setConfirmationRequired(
        error.code === "email_not_confirmed",
      );

      setError("root", {
        type: "server",
        message:
          messages[error.code ?? ""] ??
          "Não foi possível concluir. Verifique sua conexão e tente novamente.",
      });
    }
  });

  const resend = async () => {
    const parsed = emailSchema.safeParse({
      email: getValues("email" as keyof Values),
    });

    if (!parsed.success) {
      setError("root", {
        type: "manual",
        message:
          "Informe um e-mail válido para reenviar a confirmação.",
      });

      return;
    }

    clearErrors("root");
    setResending(true);

    try {
      const { error } = await getSupabase().auth.resend({
        type: "signup",
        email: parsed.data.email,
        options: {
          emailRedirectTo: location.origin + "/auth/confirm",
        },
      });

      if (error) throw error;

      setMessage(
        "Se o cadastro estiver pendente, você receberá um novo e-mail de confirmação.",
      );

      setConfirmationRequired(false);
    } catch {
      setError("root", {
        type: "server",
        message:
          "Não foi possível reenviar. Tente novamente mais tarde.",
      });
    } finally {
      setResending(false);
    }
  };

  const fields: Field[] = [];

  if (mode === "register") fields.push("name");
  if (mode !== "reset-password") fields.push("email");
  if (mode !== "forgot-password") fields.push("password");

  if (mode === "register" || mode === "reset-password") {
    fields.push("confirmation");
  }

  const unmatchedErrors = Object.entries(errors)
    .filter(
      ([field]) =>
        field !== "root" &&
        !fields.includes(field as Field),
    )
    .map(([, error]) =>
      typeof error?.message === "string"
        ? error.message
        : null,
    )
    .filter((value): value is string => Boolean(value));

  return (
    <AuthLayout>
      <div className="mb-[3.6rem]">
        <h1 className="font-heading text-[3rem] font-semibold leading-[1.2] tracking-[-0.1rem] text-foreground sm:text-[3.2rem]">
          {content[mode].title}
        </h1>

        <p className="mt-[1rem] text-[1.4rem] leading-[1.7] text-muted">
          {content[mode].description}
        </p>
      </div>

      <form
        noValidate
        onSubmit={submit}
        className="flex flex-col gap-[1.8rem]"
      >
        {fields.map((field) => {
          const key = field as keyof Values;

          const error = (
            errors as Record<
              string,
              { message?: string } | undefined
            >
          )[field];

          const isPassword =
            field === "password" || field === "confirmation";

          const registered = register(key);

          return (
            <div key={field} className="flex flex-col">
              <div className="mb-[0.8rem] flex items-center justify-between gap-[1rem]">
                <label
                  htmlFor={field}
                  className="text-[1.3rem] font-medium text-foreground"
                >
                  {labels[field]}
                </label>

                {field === "password" && mode === "login" && (
                  <Link
                    href="/auth/forgot-password"
                    className="text-[1.2rem] font-medium text-primary-ink transition-opacity hover:opacity-70"
                  >
                    Esqueceu a senha?
                  </Link>
                )}
              </div>

              <div className="relative">
                <input
                  {...registered}
                  id={field}
                  type={
                    field === "email"
                      ? "email"
                      : isPassword
                        ? showPassword
                          ? "text"
                          : "password"
                        : "text"
                  }
                  placeholder={placeholders[field]}
                  autoComplete={
                    field === "name"
                      ? "name"
                      : field === "email"
                        ? "email"
                        : mode === "login"
                          ? "current-password"
                          : "new-password"
                  }
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error ? `${field}-error` : undefined
                  }
                  onChange={(event) => {
                    void registered.onChange(event);

                    if (errors.root) {
                      clearErrors("root");
                    }
                  }}
                  className={cn(
                    "block h-[4rem] w-full rounded-[0.7rem] border bg-surface px-[1.3rem] text-[1.4rem] text-foreground outline-none transition-all duration-150 placeholder:text-muted/60",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    isPassword && "pr-[8rem]",
                    error
                      ? "border-red-500 focus:border-red-500 focus:ring-[0.2rem] focus:ring-red-500/10"
                      : "border-border hover:border-foreground/25 focus:border-[#2133ff] focus:ring-[0.2rem] focus:ring-[#2133ff]/10",
                  )}
                />

                {field === "password" && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-[0.6rem] top-1/2 -translate-y-1/2 rounded-[0.5rem] px-[1rem] py-[0.5rem] text-[1.2rem] font-medium text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-[0.2rem] focus-visible:outline-primary"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                )}
              </div>

              {error?.message && (
                <p
                  id={`${field}-error`}
                  role="alert"
                  className="mt-[0.7rem] flex items-start gap-[0.6rem] text-[1.2rem] leading-[1.5] text-red-600 dark:text-red-400"
                >
                  <span aria-hidden="true" className="font-bold">
                    !
                  </span>
                  <span>{error.message}</span>
                </p>
              )}
            </div>
          );
        })}

        {unmatchedErrors.length > 0 && (
          <div
            role="alert"
            className="border-l-[0.2rem] border-red-500 py-[0.4rem] pl-[1.2rem] text-[1.3rem] leading-[1.6] text-red-600 dark:text-red-400"
          >
            {unmatchedErrors.map((error, index) => (
              <p key={`${index}-${error}`}>{error}</p>
            ))}
          </div>
        )}

        {errors.root?.message && (
          <div
            role="alert"
            className="border-l-[0.2rem] border-red-500 py-[0.4rem] pl-[1.2rem] text-[1.3rem] leading-[1.6] text-red-600 dark:text-red-400"
          >
            {errors.root.message}
          </div>
        )}

        {message && (
          <div
            role="status"
            className={cn(
              "border-l-[0.2rem] py-[0.4rem] pl-[1.2rem] text-[1.3rem] leading-[1.6]",
              mode === "reset-password" && !ready
                ? "border-border text-muted"
                : "border-emerald-600 text-emerald-700 dark:text-emerald-400",
            )}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !ready}
          className="mt-[0.8rem] flex h-[4.2rem] w-full items-center justify-center gap-[1rem] rounded-[0.7rem] bg-[#2133ff] px-[1.6rem] text-[1.3rem] font-semibold text-white transition-colors hover:enabled:bg-[#1929db] focus-visible:outline focus-visible:outline-[0.2rem] focus-visible:outline-offset-[0.3rem] focus-visible:outline-[#2133ff] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Aguarde..."
            : content[mode].button}

          {!isSubmitting && (
            <span aria-hidden="true" className="text-[1.8rem] font-normal">
              →
            </span>
          )}
        </button>

        {mode === "login" && confirmationRequired && (
          <button
            type="button"
            disabled={isSubmitting || resending}
            onClick={() => void resend()}
            className="self-center text-[1.2rem] font-medium text-primary-ink hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resending
              ? "Reenviando..."
              : "Reenviar e-mail de confirmação"}
          </button>
        )}
      </form>

      <div className="mt-[3.2rem] text-center text-[1.3rem] text-muted">
        {mode === "login" ? (
          <p>
            Ainda não tem uma conta?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-primary-ink hover:underline"
            >
              Criar conta
            </Link>
          </p>
        ) : mode === "register" ? (
          <p>
            Já tem uma conta?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-primary-ink hover:underline"
            >
              Entrar
            </Link>
          </p>
        ) : (
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-[0.8rem] font-medium text-primary-ink hover:underline"
          >
            <span aria-hidden="true">←</span>
            Voltar para o login
          </Link>
        )}

        {mode === "reset-password" && ready && message && (
          <div className="mt-[1.6rem]">
            <Link
              href="/dashboard"
              className="font-semibold text-primary-ink hover:underline"
            >
              Abrir meu espaço →
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
