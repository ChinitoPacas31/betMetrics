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
            Quantitative +EV &amp; Kelly Criterion Calculator
          </h1>
          <p className="text-xs text-slate-400">
            Evaluate American or Decimal odds against your true probability and log the position to your virtual Bankroll.
          </p>
        </div>
      </div>

      <EVCalculatorForm />
    </div>
  );
}
