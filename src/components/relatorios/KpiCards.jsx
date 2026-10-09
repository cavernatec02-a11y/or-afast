import React from "react";
import { TrendingUp, Target, Receipt, PieChart } from "lucide-react";
import { formatMoeda } from "@/lib/pricingEngine";

export default function KpiCards({ k, total }) {
  const base = k.estrutura + k.servicos;
  const pEst = base ? (k.estrutura / base) * 100 : 0;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card icon={<TrendingUp size={18} />} label="Volume total cotado" value={formatMoeda(k.volume)} sub={`${total} propostas no período`} />
      <Card icon={<Target size={18} />} label="Taxa de conversão" value={`${k.conversao.toFixed(1)}%`}
        sub={`Aprov. ${k.st.aprovado} · Aberto ${k.st.rascunho} · Negoc. ${k.st.enviado} · Recus. ${k.st.recusado}`} />
      <Card icon={<Receipt size={18} />} label="Ticket médio" value={formatMoeda(k.ticket)} sub="Média por orçamento gerado" />
      <Card icon={<PieChart size={18} />} label="Estrutura vs. Serviços" value={`${pEst.toFixed(0)}% / ${(100 - pEst).toFixed(0)}%`}
        sub={
          <div className="mt-2">
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden dark:bg-slate-700"><div className="h-full bg-primary" style={{ width: `${pEst}%` }} /></div>
            <div className="flex justify-between mt-1"><span>Estrutura {formatMoeda(k.estrutura)}</span><span>Serviços {formatMoeda(k.servicos)}</span></div>
          </div>
        } />
    </div>
  );
}

function Card({ icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-center gap-2 text-primary mb-2">{icon}<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span></div>
      <div className="text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-100">{value}</div>
      <div className="text-[11px] text-slate-500 mt-1">{sub}</div>
    </div>
  );
}