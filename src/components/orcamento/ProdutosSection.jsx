import React, { useState } from "react";
import { Plus, Package, Bookmark, X, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import ProdutoCard from "@/components/orcamento/ProdutoCard";
import { newUid, recalcComponente } from "@/lib/pricingEngine";
import { templatesStore } from "@/lib/localStore";

export default function ProdutosSection({ produtos, componentes, comerciais, acoOptions, catalogoComercial, precoKg, onChangeProdutos, onChangeComponentes, onChangeComerciais }) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState([]);

  const updateMeta = (i, p) => onChangeProdutos(produtos.map((x, idx) => (idx === i ? p : x)));
  const remove = (i) => {
    const uid = produtos[i].uid;
    onChangeProdutos(produtos.filter((_, idx) => idx !== i));
    onChangeComponentes(componentes.filter((c) => c.produto_id !== uid));
    onChangeComerciais(comerciais.filter((c) => c.produto_id !== uid));
  };
  const add = () => onChangeProdutos([...produtos, { uid: newUid(), tipo_produto: "", nome: "" }]);

  const salvarTemplate = (tplData) => {
    templatesStore.create(tplData);
  };

  const abrirTemplates = () => {
    setTemplates(templatesStore.list());
    setShowTemplates(true);
  };

  const aplicarTemplate = (tpl) => {
    const uid = newUid();
    onChangeProdutos([...produtos, { uid, tipo_produto: tpl.tipo_produto || "", nome: "", descricao: tpl.descricao || "" }]);
    const novosComps = (tpl.componentes || []).map((c) =>
      recalcComponente({ ...c, uid: newUid(), produto_id: uid })
    );
    const novasComs = (tpl.comerciais || []).map((c) => ({ ...c, uid: newUid(), produto_id: uid }));
    onChangeComponentes([...componentes, ...novosComps]);
    onChangeComerciais([...comerciais, ...novasComs]);
    setShowTemplates(false);
    toast.success(`Template "${tpl.nome}" carregado!`);
  };

  const excluirTemplate = (id, nome) => {
    if (!confirm(`Excluir o template "${nome}"?`)) return;
    templatesStore.delete(id);
    setTemplates(templatesStore.list());
  };

  return (
    <div className="space-y-4">
      {produtos.map((p, i) => (
        <ProdutoCard
          key={p.uid}
          produto={{ ...p, indexLabel: i + 1 }}
          componentes={componentes.filter((c) => c.produto_id === p.uid)}
          comerciais={comerciais.filter((c) => c.produto_id === p.uid)}
          acoOptions={acoOptions}
          catalogoComercial={catalogoComercial}
          precoKg={precoKg}
          onChangeMeta={(meta) => updateMeta(i, meta)}
          onChangeComponentes={(comps) => {
            const others = componentes.filter((c) => c.produto_id !== p.uid);
            onChangeComponentes([...others, ...comps]);
          }}
          onChangeComerciais={(coms) => {
            const others = comerciais.filter((c) => c.produto_id !== p.uid);
            onChangeComerciais([...others, ...coms]);
          }}
          onRemove={() => remove(i)}
          onSaveTemplate={salvarTemplate}
        />
      ))}
      {produtos.length === 0 && (
        <div className="text-center py-10 rounded-2xl border-2 border-dashed border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <Package size={28} className="mx-auto text-slate-300 mb-2 dark:text-slate-600" />
          <p className="text-sm text-slate-500">Nenhum produto. Adicione o primeiro produto deste orçamento.</p>
        </div>
      )}

      {showTemplates && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Bookmark size={16} /> Templates salvos
            </h4>
            <button onClick={() => setShowTemplates(false)} className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
          </div>
          {templates.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Nenhum template salvo. Use o ícone de marcador em um produto para salvar sua configuração.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-slate-50 transition dark:border-slate-700 dark:hover:bg-slate-800">
                  <button onClick={() => aplicarTemplate(tpl)} className="flex-1 text-left">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tpl.nome}</div>
                    <div className="text-xs text-slate-500">
                      {tpl.tipo_produto || "—"} · {tpl.componentes?.length || 0} peças · {tpl.comerciais?.length || 0} acessórios
                    </div>
                  </button>
                  <button onClick={() => excluirTemplate(tpl.id, tpl.nome)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="Excluir template">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={add} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-700 text-sm font-semibold hover:border-primary hover:bg-slate-50 transition flex-1 justify-center dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
          <Plus size={18} /> Adicionar produto
        </button>
        <button onClick={abrirTemplates} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition dark:text-primary">
          <Bookmark size={18} /> Carregar template
        </button>
      </div>
    </div>
  );
}