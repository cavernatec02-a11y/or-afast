import jsPDF from "jspdf";
import { formatMoeda } from "@/lib/pricingEngine";
import { STATUS_LABELS, financeiro, tiposDe, numeroProposta, validadeAte, fmtData } from "@/lib/relatorioUtils";

const LOGO_URL = "https://media.base44.com/images/public/6a95cd709d1eb3285a3e45a0/ae1c1268b_WhatsAppImage2026-07-20at152818.jpeg";

async function logoB64() {
  try {
    const blob = await (await fetch(LOGO_URL)).blob();
    return await new Promise((r) => { const fr = new FileReader(); fr.onloadend = () => r(fr.result); fr.readAsDataURL(blob); });
  } catch { return null; }
}

export function exportarRelatorioCSV(lista) {
  const head = ["Proposta", "Emissao", "Validade", "Status", "Responsavel", "Cliente", "Contato", "Telefone", "UF", "Tipos de estrutura", "Subtotal materiais", "Frete", "Montagem", "Valor global"];
  const num = (v) => v.toFixed(2).replace(".", ",");
  const rows = lista.map((o) => {
    const f = financeiro(o);
    return [numeroProposta(o), fmtData(o.data), validadeAte(o), STATUS_LABELS[o.status || "rascunho"], o.created_by || "", o.cliente_nome || "", o.contato || "", o.telefone || "", o.uf || "",
      tiposDe(o).join(" / "), num(f.subtotal), f.freteLabel || num(f.frete), f.montLabel || num(f.montagem), num(f.total)];
  });
  const csv = "\uFEFF" + [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `Relatorio-Ripresa-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

export async function exportarRelatorioPDF(lista, k, periodo) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const logo = await logoB64();
  const M = 12, XR = 285;
  const header = () => {
    doc.setFillColor(255, 130, 0); doc.rect(0, 0, 297, 3, "F");
    if (logo) doc.addImage(logo, "JPEG", M, 7, 16, 16);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(35, 31, 32);
    doc.text("RIPRESA - Relatório Comercial de Orçamentos", M + 20, 14);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(88, 89, 91);
    doc.text(`Período: ${periodo}  ·  Emitido em ${new Date().toLocaleDateString("pt-BR")}`, M + 20, 19);
    doc.text("(11) 4154-2959 · (11) 97376-0433 · ripresa.com.br", XR, 14, { align: "right" });
    return 30;
  };
  let y = header();

  // Resumo
  const resumo = [["Volume cotado", formatMoeda(k.volume)], ["Propostas", String(lista.length)], ["Conversão", `${k.conversao.toFixed(1)}%`], ["Ticket médio", formatMoeda(k.ticket)], ["Estrutura", formatMoeda(k.estrutura)], ["Serviços", formatMoeda(k.servicos)]];
  const bw = (XR - M) / resumo.length;
  resumo.forEach(([l, v], i) => {
    const x = M + i * bw;
    doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240); doc.roundedRect(x, y, bw - 2, 14, 1.5, 1.5, "FD");
    doc.setFontSize(7); doc.setTextColor(88, 89, 91); doc.text(l.toUpperCase(), x + 3, y + 5);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(35, 31, 32); doc.text(v, x + 3, y + 11);
    doc.setFont("helvetica", "normal");
  });
  y += 20;

  const cols = [["Proposta", 20], ["Emissão", 20], ["Status", 26], ["Cliente", 58], ["UF", 10], ["Estrutura", 50], ["Materiais", 25], ["Frete", 22], ["Montagem", 22], ["Total", 20]];
  const drawHead = () => {
    doc.setFillColor(35, 31, 32); doc.rect(M, y, XR - M, 7, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
    let x = M; cols.forEach(([h, w], i) => { i >= 6 ? doc.text(h, x + w - 1.5, y + 4.8, { align: "right" }) : doc.text(h, x + 1.5, y + 4.8); x += w; });
    y += 7;
  };
  const fit = (t, w) => { let s = String(t); while (s && doc.getTextWidth(s) > w - 3) s = s.slice(0, -1); return s.length < String(t).length ? s.slice(0, -1) + "…" : s; };
  drawHead();
  lista.forEach((o, idx) => {
    if (y > 190) { doc.addPage(); y = header(); drawHead(); }
    const f = financeiro(o);
    if (idx % 2) { doc.setFillColor(248, 250, 252); doc.rect(M, y, XR - M, 6.5, "F"); }
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(35, 31, 32);
    const vals = [`#${numeroProposta(o)}`, fmtData(o.data), STATUS_LABELS[o.status || "rascunho"], o.cliente_nome || "—", o.uf || "—", tiposDe(o).join(", ") || "—",
      formatMoeda(f.subtotal), f.freteLabel || formatMoeda(f.frete), f.montLabel || formatMoeda(f.montagem), formatMoeda(f.total)];
    let x = M;
    cols.forEach(([, w], i) => { const v = fit(vals[i], w); i >= 6 ? doc.text(v, x + w - 1.5, y + 4.4, { align: "right" }) : doc.text(v, x + 1.5, y + 4.4); x += w; });
    y += 6.5;
  });
  doc.setDrawColor(255, 130, 0); doc.setLineWidth(0.5); doc.line(M, y + 1, XR, y + 1);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text(`TOTAL GERAL: ${formatMoeda(k.volume)}`, XR, y + 7, { align: "right" });

  doc.save(`Relatorio-Ripresa-${new Date().toISOString().slice(0, 10)}.pdf`);
}