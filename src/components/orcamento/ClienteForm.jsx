import React from "react";
import { Link } from "react-router-dom";
import { UserPlus, ChevronDown } from "lucide-react";
import { UFS } from "@/lib/pricingEngine";

export default function ClienteForm({ form, onChange, clientes, onSelectCliente }) {
  const set = (field) => (e) => onChange({ ...form, [field]: e.target.value });

  return (
    <div className="space-y-4">
      {/* Seletor de cliente cadastrado */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Selecionar cliente cadastrado</span>
          <div className="relative">
            <select
              className="input appearance-none pr-9"
              value={form.cliente_id || ""}
              onChange={(e) => {
                const c = clientes.find((x) => x.id === e.target.value);
                if (c) onSelectCliente(c);
                else onChange({ ...form, cliente_id: "", cliente_nome: "" });
              }}
            >
              <option value="">— Cliente não cadastrado (preencher manualmente) —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </label>
        <Link to="/clientes" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50">
          <UserPlus size={16} /> Gerenciar clientes
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
        <Field label="Cliente / Razão Social"><input className="input" value={form.cliente_nome || ""} onChange={set("cliente_nome")} placeholder="Razão social" /></Field>
        <Field label="Contato"><input className="input" value={form.contato || ""} onChange={set("contato")} placeholder="Sr. ..." /></Field>
        <Field label="Telefone"><input className="input" value={form.telefone || ""} onChange={set("telefone")} /></Field>
        <Field label="E-mail"><input className="input" value={form.email || ""} onChange={set("email")} /></Field>
        <Field label="Nº do Projeto"><input className="input" value={form.numero_projeto || ""} onChange={set("numero_projeto")} /></Field>
        <Field label="Nº da Folha (desenho)"><input className="input" value={form.numero_folha || ""} onChange={set("numero_folha")} /></Field>
        <Field label="UF (ICMS)">
          <select className="input" value={form.uf || ""} onChange={set("uf")}>
            <option value="">Selecione...</option>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </Field>
        <Field label="Data"><input type="date" className="input" value={form.data || ""} onChange={set("data")} /></Field>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}