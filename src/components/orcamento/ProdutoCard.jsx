import React, { useState } from "react";
import { Trash2, ChevronDown, ChevronUp, Layers, Boxes, Bookmark } from "lucide-react";
import { toast } from "react-hot-toast";
import ComponenteGrid from "@/components/orcamento/ComponenteGrid";
import ComponenteComercialGrid from "@/components/orcamento/ComponenteComercialGrid";
import { TIPOS_PRODUTO, PRODUTO_PRESETS, DESCRICOES_PRODUTO, recalcComponente, calcProdutoTotais, newUid, formatMoeda, formatPeso } from "@/lib/pricingEngine";

// Um produto dentro do orçamento. As peças vivem em arrays flat no parent, filtradas por produto_id.
export default function ProdutoCard({ produto, componentes, comerciais, acoOptions, catalogoComercial, precoKg, onChangeMeta, onChangeComponentes, onChangeComerciais, onRemove, onSaveTemplate }) {
  const [aberto, setAberto] = useState(true);
  const totais = calcProdutoTotais(produto.uid, componentes, comerciais, precoKg);

  const defaultAco = () => acoOptions.find((a) => a.codigo === "# 14 (2,00)") || acoOptions[0];
  const setTipo = (tipo) => {
    // Sempre preenche a descrição técnica pré-definida do tipo selecionado
    const descricao = DESCRICOES_PRODUTO[tipo] || produto.descricao || "";
    // Se já existem peças, confirma antes de substituir (descrição deve bater com as quantidades)
    if (componentes.length > 0 && !confirm("Trocar o tipo de produto substituirá as peças atuais pelas peças padrão do novo tipo. Continuar?")) return;
    onChangeMeta({ ...produto, tipo_produto: tipo, descricao });
    const aco = defaultAco();
    const preset = (PRODUTO_PRESETS[tipo] || []).map((p) => recalcComponente({ uid: newUid(), produto_id: produto.uid, ...p, custo_aco_id: aco?.id || "", peso_especifico: aco?.peso_especifico || 0 }));
    onChangeComponentes(preset);
  };

  const recarregarPreset = () => {
    if (!produto.tipo_produto) return;
    if (!confirm("Recarregar as peças padrão deste produto? As peças atuais serão substituídas.")) return;
    const aco = defaultAco();
    onChangeComponentes((PRODUTO_PRESETS[produto.tipo_produto] || []).map((p) => recalcComponente({ uid: newUid(), produto_id: produto.uid, ...p, custo_aco_id: aco?.id || "", peso_especifico: aco?.peso_especifico || 0 })));
  };

  const handleComponentes = (comps) => onChangeComponentes(comps.map((c) => ({ ...c, produto_id: c.produto_id || produto.uid })));
  const handleComerciais = (coms) => onChangeComerciais(coms.map((c) => ({ ...c, produto_id: c.produto_id || produto.uid })));

  const salvarTemplate = () => {
    if (!produto.tipo_produto && componentes.length === 0) {
      toast.error("Selecione um tipo de produto antes de salvar como template.");
      return;
    }
    const nome = prompt("Nome do template:", produto.tipo_produto || produto.nome || "Template");
    if (!nome) return;
    onSaveTemplate({
      nome,
      tipo_produto: produto.tipo_produto || "",
      descricao: produto.descricao || "",
      componentes: componentes.map(({ uid, ...c }) => c),
      comerciais: comerciais.map(({ uid, ...c }) => c),
    });
    toast.success("Template salvo!");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50/70 border-b border-slate-100 dark:bg-slate-800/70 dark:border-slate-700">
        <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">{produto.indexLabel}</div>
        <div className="flex flex-col gap-1 flex-1 min-w-[280px]">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide dark:text-slate-400">Tipo de produto — clique para selecionar</label>
          <div className="flex flex-wrap gap-1.5">
            {TIPOS_PRODUTO.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition ${produto.tipo_produto === t ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide dark:text-slate-400">Nome (opcional)</label>
          <input className="input-sm max-w-[200px]" value={produto.nome || ""} onChange={(e) => onChangeMeta({ ...produto, nome: e.target.value })} placeholder="Ex.: Porta-palete A" />
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 dark:text-slate-400">Peso / Custo aço</div>
          <div className="text-sm font-semibold text-slate-900 tabular-nums dark:text-slate-100">{formatPeso(totais.peso)} kg · {formatMoeda(totais.custoAco)}</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={salvarTemplate} className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700" title="Salvar como template"><Bookmark size={14} /></button>
          <button onClick={recarregarPreset} className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700" title="Recarregar peças padrão">Recarregar</button>
          <button onClick={() => setAberto(!aberto)} className="p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">{aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
          <button onClick={onRemove} className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="Remover produto"><Trash2 size={16} /></button>
        </div>
      </div>

      {aberto && (
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block dark:text-slate-400">Descrição do Item / Especificação Técnica</label>
            <textarea
              className="input-sm min-h-[80px] resize-y"
              value={produto.descricao || ""}
              onChange={(e) => onChangeMeta({ ...produto, descricao: e.target.value })}
              placeholder="Ex.: Fornecimento de 2 módulos Prateleira Porta facas, com as seguintes dimensões (1475x1200x4590mm) com 2 níveis de longarinas aptos a suportar uma carga uniformemente distribuída de 2000kg/par..."
            />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5 dark:text-slate-400"><Layers size={14} /> Peças estruturais</h4>
            <ComponenteGrid componentes={componentes} acoOptions={acoOptions} precoKg={precoKg} onChange={handleComponentes} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5 dark:text-slate-400"><Boxes size={14} /> Componentes comerciais</h4>
            <ComponenteComercialGrid componentes={comerciais} catalogo={catalogoComercial} onChange={handleComerciais} />
          </div>
        </div>
      )}
    </div>
  );
}