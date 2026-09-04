import React from "react";
import { TrendingUp, AlertTriangle, CheckCircle2, Info, Receipt } from "lucide-react";
import { LUCRO_PRESUMIDO, formatMoeda, formatPercent, statusMargem } from "@/lib/pricingEngine";

export default function FormacaoPreco({
  custoAco, custoAcessorios, montagem, frete, cobrarMontagem, cobrarFrete,
  custoEmpresa, totalCliente, carga, comissaoPct, comissaoValor, impostosValor,
  resultado, margemMinima, margemAdequada, precoMinimo, precoAdequado, onUsarPreco,
}) {
  const status = statusMargem(resultado.margem, margemMinima, margemAdequada);
  const statusCfg = {
    baixo: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: <AlertTriangle size={18} /> },
    medio: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: <Info size={18} /> },
    ok: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: <CheckCircle2 size={18} /> },
  }[status.level];

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 rounded-xl border ${statusCfg.border} ${statusCfg.bg} px-4 py-3`}>
        <span className={statusCfg.text}>{statusCfg.icon}</span>
        <div className="flex-1">
          <div className={`text-sm font-semibold ${statusCfg.text}`}>{status.label}</div>
          <div className="text-xs text-slate-500">Margem real da empresa sobre o preço de venda</div>
        </div>
        <div className={`text-2xl font-bold tabular-nums ${statusCfg.text}`}>{status.pct.toFixed(2)}%</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2 dark:text-slate-100"><TrendingUp size={16} className="text-slate-500" /> Composição de Custos</h3>
          <Line label="Custo do Aço" value={formatMoeda(custoAco)} />
          <Line label="Acessórios / Comerciais" value={formatMoeda(custoAcessorios)} />
          <Line label="Montagem" value={cobrarMontagem ? "Repassada ao cliente" : formatMoeda(montagem)} />
          <Line label="Frete" value={cobrarFrete ? "Repassado ao cliente" : formatMoeda(frete)} />
          <div className="border-t border-slate-200 my-2" />
          <Line label="Custo da Empresa (base da margem)" value={formatMoeda(custoEmpresa)} strong />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2 dark:text-slate-100"><Info size={16} className="text-slate-500" /> Tributos (Lucro Presumido) e Resultado</h3>
          <Line label="PIS (0,65%)" value={formatPercent(LUCRO_PRESUMIDO.pis)} />
          <Line label="COFINS (3,00%)" value={formatPercent(LUCRO_PRESUMIDO.cofins)} />
          <Line label="CSLL (0,72%)" value={formatPercent(LUCRO_PRESUMIDO.csll)} />
          <Line label="IRPJ + Adicional (2,00%)" value={formatPercent(LUCRO_PRESUMIDO.irpj + LUCRO_PRESUMIDO.irpj_adicional)} />
          <Line label="ICMS" value={formatPercent(carga.icms)} />
          <div className="border-t border-slate-200 my-2" />
          <Line label="Carga Tributária Total" value={formatPercent(carga.total)} />
          <Line label={`Comissão (${comissaoPct}%)`} value={formatMoeda(comissaoValor)} />
          <Line label="Impostos sobre a Venda" value={formatMoeda(impostosValor)} />
          <div className="border-t border-slate-200 my-2" />
          <Line label="Lucro Líquido" value={formatMoeda(resultado.lucro)} strong tone={resultado.lucro >= 0 ? "emerald" : "red"} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2 dark:text-slate-100"><Receipt size={16} className="text-slate-500" /> Sugestão de Preço de Venda</h3>
        <p className="text-xs text-slate-500 mb-3">Preço de venda = Custo da empresa ÷ (1 − Margem − Carga Tributária − Comissão). Use como referência e ajuste o valor na barra inferior.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SuggestionCard tone="amber" label={`Preço Mínimo (margem ${margemMinima}%)`} value={formatMoeda(precoMinimo)} onUse={() => onUsarPreco(precoMinimo)} />
          <SuggestionCard tone="emerald" label={`Preço Adequado (margem ${margemAdequada}%)`} value={formatMoeda(precoAdequado)} onUse={() => onUsarPreco(precoAdequado)} />
        </div>
      </div>
    </div>
  );
}

function Line({ label, value, strong, tone }) {
  const toneClass = tone === "emerald" ? "text-emerald-700" : tone === "red" ? "text-red-700" : "text-slate-900";
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`tabular-nums ${strong ? `font-bold ${toneClass}` : "text-slate-700"}`}>{value}</span>
    </div>
  );
}

function SuggestionCard({ tone, label, value, onUse }) {
  const cfg = tone === "amber" ? "border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-50" : "border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-50";
  return (
    <div className={`rounded-lg border ${cfg} p-4 flex items-center justify-between`}>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</div>
        <div className="text-xl font-bold tabular-nums mt-0.5">{value}</div>
      </div>
      <button onClick={onUse} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white border border-current/30 hover:opacity-80">Usar</button>
    </div>
  );
}