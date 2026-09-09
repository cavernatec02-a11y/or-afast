import React, { useState, useMemo } from "react";
import { Scale, Ruler, TrendingUp, DollarSign, Percent, Weight } from "lucide-react";
import NumberInput from "@/components/NumberInput";
import { acoStore } from "@/lib/localStore";
import { formatMoeda, formatPeso } from "@/lib/pricingEngine";

export default function Calculadora() {
  // ─── ESTADOS GLOBAIS (inputs editáveis) ──────────────────────────────────────
  const [valorKgCusto, setValorKgCusto] = useState(8.0);
  const [margemLucro, setMargemLucro] = useState(30);
  const [impostos, setImpostos] = useState(12);

  // ─── ABA ATIVA ───────────────────────────────────────────────────────────────
  const [aba, setAba] = useState("peso");

  // ─── MÉTODO 1: PESO DIRETO ────────────────────────────────────────────────────
  const [pesoTotal, setPesoTotal] = useState(0);

  // ─── MÉTODO 2: PESO POR DIMENSÕES ─────────────────────────────────────────────
  const [quantidade, setQuantidade] = useState(1);
  const [corte, setCorte] = useState(0);
  const [comprimento, setComprimento] = useState(0);
  const [chapaId, setChapaId] = useState("");

  const chapas = acoStore.list();
  const chapaSel = chapas.find((c) => c.id === chapaId) || chapas[0] || null;

  // ─── CÁLCULO DINÂMICO (reage a qualquer mudança) ──────────────────────────────
  const calc = useMemo(() => {
    let peso = 0;

    if (aba === "peso") {
      peso = Number(pesoTotal) || 0;
    } else {
      const area = (Number(corte) || 0) * (Number(comprimento) || 0);
      const pesoM2 = chapaSel?.peso_especifico || 0;
      const pesoUmaPeca = area * pesoM2;
      peso = pesoUmaPeca * (Number(quantidade) || 0);
    }

    const custoTotal = peso * (Number(valorKgCusto) || 0);
    const margemPct = (Number(margemLucro) || 0) / 100;
    const impostosPct = (Number(impostos) || 0) / 100;
    const divisorMarkup = 1 - margemPct - impostosPct;
    const valorVendaTotal = divisorMarkup > 0 ? custoTotal / divisorMarkup : 0;
    const valorKgVenda = peso > 0 ? valorVendaTotal / peso : 0;
    const impostosValor = valorVendaTotal * impostosPct;
    const lucroLiquido = valorVendaTotal - custoTotal - impostosValor;

    return { peso, custoTotal, valorVendaTotal, valorKgVenda, lucroLiquido, impostosValor, divisorMarkup };
  }, [aba, pesoTotal, quantidade, corte, comprimento, chapaSel, valorKgCusto, margemLucro, impostos]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* ─── PAINEL GLOBAL FIXO ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2 dark:text-slate-100">
          <DollarSign size={18} className="text-primary" /> Parâmetros de Cálculo
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlobalInput label="Valor do Kg (Custo)" prefix="R$" value={valorKgCusto} onChange={setValorKgCusto} />
          <GlobalInput label="Margem de Lucro" suffix="%" value={margemLucro} onChange={setMargemLucro} />
          <GlobalInput label="Impostos" suffix="%" value={impostos} onChange={setImpostos} />
        </div>
        {calc.divisorMarkup <= 0 && (
          <p className="mt-3 text-xs font-medium text-red-600">
            ⚠ A soma de Margem + Impostos é igual ou superior a 100%. Ajuste os valores para que o divisor seja positivo.
          </p>
        )}
      </div>

      {/* ─── ABAS ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <button
          onClick={() => setAba("peso")}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition ${aba === "peso" ? "bg-primary text-primary-foreground" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"}`}
        >
          <Scale size={18} /> Orçamento por Peso
        </button>
        <button
          onClick={() => setAba("medida")}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition ${aba === "medida" ? "bg-primary text-primary-foreground" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"}`}
        >
          <Ruler size={18} /> Orçamento por Medida
        </button>
      </div>

      {/* ─── INPUTS DO MÉTODO ATIVO ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        {aba === "peso" ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide dark:text-slate-100">Cálculo Direto por Peso</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block dark:text-slate-400">Peso Total (kg)</label>
                <NumberInput value={pesoTotal} onChange={setPesoTotal} className="input" placeholder="0" suffix="kg" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide dark:text-slate-100">Cálculo de Peso por Dimensões</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block dark:text-slate-400">Quantidade</label>
                <NumberInput value={quantidade} onChange={setQuantidade} className="input" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block dark:text-slate-400">Corte / Largura (m)</label>
                <NumberInput value={corte} onChange={setCorte} className="input" placeholder="0" suffix="m" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block dark:text-slate-400">Comprimento (m)</label>
                <NumberInput value={comprimento} onChange={setComprimento} className="input" placeholder="0" suffix="m" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block dark:text-slate-400">Tipo de Chapa</label>
                <select
                  value={chapaSel?.id || ""}
                  onChange={(e) => setChapaId(e.target.value)}
                  className="input"
                >
                  {chapas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.aco_bitola} ({c.espessura_mm}mm) — {c.peso_especifico} kg/m²
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {aba === "medida" && chapaSel && (Number(corte) > 0 && Number(comprimento) > 0) && (
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 dark:bg-slate-800 dark:text-slate-400">
                Área da peça: <strong>{formatPeso((Number(corte) || 0) * (Number(comprimento) || 0))} m²</strong>
                {" · "}Peso/peça: <strong>{formatPeso((Number(corte) || 0) * (Number(comprimento) || 0) * (chapaSel.peso_especifico || 0))} kg</strong>
                {" · "}Peso total: <strong>{formatPeso(calc.peso)} kg</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── CARD DE RESULTADOS ────────────────────────────────────────────── */}
      <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 dark:border-primary/30">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2 dark:text-slate-100">
          <TrendingUp size={18} className="text-primary" /> Resultado do Orçamento
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <ResultCard icon={<Weight size={18} />} label="Peso Total" value={`${formatPeso(calc.peso)} kg`} />
          <ResultCard icon={<DollarSign size={18} />} label="Custo Total" value={formatMoeda(calc.custoTotal)} />
          <ResultCard icon={<Percent size={18} />} label="Preço de Venda do Kg" value={formatMoeda(calc.valorKgVenda)} />
          <ResultCard icon={<DollarSign size={18} />} label="Valor Total de Venda" value={formatMoeda(calc.valorVendaTotal)} highlight />
          <ResultCard icon={<TrendingUp size={18} />} label="Lucro Líquido Projetado" value={formatMoeda(calc.lucroLiquido)} positive={calc.lucroLiquido >= 0} />
          <ResultCard icon={<Percent size={18} />} label="Impostos sobre Venda" value={formatMoeda(calc.impostosValor)} />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function GlobalInput({ label, prefix, suffix, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block dark:text-slate-400">{label}</label>
      <NumberInput value={value} onChange={onChange} className="input text-base font-semibold" placeholder="0" prefix={prefix} suffix={suffix} />
    </div>
  );
}

function ResultCard({ icon, label, value, highlight, positive }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "bg-primary text-primary-foreground border-primary" : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700"}`}>
      <div className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide mb-1.5 ${highlight ? "text-primary-foreground/80" : "text-slate-500 dark:text-slate-400"}`}>
        {icon} {label}
      </div>
      <div className={`text-lg font-bold tabular-nums ${highlight ? "text-primary-foreground" : positive === true ? "text-emerald-600" : positive === false ? "text-red-600" : "text-slate-900 dark:text-slate-100"}`}>
        {value}
      </div>
    </div>
  );
}