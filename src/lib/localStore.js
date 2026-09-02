// Persistência local (localStorage) — sem banco de dados.
// Todos os orçamentos ficam armazenados no aparelho do usuário.

const KEY_ORC = "orcaRipresa_orcamentos";
const KEY_ACO = "orcaRipresa_acos";
const KEY_CLI = "orcaRipresa_clientes";
const KEY_COM = "orcaRipresa_comerciais";

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function newId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Orçamentos ──────────────────────────────────────────────────────────────
export const orcamentosStore = {
  list: () => load(KEY_ORC).sort((a, b) => (b.created_at || 0) - (a.created_at || 0)),
  get: (id) => load(KEY_ORC).find((o) => o.id === id) || null,
  create: (data) => {
    const lista = load(KEY_ORC);
    const novo = { ...data, id: newId(), created_at: Date.now(), updated_at: Date.now() };
    save(KEY_ORC, [novo, ...lista]);
    return novo;
  },
  update: (id, data) => {
    const lista = load(KEY_ORC).map((o) => o.id === id ? { ...o, ...data, id, updated_at: Date.now() } : o);
    save(KEY_ORC, lista);
  },
  delete: (id) => save(KEY_ORC, load(KEY_ORC).filter((o) => o.id !== id)),
};

// ─── Clientes ─────────────────────────────────────────────────────────────────
export const clientesStore = {
  list: () => load(KEY_CLI).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")),
  create: (data) => {
    const lista = load(KEY_CLI);
    const novo = { ...data, id: newId(), created_at: Date.now() };
    save(KEY_CLI, [novo, ...lista]);
    return novo;
  },
  update: (id, data) => {
    save(KEY_CLI, load(KEY_CLI).map((c) => c.id === id ? { ...c, ...data, id } : c));
  },
  delete: (id) => save(KEY_CLI, load(KEY_CLI).filter((c) => c.id !== id)),
};

// ─── Tabela de Aço ────────────────────────────────────────────────────────────
export const acoStore = {
  list: () => load(KEY_ACO),
  create: (data) => {
    const lista = load(KEY_ACO);
    const novo = { ...data, id: newId() };
    save(KEY_ACO, [...lista, novo]);
    return novo;
  },
  update: (id, data) => {
    save(KEY_ACO, load(KEY_ACO).map((a) => a.id === id ? { ...a, ...data, id } : a));
  },
  delete: (id) => save(KEY_ACO, load(KEY_ACO).filter((a) => a.id !== id)),
};

// ─── Catálogo de Componentes Comerciais ───────────────────────────────────────
export const catalogoStore = {
  list: () => load(KEY_COM),
  create: (data) => {
    const lista = load(KEY_COM);
    const novo = { ...data, id: newId() };
    save(KEY_COM, [...lista, novo]);
    return novo;
  },
  delete: (id) => save(KEY_COM, load(KEY_COM).filter((c) => c.id !== id)),
};