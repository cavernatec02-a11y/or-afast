import { formatMoeda, formatPeso } from "@/lib/pricingEngine";

// Gera um arquivo .xls (HTML table) que abre direto no Excel.
// Inclui: dados do cliente, itens (peças + comerciais) e resumo financeiro.
export function exportarOrcamentoExcel(orc) {
  const rows = [];

  // Cabeçalho
  rows.push(`<tr><td colspan="4" style="font-size:18px;font-weight:bold;background:#FF8200;color:#fff;">RIPRESA — Soluções de Armazenagem</td></tr>`);
  rows.push(`<tr><td colspan="4">Proposta Comercial — ${escapeHtml(orc.titulo || "—")}</td></tr>`);
  rows.push(`<tr><td colspan="4">Data: ${fmtData(orc.data)}  ·  Validade: ${orc.validade_dias || 15} dias</td></tr>`);
  rows.push(`<tr><td colspan="4">&nbsp;</td></tr>`);

  // Dados do cliente
  rows.push(`<tr><td colspan="4" style="font-weight:bold;background:#f0f0f0;">DADOS DO CLIENTE</td></tr>`);
  rows.push(`<tr><td colspan="2"><b>Cliente:</b> ${escapeHtml(orc.cliente_nome || "—")}</td><td colspan="2"><b>UF:</b> ${escapeHtml(orc.uf || "—")}</td></tr>`);
  rows.push(`<tr><td colspan="2"><b>Contato:</b> ${escapeHtml(orc.contato || "—")}</td><td colspan="2"><b>Telefone:</b> ${escapeHtml(orc.telefone || "—")}</td></tr>`);
  rows.push(`<tr><td colspan="4"><b>E-mail:</b> ${escapeHtml(orc.email || "—")}</td></tr>`);
  rows.push(`<tr><td colspan="2"><b>Projeto Nº:</b> ${escapeHtml(orc.numero_projeto || "—")}</td><td colspan="2"><b>Folha:</b> ${escapeHtml(orc.numero_folha || "—")}</td></tr>`);
  rows.push(`<tr><td colspan="4">&nbsp;</td></tr>`);

  // Produtos e itens
  (orc.produtos || []).forEach((prod, pi) => {
    rows.push(`<tr><td colspan="4" style="font-weight:bold;background:#f8f8f8;">PRODUTO ${pi + 1}${prod.nome || prod.tipo_produto ? " — " + escapeHtml(prod.nome || prod.tipo_produto) : ""}</td></tr>`);
    if (prod.descricao) {
      rows.push(`<tr><td colspan="4" style="font-style:italic;">${escapeHtml(prod.descricao)}</td></tr>`);
    }

    const comps = (orc.componentes || []).filter((c) => c.produto_id === prod.id);
    if (comps.length > 0) {
      rows.push(`<tr style="font-weight:bold;background:#e0e0e0;"><td>Peça</td><td>Qtde</td><td>Peso Unit (kg)</td><td>Peso Total (kg)</td></tr>`);
      comps.forEach((c) => {
        rows.push(`<tr><td>${escapeHtml(c.nome || "—")}</td><td style="text-align:right;">${c.quantidade ?? 0}</td><td style="text-align:right;">${fmtNum(c.peso_unit)}</td><td style="text-align:right;">${fmtNum(c.peso_total)}</td></tr>`);
      });
    }

    const coms = (orc.componentes_comerciais || []).filter((c) => c.produto_id === prod.id);
    if (coms.length > 0) {
      rows.push(`<tr style="font-weight:bold;background:#e0e0e0;"><td>Componente</td><td>Qtde</td><td>Unidade</td><td>Custo Total</td></tr>`);
      coms.forEach((c) => {
        rows.push(`<tr><td>${escapeHtml(c.descricao || "—")}</td><td style="text-align:right;">${c.quantidade ?? 0}</td><td>${escapeHtml(c.unidade || "")}</td><td style="text-align:right;">${fmtMoeda(c.total)}</td></tr>`);
      });
    }
    rows.push(`<tr><td colspan="4">&nbsp;</td></tr>`);
  });

  // Resumo financeiro
  rows.push(`<tr><td colspan="4" style="font-weight:bold;background:#f0f0f0;">RESUMO FINANCEIRO</td></tr>`);
  rows.push(`<tr><td colspan="3">Peso Total da Estrutura</td><td style="text-align:right;font-weight:bold;">${formatPeso(orc.peso_total_aco)} kg</td></tr>`);
  rows.push(`<tr><td colspan="3">Preço do Aço (R$/kg)</td><td style="text-align:right;">${fmtMoeda(orc.preco_aco_kg)}</td></tr>`);
  rows.push(`<tr><td colspan="3">Custo do Aço</td><td style="text-align:right;">${fmtMoeda(orc.custo_total_aco)}</td></tr>`);
  rows.push(`<tr><td colspan="3">Acessórios / Comerciais</td><td style="text-align:right;">${fmtMoeda(orc.custo_acessorios)}</td></tr>`);
  if (orc.cobrar_montagem) rows.push(`<tr><td colspan="3">Montagem</td><td style="text-align:right;">${fmtMoeda(orc.montagem)}</td></tr>`);
  if (orc.cobrar_frete) rows.push(`<tr><td colspan="3">Frete</td><td style="text-align:right;">${fmtMoeda(orc.frete)}</td></tr>`);
  rows.push(`<tr><td colspan="3">Impostos (${((orc.carga_tributaria || 0) * 100).toFixed(2)}%)</td><td style="text-align:right;">${fmtMoeda(orc.impostos_valor)}</td></tr>`);
  rows.push(`<tr><td colspan="3">Comissão (${orc.comissao_percentual || 0}%)</td><td style="text-align:right;">${fmtMoeda(orc.comissao_valor)}</td></tr>`);
  rows.push(`<tr><td colspan="3">Margem Real</td><td style="text-align:right;font-weight:bold;">${((orc.margem_real || 0) * 100).toFixed(2)}%</td></tr>`);
  rows.push(`<tr><td colspan="3">Lucro Líquido</td><td style="text-align:right;font-weight:bold;">${fmtMoeda(orc.lucro_real)}</td></tr>`);
  rows.push(`<tr><td colspan="3" style="font-weight:bold;font-size:14px;background:#FF8200;color:#fff;">VALOR TOTAL DA PROPOSTA</td><td style="text-align:right;font-weight:bold;font-size:14px;background:#FF8200;color:#fff;">${fmtMoeda(orc.total_cliente)}</td></tr>`);

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1" cellspacing="0" cellpadding="4">${rows.join("")}</table></body></html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Orcamento-Ripresa-${(orc.titulo || "proposta").replace(/[^a-zA-Z0-9]/g, "_")}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function fmtData(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return String(d); }
}
function fmtNum(v) {
  return Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
function fmtMoeda(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
}