import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YUD Service Network Admin",
  description: "Painel administrativo YUD Service Network",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
