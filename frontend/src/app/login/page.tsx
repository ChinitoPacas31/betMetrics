"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AuthLayout from "@/components/AuthLayout";
import { IconEye, IconEyeOff, IconLock, IconMail } from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import { ApiClientError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.payload.message);
      } else {
        setError(
          "Could not reach the BetMetrics API. Is the backend running on port 8000?"
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">
          Welcome back
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
          Sign in to your account
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          Access your bankroll, paper bets and live +EV board.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-300"
          >
            Email address
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <IconMail className="h-4 w-4" />
            </span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              className="w-full rounded-md border border-sb-border bg-sb-canvas py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/25"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-300"
            >
              Password
            </label>
            <span className="text-[10px] text-slate-500">
              Protected by JWT
            </span>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <IconLock className="h-4 w-4" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              className="w-full rounded-md border border-sb-border bg-sb-canvas py-2.5 pl-9 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/25"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 transition hover:text-slate-200"
            >
              {showPassword ? (
                <IconEyeOff className="h-4 w-4" />
              ) : (
                <IconEye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-xs leading-relaxed text-rose-300"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 w-full rounded-md bg-sb-blue py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-blue-950/50 transition hover:bg-sb-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        New to BetMetrics?{" "}
        <Link
          href="/register"
          className="font-bold text-blue-400 transition hover:text-blue-300"
        >
          Create an account
        </Link>
      </p>

      <p className="mt-8 text-center text-[10px] leading-relaxed text-slate-600">
        Sessions expire after 7 days. Paper betting only — no real money is
        wagered.
      </p>
    </AuthLayout>
  );
}
