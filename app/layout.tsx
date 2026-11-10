import type { Metadata } from "next";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/700.css";
import "@fontsource/sora/400.css";
import "@fontsource/sora/500.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
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
