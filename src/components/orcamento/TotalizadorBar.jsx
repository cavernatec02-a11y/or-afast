import React from "react";
import { FileDown, Save, Sparkles, FileSpreadsheet } from "lucide-react";
import NumberInput from "@/components/NumberInput";
import { formatMoeda, formatPeso, statusMargem } from "@/lib/pricingEngine";

export default function TotalizadorBar({
  pesoTotal, custoEmpresa, valorVenda, setValorVenda, totalCliente,
  resultado, margemMinima, margemAdequada, precoAdequado, onSugerir, onSave, onPDF, onExcel, saving,
}) {
  const status = statusMargem(resultado.margem, margemMinima, margemAdequada);
  const badge = {
    baixo: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    medio: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  }[status.level];

  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.15)] dark:border-slate-700 dark:bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Stat label="Peso Total" value={`${formatPeso(pesoTotal)} kg`} highlight />
        <Stat label="Custo da Empresa" value={formatMoeda(custoEmpresa)} />
        <Stat label="Total do Cliente" value={formatMoeda(totalCliente)} />

        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide dark:text-slate-400">Valor de Venda</span>
          <NumberInput value={valorVenda ?? 0} onChange={setValorVenda} prefix="R$" className="input-sm w-36 text-right font-bold text-slate-900 dark:text-slate-100" />
        </label>

        {onSugerir && (
          <button onClick={onSugerir} title={`Sugerir preço com margem ${margemAdequada}%`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition dark:border-primary/50">
            <Sparkles size={14} /> Sugerir
          </button>
        )}

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${badge}`}>
          <span className="text-xs font-medium uppercase tracking-wide opacity-80">Margem</span>
          <span className="text-lg font-bold tabular-nums">{status.pct.toFixed(2)}%</span>
        </div>

        <Stat label="Lucro Líquido" value={formatMoeda(resultado.lucro)} tone={resultado.lucro >= 0 ? "emerald" : "red"} />

        <div className="ml-auto flex items-center gap-2">
          <button onClick={onExcel} disabled={!valorVenda} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-300 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-40 transition dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/30">
            <FileSpreadsheet size={18} /> Excel
          </button>
          <button onClick={onPDF} disabled={!valorVenda} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 transition dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/50">
            <FileDown size={18} /> Gerar PDF
          </button>
          <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition">
            <Save size={18} /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone, highlight }) {
  const toneClass = tone === "emerald" ? "text-emerald-700 dark:text-emerald-400" : tone === "red" ? "text-red-700 dark:text-red-400" : "text-slate-700 dark:text-slate-200";
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide dark:text-slate-400">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${toneClass} ${highlight ? "text-slate-900 dark:text-slate-100" : ""}`}>{value}</div>
    </div>
  );
}