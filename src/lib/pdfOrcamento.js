import jsPDF from "jspdf";
import { formatMoeda } from "@/lib/pricingEngine";
import { montarCondicoes } from "@/lib/pdfCondicoes";

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

const X0 = 20;          // margem esquerda
const W = 158;          // largura útil
const XR = X0 + W;      // borda direita
const Y_MAX = 268;      // limite inferior do conteúdo
const Y_START = 52;     // início do conteúdo nas páginas seguintes
const DARK = [35, 31, 32];
const ORANGE = [255, 130, 0];
const LH = 4.6;

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function dataExtensa(d) {
  const [a, m, dia] = String(d || new Date().toISOString()).slice(0, 10).split("-").map(Number);
  return `${String(dia).padStart(2, "0")} de ${MESES[m - 1]} de ${a}`;
}

// Normaliza texto colado: NBSP -> espaço, quebra palavras gigantes
function wrapTextForPdf(doc, text, maxWidth) {
  const t = String(text || "").replace(/\r\n?/g, "\n").replace(/[\u00A0\u2007\u202F\uFEFF]/g, " ").replace(/\t/g, " ").replace(/ +/g, " ");
  const out = [];
  for (const w of t.split(/(\s+)/)) {
    if (w === "" || /^\s+$/.test(w) || doc.getTextWidth(w) <= maxWidth) { out.push(w); continue; }
    let chunk = "";
    for (const ch of w) {
      if (doc.getTextWidth(chunk + ch) > maxWidth && chunk) { out.push(chunk + "\n"); chunk = ch; } else chunk += ch;
    }
    out.push(chunk);
  }
  return out.join("");
}

function fmtDim(v) {
  const n = Number(v);
  return String(Number.isInteger(n) ? n : Number(n.toFixed(2)));
}

function formatComposicaoLinha(c, isLast) {
  const qtde = Number(c.quantidade || 0);
  const nome = (c.nome || "componente").trim();
  const corte = c.corte ? Number(c.corte) : null;
  const comp = c.comprimento ? Number(c.comprimento) : null;
  let dim = "";
  if (corte && comp) dim = ` medindo ${fmtDim(corte)}mm x ${fmtDim(comp)}mm`;
  else if (comp) dim = ` medindo ${fmtDim(comp)}mm`;
  else if (corte) dim = ` medindo ${fmtDim(corte)}mm`;
  return `${qtde > 0 ? qtde + " " : ""}${nome}${dim}${isLast ? "." : ";"}`;
}

// ── Layout de página ─────────────────────────────────────────────────────────
function drawHeader(doc, logo, comTitulo) {
  if (logo) doc.addImage(logo, "JPEG", X0, 8, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text("Tel.: (11) 4154-2959", XR, 20, { align: "right" });
  doc.text("(11) 4154-2971", XR, 26, { align: "right" });
  if (comTitulo) {
    doc.setFontSize(16);
    doc.text("Proposta Comercial", X0 + W / 2, 40, { align: "center" });
  }
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.9);
  doc.line(X0, 45, XR, 45);
  doc.setLineWidth(0.2);
}

function newPage(doc, logo) {
  doc.addPage();
  drawHeader(doc, logo, false);
  return Y_START;
}

function ensure(doc, logo, y, need) {
  return y + need > Y_MAX ? newPage(doc, logo) : y;
}

// Escreve texto com quebra de linha e de página. Retorna novo y.
function writeText(doc, logo, y, text, { x = X0, w = W, bold = false, size = 9.5, bullet = null, underline = false, align = "left", gap = 0 } = {}) {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...DARK);
  const innerW = w - (bullet ? 5 : 0);
  const lines = doc.splitTextToSize(wrapTextForPdf(doc, text, innerW), innerW);
  lines.forEach((ln, i) => {
    y = ensure(doc, logo, y, LH);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...DARK);
    if (bullet && i === 0) doc.text(bullet, x, y + 3.5);
    const tx = x + (bullet ? 5 : 0);
    if (align === "center") doc.text(ln, x + w / 2, y + 3.5, { align: "center" });
    else if (align === "right") doc.text(ln, x + w, y + 3.5, { align: "right" });
    else doc.text(ln, tx, y + 3.5);
    if (underline) {
      const tw = doc.getTextWidth(ln);
      const sx = align === "center" ? x + w / 2 - tw / 2 : align === "right" ? x + w - tw : tx;
      doc.setLineWidth(0.2);
      doc.line(sx, y + 4.3, sx + tw, y + 4.3);
    }
    y += LH;
  });
  return y + gap;
}

