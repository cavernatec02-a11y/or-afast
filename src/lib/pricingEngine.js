// Motor de cálculo do OrçaFast — orçamentação industrial de estruturas de armazenagem.
// Regime: Lucro Presumido (venda de produtos, base de presunção 8%).

// ICMS interestadual por UF
export const ICMS_POR_UF = {
  AC: 0.07, AL: 0.07, AP: 0.07, AM: 0.07, BA: 0.07, CE: 0.07,
  ES: 0.07, GO: 0.07, MA: 0.07, MT: 0.07, MS: 0.07, PA: 0.07,
  PB: 0.07, PE: 0.07, PI: 0.07, RN: 0.07, RO: 0.07, RR: 0.07,
  SC: 0.07, SE: 0.07, TO: 0.07, DF: 0.07,
  MG: 0.12, PR: 0.12, RJ: 0.12, RS: 0.12, SP: 0.18,
};
export const UFS = Object.keys(ICMS_POR_UF).sort();

export const LUCRO_PRESUMIDO = {
  pis: 0.0065, cofins: 0.03, csll: 0.0072, irpj: 0.012, irpj_adicional: 0.008,
};
export function calcCargaFederal() {
  return LUCRO_PRESUMIDO.pis + LUCRO_PRESUMIDO.cofins + LUCRO_PRESUMIDO.csll + LUCRO_PRESUMIDO.irpj + LUCRO_PRESUMIDO.irpj_adicional;
}
export function calcCargaTributaria(uf) {
  const federal = calcCargaFederal();
  const icms = ICMS_POR_UF[uf] || 0;
  return { federal, icms, total: federal + icms };
}

// Presets de peças por tipo de produto
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

// Descrições técnicas pré-definidas por tipo de produto (preenchimento automático)
export const DESCRICOES_PRODUTO = {
  "P.Pallets": "Fornecimento de Porta-Palete convencional, estrutura metálica para armazenagem de paletes, composta por colunas, sapatas, travessas, diagonais e garras de fixação. Capacidade de carga conforme projeto técnico aprovado.",
  "Drive In": "Fornecimento de sistema Drive-In, estrutura metálica de alta densidade para armazenagem de paletes, composta por colunas, sapatas especiais Drive-In, travessas e diagonais. Ideal para produtos com baixa rotatividade e alta densidade.",
  "Estantes": "Fornecimento de Estante para picking, estrutura metálica composta por colunas, longarinas, travessas e diagonais. Apta a suportar carga uniformemente distribuída conforme especificação técnica.",
  "Cantilever": "Fornecimento de Cantilever pesado, estrutura metálica para armazenagem de cargas longas (tubos, perfis, chapas), composta por colunas, braços e bases reforçadas.",
  "Cant. Leve": "Fornecimento de Cantilever leve, estrutura metálica para armazenagem de cargas longas de menor peso, composta por colunas e braços reguláveis em altura.",
  "Painel TL + Portão TL": "Fornecimento de Painel TL e Portão TL, estrutura metálica para fechamento perimetral e controle de acesso de áreas industriais, composta por montantes e travessas.",
  "Mezanino": "Fornecimento de Mezanino industrial, estrutura metálica elevada para aproveitamento vertical do espaço, composta por colunas, vigas principais e secundárias e diagonais de contraventamento.",
  "Racks": "Fornecimento de Rack para armazenagem, estrutura metálica composta por colunas e longarinas. Capacidade de carga conforme projeto técnico aprovado.",
  "Plano Fl.Rack": "Fornecimento de Flow Rack, estrutura metálica para armazenagem dinâmica com trilhos de rolamento por gravidade, composta por colunas, trilhos e travessas.",
  "P.bobina": "Fornecimento de Porta-Bobina, estrutura metálica para armazenagem de bobinas de aço, composta por colunas e selas de apoio.",
};

// UID estável para keys de React (evita inputs com estado local trocado de linha)
let _uid = 0;
export function newUid() { _uid += 1; return `uid_${Date.now().toString(36)}_${_uid.toString(36)}`; }

