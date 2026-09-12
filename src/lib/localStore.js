// Persistência local (localStorage) — sem banco de dados.
// Todos os orçamentos ficam armazenados no aparelho do usuário.

const KEY_ORC = "orcaRipresa_orcamentos";
const KEY_ACO = "orcaRipresa_acos";
const KEY_CLI = "orcaRipresa_clientes";
const KEY_COM = "orcaRipresa_comerciais";
const KEY_TPL = "orcaRipresa_templates";

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
// Tabela oficial de bitolas GSC — peso específico comercial em kg/m² (NÃO é espessura).
// #14 = 16.40 kg/m², #12 = 21.36 kg/m², #13 = 18.36 kg/m² — valores corrigidos conforme planilha.
const SEED_VERSION = 2;
const TABELA_ACO_SEED = [
  { codigo: "# 20 (0,90)", aco_bitola: "# 20", tipo_aco: "SAE 1008/1010 GALV.", espessura_mm: 0.90, peso_especifico: 7.20, preco_kg: 8.50 },
  { codigo: "# 18 (1,20)", aco_bitola: "# 18", tipo_aco: "SAE 1008/1010 GALV.", espessura_mm: 1.20, peso_especifico: 9.60, preco_kg: 8.20 },
  { codigo: "# 16 (1,50)", aco_bitola: "# 16", tipo_aco: "SAE 1008/1010 GALV.", espessura_mm: 1.50, peso_especifico: 12.00, preco_kg: 8.00 },
  { codigo: "# 14 (2,00)", aco_bitola: "# 14", tipo_aco: "SAE 1008/1010 GALV.", espessura_mm: 2.00, peso_especifico: 16.40, preco_kg: 7.80 },
  { codigo: "# 13 (2,25)", aco_bitola: "# 13", tipo_aco: "SAE 1008/1010 GALV.", espessura_mm: 2.25, peso_especifico: 18.36, preco_kg: 7.75 },
  { codigo: "# 12 (2,65)", aco_bitola: "# 12", tipo_aco: "SAE 1008/1010 GALV.", espessura_mm: 2.65, peso_especifico: 21.36, preco_kg: 7.70 },
  { codigo: "# 10 (3,40)", aco_bitola: "# 10", tipo_aco: "SAE 1008/1010 GALV.", espessura_mm: 3.40, peso_especifico: 27.20, preco_kg: 7.65 },
  { codigo: "# 14 (2,00)", aco_bitola: "# 14", tipo_aco: "ESTRUTURAL ZINC.", espessura_mm: 2.00, peso_especifico: 16.40, preco_kg: 8.40 },
  { codigo: "# 16 (1,50)", aco_bitola: "# 16", tipo_aco: "ESTRUTURAL ZINC.", espessura_mm: 1.50, peso_especifico: 12.00, preco_kg: 8.60 },
  { codigo: "# 18 (1,20)", aco_bitola: "# 18", tipo_aco: "ESTRUTURAL ZINC.", espessura_mm: 1.20, peso_especifico: 9.60, preco_kg: 8.80 },
  { codigo: "# 12 (2,65)", aco_bitola: "# 12", tipo_aco: "ESTRUTURAL", espessura_mm: 2.65, peso_especifico: 21.36, preco_kg: 7.50 },
  { codigo: "# 10 (3,40)", aco_bitola: "# 10", tipo_aco: "ESTRUTURAL", espessura_mm: 3.40, peso_especifico: 27.20, preco_kg: 7.45 },
];

export const acoStore = {
  list: () => {
    const atual = load(KEY_ACO);
    const v = parseInt(localStorage.getItem("orcaRipresa_aco_v") || "0");
    // Primeiro uso: carrega o seed
    if (atual.length === 0) {
      const seed = TABELA_ACO_SEED.map((s, i) => ({ ...s, id: `seed_${i}` }));
      save(KEY_ACO, seed);
      localStorage.setItem("orcaRipresa_aco_v", String(SEED_VERSION));
      return seed;
    }
    // Migração: atualiza registros padrão (seed_) com valores corrigidos, preserva registros do usuário
    if (v < SEED_VERSION) {
      const userAdded = atual.filter((a) => !a.id?.startsWith("seed_"));
      const newSeed = TABELA_ACO_SEED.map((s, i) => ({ ...s, id: `seed_${i}` }));
      const merged = [...newSeed, ...userAdded];
      save(KEY_ACO, merged);
      localStorage.setItem("orcaRipresa_aco_v", String(SEED_VERSION));
      return merged;
    }
    return atual;
  },
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

// ─── Templates de Produtos ─────────────────────────────────────────────────────
export const templatesStore = {
  list: () => load(KEY_TPL).sort((a, b) => (b.created_at || 0) - (a.created_at || 0)),
  create: (data) => {
    const lista = load(KEY_TPL);
    const novo = { ...data, id: newId(), created_at: Date.now() };
    save(KEY_TPL, [...lista, novo]);
    return novo;
  },
  delete: (id) => save(KEY_TPL, load(KEY_TPL).filter((t) => t.id !== id)),
};