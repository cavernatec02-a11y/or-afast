import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { formatMoeda } from "@/lib/pricingEngine";
import { acoStore } from "@/lib/localStore";

export default function TabelaAco() {
  const [lista, setLista] = useState([]);
  const [editando, setEditando] = useState(null);
  const VAZIO = { codigo: "", aco_bitola: "", tipo_aco: "SAE 1008/1010", espessura_mm: 0, peso_especifico: 0, preco_kg: 0 };

  const carregar = () => setLista(acoStore.list());
  useEffect(() => { carregar(); }, []);

  const salvar = (item) => {
    if (!item.codigo) return toast.error("Informe o código.");
    if (item.id) {
      acoStore.update(item.id, item);
      toast.success("Atualizado!");
    } else {
      acoStore.create(item);
      toast.success("Adicionado!");
    }
    setEditando(null);
    carregar();
  };

  const remover = (id) => {
    if (!confirm("Excluir este item?")) return;
    acoStore.delete(id);
    carregar();
    toast.success("Excluído.");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-end gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tabela de Custo de Aço</h1>
            <p className="text-sm text-slate-500">Bitolas, tipos, peso específico e preço por kg — salvo localmente</p>
          </div>
          <button onClick={() => setEditando(VAZIO)} className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
            <Plus size={18} /> Novo item
          </button>
        </div>

        {editando && <AcoForm item={editando} onCancel={() => setEditando(null)} onSave={salvar} />}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-3 py-3">Código</th>
                <th className="text-left font-semibold px-3 py-3">Bitola</th>
                <th className="text-left font-semibold px-3 py-3">Tipo de Aço</th>
                <th className="text-right font-semibold px-3 py-3">Espessura (mm)</th>
                <th className="text-right font-semibold px-3 py-3">Peso Esp. (kg/m)</th>
                <th className="text-right font-semibold px-3 py-3">Preço/kg</th>
                <th className="w-20 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 font-medium text-slate-900">{a.codigo}</td>
                  <td className="px-3 py-2.5 text-slate-600">{a.aco_bitola}</td>
                  <td className="px-3 py-2.5 text-slate-600">{a.tipo_aco}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{a.espessura_mm}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{a.peso_especifico}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{formatMoeda(a.preco_kg)}</td>
                  <td className="px-2 py-2.5 text-right">
                    <button onClick={() => setEditando(a)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil size={15} /></button>
                    <button onClick={() => remover(a.id)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {lista.length === 0 && <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-400">Tabela vazia. Adicione o primeiro item.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function AcoForm({ item, onCancel, onSave }) {
  const [f, setF] = useState(item);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="mb-5 bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 mb-4">{item.id ? "Editar item" : "Novo item"}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <L label="Código"><input className="input-sm" value={f.codigo} onChange={set("codigo")} placeholder="# 14 (2,00)" /></L>
        <L label="Bitola"><input className="input-sm" value={f.aco_bitola} onChange={set("aco_bitola")} placeholder="# 14" /></L>
        <L label="Tipo de Aço"><input className="input-sm" value={f.tipo_aco} onChange={set("tipo_aco")} /></L>
        <L label="Espessura (mm)"><input type="number" step="0.01" className="input-sm text-right" value={f.espessura_mm} onChange={(e) => setF({ ...f, espessura_mm: Number(e.target.value) })} /></L>
        <L label="Peso Esp. (kg/m)"><input type="number" step="0.001" className="input-sm text-right" value={f.peso_especifico} onChange={(e) => setF({ ...f, peso_especifico: Number(e.target.value) })} /></L>
        <L label="Preço/kg (R$)"><input type="number" step="0.01" className="input-sm text-right" value={f.preco_kg} onChange={(e) => setF({ ...f, preco_kg: Number(e.target.value) })} /></L>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onSave(f)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">Salvar</button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-100">Cancelar</button>
      </div>
    </div>
  );
}
function L({ label, children }) {
  return <label className="flex flex-col gap-1"><span className="text-xs font-medium text-slate-500 uppercase">{label}</span>{children}</label>;
}