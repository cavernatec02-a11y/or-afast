import React, { useState } from "react";
import { Trash2, ChevronDown, ChevronUp, Package, Layers, Boxes } from "lucide-react";
import ComponenteGrid from "@/components/orcamento/ComponenteGrid";
import ComponenteComercialGrid from "@/components/orcamento/ComponenteComercialGrid";
import { TIPOS_PRODUTO, PRODUTO_PRESETS, recalcComponente, calcProdutoTotais, newUid, formatMoeda, formatPeso } from "@/lib/pricingEngine";

// Um produto dentro do orçamento (ex.: porta-palete, estante). Cada um tem suas peças e componentes comerciais.
export default function ProdutoCard({ produto, index, acoOptions, catalogoComercial, precoKg, onChange, onRemove }) {
  const [aberto, setAberto] = useState(true);
  const totais = calcProdutoTotais(produto, precoKg);

  const setTipo = (tipo) => {
    // Carrega o preset só se o produto ainda não tem peças (não sobrescreve trabalho do usuário)
    const componentes = produto.componentes && produto.componentes.length > 0
      ? produto.componentes
      : (PRODUTO_PRESETS[tipo] || []).map((p) => recalcComponente({ uid: newUid(), ...p, custo_aco_id: "", peso_especifico: 0 }));
    onChange({ ...produto, tipo_produto: tipo, componentes });
  };

  const recarregarPreset = () => {
    if (!produto.tipo_produto) return;
    if (!confirm("Recarregar as peças padrão deste produto? As peças atuais serão substituídas.")) return;
    onChange({ ...produto, componentes: (PRODUTO_PRESETS[produto.tipo_produto] || []).map((p) => recalcComponente({ uid: newUid(), ...p, custo_aco_id: "", peso_especifico: 0 })) });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50/70 border-b border-slate-100">
        <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">{index + 1}</div>
        <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tipo de produto</label>
          <select className="input-sm max-w-xs" value={produto.tipo_produto || ""} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Selecione...</option>
            {TIPOS_PRODUTO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nome (opcional)</label>
          <input className="input-sm max-w-[200px]" value={produto.nome || ""} onChange={(e) => onChange({ ...produto, nome: e.target.value })} placeholder="Ex.: Porta-palete A" />
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Peso / Custo aço</div>
          <div className="text-sm font-semibold text-slate-900 tabular-nums">{formatPeso(totais.peso)} kg · {formatMoeda(totais.custoAco)}</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={recarregarPreset} className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1.5 rounded-md hover:bg-slate-100" title="Recarregar peças padrão">Recarregar</button>
          <button onClick={() => setAberto(!aberto)} className="p-2 rounded-md text-slate-500 hover:bg-slate-100">{aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
          <button onClick={onRemove} className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50" title="Remover produto"><Trash2 size={16} /></button>
        </div>
      </div>

      {aberto && (
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Layers size={14} /> Peças estruturais</h4>
            <ComponenteGrid componentes={produto.componentes || []} acoOptions={acoOptions} precoKg={precoKg} onChange={(c) => onChange({ ...produto, componentes: c })} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Boxes size={14} /> Componentes comerciais</h4>
            <ComponenteComercialGrid componentes={produto.componentes_comerciais || []} catalogo={catalogoComercial} onChange={(c) => onChange({ ...produto, componentes_comerciais: c })} />
          </div>
        </div>
      )}
    </div>
  );
}