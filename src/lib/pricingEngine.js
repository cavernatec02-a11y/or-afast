// Motor de cálculo do OrçaFast — replica a matemática da planilha "Orçamento (padrão 2026)".
// Nenhum valor é arredondado precocemente; os arredondamentos só acontecem na exibição.

// Alíquotas de ICMS interestadual por UF (extraídas da aba "custo", colunas P/Q).
export const ICMS_POR_UF = {
  AC: 0.07, AL: 0.07, AP: 0.07, AM: 0.07, BA: 0.07, CE: 0.07,
  ES: 0.07, GO: 0.07, MA: 0.07, MT: 0.07, MS: 0.07, PA: 0.07,
  PB: 0.07, PE: 0.07, PI: 0.07, RN: 0.07, RO: 0.07, RR: 0.07,
  SC: 0.07, SE: 0.07, TO: 0.07, DF: 0.07,
  MG: 0.12, PR: 0.12, RJ: 0.12, RS: 0.12, SP: 0.12,
};

export const UFS = Object.keys(ICMS_POR_UF).sort();

// Presets de peças por tipo de produto (derivados das abas P.Pallets, Drive In, etc.).
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

// Peso Unitário (kg) = Corte (m) × Comprimento (m) × Peso Específico (kg/m)
export function calcPesoUnit(corte, comprimento, pesoEspecifico) {
  return (Number(corte) || 0) * (Number(comprimento) || 0) * (Number(pesoEspecifico) || 0);
}

// Peso Total (kg) = Peso Unitário × Quantidade
export function calcPesoTotal(pesoUnit, quantidade) {
  return (Number(pesoUnit) || 0) * (Number(quantidade) || 0);
}

// Custo do aço do componente = Peso Total × Preço do aço/kg
export function calcCustoComponente(pesoTotal, precoKg) {
  return (Number(pesoTotal) || 0) * (Number(precoKg) || 0);
}

// Recalcula um componente inteiro a partir de seus campos de entrada.
export function recalcComponente(comp) {
  const pesoUnit = calcPesoUnit(comp.corte, comp.comprimento, comp.peso_especifico);
  const pesoTotal = calcPesoTotal(pesoUnit, comp.quantidade);
  const custo = calcCustoComponente(pesoTotal, comp.preco_kg);
  return { ...comp, peso_unit: pesoUnit, peso_total: pesoTotal, custo };
}

// Total de um componente comercial = quantidade × custo unitário
export function recalcComercial(comp) {
  const total = (Number(comp.quantidade) || 0) * (Number(comp.custo_unitario) || 0);
  return { ...comp, total };
}

// Soma todos os totais do orçamento.
export function calcTotais(componentes, componentesComerciais) {
  const peso_total_aco = (componentes || []).reduce((s, c) => s + (Number(c.peso_total) || 0), 0);
  const custo_total_aco = (componentes || []).reduce((s, c) => s + (Number(c.custo) || 0), 0);
  const custo_acessorios = (componentesComerciais || []).reduce((s, c) => s + (Number(c.total) || 0), 0);
  return { peso_total_aco, custo_total_aco, custo_acessorios };
}

// Formação de preço final: (custo aço + acessórios) × (1 + margem) — ICMS aplicado sobre o valor final.
export function calcValorFinal(totais, margemPercentual, icmsPercentual) {
  const base = (totais.custo_total_aco || 0) + (totais.custo_acessorios || 0);
  const comMargem = base * (1 + (Number(margemPercentual) || 0) / 100);
  const valorComIcms = comMargem / (1 - (Number(icmsPercentual) || 0) / 100);
  return valorComIcms;
}

export function formatMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor) || 0);
}

export function formatPeso(valor) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Number(valor) || 0);
}