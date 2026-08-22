import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Управление каталогом — Молочные Традиции",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
