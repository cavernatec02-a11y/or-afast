import jsPDF from "jspdf";
import { formatMoeda, formatPeso } from "@/lib/pricingEngine";

// Gera a proposta comercial em PDF (voltada para o cliente — sem margem/lucro).
export function gerarPDFOrcamento(orc) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const M = 15;
  const W = 180;
  let y = 30;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("CAVERNATEC — Estruturas de Armazenagem", M, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Proposta Comercial", 210 - M, 13, { align: "right" });

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Orçamento: ${orc.titulo || ""}`, M, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nº Projeto: ${orc.numero_projeto || "—"}    Folha: ${orc.numero_folha || "—"}    Data: ${fmtData(orc.data)}`, M, y);
  y += 8;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(M, y, W, 22, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CLIENTE", M + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${orc.cliente_nome || "—"}`, M + 3, y + 10);
  doc.text(`Contato: ${orc.contato || "—"}    Telefone: ${orc.telefone || "—"}`, M + 3, y + 15);
  doc.text(`E-mail: ${orc.email || "—"}    UF: ${orc.uf || "—"}`, M + 3, y + 20);
  y += 28;

  // Cada produto vira um bloco
  (orc.produtos || []).forEach((prod, pi) => {
    y = ensureSpace(doc, y, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Produto ${pi + 1}: ${prod.nome || prod.tipo_produto || "—"}`, M, y);
    y += 5;
    y = drawTable(doc, y, ["Descrição", "Qtde", "Peso Total (kg)"], [110, 25, 45],
      (prod.componentes || []).map((c) => [c.nome || "—", String(c.quantidade ?? 0), formatPeso(c.peso_total)]));

    if ((prod.componentes_comerciais || []).length) {
      y += 3;
      y = drawTable(doc, y, ["Componente", "Qtde", "Un.", "Valor (R$)"], [100, 20, 20, 40],
        prod.componentes_comerciais.map((c) => [c.descricao || "—", String(c.quantidade ?? 0), c.unidade || "un", formatMoeda(c.total)]));
    }
    y += 4;
  });

  // Resumo financeiro
  const linhas = [
    ["Custo do Aço", formatMoeda(orc.custo_total_aco)],
    ["Acessórios", formatMoeda(orc.custo_acessorios)],
  ];
  if (orc.cobrar_montagem) linhas.push(["Montagem", formatMoeda(orc.montagem)]);
  if (orc.cobrar_frete) linhas.push(["Frete", formatMoeda(orc.frete)]);

  const boxH = 14 + linhas.length * 5 + 10;
  y = ensureSpace(doc, y, boxH);
  y += 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(M, y, W, boxH, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Resumo Financeiro", M + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let ry = y + 12;
  linhas.forEach(([l, v]) => { doc.text(l, M + 3, ry); doc.text(v, M + W - 3, ry, { align: "right" }); ry += 5; });
  doc.setDrawColor(203, 213, 225);
  doc.line(M + 3, ry, M + W - 3, ry);
  ry += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("VALOR TOTAL", M + 3, ry);
  doc.text(formatMoeda(orc.total_cliente), M + W - 3, ry, { align: "right" });
  y += boxH + 4;

  y = ensureSpace(doc, y, 22);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const validade = orc.validade_dias || 15;
  doc.text(`Proposta válida por ${validade} dias a partir da data de emissão.`, M, y); y += 5;
  doc.text(`Peso total da estrutura: ${formatPeso(orc.peso_total_aco)} kg.`, M, y); y += 5;
  doc.text("Valores sujeitos a confirmação após detalhamento técnico final.", M, y);

  doc.setDrawColor(226, 232, 240);
  doc.line(M, 287, 210 - M, 287);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.text("CavernaTec Estruturas de Armazenagem — OrçaFast", M, 292);
  doc.text(`Orçamento gerado em ${fmtData(new Date().toISOString())}`, 210 - M, 292, { align: "right" });

  doc.save(`Orcamento-${(orc.titulo || "proposta").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

function drawTable(doc, y, headers, colW, rows) {
  const M = 15;
  const totalW = colW.reduce((a, b) => a + b, 0);
  doc.setFillColor(241, 245, 249);
  doc.rect(M, y, totalW, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  let x = M;
  headers.forEach((h, i) => { doc.text(h, x + 2, y + 5); x += colW[i]; });
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  rows.forEach((r) => {
    y = ensureSpace(doc, y, 7);
    x = M;
    r.forEach((cell, i) => {
      doc.text(String(cell), x + (i >= 1 ? colW[i] - 2 : 2), y + 5, i >= 1 ? { align: "right" } : {});
      x += colW[i];
    });
    doc.setDrawColor(241, 245, 249);
    doc.line(M, y + 7, M + totalW, y + 7);
    y += 7;
  });
  return y;
}

function ensureSpace(doc, y, needed) {
  if (y + needed > 285) { doc.addPage(); return 20; }
  return y;
}
function fmtData(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return String(d); }
}