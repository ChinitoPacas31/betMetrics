import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { BettingProvider } from "@/context/BettingContext";

export const metadata: Metadata = {
  title: "BetMetrics | Sportsbook +EV & Paper Betting",
  description:
    "Quantitative sports analysis platform, mathematical edge detection (+EV), Kelly Criterion, and Paper Betting.",
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
        <BettingProvider>
          <Navbar />
          <main className="mx-auto max-w-[1640px] px-3 py-4 sm:px-5">
            {children}
          </main>
        </BettingProvider>
      </body>
    </html>
  );
}
