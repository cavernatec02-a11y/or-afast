import React from "react";
import { Plus, Package } from "lucide-react";
import ProdutoCard from "@/components/orcamento/ProdutoCard";
import { newUid } from "@/lib/pricingEngine";

export default function ProdutosSection({ produtos, acoOptions, catalogoComercial, precoKg, onChange }) {
  const update = (i, produto) => onChange(produtos.map((p, idx) => (idx === i ? produto : p)));
  const remove = (i) => onChange(produtos.filter((_, idx) => idx !== i));
  const add = () => onChange([...produtos, { uid: newUid(), tipo_produto: "", nome: "", componentes: [], componentes_comerciais: [] }]);

  return (
    <div className="space-y-4">
      {produtos.map((p, i) => (
        <ProdutoCard
          key={p.uid || `p${i}`}
          produto={p}
          index={i}
          acoOptions={acoOptions}
          catalogoComercial={catalogoComercial}
          precoKg={precoKg}
          onChange={(prod) => update(i, prod)}
          onRemove={() => remove(i)}
        />
      ))}
      {produtos.length === 0 && (
        <div className="text-center py-10 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
          <Package size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">Nenhum produto. Adicione o primeiro produto deste orçamento.</p>
        </div>
      )}
      <button onClick={add} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-700 text-sm font-semibold hover:border-slate-400 hover:bg-slate-50 transition w-full justify-center">
        <Plus size={18} /> Adicionar produto
      </button>
    </div>
  );
}