
"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

const flashcards = [
  {
    subject: "Português",
    topic: "Acentuação gráfica",
    question: "Por que 'pôde' tem acento, mas 'pode' não?",
    answer:
      "O acento diferencia o passado (ele pôde) do presente (ele pode). É um caso de acento diferencial.",
  },
  {
    subject: "Português",
    topic: "Sintaxe",
    question: "Em 'Vendem-se casas', qual é o sujeito da oração?",
    answer:
      "'Casas' é o sujeito paciente. O verbo concorda com ele, e o 'se' funciona como partícula apassivadora.",
  },
  {
    subject: "Matemática",
    topic: "Probabilidade",
    question:
      "Por que 23 pessoas já são suficientes para uma chance superior a 50% de aniversários coincidentes?",
    answer:
      "Porque existem 253 pares possíveis entre 23 pessoas. A quantidade de comparações faz a probabilidade aumentar rapidamente.",
  },
  {
    subject: "Matemática",
    topic: "Probabilidade condicional",
    question:
      "Por que trocar de porta aumenta suas chances de ganhar no problema de Monty Hall?",
    answer:
      "A escolha inicial tem 1/3 de chance de acerto. Ao trocar depois que o apresentador revela uma porta perdedora, a chance passa a 2/3.",
  },
  {
    subject: "História",
    topic: "História contemporânea",
    question: "Por que 1816 ficou conhecido como o ano sem verão?",
    answer:
      "A erupção do vulcão Tambora, em 1815, lançou partículas na atmosfera e provocou resfriamento climático em várias regiões.",
  },
  {
    subject: "História",
    topic: "Brasil República",
    question:
      "Por que a Revolta da Vacina não foi apenas uma reação à vacinação obrigatória?",
    answer:
      "A revolta de 1904 também envolveu insatisfação com reformas urbanas autoritárias, remoções e a atuação do governo.",
  },
  {
    subject: "Geografia",
    topic: "Climatologia",
    question:
      "Como a Amazônia influencia as chuvas em regiões distantes?",
    answer:
      "A evapotranspiração libera umidade que pode ser transportada pelos ventos, contribuindo para a formação de chuvas em outras regiões.",
  },
  {
    subject: "Geografia",
    topic: "Geografia física",
    question:
      "Por que o deserto do Atacama é tão seco mesmo estando perto do oceano?",
    answer:
      "A corrente fria de Humboldt, a estabilidade atmosférica e a barreira dos Andes dificultam a ocorrência de chuvas.",
  },
  {
    subject: "Física",
    topic: "Relatividade",
    question:
      "Por que os satélites de GPS precisam considerar a teoria da relatividade?",
    answer:
      "A velocidade e a gravidade afetam a passagem do tempo nos relógios dos satélites. Sem correções, o posicionamento acumularia erros.",
  },
  {
    subject: "Física",
    topic: "Gravitação",
    question:
      "Por que astronautas parecem flutuar na Estação Espacial Internacional?",
    answer:
      "A estação e os astronautas estão em queda livre contínua ao redor da Terra, produzindo a sensação de ausência de peso.",
  },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [exiting, setExiting] = useState(false);

  const current = flashcards[index];

  useEffect(() => {
    const reveal = window.setTimeout(() => {
      setShowAnswer(true);
    }, 3800);

    const exit = window.setTimeout(() => {
      setExiting(true);
    }, 8000);

    const next = window.setTimeout(() => {
      setIndex((value) => (value + 1) % flashcards.length);
      setShowAnswer(false);
      setExiting(false);
    }, 8500);

    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(exit);
      window.clearTimeout(next);
    };
  }, [index]);

  return (
    <main className="h-dvh overflow-y-auto bg-background p-[2rem] font-sans text-foreground">
      <div className="mx-auto grid min-h-full overflow-hidden w-full rounded-[2rem] border border-border bg-surface sm:rounded-[2.6rem] lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
        <section className="flex min-h-0 min-w-0 flex-col">
          <header className="flex shrink-0 items-center px-[2.8rem] py-[2.8rem] sm:px-[5rem] lg:px-[clamp(4rem,4.5vw,7rem)]">
            <Link
              href="/"
              aria-label="Topic — Página inicial"
              className="inline-flex items-baseline font-heading text-[2.7rem] font-bold leading-none tracking-[-0.17rem]"
            >
              topic<span className="text-primary-ink">.</span>
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center px-[2.8rem] py-[3rem] sm:px-[5rem] lg:px-[clamp(4rem,5vw,8rem)]">
            <div className="w-full max-w-[38rem]">
              {children}
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-[2rem] px-[2.8rem] py-[2.6rem] sm:px-[5rem] lg:px-[clamp(4rem,4.5vw,7rem)]">
            <span className="text-[1.2rem] text-muted">
              © {new Date().getFullYear()} Topic
            </span>

            <Link
              href="/"
              className="text-[1.2rem] font-medium text-muted transition-colors hover:text-primary-ink"
            >
              Voltar ao início
            </Link>
          </footer>
        </section>

        <aside
          aria-label="Demonstração de flashcards"
          className="relative hidden h-full min-h-0 min-w-0 overflow-hidden border-l border-border bg-[#f5f6fa] dark:bg-surface-muted lg:flex"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--border) 0.05rem, transparent 0.05rem), linear-gradient(to bottom, var(--border) 0.05rem, transparent 0.05rem)",
              backgroundSize: "3.2rem 3.2rem",
            }}
          />

          <div className="relative flex h-full min-h-0 w-full flex-col px-[clamp(3rem,4vw,6rem)] py-[clamp(2.4rem,3.5vw,5rem)]">
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div
                className={`w-full max-w-[53rem] transition-[opacity,transform,filter] duration-500 ease-out motion-reduce:transition-none ${
                  exiting
                    ? "translate-y-[-1rem] opacity-0 blur-[0.3rem]"
                    : "translate-y-0 opacity-100 blur-0"
                }`}
              >
                <div className="mb-[2.2rem] ml-[1rem] flex items-center gap-[1.2rem]">
                  <span className="flex size-[3.8rem] shrink-0 items-center justify-center rounded-[1rem] bg-primary font-heading text-[1.6rem] font-semibold text-white">
                    {current.subject.charAt(0)}
                  </span>

                  <div className="min-w-0">
                    <p className="text-[1.4rem] font-semibold text-foreground">
                      {current.subject}
                    </p>
                    <p className="truncate text-[1.2rem] text-muted">
                      {current.topic}
                    </p>
                  </div>
                </div>

                <article className="relative mr-auto flex min-h-[clamp(21rem,36dvh,31rem)] w-[88%] flex-col justify-between rounded-[1.6rem] border border-border bg-surface p-[clamp(2rem,2.7vw,3.8rem)] shadow-[0_1.4rem_4rem_-2rem_rgba(24,27,54,0.16)]">
                  <span className="text-[1.2rem] font-medium text-muted">
                    Pergunta
                  </span>

                  <h2 className="py-[2.4rem] font-heading text-[clamp(1.9rem,2.1vw,2.9rem)] font-medium leading-[1.45] tracking-[-0.07rem] text-foreground">
                    {current.question}
                  </h2>

                  <div className="flex items-center justify-between border-t border-border pt-[1.6rem]">
                    <span className="text-[1.2rem] text-muted">
                      {current.topic}
                    </span>

                    <span className="font-heading text-[1.7rem] font-semibold text-primary-ink">
                      ?
                    </span>
                  </div>
                </article>

                <div
                  className={`relative z-10 -mt-[3rem] ml-auto w-[76%] rounded-[1.4rem] border border-[#2c3557] bg-[#252d49] p-[clamp(1.8rem,2vw,2.8rem)] text-white shadow-[0_1.2rem_3.6rem_-1.5rem_rgba(20,25,50,0.25)] transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
                    showAnswer
                      ? "translate-y-0 opacity-100"
                      : "translate-y-[1.8rem] opacity-0"
                  }`}
                  aria-hidden={!showAnswer}
                >
                  <div className="mb-[1.2rem] flex items-center gap-[0.8rem]">
                    <span className="size-[0.65rem] rounded-full bg-[#a4b0ff]" />
                    <span className="text-[1.2rem] font-medium text-[#c5cdff]">
                      Resposta
                    </span>
                  </div>

                  <p className="text-[clamp(1.3rem,1.25vw,1.6rem)] leading-[1.6] text-white/90">
                    {current.answer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
