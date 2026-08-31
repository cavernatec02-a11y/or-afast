import React from "react";
import { UFS, TIPOS_PRODUTO } from "@/lib/pricingEngine";

export default function ClienteForm({ form, onChange }) {
  const set = (field) => (e) => onChange({ ...form, [field]: e.target.value });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Field label="Cliente">
        <input className="input" value={form.cliente_nome || ""} onChange={set("cliente_nome")} placeholder="Razão social" />
      </Field>
      <Field label="Contato">
        <input className="input" value={form.contato || ""} onChange={set("contato")} placeholder="Sr. ..." />
      </Field>
      <Field label="Telefone">
        <input className="input" value={form.telefone || ""} onChange={set("telefone")} />
      </Field>
      <Field label="E-mail">
        <input className="input" value={form.email || ""} onChange={set("email")} />
      </Field>
      <Field label="Nº do Projeto">
        <input className="input" value={form.numero_projeto || ""} onChange={set("numero_projeto")} />
      </Field>
      <Field label="Nº da Folha (desenho)">
        <input className="input" value={form.numero_folha || ""} onChange={set("numero_folha")} />
      </Field>
      <Field label="UF (ICMS)">
        <select className="input" value={form.uf || ""} onChange={set("uf")}>
          <option value="">Selecione...</option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </select>
      </Field>
      <Field label="Data">
        <input type="date" className="input" value={form.data || ""} onChange={set("data")} />
      </Field>
      <Field label="Tipo de Produto">
        <select className="input" value={form.tipo_produto || ""} onChange={set("tipo_produto")}>
          <option value="">Selecione...</option>
          {TIPOS_PRODUTO.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Field>
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