function drawSideBarAndFooter(doc) {
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) {
    doc.setPage(p);
    doc.setFillColor(...ORANGE);
    doc.rect(192, 0, 18, 297, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(190.5, 0, 0.8, 297, "F");
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("RIPRESA PROJETOS SOLUÇÕES ARMAZENAGEM E", 196, 12, { angle: -90 });
    doc.text("SERVIÇOS EIRELLI", 203, 12, { angle: -90 });
    // rodapé
    doc.setTextColor(...DARK);
    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.text("RIPRESA", X0 + W / 2, 280, { align: "center" });
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.text("Projetos, Soluções de Armazenagens e Serviços Eirelli", X0 + W / 2, 284, { align: "center" });
    doc.text("(11) 4154-2959 / (11) 4154-2971", X0 + W / 2, 288, { align: "center" });
    if (p > 1) doc.text(String(p), X0 + W / 2, 292, { align: "center" });
  }
}

// Divide o valor de venda entre os produtos, proporcional ao custo de cada um.
function valoresPorProduto(orc) {
  const prods = orc.produtos || [];
  const pesos = prods.map((p) => {
    const aco = (orc.componentes || []).filter((c) => c.produto_id === p.id).reduce((s, c) => s + Number(c.peso_total || 0), 0);
    const com = (orc.componentes_comerciais || []).filter((c) => c.produto_id === p.id).reduce((s, c) => s + Number(c.total || 0), 0);
    return aco * Number(orc.preco_aco_kg || 1) + com;
  });
  const soma = pesos.reduce((a, b) => a + b, 0);
  return pesos.map((v) => (soma > 0 ? (Number(orc.valor_venda || 0) * v) / soma : Number(orc.valor_venda || 0) / (prods.length || 1)));
}

