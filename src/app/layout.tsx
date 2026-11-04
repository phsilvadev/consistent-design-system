import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles.css";

export const metadata: Metadata = {
  title: { default: "AtendeHUB", template: "%s — AtendeHUB" },
  description: "Atendimento, vendas e integrações para sua empresa.",
  icons: { icon: "/favicon.ico" },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Nunito+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
