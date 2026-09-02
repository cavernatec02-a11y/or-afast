import React from "react";
import { Plus, Trash2 } from "lucide-react";
import NumberInput from "@/components/NumberInput";
import { recalcComercial, formatMoeda, newUid } from "@/lib/pricingEngine";

export default function ComponenteComercialGrid({ componentes, catalogo, onChange }) {
  const update = (i, patch) => {
    const next = componentes.map((c, idx) => (idx === i ? recalcComercial({ ...c, ...patch }) : c));
    onChange(next);
  };
  const addRow = () => onChange([...componentes, recalcComercial({ uid: newUid(), descricao: "", unidade: "un", quantidade: 0, custo_unitario: 0 })]);
  const removeRow = (i) => onChange(componentes.filter((_, idx) => idx !== i));

  const onPick = (i, desc) => {
    const item = catalogo.find((c) => c.descricao === desc);
    update(i, { descricao: desc, unidade: item?.unidade || "un", custo_unitario: item?.custo_unitario || 0 });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <th className="text-left font-semibold px-3 py-3 min-w-[260px]">Componente</th>
            <th className="text-left font-semibold px-3 py-3 w-20">Unidade</th>
            <th className="text-right font-semibold px-3 py-3 w-24">Qtde</th>
            <th className="text-right font-semibold px-3 py-3 w-32">Custo Unit. (R$)</th>
            <th className="text-right font-semibold px-3 py-3 w-32">Total (R$)</th>
            <th className="w-12 px-2"></th>
          </tr>
        </thead>
        <tbody>
          {componentes.map((c, i) => (
            <tr key={c.uid || i} className="border-t border-slate-100 hover:bg-slate-50/50">
              <td className="px-3 py-2"><input className="input-sm" list="catalogo-comercial" value={c.descricao || ""} onChange={(e) => onPick(i, e.target.value)} placeholder={'Ex.: Paraf. Ø 5/16"x 1"'} /></td>
              <td className="px-3 py-2"><input className="input-sm" value={c.unidade || ""} onChange={(e) => update(i, { unidade: e.target.value })} /></td>
              <td className="px-3 py-2"><NumberInput value={c.quantidade ?? 0} onChange={(v) => update(i, { quantidade: v })} className="input-sm text-right" /></td>
              <td className="px-3 py-2"><NumberInput value={c.custo_unitario ?? 0} onChange={(v) => update(i, { custo_unitario: v })} className="input-sm text-right" /></td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-900">{formatMoeda(c.total)}</td>
              <td className="px-2 py-2 text-right"><button onClick={() => removeRow(i)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></td>
            </tr>
          ))}
          {componentes.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400 text-sm">Nenhum componente comercial.</td></tr>}
        </tbody>
      </table>
      <datalist id="catalogo-comercial">{catalogo.map((c, i) => <option key={i} value={c.descricao} />)}</datalist>
      <div className="px-3 py-2 border-t border-slate-100">
        <button onClick={addRow} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"><Plus size={16} /> Adicionar componente</button>
      </div>
    </div>
  );
}