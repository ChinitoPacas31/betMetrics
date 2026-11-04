import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/40">
            <span className="text-lg font-extrabold tracking-tight text-emerald-400">
              +EV
            </span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              Bet<span className="text-emerald-400">Metrics</span>
            </span>
            <p className="text-xs text-slate-400">
              Quantitative Sports Analytics & Paper Betting
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800/70 hover:text-white"
          >
            Dashboard Cuotas
          </Link>
          <Link
            href="/calculator"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400"
          >
            Calculadora +EV
          </Link>
        </nav>
      </div>
    </header>
  );
}

