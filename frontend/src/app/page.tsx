"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import SportsSidebar from "@/components/SportsSidebar";
import OddsBoard from "@/components/OddsBoard";
import BetSlipSidebar from "@/components/BetSlipSidebar";

function ArrowUpRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M5 15 15 5M6 5h9v9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label="BetMetrics home" className="inline-flex items-center gap-2.5">
      <img src="/logo.png" alt="" className="h-8 w-auto object-contain" />
      <img src="/letras.png" alt="BetMetrics" className={`h-[19px] w-auto object-contain ${light ? "brightness-0 invert" : ""}`} />
    </Link>
  );
}

function EdgeVisual() {
  return (
    <div className="landing-visual relative mx-auto w-full max-w-[570px]" aria-label="BetMetrics market analysis illustration">
      <div className="landing-orbit landing-orbit-one" />
      <div className="landing-orbit landing-orbit-two" />
      <div className="landing-visual-top flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="landing-live-dot" />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Value engine</span>
        </div>
        <span className="font-mono text-[10px] tracking-wider text-slate-500">BM / 01</span>
      </div>

      <div className="landing-signal-wrap">
        <div className="landing-signal-grid" />
        <svg className="landing-signal" viewBox="0 0 520 224" fill="none" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="signalLine" x1="0" y1="0" x2="520" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" stopOpacity=".08" />
              <stop offset=".45" stopColor="#93C5FD" />
              <stop offset="1" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="signalFill" x1="260" y1="20" x2="260" y2="224" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" stopOpacity=".2" />
              <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 177C34 177 38 158 69 158s36 17 67 8 37-42 68-42 35 30 65 18 42-72 74-72 35 38 64 34 37-45 67-45 35 27 46 8v165H0V177Z" fill="url(#signalFill)" />
          <path d="M0 177C34 177 38 158 69 158s36 17 67 8 37-42 68-42 35 30 65 18 42-72 74-72 35 38 64 34 37-45 67-45 35 27 46 8" stroke="url(#signalLine)" strokeWidth="2.4" />
          <circle cx="474" cy="109" r="4" fill="#93C5FD" />
          <circle cx="474" cy="109" r="11" stroke="#60A5FA" strokeOpacity=".35" />
        </svg>
        <div className="landing-axis-labels"><span>MARKET READING</span><span>PRECISION &gt; INTUITION</span></div>
      </div>

      <div className="landing-floating-card landing-card-left">
        <span className="landing-card-icon">↗</span>
        <span><small>Detect</small><strong>mispricings</strong></span>
      </div>
      <div className="landing-floating-card landing-card-right">
        <span className="landing-card-icon landing-card-icon-blue">◎</span>
        <span><small>Compare</small><strong>best lines</strong></span>
      </div>
      <div className="landing-visual-bottom">
        <span>LIVE MARKET DATA</span><span className="landing-bottom-rule" /><span>METHODICAL DECISIONS</span>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <main className="landing-page min-h-screen overflow-hidden">
      <div className="landing-grain" />
      <header className="landing-header relative z-10 mx-auto flex max-w-[1320px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Brand light />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          <a href="#method" className="landing-nav-link">The Method</a>
          <a href="#tools" className="landing-nav-link">Tools</a>
          <a href="#philosophy" className="landing-nav-link">Our Philosophy</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="landing-login hidden sm:inline-flex">Sign In</Link>
          <Link href="/register" className="landing-header-cta">Get Started <ArrowUpRight /></Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:min-h-[650px] lg:grid-cols-[1.02fr_.98fr] lg:gap-4 lg:px-12 lg:pb-28 lg:pt-10">
        <div className="relative z-[1] max-w-[650px]">
          <div className="landing-eyebrow"><span className="landing-eyebrow-mark" />SPORTS ANALYSIS, NO HYPE</div>
          <h1 className="landing-hero-title">The edge<br />isn't <span>guessed.</span><br />It's calculated.</h1>
          <p className="landing-hero-copy">Leave gut feelings on the bench. Find real value in the odds, compare the market, and make decisions backed by numbers.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/register" className="landing-primary-cta">Find your edge <ArrowUpRight /></Link>
            <a href="#method" className="landing-secondary-cta">Explore the method <span>↓</span></a>
          </div>
          <div className="landing-trust-row">
            <div className="landing-trust-icon"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
            <p><strong>Transparent insights.</strong> Real market data, mathematical analysis, and zero empty promises.</p>
          </div>
        </div>
        <div className="relative z-[1] py-4 lg:py-0"><EdgeVisual /></div>
        <div className="landing-hero-index"><span>01</span><span className="landing-index-line" /><span>THE GAME HAS CHANGED</span></div>
      </section>

      <div className="landing-ticker" aria-label="Analyze. Compare. Decide.">
        <div className="landing-ticker-track"><span>ANALYZE WITH DATA</span><i>✳</i><span>COMPARE THE MARKET</span><i>✳</i><span>BET WITH DISCIPLINE</span><i>✳</i><span>ANALYZE WITH DATA</span><i>✳</i><span>COMPARE THE MARKET</span><i>✳</i><span>BET WITH DISCIPLINE</span><i>✳</i></div>
      </div>

      <section id="method" className="landing-section mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="landing-section-heading">
          <div><span className="landing-section-kicker">01 — THE METHOD</span><h2>Less impulse.<br /><span>More information.</span></h2></div>
          <p>A smart decision doesn't start with a prediction. It starts by understanding what the market is saying.</p>
        </div>
        <div className="landing-method-grid">
          <article className="landing-method-card"><span className="landing-method-number">01</span><div className="landing-method-symbol">⌁</div><h3>Find the Value</h3><p>We compare available odds against a no-vig fair reference probability to highlight prices that warrant a closer look.</p><span className="landing-card-arrow"><ArrowUpRight /></span></article>
          <article className="landing-method-card landing-method-featured"><span className="landing-method-number">02</span><div className="landing-method-symbol">⤢</div><h3>Compare Every Line</h3><p>View the best odds per outcome across sportsbooks and see where the market offers the most competitive price.</p><span className="landing-card-arrow"><ArrowUpRight /></span></article>
          <article className="landing-method-card"><span className="landing-method-number">03</span><div className="landing-method-symbol">▤</div><h3>Track Your Process</h3><p>Log paper bets, manage your virtual bankroll, and learn from your decisions with clear metrics.</p><span className="landing-card-arrow"><ArrowUpRight /></span></article>
        </div>
      </section>

      <section id="tools" className="landing-tools-section">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[.95fr_1.05fr] lg:px-12 lg:py-28">
          <div className="landing-tools-art" aria-hidden="true">
            <div className="landing-tools-ring ring-a" /><div className="landing-tools-ring ring-b" />
            <div className="landing-tool-cross cross-a">+</div><div className="landing-tool-cross cross-b">+</div>
            <div className="landing-tool-core"><img src="/logo.png" alt="" /><span>EDGE<br />ENGINE</span></div>
            <div className="landing-tool-tag tag-top"><span className="landing-mini-dot" />FAIR PROBABILITY</div>
            <div className="landing-tool-tag tag-bottom">KELLY <span>→</span> RESPONSIBLE STAKE</div>
          </div>
          <div className="landing-tools-copy">
            <span className="landing-section-kicker">02 — YOUR ANALYTICS HUB</span>
            <h2>Everything you need.<br /><span>Nothing you don't.</span></h2>
            <p>A platform built for those who prefer to understand the game before stepping in. Clear, focused, and data-driven.</p>
            <ul className="landing-tools-list">
              <li><span>↗</span><div><strong>+EV Scanner</strong><small>Identify positive expected value opportunities in live odds.</small></div></li>
              <li><span>⌗</span><div><strong>Betting Calculator</strong><small>Evaluate expected value and recommended stake sizing.</small></div></li>
              <li><span>◷</span><div><strong>Paper Betting</strong><small>Practice and track outcomes without risking real capital.</small></div></li>
            </ul>
            <Link href="/register" className="landing-text-link">Explore BetMetrics <ArrowUpRight /></Link>
          </div>
        </div>
      </section>

      <section id="philosophy" className="landing-principle mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <span className="landing-section-kicker">03 — OUR PHILOSOPHY</span>
        <div className="landing-principle-main"><span className="landing-quote-mark">“</span><h2>The tool doesn't predict the future.<br /><span>It helps you make better decisions.</span></h2></div>
        <div className="landing-principle-foot"><span>BETMETRICS / PRINCIPLE #01</span><p>Expected value is an analytical tool, not a guarantee of profit. Bet responsibly.</p></div>
      </section>

      <section className="landing-final-cta mx-5 mb-16 sm:mx-8 lg:mx-auto lg:mb-24 lg:max-w-[1224px]">
        <div className="landing-final-orb" />
        <div className="relative z-[1] px-6 py-14 text-center sm:px-12 sm:py-16">
          <span className="landing-section-kicker">THE NEXT MOVE IS YOURS</span>
          <h2>Think like an analyst.<br /><span>Play with an edge.</span></h2>
          <p>Start making decisions with more context and less noise.</p>
          <Link href="/register" className="landing-primary-cta">Create Your Account <ArrowUpRight /></Link>
        </div>
      </section>

      <footer className="landing-footer mx-auto flex max-w-[1320px] flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
        <Brand light />
        <p>© 2026 BetMetrics. Responsible analysis, informed decisions.</p>
        <Link href="/login" className="landing-footer-login">Already have an account <ArrowUpRight /></Link>
      </footer>
    </main>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <LandingPage />;

  return (
    <div className="flex items-start gap-4 pb-16 xl:pb-6">
      <SportsSidebar />
      <OddsBoard />
      <BetSlipSidebar />
    </div>
  );
}
