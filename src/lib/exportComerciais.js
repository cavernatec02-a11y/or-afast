// Exporta apenas os componentes comerciais de um produto para Excel (.xls).
export function exportarComerciaisExcel(produto, componentes) {
  const titulo = produto?.tipo_produto || produto?.nome || `Produto ${produto?.indexLabel || ""}`;
  const total = componentes.reduce((s, c) => s + (Number(c.total) || 0), 0);

  const rows = [];
  rows.push(`<tr><td colspan="5" style="font-size:16px;font-weight:bold;background:#FF8200;color:#fff;">RIPRESA — Componentes Comerciais</td></tr>`);
  rows.push(`<tr><td colspan="5" style="font-weight:bold;">${escapeHtml(titulo)}</td></tr>`);
  rows.push(`<tr><td colspan="5">&nbsp;</td></tr>`);
  rows.push(`<tr style="font-weight:bold;background:#e0e0e0;"><td>Componente</td><td>Unidade</td><td>Qtde</td><td>Custo Unit (R$)</td><td>Total (R$)</td></tr>`);

  componentes.forEach((c) => {
    rows.push(`<tr>
      <td>${escapeHtml(c.descricao || "—")}</td>
      <td>${escapeHtml(c.unidade || "")}</td>
      <td style="text-align:right;">${c.quantidade ?? 0}</td>
      <td style="text-align:right;">${fmtMoeda(c.custo_unitario)}</td>
      <td style="text-align:right;">${fmtMoeda(c.total)}</td>
    </tr>`);
  });

  rows.push(`<tr><td colspan="4" style="font-weight:bold;">Total Geral</td><td style="text-align:right;font-weight:bold;">${fmtMoeda(total)}</td></tr>`);

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1" cellspacing="0" cellpadding="4">${rows.join("")}</table></body></html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Comerciais-${titulo.replace(/[^a-zA-Z0-9]/g, "_")}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function fmtMoeda(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
}