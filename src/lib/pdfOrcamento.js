import jsPDF from "jspdf";
import { formatMoeda, formatPeso } from "@/lib/pricingEngine";

// URL da logo Ripresa (usada via fetch para embeddar no PDF)
const LOGO_URL = "https://media.base44.com/images/public/6a95cd709d1eb3285a3e45a0/ae1c1268b_WhatsAppImage2026-07-20at152818.jpeg";

async function loadImageBase64(url) {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return await new Promise((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const M = 15; // margem lateral
const W = 180; // largura útil (A4 = 210mm)
const ORANGE = [255, 130, 0];
const DARK = [35, 31, 32];
const GRAY = [88, 89, 91];
const LIGHT = [248, 250, 252];
const BORDER = [226, 232, 240];

function addPage(doc) {
  doc.addPage();
  return 20;
}

function checkY(doc, y, needed = 14) {
  if (y + needed > 280) return addPage(doc);
  return y;
}

function headerLine(doc, y) {
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(M, y, M + W, y);
  return y;
}

function sectionTitle(doc, y, text) {
  y = checkY(doc, y, 10);
  doc.setFillColor(...ORANGE);
  doc.rect(M, y, 3, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(text, M + 6, y + 5.5);
  return y + 10;
}

function drawTableHeader(doc, y, cols) {
  y = checkY(doc, y, 10);
  doc.setFillColor(35, 31, 32);
  doc.rect(M, y, W, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  let x = M;
  cols.forEach(({ label, w, align }) => {
    doc.text(label, align === "right" ? x + w - 2 : x + 2, y + 5.5, { align: align === "right" ? "right" : "left" });
    x += w;
  });
  return y + 8;
}

function drawTableRow(doc, y, cols, cells, zebra) {
  y = checkY(doc, y, 7);
  if (zebra) { doc.setFillColor(248, 250, 252); doc.rect(M, y, W, 7, "F"); }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  let x = M;
  cols.forEach(({ w, align }, i) => {
    const txt = String(cells[i] ?? "");
    doc.text(txt, align === "right" ? x + w - 2 : x + 2, y + 5, { align: align === "right" ? "right" : "left" });
    x += w;
  });
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.1);
  doc.line(M, y + 7, M + W, y + 7);
  return y + 7;
}

export async function gerarPDFOrcamento(orc) {
  const logoB64 = await loadImageBase64(LOGO_URL);
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // ── CABEÇALHO ────────────────────────────────────────────────────────────────
  if (logoB64) {
    doc.addImage(logoB64, "JPEG", M, 8, 22, 22);
  }
  // Nome da empresa
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...DARK);
  doc.text("RIPRESA", M + 26, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("Soluções de Armazenagem", M + 26, 21);
  // Contato comercial (direita)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text("vendas@ripresa.com.br", M + W, 14, { align: "right" });
  doc.text("(11) 97376-0433", M + W, 19, { align: "right" });
  // Linha divisória laranja
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(1.2);
  doc.line(M, 34, M + W, 34);
  doc.setLineWidth(0.3);

  // Título "PROPOSTA COMERCIAL"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  doc.text("PROPOSTA COMERCIAL", M + W / 2, 42, { align: "center" });

  let y = 50;

  // ── DADOS DO ORÇAMENTO ───────────────────────────────────────────────────────
  doc.setFillColor(...LIGHT);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(M, y, W, 10, 1, 1, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  const tituloLabel = `Orçamento: ${orc.titulo || "—"}`;
  const metaLabel = `Projeto: ${orc.numero_projeto || "—"}   Folha: ${orc.numero_folha || "—"}   Data: ${fmtData(orc.data)}   Validade: ${orc.validade_dias || 15} dias`;
  doc.text(tituloLabel, M + 3, y + 4.5);
  doc.text(metaLabel, M + 3, y + 8.5);
  y += 15;

  // ── CLIENTE ──────────────────────────────────────────────────────────────────
  y = sectionTitle(doc, y, "DADOS DO CLIENTE");
  doc.setFillColor(...LIGHT);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(M, y, W, 18, 1, 1, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(orc.cliente_nome || "—", M + 3, y + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text(`Contato: ${orc.contato || "—"}   Fone: ${orc.telefone || "—"}   E-mail: ${orc.email || "—"}`, M + 3, y + 10.5);
  doc.text(`UF: ${orc.uf || "—"}   Projeto nº: ${orc.numero_projeto || "—"}`, M + 3, y + 15.5);
  y += 23;

  // ── PRODUTOS ─────────────────────────────────────────────────────────────────
  (orc.produtos || []).forEach((prod, pi) => {
    y = checkY(doc, y, 20);
    y = sectionTitle(doc, y, `PRODUTO ${pi + 1}${prod.nome || prod.tipo_produto ? " — " + (prod.nome || prod.tipo_produto) : ""}`);

    const comps = (orc.componentes || []).filter((c) => c.produto_id === prod.id);
    if (comps.length > 0) {
      const cols = [
        { label: "Descrição da Peça", w: 90, align: "left" },
        { label: "Qtde", w: 20, align: "right" },
        { label: "Corte (m)", w: 30, align: "right" },
        { label: "Compr. (m)", w: 30, align: "right" },
        { label: "Peso Total", w: 30, align: "right" },
      ];
      y = drawTableHeader(doc, y, cols);
      comps.forEach((c, i) => {
        y = drawTableRow(doc, y, cols, [
          c.nome || "—", c.quantidade ?? 0,
          fmtNum(c.corte), fmtNum(c.comprimento),
          `${formatPeso(c.peso_total)} kg`,
        ], i % 2 === 0);
      });
      y += 4;
    }

    const coms = (orc.componentes_comerciais || []).filter((c) => c.produto_id === prod.id);
    if (coms.length > 0) {
      const cols2 = [
        { label: "Componente / Acessório", w: 100, align: "left" },
        { label: "Qtde", w: 20, align: "right" },
        { label: "Un.", w: 20, align: "right" },
        { label: "Valor (R$)", w: 40, align: "right" },
      ];
      y = drawTableHeader(doc, y, cols2);
      coms.forEach((c, i) => {
        y = drawTableRow(doc, y, cols2, [
          c.descricao || "—", c.quantidade ?? 0, c.unidade || "un", formatMoeda(c.total),
        ], i % 2 === 0);
      });
      y += 6;
    }
  });

  // ── RESUMO FINANCEIRO ────────────────────────────────────────────────────────
  y = checkY(doc, y, 60);
  y = sectionTitle(doc, y, "RESUMO FINANCEIRO");

  // Tabela de itens do resumo (sem Custo do Aço — informação interna)
  const itensResumo = [];
  if (orc.custo_acessorios > 0) itensResumo.push(["Acessórios e Componentes", formatMoeda(orc.custo_acessorios)]);
  if (orc.cobrar_montagem && orc.montagem > 0) itensResumo.push(["Montagem", formatMoeda(orc.montagem)]);
  if (orc.cobrar_frete && orc.frete > 0) itensResumo.push(["Frete", formatMoeda(orc.frete)]);

  const colsRes = [
    { label: "Descrição", w: 140, align: "left" },
    { label: "Valor", w: 40, align: "right" },
  ];
  if (itensResumo.length > 0) {
    y = drawTableHeader(doc, y, colsRes);
    itensResumo.forEach(([desc, val], i) => {
      y = drawTableRow(doc, y, colsRes, [desc, val], i % 2 === 0);
    });
    y += 2;
  }

  // Caixa VALOR TOTAL
  y = checkY(doc, y, 18);
  doc.setFillColor(...ORANGE);
  doc.roundedRect(M, y, W, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("VALOR TOTAL DA PROPOSTA", M + 4, y + 9);
  doc.text(formatMoeda(orc.total_cliente), M + W - 3, y + 9, { align: "right" });
  y += 18;

  // ── OBSERVAÇÕES ──────────────────────────────────────────────────────────────
  y = checkY(doc, y, 24);
  doc.setFillColor(...LIGHT);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(M, y, W, 22, 1, 1, "FD");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`• Proposta válida por ${orc.validade_dias || 15} dias a partir da data de emissão.`, M + 4, y + 6);
  doc.text(`• Peso total da estrutura: ${formatPeso(orc.peso_total_aco)} kg.`, M + 4, y + 11);
  doc.text("• Valores sujeitos a confirmação após detalhamento técnico final.", M + 4, y + 16);
  doc.text("• Prazo de entrega e condições de pagamento a combinar.", M + 4, y + 21);
  y += 28;

  // ── RODAPÉ ───────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.8);
    doc.line(M, 287, M + W, 287);
    doc.setLineWidth(0.3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text("RIPRESA Soluções de Armazenagem  ·  vendas@ripresa.com.br  ·  (11) 97376-0433", M, 292);
    doc.text(`Página ${p}/${pageCount}  ·  ${fmtData(new Date().toISOString())}`, M + W, 292, { align: "right" });
  }

  doc.save(`Proposta-Ripresa-${(orc.titulo || "proposta").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

function fmtData(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return String(d); }
}
function fmtNum(v) {
  return Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}