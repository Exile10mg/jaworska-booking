import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio Brwi | Rezerwacja wizyt",
  description:
    "Nowoczesna aplikacja do rezerwacji wizyt dla lokalnego salonu stylizacji brwi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
