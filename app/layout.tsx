import type { Metadata } from "next";
import "@fontsource/exo/400.css";
import "@fontsource/exo/500.css";
import "@fontsource/exo/600.css";
import "@fontsource/exo/700.css";
import "@fontsource/saira/400.css";
import "@fontsource/saira/500.css";
import "@fontsource/saira/600.css";
import "@fontsource/saira/700.css";
import "./globals.css";
import { Themes } from "@/src/components/Providers";
export const metadata: Metadata = {
  title: {
    default: "Topic — Seu espaço de aprendizado",
    template: "%s · Topic",
  },
  description:
    "Organize matérias, conecte ideias e aprenda com resumos e flashcards.",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Themes>{children}</Themes>
      </body>
    </html>
  );
}