export async function gerarPDFOrcamento(orc) {
  const logo = await loadImageBase64(LOGO_URL);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  drawHeader(doc, logo, true);
  let y = 50;

  // Data e número
  y = writeText(doc, logo, y, `Santana de Parnaíba, ${dataExtensa(orc.data)}`, { align: "right" });
  y = writeText(doc, logo, y, `Orçamento Nº ${orc.titulo || "—"}`, { align: "right", bold: true, gap: 6 });

  // Cliente
  y = writeText(doc, logo, y, "À", { bold: true });
  y = writeText(doc, logo, y, orc.cliente_nome || "—", { bold: true });
  if (orc.uf) y = writeText(doc, logo, y, orc.uf, { bold: true });
  y = writeText(doc, logo, y, `Fone: ${orc.telefone || ""}`);
  y = writeText(doc, logo, y, `E-mail: ${orc.email || ""}`, { gap: 6 });
  if (orc.contato) y = writeText(doc, logo, y, `A/C Sr. ${orc.contato}`, { bold: true, underline: true, align: "center", gap: 6 });

  const servicos = ["fornecimento"];
  if (orc.cobrar_frete && orc.frete > 0) servicos.push("frete");
  if (orc.cobrar_montagem && orc.montagem > 0) servicos.push("montagem");
  const lista = servicos.length > 1 ? servicos.slice(0, -1).join(", ") + " e " + servicos[servicos.length - 1] : servicos[0];
  y = writeText(doc, logo, y, `Ref.: Proposta para ${lista} conforme projeto: ${orc.numero_projeto || "—"}`, { bold: true, underline: true, gap: 6 });
  y = writeText(doc, logo, y, "Prezado Senhor,", { bold: true, gap: 3 });
  y = writeText(doc, logo, y, "Temos o prazer de apresentar o nosso orçamento do material abaixo descrito, para sua avaliação.", { x: X0 + 10, w: W - 10, gap: 6 });

  // Itens
  const prods = orc.produtos || [];
  const valores = valoresPorProduto(orc);
  prods.forEach((prod, i) => {
    y = ensure(doc, logo, y, 30);
    const titulo = (prod.tipo_produto || prod.nome || "").toUpperCase();
    y = writeText(doc, logo, y, `Item ${String(i + 1).padStart(2, "0")} – ${titulo}`, { bold: true, underline: true, gap: 2 });
    if (prod.descricao) y = writeText(doc, logo, y, prod.descricao, { bullet: "•", gap: 3 });

    const comps = (orc.componentes || []).filter((c) => c.produto_id === prod.id);
    const coms = (orc.componentes_comerciais || []).filter((c) => c.produto_id === prod.id);
    if (comps.length > 0) {
      y = writeText(doc, logo, y, "Composição total dos módulos:", { bold: true, gap: 1 });
      comps.forEach((c, k) => { y = writeText(doc, logo, y, formatComposicaoLinha(c, k === comps.length - 1), { bullet: "•", x: X0 + 2, w: W - 2 }); });
      y += 2;
    }
    if (coms.length > 0) {
      y = writeText(doc, logo, y, "Acessórios e componentes:", { bold: true, gap: 1 });
      coms.forEach((c) => {
        const un = c.unidade ? ` (${c.unidade})` : "";
        y = writeText(doc, logo, y, `${Number(c.quantidade || 0)}${un} ${c.descricao || "componente"}.`, { bullet: "•", x: X0 + 2, w: W - 2 });
      });
      y += 2;
    }
    y = writeText(doc, logo, y + 2, `Valor do Item ${String(i + 1).padStart(2, "0")}: ${formatMoeda(valores[i])}`, { bold: true, underline: true, gap: 4 });
  });

  // Valores finais
  y = ensure(doc, logo, y, 30);
  if (orc.cobrar_montagem && orc.montagem > 0) y = writeText(doc, logo, y, `Valor da Montagem: ${formatMoeda(orc.montagem)}`, { bold: true, underline: true });
  if (orc.cobrar_frete && orc.frete > 0) y = writeText(doc, logo, y, `Valor do Frete: ${formatMoeda(orc.frete)}`, { bold: true, underline: true });
  y = writeText(doc, logo, y + 6, `Valor Total ${formatMoeda(orc.total_cliente)}`, { bold: true, underline: true, align: "center", size: 11 });

  // Condições gerais (nova página)
  y = newPage(doc, logo);
  montarCondicoes(orc).forEach((it) => {
    const x = X0 + (it.i || 0) * 8;
    const w = W - (it.i || 0) * 8;
    if (it.t === "h") y = writeText(doc, logo, y + 3, it.x, { bold: true, underline: true, gap: 2 });
    else if (it.t === "hb") y = writeText(doc, logo, y + 3, it.x, { bold: true, gap: 2 });
    else if (it.t === "b") y = writeText(doc, logo, y + 2, it.x, { x, w, bold: true, gap: 2 });
    else if (it.t === "bul") y = writeText(doc, logo, y, it.x, { x: X0 + 8, w: W - 8, bold: true, bullet: "•", gap: 1 });
    else if (it.t === "dash") y = writeText(doc, logo, y, it.x, { x: X0 + 4, w: W - 4, bullet: "-", gap: 1 });
    else y = writeText(doc, logo, y, it.x, { x, w, gap: 2 });
  });

  // Assinaturas
  y = ensure(doc, logo, y + 20, 45);
  doc.setLineWidth(0.3);
  doc.line(X0, y, X0 + 65, y);
  doc.line(X0 + 95, y, XR, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Data", X0, y + 4.5);
  doc.text("Cliente", X0 + 95, y + 4.5);
  doc.text("/        /", X0 + 25, y - 1);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.text("Atenciosamente,", X0, y);
  doc.line(X0, y + 16, X0 + 110, y + 16);
  doc.setFont("helvetica", "bold");
  doc.text("Ripresa Projetos, Soluções de Armazenagens e Serviços Eirelli", X0, y + 20.5);

  drawSideBarAndFooter(doc);

  const ab = doc.output("arraybuffer");
  const bytes = new Uint8Array(ab);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  return { url, bytes, fileName: `Proposta-Ripresa-${(orc.titulo || "proposta").replace(/[^a-zA-Z0-9]/g, "_")}.pdf` };
}