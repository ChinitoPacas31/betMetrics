"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { BettingProvider } from "@/context/BettingContext";
import { useAuth } from "@/context/AuthContext";

function BootScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sb-canvas">
      <div className="animate-pulse">
        <img
          src="/logo.png"
          alt="BetMetrics"
          width={64}
          height={44}
          className="h-11 w-auto object-contain"
        />
      </div>
      <div className="h-1 w-36 overflow-hidden rounded-full bg-sb-surface">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-sb-blue" />
      </div>
    </div>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !isAuthRoute) {
      router.replace("/login");
    } else if (isAuthenticated && isAuthRoute) {
      router.replace("/");
    }
  }, [isAuthenticated, isAuthRoute, isLoading, router]);

  if (isLoading) return <BootScreen />;

  if (isAuthRoute) {
    return isAuthenticated ? <BootScreen /> : <>{children}</>;
  }

  if (!isAuthenticated) return <BootScreen />;

  return (
    <BettingProvider>
      <Navbar />
      <main className="mx-auto max-w-[1640px] px-3 py-4 sm:px-5">
        {children}
      </main>
    </BettingProvider>
  );
}
