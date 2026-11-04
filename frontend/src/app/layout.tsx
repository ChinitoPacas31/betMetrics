import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "BetMetrics | Plataforma de Análisis Deportivo (+EV) y Paper Betting",
  description:
    "Análisis cuantitativo de cuotas deportivas con Valor Esperado (+EV), semáforo de confianza y simulación de apuestas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}

