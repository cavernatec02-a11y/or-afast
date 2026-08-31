// Motor de cálculo do OrçaFast — replica a matemática da planilha "Orçamento (padrão 2026)"
// e adiciona formação de preço completa para empresa no regime de Lucro Presumido.
// Nenhum valor é arredondado precocemente; arredondamentos só na exibição.

// ---------------------------------------------------------------------------
// ICMS interestadual por UF (aba "custo", colunas P/Q)
// ---------------------------------------------------------------------------
export const ICMS_POR_UF = {
  AC: 0.07, AL: 0.07, AP: 0.07, AM: 0.07, BA: 0.07, CE: 0.07,
  ES: 0.07, GO: 0.07, MA: 0.07, MT: 0.07, MS: 0.07, PA: 0.07,
  PB: 0.07, PE: 0.07, PI: 0.07, RN: 0.07, RO: 0.07, RR: 0.07,
  SC: 0.07, SE: 0.07, TO: 0.07, DF: 0.07,
  MG: 0.12, PR: 0.12, RJ: 0.12, RS: 0.12, SP: 0.18,
};
export const UFS = Object.keys(ICMS_POR_UF).sort();

// ---------------------------------------------------------------------------
// Regime: Lucro Presumido — venda de produtos (comércio/indústria)
// Base de presunção de lucro: 8%. Tributos sobre o faturamento (preço de venda).
// ---------------------------------------------------------------------------
export const LUCRO_PRESUMIDO = {
  pis: 0.0065,            // 0,65% sobre faturamento
  cofins: 0.03,           // 3,00% sobre faturamento
  csll: 0.0072,           // 9% × 8% (base de presunção)
  irpj: 0.012,            // 15% × 8% (base de presunção)
  irpj_adicional: 0.004,  // aproximação do adicional de 10%
};
export function calcCargaFederal() {
  return LUCRO_PRESUMIDO.pis + LUCRO_PRESUMIDO.cofins + LUCRO_PRESUMIDO.csll + LUCRO_PRESUMIDO.irpj + LUCRO_PRESUMIDO.irpj_adicional;
}

// Carga tributária total sobre o faturamento (federal + ICMS estadual)
export function calcCargaTributaria(uf) {
  const federal = calcCargaFederal();
  const icms = ICMS_POR_UF[uf] || 0;
  return { federal, icms, total: federal + icms };
}

// ---------------------------------------------------------------------------
// Presets de peças por tipo de produto
// ---------------------------------------------------------------------------
export const PRODUTO_PRESETS = {
  "P.Pallets": [
    { nome: "Coluna", quantidade: 2, corte: 0.25, comprimento: 6.004 },
    { nome: "Sapata", quantidade: 2, corte: 0.186, comprimento: 0.152 },
    { nome: "Travessa", quantidade: 6, corte: 0.075, comprimento: 0.906 },
    { nome: "Diagonal", quantidade: 5, corte: 0.075, comprimento: 1.292727 },
    { nome: "Garra/luvas", quantidade: 12, corte: 0.04, comprimento: 0.3 },
    { nome: "Calço", quantidade: 4, corte: 0.075, comprimento: 0.1 },
  ],
  "Drive In": [
    { nome: "Coluna", quantidade: 4, corte: 0.25, comprimento: 6.004 },
    { nome: "Corpo Sapata Dr-in", quantidade: 4, corte: 0.186, comprimento: 0.152 },
    { nome: "Base Sapata Dr-in", quantidade: 4, corte: 0.13, comprimento: 0.13 },
    { nome: "Travessa", quantidade: 8, corte: 0.075, comprimento: 0.906 },
    { nome: "Diagonal", quantidade: 6, corte: 0.075, comprimento: 1.292727 },
  ],
  Estantes: [
    { nome: "Coluna", quantidade: 4, corte: 0.25, comprimento: 3.0 },
    { nome: "Longarina", quantidade: 6, corte: 0.075, comprimento: 1.8 },
    { nome: "Travessa", quantidade: 8, corte: 0.075, comprimento: 0.9 },
    { nome: "Diagonal", quantidade: 4, corte: 0.075, comprimento: 1.2 },
  ],
  Cantilever: [
    { nome: "Coluna", quantidade: 4, corte: 0.25, comprimento: 4.0 },
    { nome: "Braço", quantidade: 8, corte: 0.075, comprimento: 1.2 },
    { nome: "Base", quantidade: 4, corte: 0.25, comprimento: 0.8 },
  ],
  "Cant. Leve": [
    { nome: "Coluna", quantidade: 4, corte: 0.2, comprimento: 2.5 },
    { nome: "Braço", quantidade: 8, corte: 0.06, comprimento: 0.9 },
  ],
  "Painel TL + Portão TL": [
    { nome: "Montante", quantidade: 6, corte: 0.2, comprimento: 2.8 },
    { nome: "Travessa", quantidade: 8, corte: 0.075, comprimento: 2.0 },
  ],
  "Mezanino": [
    { nome: "Coluna", quantidade: 6, corte: 0.25, comprimento: 3.5 },
    { nome: "Viga Principal", quantidade: 4, corte: 0.25, comprimento: 4.0 },
    { nome: "Viga Secundária", quantidade: 8, corte: 0.075, comprimento: 2.0 },
    { nome: "Diagonal", quantidade: 6, corte: 0.075, comprimento: 1.5 },
  ],
  Racks: [
    { nome: "Coluna", quantidade: 4, corte: 0.25, comprimento: 2.4 },
    { nome: "Longarina", quantidade: 4, corte: 0.075, comprimento: 1.8 },
  ],
  "Plano Fl.Rack": [
    { nome: "Coluna", quantidade: 4, corte: 0.25, comprimento: 3.0 },
    { nome: "Trilho", quantidade: 4, corte: 0.075, comprimento: 1.8 },
    { nome: "Travessa", quantidade: 6, corte: 0.075, comprimento: 1.2 },
  ],
  "P.bobina": [
    { nome: "Coluna", quantidade: 4, corte: 0.25, comprimento: 3.0 },
    { nome: "Sela", quantidade: 4, corte: 0.186, comprimento: 0.6 },
  ],
};
export const TIPOS_PRODUTO = Object.keys(PRODUTO_PRESETS);

