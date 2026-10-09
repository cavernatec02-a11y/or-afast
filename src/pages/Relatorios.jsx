import React, { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import FiltrosBar from "@/components/relatorios/FiltrosBar";
import KpiCards from "@/components/relatorios/KpiCards";
import TabelaOrcamentos from "@/components/relatorios/TabelaOrcamentos";
import ExportMenu from "@/components/relatorios/ExportMenu";
import { filtrar, kpis, financeiro, fmtData } from "@/lib/relatorioUtils";
import { exportarRelatorioPDF, exportarRelatorioCSV } from "@/lib/exportRelatorio";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import Navbar from "@/components/Navbar";
import { orcamentosStore } from "@/lib/sharedStore";
import { formatMoeda } from "@/lib/pricingEngine";


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

  const [filtros, setFiltros] = useState({ inicio: "", fim: "", atalho: "todos", status: "todos", tipo: "todos", busca: "" });
  const filtrados = useMemo(() => filtrar(orcamentos, filtros).sort((a, b) => String(b.data || "").localeCompare(String(a.data || ""))), [orcamentos, filtros]);
  const k = useMemo(() => kpis(filtrados), [filtrados]);
  const periodo = filtros.inicio || filtros.fim ? `${fmtData(filtros.inicio) || "início"} a ${fmtData(filtros.fim)}` : "Todo o histórico";

  // Agrupar por mês (YYYY-MM) — apenas aprovados
  const dadosMensais = useMemo(() => {
    const grupos = {};
    filtrados
      .filter((o) => o.status === "aprovado" && o.data)
      .forEach((o) => {
        const mes = o.data.slice(0, 7); // YYYY-MM
        if (!grupos[mes]) grupos[mes] = { mes, count: 0, total: 0 };
        grupos[mes].count += 1;
        grupos[mes].total += financeiro(o).total;
      });
    return Object.values(grupos).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [filtrados]);

  const chartData = useMemo(
    () => dadosMensais.map((d) => ({ mes: formatarMes(d.mes), valor: d.total, count: d.count })),
    [dadosMensais]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="print-area max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><BarChart3 size={22} /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Relatórios</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Indicadores comerciais · {periodo}</p>
          </div>
          <ExportMenu onPDF={() => exportarRelatorioPDF(filtrados, k, periodo)} onCSV={() => exportarRelatorioCSV(filtrados)} />
        </div>

        <FiltrosBar filtros={filtros} setFiltros={setFiltros} />
        <KpiCards k={k} total={filtrados.length} />

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Detalhamento por Orçamento ({filtrados.length})</h2>
          </div>
          <TabelaOrcamentos lista={filtrados} />
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