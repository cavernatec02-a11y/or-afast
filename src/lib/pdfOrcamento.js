import jsPDF from "jspdf";
import { formatMoeda } from "@/lib/pricingEngine";

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

const M = 18;
const W = 174;
const XR = M + W;
const Y_MAX = 270;
const ORANGE = [255, 130, 0];
const DARK = [35, 31, 32];
const GRAY = [88, 89, 91];
const LIGHT = [248, 250, 252];
const BORDER = [226, 232, 240];
const LH = 4.6;

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

function wrap(doc, text, maxW) {
  const t = String(text || "").replace(/\r\n?/g, "\n").replace(/[\u00A0\u2007\u202F\uFEFF]/g, " ").replace(/\t/g, " ").replace(/ +/g, " ");
  const out = [];
  for (const w of t.split(/(\s+)/)) {
    if (w === "" || /^\s+$/.test(w) || doc.getTextWidth(w) <= maxW) { out.push(w); continue; }
    let chunk = "";
    for (const ch of w) {
      if (doc.getTextWidth(chunk + ch) > maxW && chunk) { out.push(chunk + "\n"); chunk = ch; } else chunk += ch;
    }
    out.push(chunk);
  }
  return out.join("");
}

// ── Cabeçalho / páginas ──────────────────────────────────────────────────────
function drawHeader(doc, logo) {
  // faixa superior fina laranja
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, 210, 4, "F");
  if (logo) doc.addImage(logo, "JPEG", M, 12, 24, 24);
  const tx = M + 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...DARK);
  doc.text("RIPRESA", tx, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text("Projetos, Soluções de Armazenagem e Serviços", tx, 25);
  doc.setFontSize(8);
  doc.text("(11) 4154-2959  ·  (11) 4154-2971", XR, 18, { align: "right" });
  doc.text("hericke.comercial@ripresa.com.br", XR, 23, { align: "right" });
  doc.text("ripresa.com.br", XR, 28, { align: "right" });
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(M, 40, XR, 40);
  return 46;
}

function newPage(doc, logo) {
  doc.addPage();
  return drawHeader(doc, logo);
}

function ensure(doc, logo, y, need) {
  return y + need > Y_MAX ? newPage(doc, logo) : y;
}

function writeText(doc, logo, y, text, { x = M, w = W, bold = false, size = 9.5, color = DARK, align = "left", gap = 0, italic = false } = {}) {
  const lines = doc.splitTextToSize(wrap(doc, text, w), w);
  lines.forEach((ln) => {
    y = ensure(doc, logo, y, LH);
    doc.setFont("helvetica", bold ? "bold" : italic ? "italic" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    if (align === "center") doc.text(ln, x + w / 2, y + 3.4, { align: "center" });
    else if (align === "right") doc.text(ln, x + w, y + 3.4, { align: "right" });
    else doc.text(ln, x, y + 3.4);
    y += LH;
  });
  return y + gap;
}

// Caixa de destaque (usada no valor de cada item e no total)
function priceBox(doc, logo, y, label, valor, strong = false) {
  y = ensure(doc, logo, y, 14);
  const h = strong ? 14 : 10;
  if (strong) doc.setFillColor(...ORANGE); else doc.setFillColor(...DARK);
  doc.roundedRect(M, y, W, h, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(strong ? 13 : 10);
  doc.setTextColor(255, 255, 255);
  const ty = y + h / 2 + (strong ? 1.8 : 1.5);
  doc.text(label, M + 5, ty);
  doc.text(valor, XR - 5, ty, { align: "right" });
  return y + h + 5;
}

function drawFooters(doc) {
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) {
    doc.setPage(p);
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.8);
    doc.line(M, 282, XR, 282);
    doc.setLineWidth(0.2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    doc.setTextColor(...GRAY);
    doc.text("Ripresa Projetos, Soluções de Armazenagem e Serviços Eirelli  ·  CNPJ: 21.567.464/0001-54", M, 286);
    doc.text("Estrada dos Romeiros, 796 - Centro - Santana de Parnaíba/SP - CEP 06501-001", M, 289.5);
    doc.text(`Página ${p}/${n}`, XR, 289.5, { align: "right" });
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
  let y = drawHeader(doc, logo);

  // Título + local/data
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text("PROPOSTA COMERCIAL", M, y + 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Santana de Parnaíba, ${dataExtensa(orc.data)}`, XR, y + 2, { align: "right" });
  y += 8;

  // Cliente
  doc.setFillColor(...LIGHT);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(M, y, W, 16, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("CLIENTE", M + 4, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(orc.cliente_nome || "—", M + 4, y + 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  const cont = [orc.contato && `A/C: ${orc.contato}`, orc.telefone && `Fone: ${orc.telefone}`, orc.uf && `UF: ${orc.uf}`].filter(Boolean).join("   ·   ");
  if (cont) doc.text(cont, M + 4, y + 14.5);
  y += 21;

  // Carta de apresentação (curta, primeiro contato)
  y = writeText(doc, logo, y, orc.contato ? `Prezado(a) Sr(a). ${orc.contato},` : "Prezado(a) Senhor(a),", { gap: 3 });
  y = writeText(doc, logo, y, "Agradecemos a oportunidade de apresentar nossa proposta para o projeto em referência. Apresentamos abaixo os itens e o valor correspondente para sua avaliação.", { gap: 4 });

  // Itens — sem quantidades, sem composição detalhada
  const prods = orc.produtos || [];
  const valores = valoresPorProduto(orc);
  prods.forEach((prod, i) => {
    const num = String(i + 1).padStart(2, "0");
    const titulo = (prod.tipo_produto || prod.nome || "Item").toUpperCase();
    y = ensure(doc, logo, y, 24);

    // barra do item
    doc.setFillColor(...DARK);
    doc.rect(M, y, 3, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...DARK);
    doc.text(`ITEM ${num}`, M + 6, y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...GRAY);
    doc.text(titulo, XR, y + 5.5, { align: "right" });
    y += 10;

    // descrição técnica do produto
    if (prod.descricao) {
      y = writeText(doc, logo, y, prod.descricao, { size: 9, gap: 2 });
    }
    // valor do item
    y = priceBox(doc, logo, y, `Valor do Item ${num}`, formatMoeda(valores[i]));
    y += 3;
  });

  // Total
  y = ensure(doc, logo, y, 20);
  y = priceBox(doc, logo, y, "VALOR TOTAL DA PROPOSTA", formatMoeda(orc.total_cliente), true);

  // Validade + observação curta
  y = ensure(doc, logo, y, 14);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text(`Proposta válida por ${orc.validade_dias || 15} dias a partir da data de emissão.`, M, y + 4);
  y += 8;

  // Assinatura
  y = ensure(doc, logo, y + 14, 30);
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.3);
  doc.line(M, y, M + 80, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text("Atenciosamente,", M, y - 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Ripresa Projetos, Soluções de Armazenagem e Serviços Eirelli", M, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("hericke.comercial@ripresa.com.br  ·  (11) 4154-2959  ·  ripresa.com.br", M, y + 9);

  drawFooters(doc);

  const url = URL.createObjectURL(doc.output("blob"));
  return { url, fileName: `Proposta-Ripresa-${(orc.titulo || "proposta").replace(/[^a-zA-Z0-9]/g, "_")}.pdf` };
}