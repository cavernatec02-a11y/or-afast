import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Pencil, Trash2, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";
import { formatMoeda, formatPeso } from "@/lib/pricingEngine";

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const carregar = async () => {
    setLoading(true);
    try {
      const lista = await base44.entities.Orcamento.list("-created_date", 50);
      setOrcamentos(lista);
    } catch (e) {
      toast.error("Erro ao carregar orçamentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const remover = async (id) => {
    if (!confirm("Excluir este orçamento?")) return;
    try {
      await base44.entities.Orcamento.delete(id);
      setOrcamentos((o) => o.filter((x) => x.id !== id));
      toast.success("Orçamento excluído.");
    } catch (e) {
      toast.error("Erro ao excluir.");
    }
  };

  const filtrados = orcamentos.filter((o) =>
    [o.titulo, o.cliente_nome, o.tipo_produto].join(" ").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">OrçaFast</h1>
            <p className="text-sm text-slate-500">Orçamentação industrial de estruturas de armazenagem</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/tabela-aco" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100">Tabela de Aço</Link>
            <Link to="/novo-orcamento" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">
              <Plus size={18} /> Novo orçamento
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative mb-5 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por título, cliente ou produto..." className="input pl-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
        ) : filtrados.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 leading-tight">{o.titulo}</h3>
                      <p className="text-xs text-slate-500">{o.tipo_produto}</p>
                    </div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-4 space-y-1.5 text-sm">
                  <Row label="Cliente" value={o.cliente_nome || "—"} />
                  <Row label="UF" value={o.uf || "—"} />
                  <Row label="Peso total" value={`${formatPeso(o.peso_total_aco)} kg`} />
                  <Row label="Valor de venda" value={formatMoeda(o.valor_venda)} strong />
                </div>
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Link to={`/orcamento/${o.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900">
                    <Pencil size={15} /> Editar
                  </Link>
                  <button onClick={() => remover(o.id)} className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-red-600">
                    <Trash2 size={15} /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`tabular-nums ${strong ? "font-semibold text-slate-900" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    rascunho: "bg-amber-50 text-amber-700",
    enviado: "bg-blue-50 text-blue-700",
    aprovado: "bg-emerald-50 text-emerald-700",
    recusado: "bg-red-50 text-red-700",
  };
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${map[status] || "bg-slate-100 text-slate-600"}`}>{status || "rascunho"}</span>;
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <FileText size={28} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">Nenhum orçamento ainda</h3>
      <p className="text-sm text-slate-500 mt-1">Crie seu primeiro orçamento industrial.</p>
      <Link to="/novo-orcamento" className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">
        <Plus size={18} /> Novo orçamento
      </Link>
    </div>
  );
}