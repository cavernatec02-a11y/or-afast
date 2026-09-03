import React from "react";
import { Scale, Coins } from "lucide-react";
import NumberInput from "@/components/NumberInput";
import { formatMoeda, formatPeso } from "@/lib/pricingEngine";

// Card em destaque: peso total da estrutura, preço do kg do aço (fácil acesso) e custo do aço.
export default function CustoAcoCard({ pesoTotal, precoKg, setPrecoKg, custoAco }) {
  return (
    <div className="rounded-2xl border-2 border-slate-900/10 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 dark:border-primary/20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div>
          <div className="flex items-center gap-2 text-slate-300 text-xs font-medium uppercase tracking-wide mb-1"><Scale size={14} /> Peso Total da Estrutura</div>
          <div className="text-3xl font-bold tabular-nums">{formatPeso(pesoTotal)} <span className="text-lg font-normal text-slate-400">kg</span></div>
        </div>
        <div className="md:border-x md:border-white/15 md:px-4">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-medium uppercase tracking-wide mb-1"><Coins size={14} /> Preço do Aço (R$/kg)</div>
          <NumberInput
            value={precoKg ?? 0}
            onChange={setPrecoKg}
            prefix="R$"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-2xl font-bold text-white w-32 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          <p className="text-xs text-slate-400 mt-1">Atualize com o valor de mercado. O sistema calcula peso × preço.</p>
        </div>
        <div>
          <div className="text-slate-300 text-xs font-medium uppercase tracking-wide mb-1">Custo do Aço</div>
          <div className="text-3xl font-bold tabular-nums text-emerald-400">{formatMoeda(custoAco)}</div>
          <div className="text-xs text-slate-400 mt-1">{formatPeso(pesoTotal)} kg × {formatMoeda(precoKg)}</div>
        </div>
      </div>
    </div>
  );
}