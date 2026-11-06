"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AuthLayout from "@/components/AuthLayout";
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
  IconUser,
} from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import { ApiClientError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (displayName.trim().length < 2) {
      setError("Enter a display name with at least 2 characters.");
      return;
    }
    if (!email.trim()) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Your password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        display_name: displayName.trim(),
        email: email.trim(),
        password,
      });
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
          Start tracking
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
          Create your account
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          Your bankroll and paper bets stay private to this account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        <div>
          <label
            htmlFor="displayName"
            className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-300"
          >
            Display name
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <IconUser className="h-4 w-4" />
            </span>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
              autoFocus
              className="w-full rounded-md border border-sb-border bg-sb-canvas py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/25"
            />
          </div>
        </div>

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
              className="w-full rounded-md border border-sb-border bg-sb-canvas py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/25"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-300"
          >
            Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <IconLock className="h-4 w-4" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
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
          <div className="mt-1.5 flex gap-1">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={`h-0.5 flex-1 rounded-full transition ${
                  password.length >= (index + 1) * 3
                    ? "bg-blue-500"
                    : "bg-sb-border"
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-300"
          >
            Confirm password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <IconLock className="h-4 w-4" />
            </span>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              className="w-full rounded-md border border-sb-border bg-sb-canvas py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/25"
            />
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
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-blue-400 transition hover:text-blue-300"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-8 text-center text-[10px] leading-relaxed text-slate-600">
        By creating an account you agree to use BetMetrics for paper betting
        and quantitative analysis only.
      </p>
    </AuthLayout>
  );
}
