import React from "react";
import { Truck, Wrench, UserCheck, Target } from "lucide-react";
import { formatMoeda } from "@/lib/pricingEngine";

export default function CustosAdicionais({
  montagem, setMontagem, cobrarMontagem, setCobrarMontagem,
  frete, setFrete, cobrarFrete, setCobrarFrete,
  comissao, setComissao,
  margemMinima, setMargemMinima,
  margemAdequada, setMargemAdequada,
  comissaoValor,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CostCard icon={<Wrench size={16} />} label="Montagem (R$)" value={montagem} onChange={setMontagem} step={0.01} prefix="R$"
        cobrar={cobrarMontagem} setCobrar={setCobrarMontagem} cobrarLabel="Cobrar do cliente" />
      <CostCard icon={<Truck size={16} />} label="Frete (R$)" value={frete} onChange={setFrete} step={0.01} prefix="R$"
        cobrar={cobrarFrete} setCobrar={setCobrarFrete} cobrarLabel="Cobrar do cliente" />
      <SimpleCard icon={<UserCheck size={16} />} label="Comissão Vendedor (%)" value={comissao} onChange={setComissao} step={0.1} suffix="%" hint={formatMoeda(comissaoValor)} />
      <SimpleCard icon={<Target size={16} />} label="Margem Mínima (%)" value={margemMinima} onChange={setMargemMinima} step={1} suffix="%" tone="amber" />
      <SimpleCard icon={<Target size={16} />} label="Margem Adequada (%)" value={margemAdequada} onChange={setMargemAdequada} step={1} suffix="%" tone="emerald" />
    </div>
  );
}

function CostCard({ icon, label, value, onChange, step, prefix, cobrar, setCobrar, cobrarLabel }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-slate-500">{icon}</span>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-slate-400">{prefix}</span>}
        <input type="number" step={step || 1} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} className="input-sm text-right font-semibold text-slate-900" />
      </div>
      <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none">
        <input type="checkbox" checked={!!cobrar} onChange={(e) => setCobrar(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/30" />
        <span className="text-xs font-medium text-slate-600">{cobrarLabel}</span>
      </label>
    </div>
  );
}

function SimpleCard({ icon, label, value, onChange, step, prefix, suffix, hint, tone }) {
  const toneClass = tone === "amber" ? "text-amber-600" : tone === "emerald" ? "text-emerald-600" : "text-slate-500";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={toneClass}>{icon}</span>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-slate-400">{prefix}</span>}
        <input type="number" step={step || 1} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} className="input-sm text-right font-semibold text-slate-900" />
        {suffix && <span className="text-sm text-slate-400">{suffix}</span>}
      </div>
      {hint && <div className="text-xs text-slate-400 mt-1 text-right tabular-nums">{hint}</div>}
    </div>
  );
}