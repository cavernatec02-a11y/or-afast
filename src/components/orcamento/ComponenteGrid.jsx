import React, { useState } from "react";
import { Trash2, Copy, Plus, ChevronDown, ChevronUp } from "lucide-react";
import NumberInput from "@/components/NumberInput";
import { recalcComponente, recalcComercial, formatMoeda, formatPeso, TIPOS_PRODUTO, PRODUTO_PRESETS, newUid } from "@/lib/pricingEngine";

export default function ComponenteGrid({ componentes, acoOptions, precoKg, onChange }) {
  const update = (i, patch) => {
    const next = componentes.map((c, idx) => (idx === i ? recalcComponente({ ...c, ...patch }) : c));
    onChange(next);
  };
  const addRow = () => onChange([...componentes, recalcComponente({ uid: newUid(), nome: "", quantidade: 1, corte: 0, comprimento: 0, custo_aco_id: "", peso_especifico: 0 })]);
  const removeRow = (i) => onChange(componentes.filter((_, idx) => idx !== i));
  const duplicate = (i) => {
    const copy = { ...componentes[i], uid: newUid(), nome: `${componentes[i].nome || ""} (cópia)` };
    const next = [...componentes];
    next.splice(i + 1, 0, copy);
    onChange(next);
  };
  const onChapaChange = (i, acoId) => {
    const aco = acoOptions.find((a) => a.id === acoId);
    update(i, { custo_aco_id: acoId, peso_especifico: aco?.peso_especifico || 0 });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <th className="text-left font-semibold px-3 py-3 min-w-[170px]">Descrição</th>
            <th className="text-right font-semibold px-3 py-3 w-20">Qtde</th>
            <th className="text-right font-semibold px-3 py-3 w-24">Corte (m)</th>
            <th className="text-right font-semibold px-3 py-3 w-28">Compr. (m)</th>
            <th className="text-left font-semibold px-3 py-3 min-w-[190px]">Chapa / Aço</th>
            <th className="text-right font-semibold px-3 py-3 w-24">Peso Unit.</th>
            <th className="text-right font-semibold px-3 py-3 w-24">Peso Total</th>
            <th className="text-right font-semibold px-3 py-3 w-32">Custo (R$)</th>
            <th className="w-16 px-2"></th>
          </tr>
        </thead>
        <tbody>
          {componentes.map((c, i) => {
            const custo = (c.peso_total || 0) * (precoKg || 0);
            return (
              <tr key={c.uid || i} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-3 py-2"><input className="input-sm" value={c.nome || ""} onChange={(e) => update(i, { nome: e.target.value })} placeholder="Ex.: Coluna 90 # 14" /></td>
                <td className="px-3 py-2"><NumberInput value={c.quantidade ?? 0} onChange={(v) => update(i, { quantidade: v })} className="input-sm text-right" /></td>
                <td className="px-3 py-2"><NumberInput value={c.corte ?? 0} onChange={(v) => update(i, { corte: v })} className="input-sm text-right" /></td>
                <td className="px-3 py-2"><NumberInput value={c.comprimento ?? 0} onChange={(v) => update(i, { comprimento: v })} className="input-sm text-right" /></td>
                <td className="px-3 py-2">
                  <select className="input-sm" value={c.custo_aco_id || ""} onChange={(e) => onChapaChange(i, e.target.value)}>
                    <option value="">—</option>
                    {acoOptions.map((a) => <option key={a.id} value={a.id}>{a.codigo} · {a.tipo_aco}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600">{formatPeso(c.peso_unit)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-800">{formatPeso(c.peso_total)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-900">{formatMoeda(custo)}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => duplicate(i)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="Duplicar"><Copy size={15} /></button>
                    <button onClick={() => removeRow(i)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50" title="Remover"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
          {componentes.length === 0 && (
            <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400 text-sm">Nenhuma peça. Selecione um tipo de produto acima para pré-carregar as linhas.</td></tr>
          )}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-slate-100">
        <button onClick={addRow} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"><Plus size={16} /> Adicionar peça</button>
      </div>
    </div>
  );
}