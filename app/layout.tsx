import type { Metadata } from "next";
import { Manrope, Prata } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

const prata = Prata({
  subsets: ["cyrillic", "latin"],
  variable: "--font-display",
  weight: "400",
  display: "swap",
});

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Молочные Традиции — оптовый каталог",
  description:
    "Оптовый каталог сыров и молочной продукции в Москве. Актуальные цены и наличие.",
  openGraph: {
    title: "Молочные Традиции — оптовый каталог",
    description: "Сыры и молочная продукция для магазинов, ресторанов и вашего бизнеса.",
    type: "website",
    locale: "ru_RU",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Молочные Традиции" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Молочные Традиции — оптовый каталог",
    description: "Оптовый каталог сыров и молочной продукции.",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${prata.variable}`}>{children}</body>
    </html>
  );
}
