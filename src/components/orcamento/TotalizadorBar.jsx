import React from "react";
import { formatMoeda, formatPeso } from "@/lib/pricingEngine";

export default function TotalizadorBar({ totais, margem, setMargem, icms, valorFinal, onSave, saving }) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur-md shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.12)]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Stat label="Custo Total do Aço" value={formatMoeda(totais.custo_total_aco)} />
        <Stat label="Peso Total do Aço" value={`${formatPeso(totais.peso_total_aco)} kg`} />
        <Stat label="Custo Acessórios" value={formatMoeda(totais.custo_acessorios)} />
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Margem %</span>
          <input type="number" step="0.1" value={margem} onChange={(e) => setMargem(Number(e.target.value))} className="input-sm w-20 text-right" />
        </label>
        <Stat label="ICMS" value={`${(icms * 100).toFixed(0)}%`} />
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Valor Final Proposto</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{formatMoeda(valorFinal)}</div>
          </div>
          <button onClick={onSave} disabled={saving} className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition">
            {saving ? "Salvando..." : "Salvar orçamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-base font-semibold text-slate-800 tabular-nums">{value}</div>
    </div>
  );
}