import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Search, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";
import Navbar from "@/components/Navbar";

const VAZIO = { nome: "", contato: "", telefone: "", fax: "", email: "", web_site: "", numero_projeto: "", numero_folha: "" };

export default function Clientes() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState(null);

  const carregar = async () => {
    setLoading(true);
    try {
      setLista(await base44.entities.Cliente.list("-created_date", 100));
    } catch (e) {
      toast.error("Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const salvar = async (item) => {
    if (!item.nome) return toast.error("Informe o nome do cliente.");
    try {
      if (item.id) {
        await base44.entities.Cliente.update(item.id, item);
        toast.success("Cliente atualizado!");
      } else {
        await base44.entities.Cliente.create(item);
        toast.success("Cliente cadastrado!");
      }
      setEditando(null);
      carregar();
    } catch (e) {
      toast.error("Erro ao salvar cliente.");
    }
  };

  const remover = async (id) => {
    if (!confirm("Excluir este cliente?")) return;
    try {
      await base44.entities.Cliente.delete(id);
      carregar();
      toast.success("Excluído.");
    } catch (e) {
      toast.error("Erro ao excluir.");
    }
  };

  const filtrados = lista.filter((c) =>
    [c.nome, c.contato, c.email, c.telefone].join(" ").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-end gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
            <p className="text-sm text-slate-500">Cadastre e edite clientes para usar nos orçamentos</p>
          </div>
          <button onClick={() => setEditando({ ...VAZIO })} className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
            <Plus size={18} /> Novo cliente
          </button>
        </div>

        {editando && <ClienteForm item={editando} onCancel={() => setEditando(null)} onSave={salvar} />}

        <div className="relative mb-5 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente..." className="input pl-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4"><Users size={28} /></div>
            <h3 className="text-lg font-semibold text-slate-900">Nenhum cliente cadastrado</h3>
            <p className="text-sm text-slate-500 mt-1">Cadastre clientes para preencher orçamentos em um clique.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600"><Users size={18} /></div>
                  <div>
                    <h3 className="font-semibold text-slate-900 leading-tight">{c.nome}</h3>
                    <p className="text-xs text-slate-500">{c.contato || "—"}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <Row label="Telefone" value={c.telefone || "—"} />
                  <Row label="E-mail" value={c.email || "—"} />
                  <Row label="Site" value={c.web_site || "—"} />
                </div>
                <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button onClick={() => setEditando(c)} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900"><Pencil size={15} /> Editar</button>
                  <button onClick={() => remover(c.id)} className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-red-600"><Trash2 size={15} /> Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-700 truncate ml-2 max-w-[60%] text-right">{value}</span>
    </div>
  );
}

function ClienteForm({ item, onCancel, onSave }) {
  const [f, setF] = useState(item);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="mb-5 bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 mb-4">{item.id ? "Editar cliente" : "Novo cliente"}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <L label="Nome / Razão Social"><input className="input-sm" value={f.nome || ""} onChange={set("nome")} /></L>
        <L label="Contato"><input className="input-sm" value={f.contato || ""} onChange={set("contato")} /></L>
        <L label="Telefone"><input className="input-sm" value={f.telefone || ""} onChange={set("telefone")} /></L>
        <L label="E-mail"><input className="input-sm" value={f.email || ""} onChange={set("email")} /></L>
        <L label="Site"><input className="input-sm" value={f.web_site || ""} onChange={set("web_site")} /></L>
        <L label="Fax"><input className="input-sm" value={f.fax || ""} onChange={set("fax")} /></L>
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