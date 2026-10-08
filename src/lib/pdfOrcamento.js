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

const M = 15;            // margem esquerda
const W = 176;           // largura útil (deixa espaço para a faixa laranja lateral)
const XR = M + W;
const Y_MAX = 276;       // limite inferior do conteúdo
const ORANGE = [255, 130, 0];
const DARK = [35, 31, 32];
const GRAY = [88, 89, 91];
const LIGHT = [248, 250, 252];
const BORDER = [226, 232, 240];
const LH = 4.4;

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function dataExtensa(d) {
  const [a, m, dia] = String(d || new Date().toISOString()).slice(0, 10).split("-").map(Number);
  return `${String(dia).padStart(2, "0")} de ${MESES[m - 1]} de ${a}`;
}
function fmtData(d) {
  if (!d) return "—";
  const [a, m, dia] = String(d).slice(0, 10).split("-");
  return `${dia}/${m}/${a}`;
}

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

// ── Cabeçalho / páginas ──────────────────────────────────────────────────────
function drawHeader(doc, logo, full) {
  if (logo) doc.addImage(logo, "JPEG", M, 8, full ? 22 : 16, full ? 22 : 16);
  const tx = M + (full ? 26 : 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(full ? 18 : 13);
  doc.setTextColor(...DARK);
  doc.text("RIPRESA", tx, full ? 16 : 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(full ? 9 : 8);
  doc.setTextColor(...GRAY);
  doc.text("Soluções de Armazenagem", tx, full ? 21 : 19);
  doc.setFontSize(8.5);
  doc.text("Tel.: (11) 4154-2959 / (11) 4154-2971", XR, full ? 14 : 13, { align: "right" });
  doc.text("hericke.comercial@ripresa.com.br  ·  ripresa.com.br", XR, full ? 19 : 18, { align: "right" });
  const ly = full ? 33 : 27;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(1.2);
  doc.line(M, ly, XR, ly);
  doc.setLineWidth(0.2);
  return ly + 6;
}

function newPage(doc, logo) {
  doc.addPage();
  return drawHeader(doc, logo, false);
}

function ensure(doc, logo, y, need) {
  return y + need > Y_MAX ? newPage(doc, logo) : y;
}

function writeText(doc, logo, y, text, { x = M, w = W, bold = false, size = 9.5, color = DARK, bullet = null, underline = false, align = "left", gap = 0 } = {}) {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  const innerW = w - (bullet ? 5 : 0);
  const lines = doc.splitTextToSize(wrapTextForPdf(doc, text, innerW), innerW);
  lines.forEach((ln, i) => {
    y = ensure(doc, logo, y, LH);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    if (bullet && i === 0) { doc.setTextColor(...ORANGE); doc.text(bullet, x, y + 3.5); doc.setTextColor(...color); }
    const tx = x + (bullet ? 5 : 0);
    if (align === "center") doc.text(ln, x + w / 2, y + 3.5, { align: "center" });
    else if (align === "right") doc.text(ln, x + w, y + 3.5, { align: "right" });
    else doc.text(ln, tx, y + 3.5);
    if (underline) {
      const tw = doc.getTextWidth(ln);
      const sx = align === "center" ? x + w / 2 - tw / 2 : align === "right" ? x + w - tw : tx;
      doc.line(sx, y + 4.3, sx + tw, y + 4.3);
    }
    y += LH;
  });
  return y + gap;
}

function sectionTitle(doc, logo, y, text) {
  y = ensure(doc, logo, y, 14);
  doc.setFillColor(...ORANGE);
  doc.rect(M, y, 3, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK);
  doc.text(text, M + 6, y + 5.3);
  return y + 10;
}

function infoBox(doc, y, lines) {
  const h = 5 + lines.length * 5;
  doc.setFillColor(...LIGHT);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(M, y, W, h, 1.5, 1.5, "FD");
  lines.forEach(([txt, bold], i) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 9.5 : 8.5);
    doc.setTextColor(...(bold ? DARK : GRAY));
    doc.text(String(txt), M + 4, y + 6 + i * 5);
  });
  return y + h + 5;
}

