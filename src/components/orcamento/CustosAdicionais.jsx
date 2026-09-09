import React from "react";
import { Truck, Wrench, UserCheck, Target, Receipt } from "lucide-react";
import NumberInput from "@/components/NumberInput";
import { formatMoeda } from "@/lib/pricingEngine";

export default function CustosAdicionais({
  montagem, setMontagem, cobrarMontagem, setCobrarMontagem,
  frete, setFrete, cobrarFrete, setCobrarFrete,
  comissao, setComissao,
  impostos, setImpostos,
  margemMinima, setMargemMinima,
  margemAdequada, setMargemAdequada,
  comissaoValor,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CostCard icon={<Wrench size={16} />} label="Montagem (R$)" value={montagem} onChange={setMontagem}
        cobrar={cobrarMontagem} setCobrar={setCobrarMontagem} cobrarLabel="Cobrar do cliente" />
      <CostCard icon={<Truck size={16} />} label="Frete (R$)" value={frete} onChange={setFrete}
        cobrar={cobrarFrete} setCobrar={setCobrarFrete} cobrarLabel="Cobrar do cliente" />
      <SimpleCard icon={<Receipt size={16} />} label="Impostos (%)" value={impostos} onChange={setImpostos} suffix="%" hint="Editável — PIS, COFINS, CSLL, IRPJ, ICMS" />
      <SimpleCard icon={<UserCheck size={16} />} label="Comissão Vendedor (%)" value={comissao} onChange={setComissao} suffix="%" hint={formatMoeda(comissaoValor)} />
      <SimpleCard icon={<Target size={16} />} label="Margem Mínima (%)" value={margemMinima} onChange={setMargemMinima} suffix="%" tone="amber" />
      <SimpleCard icon={<Target size={16} />} label="Margem Adequada (%)" value={margemAdequada} onChange={setMargemAdequada} suffix="%" tone="emerald" />
    </div>
  );
}

function CostCard({ icon, label, value, onChange, cobrar, setCobrar, cobrarLabel }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-1.5 mb-2"><span className="text-slate-500">{icon}</span><span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span></div>
      <NumberInput value={value ?? 0} onChange={onChange} prefix="R$" className="input-sm text-right font-semibold text-slate-900 dark:text-slate-100" />
      <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none">
        <input type="checkbox" checked={!!cobrar} onChange={(e) => setCobrar(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-800" />
        <span className="text-xs font-medium text-slate-600">{cobrarLabel}</span>
      </label>
    </div>
  );
}

function SimpleCard({ icon, label, value, onChange, suffix, hint, tone }) {
  const toneClass = tone === "amber" ? "text-amber-600" : tone === "emerald" ? "text-emerald-600" : "text-slate-500";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-1.5 mb-2"><span className={toneClass}>{icon}</span><span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span></div>
      <NumberInput value={value ?? 0} onChange={onChange} suffix={suffix} className="input-sm text-right font-semibold text-slate-900 dark:text-slate-100" />
      {hint && <div className="text-xs text-slate-400 mt-1 text-right tabular-nums">{hint}</div>}
    </div>
  );
}