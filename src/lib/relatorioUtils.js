export const STATUS_LABELS = { rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado", recusado: "Recusado/Cancelado" };
export const TIPOS_ESTRUTURA = ["Porta-Palete", "Mezanino", "Cantilever", "Drive-in", "Pisos"];

const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function financeiro(o) {
  const subtotal = Number(o.valor_venda || 0);
  const frete = Number(o.frete || 0);
  const mont = Number(o.montagem || 0);
  const freteCob = o.cobrar_frete && frete > 0;
  const montCob = o.cobrar_montagem && mont > 0;
  return {
    subtotal,
    frete: freteCob ? frete : 0,
    montagem: montCob ? mont : 0,
    freteLabel: freteCob ? null : frete > 0 ? "Incluso" : "FOB/Retira",
    montLabel: montCob ? null : mont > 0 ? "Inclusa" : "Não inclusa",
    total: subtotal + (freteCob ? frete : 0) + (montCob ? mont : 0),
  };
}

export const tiposDe = (o) => (o.produtos || []).map((p) => p.tipo_produto || p.nome).filter(Boolean);
export const numeroProposta = (o) => o.numero_projeto || String(o.id || "").slice(-6).toUpperCase();
export const qtdPecas = (o) => (o.componentes || []).reduce((s, c) => s + (Number(c.quantidade) || 0), 0);

export function validadeAte(o) {
  if (!o.data) return "—";
  const d = new Date(o.data + "T12:00:00");
  d.setDate(d.getDate() + Number(o.validade_dias || 15));
  return d.toLocaleDateString("pt-BR");
}
export const fmtData = (d) => (d ? new Date(d.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR") : "—");

export function filtrar(lista, f) {
  const q = norm(f.busca);
  return lista.filter((o) => {
    const data = (o.data || o.created_date || "").slice(0, 10);
    if (f.inicio && data < f.inicio) return false;
    if (f.fim && data > f.fim) return false;
    if (f.status !== "todos" && (o.status || "rascunho") !== f.status) return false;
    if (f.tipo !== "todos" && !tiposDe(o).some((t) => norm(t).includes(norm(f.tipo).replace("-", "").slice(0, 5)) || norm(t).replace("-", "").includes(norm(f.tipo).replace("-", "").slice(0, 5)))) return false;
    if (q && ![o.cliente_nome, o.titulo, numeroProposta(o), o.numero_projeto].some((v) => norm(v).includes(q))) return false;
    return true;
  });
}

export function kpis(lista) {
  const st = { rascunho: 0, enviado: 0, aprovado: 0, recusado: 0 };
  let volume = 0, estrutura = 0, servicos = 0;
  lista.forEach((o) => {
    st[o.status || "rascunho"] += 1;
    const f = financeiro(o);
    volume += f.total;
    estrutura += f.subtotal;
    servicos += f.frete + f.montagem;
  });
  return { st, volume, ticket: lista.length ? volume / lista.length : 0, estrutura, servicos, conversao: lista.length ? (st.aprovado / lista.length) * 100 : 0 };
}

const iso = (d) => d.toISOString().slice(0, 10);
export function atalhoPeriodo(tipo) {
  const hoje = new Date();
  if (tipo === "hoje") return { inicio: iso(hoje), fim: iso(hoje) };
  if (tipo === "7d") { const d = new Date(); d.setDate(d.getDate() - 6); return { inicio: iso(d), fim: iso(hoje) }; }
  if (tipo === "mes") return { inicio: iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), fim: iso(hoje) };
  return { inicio: "", fim: "" };
}