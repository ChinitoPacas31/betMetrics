import EVCalculatorForm from "@/components/EVCalculatorForm";

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
          Paper Betting Simulator
        </span>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Calculadora Manual de Valor Esperado (+EV)
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Simula cualquier escenario de apuesta enviando los datos al endpoint
          validado <code>POST /api/v1/calculations/ev</code>.
        </p>
      </div>

      <EVCalculatorForm />
    </div>
  );
}

