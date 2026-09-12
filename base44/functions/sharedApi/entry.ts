import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const ENTITY_MAP = {
  orcamentos: "Orcamento",
  clientes: "Cliente",
  aco: "CustoAco",
  catalogo: "ComponenteComercial",
};

const ACO_SEED = [
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

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { code, action, entity, id, data } = body;

    // Validate access code
    if (!code || code !== secrets.get("ACCESS_CODE")) {
      return Response.json({ success: false, error: "Código de acesso inválido" }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);
    const entityName = ENTITY_MAP[entity];
    if (!entityName) {
      return Response.json({ success: false, error: "Entidade inválida" }, { status: 400 });
    }

    const store = base44.asServiceRole.entities[entityName];

    switch (action) {
      case "list": {
        let items;
        if (entity === "orcamentos") {
          items = await store.list("-created_date", 500);
        } else if (entity === "clientes") {
          items = await store.list("nome", 500);
        } else {
          items = await store.list("-created_date", 500);
        }
        return Response.json({ success: true, data: items });
      }
      case "get": {
        const item = await store.get(id);
        return Response.json({ success: true, data: item });
      }
      case "create": {
        const item = await store.create(data);
        return Response.json({ success: true, data: item });
      }
      case "update": {
        const item = await store.update(id, data);
        return Response.json({ success: true, data: item });
      }
      case "delete": {
        await store.delete(id);
        return Response.json({ success: true });
      }
      case "seedAco": {
        const existing = await store.list("-created_date", 500);
        if (existing.length === 0) {
          const seeded = await store.bulkCreate(ACO_SEED);
          return Response.json({ success: true, data: seeded });
        }
        return Response.json({ success: true, data: existing });
      }
      default:
        return Response.json({ success: false, error: "Ação inválida" }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}