// ---------------------------------------------------------------------------
// Cálculos de peso e custo das peças
// ---------------------------------------------------------------------------
export function calcPesoUnit(corte, comprimento, pesoEspecifico) {
  return (Number(corte) || 0) * (Number(comprimento) || 0) * (Number(pesoEspecifico) || 0);
}
export function calcPesoTotal(pesoUnit, quantidade) {
  return (Number(pesoUnit) || 0) * (Number(quantidade) || 0);
}
export function calcCustoComponente(pesoTotal, precoKg) {
  return (Number(pesoTotal) || 0) * (Number(precoKg) || 0);
}
export function recalcComponente(comp) {
  const pesoUnit = calcPesoUnit(comp.corte, comp.comprimento, comp.peso_especifico);
  const pesoTotal = calcPesoTotal(pesoUnit, comp.quantidade);
  const custo = calcCustoComponente(pesoTotal, comp.preco_kg);
  return { ...comp, peso_unit: pesoUnit, peso_total: pesoTotal, custo };
}
export function recalcComercial(comp) {
  const total = (Number(comp.quantidade) || 0) * (Number(comp.custo_unitario) || 0);
  return { ...comp, total };
}
export function calcTotais(componentes, componentesComerciais) {
  const peso_total_aco = (componentes || []).reduce((s, c) => s + (Number(c.peso_total) || 0), 0);
  const custo_total_aco = (componentes || []).reduce((s, c) => s + (Number(c.custo) || 0), 0);
  const custo_acessorios = (componentesComerciais || []).reduce((s, c) => s + (Number(c.total) || 0), 0);
  return { peso_total_aco, custo_total_aco, custo_acessorios };
}

// ---------------------------------------------------------------------------
// Formação de preço — Lucro Presumido
// ---------------------------------------------------------------------------
// Custo total = aço + acessórios + montagem + frete
export function calcCustoTotal(custoAco, custoAcessorios, montagem, frete) {
  return (Number(custoAco) || 0) + (Number(custoAcessorios) || 0) + (Number(montagem) || 0) + (Number(frete) || 0);
}

// Preço de venda necessário para atingir uma margem M (sobre preço de venda, líquido de impostos e comissão):
//   margem = 1 - custo/PV - carga_tributaria - comissao  =>  PV = custo / (1 - margem - carga - comissao)
export function calcPrecoVendaParaMargem(custoTotal, margemPct, cargaTotal, comissaoPct) {
  const denom = 1 - (Number(margemPct) || 0) / 100 - (Number(cargaTotal) || 0) - (Number(comissaoPct) || 0) / 100;
  if (denom <= 0) return Infinity;
  return (Number(custoTotal) || 0) / denom;
}

// Dado um valor de venda definido, calcula a margem real e o lucro líquido
export function calcResultadoVenda(valorVenda, custoTotal, cargaTotal, comissaoPct) {
  const vv = Number(valorVenda) || 0;
  const comissao = vv * ((Number(comissaoPct) || 0) / 100);
  const impostos = vv * (Number(cargaTotal) || 0);
  const lucro = vv - (Number(custoTotal) || 0) - impostos - comissao;
  const margem = vv > 0 ? lucro / vv : 0;
  return { valorVenda: vv, comissao, impostos, lucro, margem };
}

// Status da margem frente aos limites mínimo e adequado
export function statusMargem(margemReal, margemMinima, margemAdequada) {
  const m = (Number(margemReal) || 0) * 100;
  const min = Number(margemMinima) || 0;
  const ade = Number(margemAdequada) || 0;
  if (m < min) return { level: "baixo", label: `Abaixo da margem mínima (${min}%)`, pct: m };
  if (m < ade) return { level: "medio", label: `Acima do mínimo, abaixo da adequada (${ade}%)`, pct: m };
  return { level: "ok", label: "Margem adequada", pct: m };
}

// ---------------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------------
export function formatMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor) || 0);
}
export function formatPeso(valor) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Number(valor) || 0);
}
export function formatPercent(valor) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((Number(valor) || 0) * 100) + "%";
}