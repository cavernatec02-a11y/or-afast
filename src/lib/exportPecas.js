import { formatMoeda, formatPeso } from "@/lib/pricingEngine";

// Exporta apenas as peças estruturais de um produto para Excel (.xls).
export function exportarPecasExcel(produto, componentes, precoKg) {
  const titulo = produto?.tipo_produto || produto?.nome || `Produto ${produto?.indexLabel || ""}`;
  const pesoTotal = componentes.reduce((s, c) => s + (Number(c.peso_total) || 0), 0);
  const custoTotal = pesoTotal * (Number(precoKg) || 0);

  const rows = [];
  rows.push(`<tr><td colspan="7" style="font-size:16px;font-weight:bold;background:#FF8200;color:#fff;">RIPRESA — Peças Estruturais</td></tr>`);
  rows.push(`<tr><td colspan="7" style="font-weight:bold;">${escapeHtml(titulo)}</td></tr>`);
  rows.push(`<tr><td colspan="7">Preço do aço: ${fmtMoeda(precoKg)} / kg</td></tr>`);
  rows.push(`<tr><td colspan="7">&nbsp;</td></tr>`);
  rows.push(`<tr style="font-weight:bold;background:#e0e0e0;"><td>Descrição</td><td>Qtde</td><td>Corte (m)</td><td>Compr. (m)</td><td>Peso Unit (kg)</td><td>Peso Total (kg)</td><td>Custo (R$)</td></tr>`);

  componentes.forEach((c) => {
    const custo = (Number(c.peso_total) || 0) * (Number(precoKg) || 0);
    rows.push(`<tr>
      <td>${escapeHtml(c.nome || "—")}</td>
      <td style="text-align:right;">${c.quantidade ?? 0}</td>
      <td style="text-align:right;">${c.corte ?? 0}</td>
      <td style="text-align:right;">${c.comprimento ?? 0}</td>
      <td style="text-align:right;">${fmtNum(c.peso_unit)}</td>
      <td style="text-align:right;">${fmtNum(c.peso_total)}</td>
      <td style="text-align:right;">${fmtMoeda(custo)}</td>
    </tr>`);
  });

  rows.push(`<tr><td colspan="5" style="font-weight:bold;">Totais</td><td style="text-align:right;font-weight:bold;">${fmtNum(pesoTotal)} kg</td><td style="text-align:right;font-weight:bold;">${fmtMoeda(custoTotal)}</td></tr>`);

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1" cellspacing="0" cellpadding="4">${rows.join("")}</table></body></html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Pecas-${titulo.replace(/[^a-zA-Z0-9]/g, "_")}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function fmtNum(v) {
  return Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
function fmtMoeda(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
}