// Cálculos de peso (geometria). O custo vem do preço global do aço (R$/kg).
export function calcPesoUnit(corte, comprimento, pesoEspecifico) {
  return (Number(corte) || 0) * (Number(comprimento) || 0) * (Number(pesoEspecifico) || 0);
}
export function calcPesoTotal(pesoUnit, quantidade) {
  return (Number(pesoUnit) || 0) * (Number(quantidade) || 0);
}
export function recalcComponente(comp) {
  const pesoUnit = calcPesoUnit(comp.corte, comp.comprimento, comp.peso_especifico);
  const pesoTotal = calcPesoTotal(pesoUnit, comp.quantidade);
  return { ...comp, peso_unit: pesoUnit, peso_total: pesoTotal };
}
export function recalcComercial(comp) {
  const total = (Number(comp.quantidade) || 0) * (Number(comp.custo_unitario) || 0);
  return { ...comp, total };
}

// Totais de um único produto (componentes/comerciais já filtrados para o produto)
export function calcProdutoTotais(produtoId, componentes, comerciais, precoKg) {
  const comps = (componentes || []).filter((c) => c.produto_id === produtoId);
  const coms = (comerciais || []).filter((c) => c.produto_id === produtoId);
  const peso = comps.reduce((s, c) => s + (Number(c.peso_total) || 0), 0);
  const custoAco = peso * (Number(precoKg) || 0);
  const custoAcessorios = coms.reduce((s, c) => s + (Number(c.total) || 0), 0);
  return { peso, custoAco, custoAcessorios };
}

// Totais do orçamento inteiro (arrays flat de componentes e comerciais)
export function calcTotaisOrcamento(componentes, comerciais, precoKg) {
  const peso_total_aco = (componentes || []).reduce((s, c) => s + (Number(c.peso_total) || 0), 0);
  const custo_acessorios = (comerciais || []).reduce((s, c) => s + (Number(c.total) || 0), 0);
  const custo_total_aco = peso_total_aco * (Number(precoKg) || 0);
  return { peso_total_aco, custo_total_aco, custo_acessorios };
}

// Custo da empresa (base para margem): aço + acessórios + montagem/frete ABSORVIDOS
export function calcCustoEmpresa(custoAco, custoAcessorios, montagem, frete, cobrarMontagem, cobrarFrete) {
  const m = cobrarMontagem ? 0 : (Number(montagem) || 0);
  const f = cobrarFrete ? 0 : (Number(frete) || 0);
  return (Number(custoAco) || 0) + (Number(custoAcessorios) || 0) + m + f;
}

// Total que o cliente paga = valor de venda + montagem/frete repassados
export function calcTotalCliente(valorVenda, montagem, frete, cobrarMontagem, cobrarFrete) {
  const m = cobrarMontagem ? (Number(montagem) || 0) : 0;
  const f = cobrarFrete ? (Number(frete) || 0) : 0;
  return (Number(valorVenda) || 0) + m + f;
}

// Preço de venda para atingir margem M: PV = custo / (1 - margem - carga - comissao)
export function calcPrecoVendaParaMargem(custoTotal, margemPct, cargaTotal, comissaoPct) {
  const denom = 1 - (Number(margemPct) || 0) / 100 - (Number(cargaTotal) || 0) - (Number(comissaoPct) || 0) / 100;
  if (denom <= 0) return Infinity;
  return (Number(custoTotal) || 0) / denom;
}

// Resultado dado o valor de venda: margem real e lucro líquido
export function calcResultadoVenda(valorVenda, custoEmpresa, cargaTotal, comissaoPct) {
  const vv = Number(valorVenda) || 0;
  const comissao = vv * ((Number(comissaoPct) || 0) / 100);
  const impostos = vv * (Number(cargaTotal) || 0);
  const lucro = vv - (Number(custoEmpresa) || 0) - impostos - comissao;
  const margem = vv > 0 ? lucro / vv : 0;
  return { valorVenda: vv, comissao, impostos, lucro, margem };
}

export function statusMargem(margemReal, margemMinima, margemAdequada) {
  const m = (Number(margemReal) || 0) * 100;
  const min = Number(margemMinima) || 0;
  const ade = Number(margemAdequada) || 0;
  if (m < min) return { level: "baixo", label: `Abaixo da margem mínima (${min}%)`, pct: m };
  if (m < ade) return { level: "medio", label: `Acima do mínimo, abaixo da adequada (${ade}%)`, pct: m };
  return { level: "ok", label: "Margem adequada", pct: m };
}

export function formatMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor) || 0);
}
export function formatPeso(valor) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Number(valor) || 0);
}
export function formatPercent(valor) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((Number(valor) || 0) * 100) + "%";
}