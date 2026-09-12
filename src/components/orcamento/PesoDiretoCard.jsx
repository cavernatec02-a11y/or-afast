import React from "react";
import { Scale } from "lucide-react";
import NumberInput from "@/components/NumberInput";
import { formatMoeda, formatPeso } from "@/lib/pricingEngine";

// Modo de cálculo alternativo: o peso vem automaticamente das peças (Por Componentes),
// e o usuário edita o preço por kg para definir o valor de venda.
export default function PesoDiretoCard({ pesoDireto, setPesoDireto, precoKg, setPrecoKg, custoAco }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Scale size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Cálculo por Peso Direto</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Peso das peças selecionadas × preço por kg — edite o preço para definir o valor</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block dark:text-slate-400">Peso total (kg)</label>
          <NumberInput value={pesoDireto} onChange={setPesoDireto} suffix=" kg" className="input text-right text-lg font-bold text-slate-900 dark:text-slate-100" placeholder="0" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block dark:text-slate-400">Preço por kg (R$) — editável</label>
          <NumberInput value={precoKg} onChange={setPrecoKg} prefix="R$" className="input text-right text-lg font-bold text-slate-900 dark:text-slate-100" placeholder="0" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block dark:text-slate-400">Custo do aço</label>
          <div className="rounded-lg bg-primary/10 px-4 py-2.5 text-right h-[42px] flex items-center justify-end">
            <span className="text-lg font-bold tabular-nums text-primary">{formatMoeda(custoAco)}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        {formatPeso(pesoDireto)} kg × {formatMoeda(precoKg)}/kg = <span className="font-semibold text-slate-700 dark:text-slate-300">{formatMoeda(custoAco)}</span>
      </p>
    </div>
  );
}