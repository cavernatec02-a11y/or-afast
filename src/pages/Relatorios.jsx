import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp, CheckCircle2, FileText, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import Navbar from "@/components/Navbar";
import { orcamentosStore } from "@/lib/sharedStore";
import { formatMoeda } from "@/lib/pricingEngine";

const STATUS_LABELS = { rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado", recusado: "Recusado" };

export default function Relatorios() {
  const [orcamentos, setOrcamentos] = useState([]);

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await orcamentosStore.list();
        setOrcamentos(data || []);
      } catch (e) {
        // silent
      }
    };
    carregar();
    const interval = setInterval(carregar, 15000);
    return () => clearInterval(interval);
  }, []);

  // Agrupar por mês (YYYY-MM) — apenas aprovados
  const dadosMensais = useMemo(() => {
    const grupos = {};
    orcamentos
      .filter((o) => o.status === "aprovado" && o.data)
      .forEach((o) => {
        const mes = o.data.slice(0, 7); // YYYY-MM
        if (!grupos[mes]) grupos[mes] = { mes, count: 0, total: 0 };
        grupos[mes].count += 1;
        grupos[mes].total += Number(o.total_cliente) || 0;
      });
    return Object.values(grupos).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [orcamentos]);

  // Totais gerais por status
  const totaisStatus = useMemo(() => {
    const t = { rascunho: 0, enviado: 0, aprovado: 0, recusado: 0 };
    orcamentos.forEach((o) => { t[o.status || "rascunho"] += 1; });
    return t;
  }, [orcamentos]);

  const valorTotalAprovado = useMemo(
    () => orcamentos.filter((o) => o.status === "aprovado").reduce((s, o) => s + (Number(o.total_cliente) || 0), 0),
    [orcamentos]
  );

  const ticketMedio = useMemo(() => {
    const aprovados = orcamentos.filter((o) => o.status === "aprovado");
    return aprovados.length > 0 ? valorTotalAprovado / aprovados.length : 0;
  }, [orcamentos, valorTotalAprovado]);

  const chartData = useMemo(
    () => dadosMensais.map((d) => ({ mes: formatarMes(d.mes), valor: d.total, count: d.count })),
    [dadosMensais]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><BarChart3 size={22} /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Relatórios</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Orçamentos aprovados por mês e indicadores comerciais</p>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard icon={<CheckCircle2 size={20} />} label="Orçamentos Aprovados" value={totaisStatus.aprovado} tone="emerald" />
          <SummaryCard icon={<TrendingUp size={20} />} label="Valor Total Aprovado" value={formatMoeda(valorTotalAprovado)} tone="primary" />
          <SummaryCard icon={<FileText size={20} />} label="Ticket Médio" value={formatMoeda(ticketMedio)} tone="blue" />
          <SummaryCard icon={<Calendar size={20} />} label="Total de Orçamentos" value={orcamentos.length} tone="slate" />
        </div>

        {/* Gráfico de barras — valor aprovado por mês */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 dark:text-slate-100">Valor Aprovado por Mês (R$)</h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">Nenhum orçamento aprovado ainda. Marque orçamentos como "aprovado" para acompanhar os resultados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={{ stroke: "hsl(var(--border))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={{ stroke: "hsl(var(--border))" }} width={60} />
                <Tooltip
                  formatter={(v) => [formatMoeda(v), "Valor"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", fontSize: 13 }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 600 }}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tabela detalhada por mês */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden dark:border-slate-700 dark:bg-slate-900">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Detalhamento Mensal</h2>
          </div>
          {dadosMensais.length === 0 ? (
            <p className="text-sm text-slate-500 py-10 text-center">Sem dados de orçamentos aprovados para exibir.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Mês</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Orçamentos Aprovados</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Valor Total</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {dadosMensais.map((d) => (
                  <tr key={d.mes} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{formatarMes(d.mes)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{d.count}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-900 dark:text-slate-100">{formatMoeda(d.total)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{formatMoeda(d.total / d.count)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold dark:border-slate-600 dark:bg-slate-800">
                  <td className="px-5 py-3 text-slate-900 dark:text-slate-100">Total Geral</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-900 dark:text-slate-100">{dadosMensais.reduce((s, d) => s + d.count, 0)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-primary">{formatMoeda(dadosMensais.reduce((s, d) => s + d.total, 0))}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-900 dark:text-slate-100">{formatMoeda(dadosMensais.reduce((s, d) => s + d.total, 0) / dadosMensais.reduce((s, d) => s + d.count, 0))}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Distribuição por status */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide dark:text-slate-400">{label}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 dark:text-slate-100">{totaisStatus[key]}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function formatarMes(ym) {
  const [y, m] = ym.split("-");
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${nomes[parseInt(m) - 1]}/${y}`;
}

function SummaryCard({ icon, label, value, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tones[tone]}`}>{icon}</div>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide dark:text-slate-400">{label}</div>
      <div className="text-xl font-bold text-slate-900 mt-1 dark:text-slate-100">{value}</div>
    </div>
  );
}