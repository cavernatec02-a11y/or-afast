import React from "react";
import { Search } from "lucide-react";
import { STATUS_LABELS, TIPOS_ESTRUTURA, atalhoPeriodo } from "@/lib/relatorioUtils";

const ATALHOS = [["todos", "Tudo"], ["hoje", "Hoje"], ["7d", "Últimos 7 dias"], ["mes", "Este mês"]];

export default function FiltrosBar({ filtros, setFiltros }) {
  const set = (k, v) => setFiltros((f) => ({ ...f, [k]: v }));
  return (
    <div className="no-print bg-white rounded-2xl border border-slate-200 p-4 mb-6 space-y-3 dark:bg-slate-900 dark:border-slate-700">
      <div className="flex flex-wrap gap-2">
        {ATALHOS.map(([k, l]) => (
          <button key={k} onClick={() => setFiltros((f) => ({ ...f, ...atalhoPeriodo(k), atalho: k }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filtros.atalho === k ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>{l}</button>
        ))}
        <span className="text-xs text-slate-400 self-center ml-1">ou personalizado:</span>
        <input type="date" className="input-sm !w-auto" value={filtros.inicio} onChange={(e) => setFiltros((f) => ({ ...f, inicio: e.target.value, atalho: "custom" }))} />
        <span className="text-xs text-slate-400 self-center">até</span>
        <input type="date" className="input-sm !w-auto" value={filtros.fim} onChange={(e) => setFiltros((f) => ({ ...f, fim: e.target.value, atalho: "custom" }))} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select className="input-sm" value={filtros.status} onChange={(e) => set("status", e.target.value)}>
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select className="input-sm" value={filtros.tipo} onChange={(e) => set("tipo", e.target.value)}>
          <option value="todos">Todos os tipos de estrutura</option>
          {TIPOS_ESTRUTURA.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-sm !pl-8" placeholder="Cliente ou nº da proposta" value={filtros.busca} onChange={(e) => set("busca", e.target.value)} />
        </div>
      </div>
    </div>
  );
}