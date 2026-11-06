import React from "react";

import { IconBolt, IconChart, IconShield } from "./Icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-sb-canvas lg:grid-cols-[1.05fr_0.95fr]">
      {/* Panel de marca */}
      <section className="relative hidden overflow-hidden border-r border-sb-border bg-sb-header lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(37,99,235,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.55) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse at 30% 20%, black 0%, transparent 72%)",
          }}
        />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-sb-blue/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="BetMetrics"
              width={56}
              height={40}
              className="h-10 w-auto object-contain"
            />
            <img
              src="/letras.png"
              alt="BetMetrics"
              width={180}
              height={30}
              className="h-7 w-auto object-contain"
            />
          </div>

          <h1 className="mt-12 max-w-xl text-4xl font-black leading-tight tracking-tight text-white">
            Find the edge.
            <br />
            <span className="text-blue-400">Track every bet.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            A quantitative sportsbook scanner that removes the vig, compares
            real prices across bookmakers, and keeps your paper betting
            portfolio accountable.
          </p>

          <div className="mt-10 grid max-w-lg gap-3">
            {[
              {
                icon: <IconBolt className="h-4 w-4" />,
                title: "Live +EV detection",
                copy: "Sharp-weighted consensus probabilities against the best available line.",
              },
              {
                icon: <IconChart className="h-4 w-4" />,
                title: "Bankroll discipline",
                copy: "Quarter-Kelly sizing and a persistent paper-bet ledger.",
              },
              {
                icon: <IconShield className="h-4 w-4" />,
                title: "Your data, isolated",
                copy: "Every account has its own bankroll, history and preferences.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-lg border border-sb-border bg-sb-panel/70 p-3.5 backdrop-blur"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-blue-500/35 bg-sb-blue/15 text-blue-400">
                  {item.icon}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-100">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                    {item.copy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-slate-500">
          Real odds via The Odds API · Paper betting only · No real money at
          risk
        </p>
      </section>

      {/* Panel de formulario */}
      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <img
              src="/logo.png"
              alt="BetMetrics"
              width={49}
              height={32}
              className="h-8 w-auto object-contain"
            />
            <img
              src="/letras.png"
              alt="BetMetrics"
              width={138}
              height={22}
              className="h-[22px] w-auto object-contain"
            />
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
