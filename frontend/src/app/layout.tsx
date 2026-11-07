import type { Metadata } from "next";
import "./globals.css";
import AuthGate from "@/components/AuthGate";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "BetMetrics | Analyze Value. Decide with Precision.",
  description:
    "Analyze sports odds with live market data, uncover positive EV opportunities, and make methodical betting decisions.",
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
    <html lang="en">
      <body className="min-h-screen bg-sb-canvas font-sans text-slate-100">
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
