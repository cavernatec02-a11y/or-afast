import React, { useState } from "react";
import { Calculator } from "lucide-react";
import NumberInput from "@/components/NumberInput";
import { formatMoeda, formatPeso } from "@/lib/pricingEngine";

// Calculadora rápida: Peso (kg) × Preço por kg (R$) = Total (R$)
export default function CalculadoraKg() {
  const [peso, setPeso] = useState(0);
  const [precoKg, setPrecoKg] = useState(0);
  const total = (Number(peso) || 0) * (Number(precoKg) || 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Calculator size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Calculadora por Kg</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Peso × Preço por kg = Total</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block dark:text-slate-400">Peso (kg)</label>
          <NumberInput value={peso} onChange={setPeso} suffix=" kg" className="input-sm text-right font-semibold text-slate-900 dark:text-slate-100" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block dark:text-slate-400">Preço por kg (R$)</label>
          <NumberInput value={precoKg} onChange={setPrecoKg} prefix="R$" className="input-sm text-right font-semibold text-slate-900 dark:text-slate-100" />
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3 flex items-center justify-between dark:bg-slate-800/50">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {formatPeso(peso)} kg × {formatMoeda(precoKg)}
        </span>
        <span className="text-xl font-bold tabular-nums text-primary">{formatMoeda(total)}</span>
      </div>
    </div>
  );
}