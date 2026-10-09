import React from "react";
import { formatMoeda } from "@/lib/pricingEngine";
import { STATUS_LABELS, financeiro, tiposDe, numeroProposta, qtdPecas, validadeAte, fmtData } from "@/lib/relatorioUtils";

export default function TabelaOrcamentos({ lista }) {
  if (!lista.length) return <p className="text-sm text-slate-500 py-10 text-center">Nenhum orçamento encontrado com os filtros atuais.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase tracking-wide">
          <tr>
            {["Proposta", "Cliente", "Escopo técnico", "Materiais", "Frete", "Montagem", "Valor global"].map((h, i) => (
              <th key={h} className={`px-3 py-3 font-medium ${i >= 3 ? "text-right" : "text-left"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lista.map((o, i) => {
            const f = financeiro(o);
            return (
              <tr key={o.id} className={`border-t border-slate-100 align-top dark:border-slate-700 ${i % 2 ? "bg-slate-50/50" : ""}`}>
                <td className="px-3 py-3">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">#{numeroProposta(o)}</div>
                  <div className="text-slate-500">Emissão {fmtData(o.data)}</div>
                  <div className="text-slate-500">Validade {validadeAte(o)}</div>
                  <div className="text-slate-500">{STATUS_LABELS[o.status || "rascunho"]} · {o.created_by || "—"}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{o.cliente_nome || "—"}</div>
                  <div className="text-slate-500">A/C {o.contato || "—"}</div>
                  <div className="text-slate-500">{o.telefone || "—"}</div>
                  <div className="text-slate-500">UF {o.uf || "—"}</div>
                </td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                  <div>{tiposDe(o).join(", ") || "—"}</div>
                  <div className="text-slate-500">{(o.produtos || []).length} produto(s) · {qtdPecas(o)} peças</div>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{formatMoeda(f.subtotal)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{f.freteLabel || formatMoeda(f.frete)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{f.montLabel || formatMoeda(f.montagem)}</td>
                <td className="px-3 py-3 text-right tabular-nums font-bold text-primary">{formatMoeda(f.total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}