function valueBar(doc, logo, y, label, valor, strong = false) {
  y = ensure(doc, logo, y, 12);
  const h = strong ? 13 : 9;
  if (strong) doc.setFillColor(...ORANGE); else doc.setFillColor(...DARK);
  doc.roundedRect(M, y, W, h, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(strong ? 12.5 : 9.5);
  doc.setTextColor(255, 255, 255);
  const ty = y + h / 2 + (strong ? 1.6 : 1.3);
  doc.text(label, M + 4, ty);
  doc.text(valor, XR - 4, ty, { align: "right" });
  return y + h + 4;
}

function tableRow(doc, logo, y, desc, valor, zebra) {
  y = ensure(doc, logo, y, 8);
  if (zebra) { doc.setFillColor(...LIGHT); doc.rect(M, y, W, 7.5, "F"); }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(desc, M + 3, y + 5);
  doc.setFont("helvetica", "bold");
  doc.text(valor, XR - 3, y + 5, { align: "right" });
  doc.setDrawColor(...BORDER);
  doc.line(M, y + 7.5, XR, y + 7.5);
  return y + 7.5;
}

function drawFooters(doc) {
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) {
    doc.setPage(p);
    // faixa lateral Ripresa
    doc.setFillColor(...ORANGE);
    doc.rect(200, 0, 10, 297, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("RIPRESA  ·  PROJETOS, SOLUÇÕES DE ARMAZENAGEM E SERVIÇOS", 203.5, 14, { angle: -90 });
    // rodapé
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.8);
    doc.line(M, 283, XR, 283);
    doc.setLineWidth(0.2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    doc.setTextColor(...GRAY);
    doc.text("Ripresa Projetos, Soluções de Armazenagem e Serviços Eirelli  ·  CNPJ: 21.567.464/0001-54", M, 287);
    doc.text("Estrada dos Romeiros, 796 - Centro - Santana de Parnaíba/SP - CEP 06501-001  ·  (11) 4154-2959", M, 290.5);
    doc.text(`Página ${p}/${n}`, XR, 290.5, { align: "right" });
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
  let y = drawHeader(doc, logo, true);

  // Título + local/data
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...DARK);
  doc.text("PROPOSTA COMERCIAL", M, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Santana de Parnaíba, ${dataExtensa(orc.data)}`, XR, y + 4, { align: "right" });
  y += 10;

  // Dados do orçamento + cliente
  y = infoBox(doc, y, [
    [`Orçamento Nº ${orc.titulo || "—"}`, true],
    [`Projeto: ${orc.numero_projeto || "—"}   ·   Folha: ${orc.numero_folha || "—"}   ·   Data: ${fmtData(orc.data)}   ·   Validade: ${orc.validade_dias || 15} dias`],
  ]);
  y = sectionTitle(doc, logo, y, "CLIENTE");
  y = infoBox(doc, y, [
    [orc.cliente_nome || "—", true],
    [`A/C: ${orc.contato || "—"}   ·   Fone: ${orc.telefone || "—"}   ·   UF: ${orc.uf || "—"}`],
    [`E-mail: ${orc.email || "—"}`],
  ]);

  // Carta de apresentação
  const servicos = ["fornecimento"];
  if (orc.cobrar_frete && orc.frete > 0) servicos.push("frete");
  if (orc.cobrar_montagem && orc.montagem > 0) servicos.push("montagem");
  const lista = servicos.length > 1 ? servicos.slice(0, -1).join(", ") + " e " + servicos[servicos.length - 1] : servicos[0];
  y = writeText(doc, logo, y, `Ref.: Proposta para ${lista} conforme projeto ${orc.numero_projeto || "—"}`, { bold: true, gap: 3 });
  y = writeText(doc, logo, y, orc.contato ? `Prezado(a) Sr(a). ${orc.contato},` : "Prezado(a) Senhor(a),", { gap: 1.5 });
  y = writeText(doc, logo, y, "Temos o prazer de apresentar nosso orçamento para o material abaixo descrito, para sua avaliação.", { gap: 6 });

  // Itens
  const prods = orc.produtos || [];
  const valores = valoresPorProduto(orc);
  prods.forEach((prod, i) => {
    const num = String(i + 1).padStart(2, "0");
    const titulo = (prod.tipo_produto || prod.nome || "Produto").toUpperCase();
    y = sectionTitle(doc, logo, y, `ITEM ${num} — ${titulo}${prod.nome && prod.tipo_produto ? " · " + prod.nome : ""}`);

    if (prod.descricao) {
      y = writeText(doc, logo, y, "Descrição do projeto:", { bold: true, x: M + 3, w: W - 3 });
      y = writeText(doc, logo, y, prod.descricao, { x: M + 3, w: W - 3, gap: 3 });
    }

    const comps = (orc.componentes || []).filter((c) => c.produto_id === prod.id);
    if (comps.length > 0) {
      y = writeText(doc, logo, y, "Composição total dos módulos:", { bold: true, x: M + 3, w: W - 3, gap: 0.5 });
      comps.forEach((c, k) => { y = writeText(doc, logo, y, formatComposicaoLinha(c, k === comps.length - 1), { bullet: "•", x: M + 5, w: W - 5, size: 9 }); });
      y += 2.5;
    }
    const coms = (orc.componentes_comerciais || []).filter((c) => c.produto_id === prod.id);
    if (coms.length > 0) {
      y = writeText(doc, logo, y, "Acessórios e componentes:", { bold: true, x: M + 3, w: W - 3, gap: 0.5 });
      coms.forEach((c) => {
        const un = c.unidade ? ` (${c.unidade})` : "";
        y = writeText(doc, logo, y, `${Number(c.quantidade || 0)}${un} ${c.descricao || "componente"}.`, { bullet: "•", x: M + 5, w: W - 5, size: 9 });
      });
      y += 2.5;
    }
    y = valueBar(doc, logo, y + 1, `Valor do Item ${num}`, formatMoeda(valores[i]));
    y += 3;
  });

  // Resumo financeiro
  y = ensure(doc, logo, y, 50);
  y = sectionTitle(doc, logo, y, "RESUMO FINANCEIRO");
  const linhas = [["Fornecimento das estruturas", formatMoeda(orc.valor_venda)]];
  if (orc.cobrar_montagem && orc.montagem > 0) linhas.push(["Montagem", formatMoeda(orc.montagem)]);
  if (orc.cobrar_frete && orc.frete > 0) linhas.push(["Frete", formatMoeda(orc.frete)]);
  linhas.forEach(([d, v], k) => { y = tableRow(doc, logo, y, d, v, k % 2 === 0); });
  y = valueBar(doc, logo, y + 3, "VALOR TOTAL DA PROPOSTA", formatMoeda(orc.total_cliente), true);

  // Condições gerais
  y = newPage(doc, logo);
  y = sectionTitle(doc, logo, y, "CONDIÇÕES GERAIS DE FORNECIMENTO");
  montarCondicoes(orc).forEach((it) => {
    const x = M + (it.i || 0) * 8;
    const w = W - (it.i || 0) * 8;
    if (it.t === "h") y = writeText(doc, logo, y + 3, it.x, { bold: true, underline: true, gap: 2 });
    else if (it.t === "hb") y = writeText(doc, logo, y + 3, it.x, { bold: true, gap: 2 });
    else if (it.t === "b") y = writeText(doc, logo, y + 2, it.x, { x, w, bold: true, gap: 2 });
    else if (it.t === "bul") y = writeText(doc, logo, y, it.x, { x: M + 8, w: W - 8, bold: true, bullet: "•", gap: 1 });
    else if (it.t === "dash") y = writeText(doc, logo, y, it.x, { x: M + 4, w: W - 4, bullet: "-", gap: 1 });
    else y = writeText(doc, logo, y, it.x, { x, w, gap: 2 });
  });

  // Assinaturas
  y = ensure(doc, logo, y + 18, 45);
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.3);
  doc.line(M, y, M + 65, y);
  doc.line(M + 95, y, XR, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text("/        /", M + 25, y - 1);
  doc.text("Data", M, y + 4.5);
  doc.text("Cliente", M + 95, y + 4.5);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.text("Atenciosamente,", M, y);
  doc.line(M, y + 16, M + 110, y + 16);
  doc.setFont("helvetica", "bold");
  doc.text("Ripresa Projetos, Soluções de Armazenagem e Serviços Eirelli", M, y + 20.5);

  drawFooters(doc);

  const url = URL.createObjectURL(doc.output("blob"));
  return { url, fileName: `Proposta-Ripresa-${(orc.titulo || "proposta").replace(/[^a-zA-Z0-9]/g, "_")}.pdf` };
}