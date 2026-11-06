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
    <Link href="/" aria-label="BetMetrics, inicio" className="inline-flex items-center gap-2.5">
      <img src="/logo.png" alt="" className="h-8 w-auto object-contain" />
      <img src="/letras.png" alt="BetMetrics" className={`h-[19px] w-auto object-contain ${light ? "brightness-0 invert" : ""}`} />
    </Link>
  );
}

function EdgeVisual() {
  return (
    <div className="landing-visual relative mx-auto w-full max-w-[570px]" aria-label="Ilustración del análisis de mercados de BetMetrics">
      <div className="landing-orbit landing-orbit-one" />
      <div className="landing-orbit landing-orbit-two" />
      <div className="landing-visual-top flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="landing-live-dot" />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Motor de valor</span>
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
        <div className="landing-axis-labels"><span>LECTURA DEL MERCADO</span><span>PRECISIÓN &gt; INTUICIÓN</span></div>
      </div>

      <div className="landing-floating-card landing-card-left">
        <span className="landing-card-icon">↗</span>
        <span><small>Detecta</small><strong>desajustes</strong></span>
      </div>
      <div className="landing-floating-card landing-card-right">
        <span className="landing-card-icon landing-card-icon-blue">◎</span>
        <span><small>Compara</small><strong>mejores líneas</strong></span>
      </div>
      <div className="landing-visual-bottom">
        <span>DATOS DE MERCADO EN VIVO</span><span className="landing-bottom-rule" /><span>DECISIONES CON MÉTODO</span>
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
        <nav className="hidden items-center gap-8 md:flex" aria-label="Navegación principal">
          <a href="#metodo" className="landing-nav-link">El método</a>
          <a href="#herramientas" className="landing-nav-link">Herramientas</a>
          <a href="#criterio" className="landing-nav-link">Nuestro criterio</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="landing-login hidden sm:inline-flex">Iniciar sesión</Link>
          <Link href="/register" className="landing-header-cta">Crear cuenta <ArrowUpRight /></Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:min-h-[650px] lg:grid-cols-[1.02fr_.98fr] lg:gap-4 lg:px-12 lg:pb-28 lg:pt-10">
        <div className="relative z-[1] max-w-[650px]">
          <div className="landing-eyebrow"><span className="landing-eyebrow-mark" />ANÁLISIS DEPORTIVO, SIN HUMO</div>
          <h1 className="landing-hero-title">La ventaja<br />no se <span>adivina.</span><br />Se calcula.</h1>
          <p className="landing-hero-copy">Deja la corazonada en la banca. Encuentra valor real en las cuotas, compara el mercado y toma decisiones respaldadas por números.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/register" className="landing-primary-cta">Encuentra tu ventaja <ArrowUpRight /></Link>
            <a href="#metodo" className="landing-secondary-cta">Conoce el método <span>↓</span></a>
          </div>
          <div className="landing-trust-row">
            <div className="landing-trust-icon"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
            <p><strong>Información transparente.</strong> Datos reales de mercado, análisis matemático y cero promesas mágicas.</p>
          </div>
        </div>
        <div className="relative z-[1] py-4 lg:py-0"><EdgeVisual /></div>
        <div className="landing-hero-index"><span>01</span><span className="landing-index-line" /><span>EL JUEGO CAMBIÓ</span></div>
      </section>

      <div className="landing-ticker" aria-label="Analiza. Compara. Decide.">
        <div className="landing-ticker-track"><span>ANALIZA CON DATOS</span><i>✳</i><span>COMPARA EL MERCADO</span><i>✳</i><span>JUEGA CON CRITERIO</span><i>✳</i><span>ANALIZA CON DATOS</span><i>✳</i><span>COMPARA EL MERCADO</span><i>✳</i><span>JUEGA CON CRITERIO</span><i>✳</i></div>
      </div>

      <section id="metodo" className="landing-section mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="landing-section-heading">
          <div><span className="landing-section-kicker">01 — EL MÉTODO</span><h2>Menos impulso.<br /><span>Más información.</span></h2></div>
          <p>Una buena decisión no empieza con un pronóstico. Empieza entendiendo lo que el mercado está diciendo.</p>
        </div>
        <div className="landing-method-grid">
          <article className="landing-method-card"><span className="landing-method-number">01</span><div className="landing-method-symbol">⌁</div><h3>Encuentra el valor</h3><p>Comparamos las cuotas disponibles con una probabilidad de referencia sin margen para señalar precios que merecen una segunda mirada.</p><span className="landing-card-arrow"><ArrowUpRight /></span></article>
          <article className="landing-method-card landing-method-featured"><span className="landing-method-number">02</span><div className="landing-method-symbol">⤢</div><h3>Compara cada línea</h3><p>Ve las mejores cuotas por resultado entre distintas casas y entiende dónde el mercado ofrece un precio más competitivo.</p><span className="landing-card-arrow"><ArrowUpRight /></span></article>
          <article className="landing-method-card"><span className="landing-method-number">03</span><div className="landing-method-symbol">▤</div><h3>Mide tu proceso</h3><p>Registra apuestas de práctica, administra tu bankroll virtual y aprende de tus decisiones con métricas claras.</p><span className="landing-card-arrow"><ArrowUpRight /></span></article>
        </div>
      </section>

      <section id="herramientas" className="landing-tools-section">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[.95fr_1.05fr] lg:px-12 lg:py-28">
          <div className="landing-tools-art" aria-hidden="true">
            <div className="landing-tools-ring ring-a" /><div className="landing-tools-ring ring-b" />
            <div className="landing-tool-cross cross-a">+</div><div className="landing-tool-cross cross-b">+</div>
            <div className="landing-tool-core"><img src="/logo.png" alt="" /><span>EDGE<br />ENGINE</span></div>
            <div className="landing-tool-tag tag-top"><span className="landing-mini-dot" />PROBABILIDAD JUSTA</div>
            <div className="landing-tool-tag tag-bottom">KELLY <span>→</span> STAKE RESPONSABLE</div>
          </div>
          <div className="landing-tools-copy">
            <span className="landing-section-kicker">02 — TU CENTRO DE ANÁLISIS</span>
            <h2>Todo lo que necesitas.<br /><span>Nada que estorbe.</span></h2>
            <p>Una plataforma hecha para quienes prefieren entender el juego antes de entrar. Clara, directa y enfocada en lo que importa.</p>
            <ul className="landing-tools-list">
              <li><span>↗</span><div><strong>Escáner +EV</strong><small>Identifica posibles ventajas en cuotas en vivo.</small></div></li>
              <li><span>⌗</span><div><strong>Calculadora de apuestas</strong><small>Evalúa valor esperado y tamaño de stake.</small></div></li>
              <li><span>◷</span><div><strong>Paper betting</strong><small>Practica y registra resultados sin arriesgar dinero.</small></div></li>
            </ul>
            <Link href="/register" className="landing-text-link">Explora BetMetrics <ArrowUpRight /></Link>
          </div>
        </div>
      </section>

      <section id="criterio" className="landing-principle mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <span className="landing-section-kicker">03 — NUESTRO CRITERIO</span>
        <div className="landing-principle-main"><span className="landing-quote-mark">“</span><h2>La herramienta no predice el futuro.<br /><span>Te ayuda a decidir mejor.</span></h2></div>
        <div className="landing-principle-foot"><span>BETMETRICS / PRINCIPIO Nº 01</span><p>El valor esperado es una herramienta de análisis, no una garantía de ganancias. Apuesta con responsabilidad.</p></div>
      </section>

      <section className="landing-final-cta mx-5 mb-16 sm:mx-8 lg:mx-auto lg:mb-24 lg:max-w-[1224px]">
        <div className="landing-final-orb" />
        <div className="relative z-[1] px-6 py-14 text-center sm:px-12 sm:py-16">
          <span className="landing-section-kicker">EL SIGUIENTE MOVIMIENTO ES TUYO</span>
          <h2>Piensa como analista.<br /><span>Juega con ventaja.</span></h2>
          <p>Empieza a tomar decisiones con más contexto y menos ruido.</p>
          <Link href="/register" className="landing-primary-cta">Crear mi cuenta <ArrowUpRight /></Link>
        </div>
      </section>

      <footer className="landing-footer mx-auto flex max-w-[1320px] flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
        <Brand light />
        <p>© 2026 BetMetrics. Análisis responsable, decisiones informadas.</p>
        <Link href="/login" className="landing-footer-login">Ya tengo cuenta <ArrowUpRight /></Link>
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
