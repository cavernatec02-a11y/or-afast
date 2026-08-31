import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Layers, Boxes, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";
import ClienteForm from "@/components/orcamento/ClienteForm";
import ComponenteGrid from "@/components/orcamento/ComponenteGrid";
import ComponenteComercialGrid from "@/components/orcamento/ComponenteComercialGrid";
import TotalizadorBar from "@/components/orcamento/TotalizadorBar";
import {
  PRODUTO_PRESETS, ICMS_POR_UF, recalcComponente, recalcComercial,
  calcTotais, calcValorFinal,
} from "@/lib/pricingEngine";

export default function NovoOrcamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [acoOptions, setAcoOptions] = useState([]);
  const [catalogoComercial, setCatalogoComercial] = useState([]);

  const [form, setForm] = useState({
    titulo: "", cliente_nome: "", contato: "", telefone: "", email: "",
    numero_projeto: "", numero_folha: "", uf: "", data: new Date().toISOString().slice(0, 10),
    tipo_produto: "",
  });
  const [componentes, setComponentes] = useState([]);
  const [comerciais, setComerciais] = useState([]);
  const [margem, setMargem] = useState(30);

  useEffect(() => {
    (async () => {
      try {
        const [acos, catalogo] = await Promise.all([
          base44.entities.CustoAco.list(),
          base44.entities.ComponenteComercial.list(),
        ]);
        setAcoOptions(acos);
        setCatalogoComercial(catalogo);
      } catch (e) {
        toast.error("Erro ao carregar tabelas de custo.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const orc = await base44.entities.Orcamento.get(id);
        setForm({
          titulo: orc.titulo || "", cliente_nome: orc.cliente_nome || "", contato: "",
          telefone: "", email: "", numero_projeto: orc.cliente_id || "",
          numero_folha: "", uf: orc.uf || "", data: orc.data || new Date().toISOString().slice(0, 10),
          tipo_produto: orc.tipo_produto || "",
        });
        setComponentes(orc.componentes || []);
        setComerciais(orc.componentes_comerciais || []);
        setMargem(orc.margem_percentual ?? 30);
      } catch (e) {
        toast.error("Orçamento não encontrado.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Pré-carrega as peças ao escolher um tipo de produto (somente em criação nova).
  const aplicarPreset = (tipo) => {
    if (id) return;
    const preset = PRODUTO_PRESETS[tipo];
    if (!preset) return;
    setComponentes(preset.map((p) => recalcComponente({ ...p, custo_aco_id: "", peso_especifico: 0, preco_kg: 0 })));
    if (!form.titulo) setForm((f) => ({ ...f, titulo: `${tipo} — ${f.cliente_nome || "Novo orçamento"}` }));
  };

  const onFormChange = (next) => {
    if (next.tipo_produto && next.tipo_produto !== form.tipo_produto) aplicarPreset(next.tipo_produto);
    setForm(next);
  };

  const totais = useMemo(() => calcTotais(componentes, comerciais), [componentes, comerciais]);
  const icms = ICMS_POR_UF[form.uf] || 0;
  const valorFinal = useMemo(() => calcValorFinal(totais, margem, icms), [totais, margem, icms]);

  const salvar = async () => {
    if (!form.titulo || !form.tipo_produto) {
      toast.error("Informe título e tipo de produto.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      componentes,
      componentes_comerciais: comerciais,
      custo_total_aco: totais.custo_total_aco,
      peso_total_aco: totais.peso_total_aco,
      custo_acessorios: totais.custo_acessorios,
      margem_percentual: margem,
      icms_percentual: icms,
      valor_final: valorFinal,
    };
    try {
      if (id) {
        await base44.entities.Orcamento.update(id, payload);
        toast.success("Orçamento atualizado!");
      } else {
        await base44.entities.Orcamento.create(payload);
        toast.success("Orçamento criado!");
      }
      navigate("/");
    } catch (e) {
      toast.error("Erro ao salvar orçamento.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen pb-28 bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{id ? "Editar orçamento" : "Novo orçamento"}</h1>
            <p className="text-sm text-slate-500">Dados do cliente e parâmetros do projeto</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <ClienteForm form={form} onChange={onFormChange} />
        </section>

        <section>
          <SectionTitle icon={<Layers size={18} />} title="Peças estruturais" subtitle="Corte × Comprimento × Peso específico = Peso. Recalculado em tempo real." />
          <ComponenteGrid componentes={componentes} acoOptions={acoOptions} onChange={setComponentes} />
        </section>

        <section>
          <SectionTitle icon={<Boxes size={18} />} title="Componentes comerciais" subtitle="Parafusos, chumbadores e fixadores terceirizados." />
          <ComponenteComercialGrid componentes={comerciais} catalogo={catalogoComercial} onChange={setComerciais} />
        </section>
      </main>

      <TotalizadorBar totais={totais} margem={margem} setMargem={setMargem} icms={icms} valorFinal={valorFinal} onSave={salvar} saving={saving} />
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="text-slate-700">{icon}</div>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}