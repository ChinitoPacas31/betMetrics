import type { Metadata } from "next";
import "./globals.css";
import AuthGate from "@/components/AuthGate";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "BetMetrics | Analiza el valor. Decide con criterio.",
  description:
    "Analiza cuotas deportivas con datos de mercado, encuentra posibles ventajas y toma decisiones con método.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-sb-canvas font-sans text-slate-100">
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
