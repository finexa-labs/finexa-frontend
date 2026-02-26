import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FINEXA — Motor de decisiones financieras",
  description:
    "Convertí datos operativos de e-commerce en decisiones financieras claras. Presupuesto seguro de ads, margen real y control de caja.",
};

export const viewport: Viewport = {
  themeColor: "#1F1F24",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
