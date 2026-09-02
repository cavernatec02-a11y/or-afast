import React from "react";
import { Plus, Package } from "lucide-react";
import ProdutoCard from "@/components/orcamento/ProdutoCard";
import { newUid } from "@/lib/pricingEngine";

export default function ProdutosSection({ produtos, componentes, comerciais, acoOptions, catalogoComercial, precoKg, onChangeProdutos, onChangeComponentes, onChangeComerciais }) {
  const updateMeta = (i, p) => onChangeProdutos(produtos.map((x, idx) => (idx === i ? p : x)));
  const remove = (i) => {
    const uid = produtos[i].uid;
    onChangeProdutos(produtos.filter((_, idx) => idx !== i));
    onChangeComponentes(componentes.filter((c) => c.produto_id !== uid));
    onChangeComerciais(comerciais.filter((c) => c.produto_id !== uid));
  };
  const add = () => onChangeProdutos([...produtos, { uid: newUid(), tipo_produto: "", nome: "" }]);

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
        />
      ))}
      {produtos.length === 0 && (
        <div className="text-center py-10 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
          <Package size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">Nenhum produto. Adicione o primeiro produto deste orçamento.</p>
        </div>
      )}
      <button onClick={add} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-700 text-sm font-semibold hover:border-primary hover:bg-slate-50 transition w-full justify-center">
        <Plus size={18} /> Adicionar produto
      </button>
    </div>
  );
}