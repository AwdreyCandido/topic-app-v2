"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center [&_h2]:mt-4 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mb-6 [&_p]:mt-3 [&_p]:max-w-[48rem] [&_p]:text-base [&_p]:text-muted">
      <h1>Não foi possível carregar esta tela</h1>
      <p>Seus dados continuam neste navegador. Tente abrir a tela novamente.</p>
      <button
        className="inline-flex min-h-[4.2rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-[1.7rem] py-2.5 text-base font-semibold [&_svg]:size-[1.7rem] bg-primary text-white shadow-sm hover:enabled:bg-primary-hover"
        onClick={reset}
      >
        Tentar novamente
      </button>
    </div>
  );
}
