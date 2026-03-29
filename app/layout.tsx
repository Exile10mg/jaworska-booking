import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Jaworska Beauty - System rezerwacji wizyt",
    template: "%s | Jaworska Beauty - System rezerwacji wizyt",
  },
  description:
    "System rezerwacji wizyt Jaworska Beauty do wygodnego zarządzania usługami, terminami i rezerwacjami klientek.",
  applicationName: "Jaworska Beauty - System rezerwacji wizyt",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/icon.svg"],
    apple: ["/icon.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#8c6b4a",
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
