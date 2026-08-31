import jsPDF from "jspdf";
import { formatMoeda, formatPeso } from "@/lib/pricingEngine";

// Gera a proposta comercial em PDF (voltada para o cliente — sem margem/lucro).
export function gerarPDFOrcamento(orc) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const M = 15;
  const W = 180;
  let y = 18;

  // --- Cabeçalho ---
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("CAVERNATEC — Estruturas de Armazenagem", M, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Proposta Comercial", 210 - M, 13, { align: "right" });
  y = 30;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Orçamento: ${orc.titulo || ""}`, M, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nº Projeto: ${orc.numero_projeto || "—"}    Folha: ${orc.numero_folha || "—"}    Data: ${fmtData(orc.data)}`, M, y);
  y += 8;

  // --- Dados do cliente ---
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

  // --- Tabela de peças estruturais ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Peças Estruturais", M, y);
  y += 4;
  y = drawTable(doc, y, ["Descrição", "Qtde", "Peso Total (kg)", "Valor (R$)"], [90, 20, 35, 35],
    (orc.componentes || []).map((c) => [c.nome || "—", String(c.quantidade ?? 0), formatPeso(c.peso_total), formatMoeda(c.custo)]));

  // --- Componentes comerciais ---
  if ((orc.componentes_comerciais || []).length) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Componentes Comerciais", M, y);
    y += 4;
    y = drawTable(doc, y, ["Descrição", "Qtde", "Un.", "Valor (R$)"], [100, 20, 20, 40],
      orc.componentes_comerciais.map((c) => [c.descricao || "—", String(c.quantidade ?? 0), c.unidade || "un", formatMoeda(c.total)]));
  }

  // --- Resumo financeiro ---
  y = ensureSpace(doc, y, 50);
  y += 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(M, y, W, 42, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Resumo Financeiro", M + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const rx = M + 3;
  let ry = y + 12;
  const resumo = [
    ["Custo do Aço", formatMoeda(orc.custo_total_aco)],
    ["Acessórios", formatMoeda(orc.custo_acessorios)],
    ["Montagem", formatMoeda(orc.montagem)],
    ["Frete", formatMoeda(orc.frete)],
  ];
  resumo.forEach(([l, v]) => {
    doc.text(l, rx, ry);
    doc.text(v, M + W - 3, ry, { align: "right" });
    ry += 5;
  });
  doc.setDrawColor(203, 213, 225);
  doc.line(rx, ry, M + W - 3, ry);
  ry += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("VALOR TOTAL", rx, ry);
  doc.text(formatMoeda(orc.valor_venda), M + W - 3, ry, { align: "right" });
  y += 48;

  // --- Condições / rodapé ---
  y = ensureSpace(doc, y, 22);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const validade = orc.validade_dias || 15;
  doc.text(`Proposta válida por ${validade} dias a partir da data de emissão.`, M, y);
  y += 5;
  doc.text(`Peso total da estrutura: ${formatPeso(orc.peso_total_aco)} kg.`, M, y);
  y += 5;
  doc.text("Valores sujeitos a confirmação após detalhamento técnico final.", M, y);

  // rodapé página
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
  // cabeçalho
  doc.setFillColor(241, 245, 249);
  doc.rect(M, y, colW.reduce((a, b) => a + b, 0), 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  let x = M;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y + 5);
    x += colW[i];
  });
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  rows.forEach((r) => {
    y = ensureSpace(doc, y, 7);
    x = M;
    r.forEach((cell, i) => {
      const align = i >= 1 ? { align: "right" } : {};
      doc.text(String(cell), x + (i >= 1 ? colW[i] - 2 : 2), y + 5, align);
      x += colW[i];
    });
    doc.setDrawColor(241, 245, 249);
    doc.line(M, y + 7, M + colW.reduce((a, b) => a + b, 0), y + 7);
    y += 7;
  });
  return y;
}

function ensureSpace(doc, y, needed) {
  if (y + needed > 285) {
    doc.addPage();
    return 20;
  }
  return y;
}

function fmtData(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("pt-BR");
  } catch {
    return String(d);
  }
}