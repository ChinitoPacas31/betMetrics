import EVCalculatorForm from "@/components/EVCalculatorForm";
import { IconCalculator } from "@/components/Icons";

export default function CalculatorPage() {
  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center gap-3 rounded-lg border border-sb-border bg-sb-panel p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-blue-500/35 bg-sb-blue/15 text-blue-400">
          <IconCalculator className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-white">
            Calculadora Cuantitativa +EV &amp; Criterio de Kelly
          </h1>
          <p className="text-xs text-slate-400">
            Evalúa momios en formato Americano o Decimal contra tu probabilidad real y registra la operación en tu Bankroll virtual.
          </p>
        </div>
      </div>

      <EVCalculatorForm />
    </div>
  );
}
