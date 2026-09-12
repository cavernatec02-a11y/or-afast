// Camada de dados compartilhada — todos os vendedores acessam o mesmo conteúdo
// via função de backend (sharedApi). Dados ficam no banco do app, não no localStorage.
import { base44 } from "@/api/base44Client";

const ACCESS_CODE_KEY = "ripresa_access_code";

export function getAccessCode() {
  return localStorage.getItem(ACCESS_CODE_KEY) || "";
}
export function setAccessCode(code) {
  localStorage.setItem(ACCESS_CODE_KEY, code);
}
export function clearAccessCode() {
  localStorage.removeItem(ACCESS_CODE_KEY);
}
export function hasAccess() {
  return !!getAccessCode();
}

async function callApi(payload) {
  const code = getAccessCode();
  const res = await base44.functions.invoke("sharedApi", { ...payload, code });
  if (!res.data) throw new Error("Sem resposta do servidor");
  if (res.data.success === false) {
    const err = new Error(res.data.error || "Erro desconhecido");
    err.code = res.data.error?.includes("Código") ? "ACCESS_DENIED" : "API_ERROR";
    throw err;
  }
  return res.data.data;
}

export const orcamentosStore = {
  list: () => callApi({ action: "list", entity: "orcamentos" }),
  get: (id) => callApi({ action: "get", entity: "orcamentos", id }),
  create: (data) => callApi({ action: "create", entity: "orcamentos", data }),
  update: (id, data) => callApi({ action: "update", entity: "orcamentos", id, data }),
  delete: (id) => callApi({ action: "delete", entity: "orcamentos", id }),
};

export const clientesStore = {
  list: () => callApi({ action: "list", entity: "clientes" }),
  create: (data) => callApi({ action: "create", entity: "clientes", data }),
  update: (id, data) => callApi({ action: "update", entity: "clientes", id, data }),
  delete: (id) => callApi({ action: "delete", entity: "clientes", id }),
};

export const acoStore = {
  list: () => callApi({ action: "list", entity: "aco" }),
  create: (data) => callApi({ action: "create", entity: "aco", data }),
  update: (id, data) => callApi({ action: "update", entity: "aco", id, data }),
  delete: (id) => callApi({ action: "delete", entity: "aco", id }),
  seed: () => callApi({ action: "seedAco", entity: "aco" }),
};

export const catalogoStore = {
  list: () => callApi({ action: "list", entity: "catalogo" }),
  create: (data) => callApi({ action: "create", entity: "catalogo", data }),
  delete: (id) => callApi({ action: "delete", entity: "catalogo", id }),
};