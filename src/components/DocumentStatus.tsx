"use client";
export function DocumentStatus({
  error,
  retry,
}: {
  error: string;
  retry: () => void;
}) {
  return (
    <div className="flex flex-col gap-5 p-6">
      {error ? (
        <>
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
          <button
            type="button"
            className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] border-border bg-surface text-foreground hover:enabled:border-border-strong hover:enabled:bg-surface-hover"
            onClick={retry}
          >
            Tentar novamente
          </button>
        </>
      ) : (
        <p className="text-muted" role="status">
          Carregando conteúdo…
        </p>
      )}
    </div>
  );
}
