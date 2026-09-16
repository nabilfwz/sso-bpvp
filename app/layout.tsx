import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SSO Kemnaker RI — Ekosistem Terpadu BPVP Banda Aceh",
  description: "Single Sign-On (SSO) Terpadu SIAPkerja & Ekosistem Aplikasi BPVP Banda Aceh",
  icons: {
    icon: "/favicon.ico?v=2",
    shortcut: "/favicon.ico?v=2",
    apple: "/favicon.ico?v=2",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-100 flex flex-col justify-between antialiased">
        {children}
      </body>
    </html>
  );
}
