import React from "react";
import { X, Download, Boxes } from "lucide-react";
import { formatMoeda } from "@/lib/pricingEngine";

// Modal de visualização dos componentes comerciais de um produto.
export default function ComerciaisPreviewModal({ open, onClose, produto, componentes, onDownload }) {
  if (!open) return null;

  const total = componentes.reduce((s, c) => s + (Number(c.total) || 0), 0);
  const titulo = produto?.tipo_produto || produto?.nome || `Produto ${produto?.indexLabel || ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Boxes size={18} className="text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Componentes comerciais — {titulo}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{componentes.length} item(ns) · {formatMoeda(total)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onDownload} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
              <Download size={15} /> Baixar Excel
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
          </div>
        </div>
        <div className="overflow-auto p-5">
          {componentes.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">Nenhum componente comercial cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide dark:bg-slate-800/50">
                  <th className="text-left font-semibold px-3 py-2.5">Componente</th>
                  <th className="text-left font-semibold px-3 py-2.5">Unidade</th>
                  <th className="text-right font-semibold px-3 py-2.5">Qtde</th>
                  <th className="text-right font-semibold px-3 py-2.5">Custo Unit. (R$)</th>
                  <th className="text-right font-semibold px-3 py-2.5">Total (R$)</th>
                </tr>
              </thead>
              <tbody>
                {componentes.map((c, i) => (
                  <tr key={c.uid || i} className="border-t border-slate-100 dark:border-slate-700/50">
                    <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{c.descricao || "—"}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{c.unidade || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.quantidade ?? 0}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">{formatMoeda(c.custo_unitario)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-900 dark:text-slate-100">{formatMoeda(c.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold dark:border-slate-600 dark:bg-slate-800">
                  <td className="px-3 py-2.5 text-slate-900 dark:text-slate-100" colSpan={4}>Total Geral</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-primary">{formatMoeda(total)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}