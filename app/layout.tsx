import type { Metadata } from "next";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import { anton, barlow, montserrat } from "./fonts";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bendito Fantasy — FPL en español",
    template: "%s · Bendito Fantasy",
  },
  description:
    "Fantasy Premier League en español: podcast semanal, análisis, datos y capitanes, jornada a jornada.",
  alternates: {
    canonical: "/",
    languages: { es: "/", en: "/?lang=en" },
  },
  openGraph: {
    type: "website",
    siteName: "Bendito Fantasy",
    locale: "es_ES",
    alternateLocale: "en_GB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${anton.variable} ${barlow.variable} ${montserrat.variable}`}
    >
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
