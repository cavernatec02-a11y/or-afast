import React, { useState } from "react";
import { setAccessCode } from "@/lib/sharedStore";
import { base44 } from "@/api/base44Client";

export default function AccessGate({ onSuccess }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      setAccessCode(code.trim());
      const res = await base44.functions.invoke("sharedApi", {
        action: "list", entity: "orcamentos", code: code.trim(),
      });
      if (res.data?.success === false) {
        setError("Código de acesso inválido. Tente novamente.");
        setAccessCode("");
      } else {
        onSuccess();
      }
    } catch {
      setError("Não foi possível validar o código. Verifique sua conexão.");
      setAccessCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <span className="text-2xl font-bold text-white">R</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">RIPRESA</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Sistema de Orçamentação</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 dark:border-slate-700 dark:bg-slate-900">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Código de Acesso</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Digite o código da equipe"
            className="input text-center text-lg font-semibold tracking-wide"
            autoFocus
            disabled={loading}
          />
          {error && <p className="text-sm text-red-600 mt-2 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50 hover:bg-primary/90 transition"
          >
            {loading ? "Validando..." : "Entrar"}
          </button>
          <p className="text-xs text-slate-400 mt-4 text-center">
            Acesso compartilhado entre a equipe de vendas.
          </p>
        </form>
      </div>
    </div>
  );
}