import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Coins, Calculator, Package, User, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";
import ClienteForm from "@/components/orcamento/ClienteForm";
import ProdutosSection from "@/components/orcamento/ProdutosSection";
import CustoAcoCard from "@/components/orcamento/CustoAcoCard";
import CustosAdicionais from "@/components/orcamento/CustosAdicionais";
import FormacaoPreco from "@/components/orcamento/FormacaoPreco";
import TotalizadorBar from "@/components/orcamento/TotalizadorBar";
import { gerarPDFOrcamento } from "@/lib/pdfOrcamento";
import {
  calcTotaisOrcamento, calcCustoEmpresa, calcTotalCliente,
  calcCargaTributaria, calcPrecoVendaParaMargem, calcResultadoVenda, newUid,
} from "@/lib/pricingEngine";

const novoProduto = () => ({ uid: newUid(), tipo_produto: "", nome: "", componentes: [], componentes_comerciais: [] });

export default function NovoOrcamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [acoOptions, setAcoOptions] = useState([]);
  const [catalogoComercial, setCatalogoComercial] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [form, setForm] = useState({
    titulo: "", cliente_id: "", cliente_nome: "", contato: "", telefone: "", email: "",
    numero_projeto: "", numero_folha: "", uf: "", data: new Date().toISOString().slice(0, 10), validade_dias: 15,
  });
  const [produtos, setProdutos] = useState([]);
  const [precoAcoKg, setPrecoAcoKg] = useState(15);
  const [montagem, setMontagem] = useState(0);
  const [frete, setFrete] = useState(0);
  const [cobrarMontagem, setCobrarMontagem] = useState(false);
  const [cobrarFrete, setCobrarFrete] = useState(false);
  const [comissao, setComissao] = useState(0);
  const [margemMinima, setMargemMinima] = useState(15);
  const [margemAdequada, setMargemAdequada] = useState(30);
  const [valorVenda, setValorVenda] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [acos, catalogo, cli] = await Promise.all([
          base44.entities.CustoAco.list(),
          base44.entities.ComponenteComercial.list(),
          base44.entities.Cliente.list("-created_date", 200),
        ]);
        setAcoOptions(acos);
        setCatalogoComercial(catalogo);
        setClientes(cli);
      } catch (e) {
        toast.error("Erro ao carregar tabelas de custo.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) {
      setProdutos([novoProduto()]);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const orc = await base44.entities.Orcamento.get(id);
        setForm({
          titulo: orc.titulo || "", cliente_id: orc.cliente_id || "", cliente_nome: orc.cliente_nome || "",
          contato: orc.contato || "", telefone: orc.telefone || "", email: orc.email || "",
          numero_projeto: orc.numero_projeto || "", numero_folha: orc.numero_folha || "",
          uf: orc.uf || "", data: orc.data || new Date().toISOString().slice(0, 10), validade_dias: orc.validade_dias ?? 15,
        });
        // Garante uid em todos os componentes para keys estáveis
        const produtosComUid = (orc.produtos && orc.produtos.length ? orc.produtos : [novoProduto()]).map((p) => ({
          ...p,
          uid: p.uid || newUid(),
          componentes: (p.componentes || []).map((c) => ({ ...c, uid: c.uid || newUid() })),
          componentes_comerciais: (p.componentes_comerciais || []).map((c) => ({ ...c, uid: c.uid || newUid() })),
        }));
        setProdutos(produtosComUid);
        setPrecoAcoKg(orc.preco_aco_kg ?? 15);
        setMontagem(orc.montagem ?? 0);
        setFrete(orc.frete ?? 0);
        setCobrarMontagem(!!orc.cobrar_montagem);
        setCobrarFrete(!!orc.cobrar_frete);
        setComissao(orc.comissao_percentual ?? 0);
        setMargemMinima(orc.margem_minima ?? 15);
        setMargemAdequada(orc.margem_adequada ?? 30);
        setValorVenda(orc.valor_venda ?? 0);
      } catch (e) {
        toast.error("Orçamento não encontrado.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onSelectCliente = (c) => {
    setForm((f) => ({
      ...f,
      cliente_id: c.id, cliente_nome: c.nome, contato: c.contato || "", telefone: c.telefone || "", email: c.email || "",
    }));
  };

  const totais = useMemo(() => calcTotaisOrcamento(produtos, precoAcoKg), [produtos, precoAcoKg]);
  const custoEmpresa = useMemo(
    () => calcCustoEmpresa(totais.custo_total_aco, totais.custo_acessorios, montagem, frete, cobrarMontagem, cobrarFrete),
    [totais, montagem, frete, cobrarMontagem, cobrarFrete]
  );
  const carga = useMemo(() => calcCargaTributaria(form.uf), [form.uf]);
  const resultado = useMemo(
    () => calcResultadoVenda(valorVenda, custoEmpresa, carga.total, comissao),
    [valorVenda, custoEmpresa, carga, comissao]
  );
  const totalCliente = useMemo(
    () => calcTotalCliente(valorVenda, montagem, frete, cobrarMontagem, cobrarFrete),
    [valorVenda, montagem, frete, cobrarMontagem, cobrarFrete]
  );
  const precoMinimo = useMemo(
    () => calcPrecoVendaParaMargem(custoEmpresa, margemMinima, carga.total, comissao),
    [custoEmpresa, margemMinima, carga, comissao]
  );
  const precoAdequado = useMemo(
    () => calcPrecoVendaParaMargem(custoEmpresa, margemAdequada, carga.total, comissao),
    [custoEmpresa, margemAdequada, carga, comissao]
  );

  // Sugere automaticamente o preço adequado quando o custo muda e o usuário ainda não definiu um valor.
  useEffect(() => {
    if (!id && custoEmpresa > 0 && !valorVenda) setValorVenda(Number(precoAdequado.toFixed(2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custoEmpresa]);

  const salvar = async () => {
    if (!form.titulo) {
      toast.error("Informe um título para o orçamento.");
      return;
    }
    const produtosValidos = produtos.filter((p) => (p.componentes && p.componentes.length > 0) || (p.componentes_comerciais && p.componentes_comerciais.length > 0) || p.tipo_produto);
    if (produtosValidos.length === 0) {
      toast.error("Adicione ao menos um produto com peças.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      produtos: produtosValidos,
      preco_aco_kg: precoAcoKg,
      peso_total_aco: totais.peso_total_aco,
      custo_total_aco: totais.custo_total_aco,
      custo_acessorios: totais.custo_acessorios,
      montagem, cobrar_montagem: cobrarMontagem,
      frete, cobrar_frete: cobrarFrete,
      comissao_percentual: comissao,
      margem_minima: margemMinima,
      margem_adequada: margemAdequada,
      valor_venda: valorVenda,
      custo_empresa: custoEmpresa,
      total_cliente: totalCliente,
      carga_tributaria: carga.total,
      impostos_valor: resultado.impostos,
      comissao_valor: resultado.comissao,
      margem_real: resultado.margem,
      lucro_real: resultado.lucro,
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

  const gerarPDF = () => {
    if (!valorVenda) {
      toast.error("Defina o valor de venda antes de gerar o PDF.");
      return;
    }
    gerarPDFOrcamento({
      ...form,
      produtos, preco_aco_kg: precoAcoKg,
      peso_total_aco: totais.peso_total_aco,
      custo_total_aco: totais.custo_total_aco,
      custo_acessorios: totais.custo_acessorios,
      montagem, cobrar_montagem: cobrarMontagem,
      frete, cobrar_frete: cobrarFrete,
      valor_venda: valorVenda, total_cliente: totalCliente,
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen pb-28 bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{id ? "Editar orçamento" : "Novo orçamento"}</h1>
            <p className="text-sm text-slate-500">Cliente, produtos e formação de preço</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Section n="1" icon={<User size={18} />} title="Cliente" subtitle="Selecione um cliente cadastrado ou preencha manualmente.">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <ClienteForm form={form} onChange={setForm} clientes={clientes} onSelectCliente={onSelectCliente} />
          </div>
        </Section>

        <Section n="2" icon={<Package size={18} />} title="Produtos do orçamento" subtitle="Adicione um ou mais produtos (ex.: porta-palete + estante) para o mesmo cliente.">
          <ProdutosSection produtos={produtos} acoOptions={acoOptions} catalogoComercial={catalogoComercial} precoKg={precoAcoKg} onChange={setProdutos} />
        </Section>

        <Section n="3" icon={<Coins size={18} />} title="Custo do Aço" subtitle="Informe o preço de mercado do aço (R$/kg). O sistema calcula peso total × preço.">
          <CustoAcoCard pesoTotal={totais.peso_total_aco} precoKg={precoAcoKg} setPrecoKg={setPrecoAcoKg} custoAco={totais.custo_total_aco} />
        </Section>

        <Section n="4" icon={<Calculator size={18} />} title="Custos adicionais" subtitle="Montagem e frete (marque se o cliente paga), comissão e metas de margem.">
          <CustosAdicionais
            montagem={montagem} setMontagem={setMontagem} cobrarMontagem={cobrarMontagem} setCobrarMontagem={setCobrarMontagem}
            frete={frete} setFrete={setFrete} cobrarFrete={cobrarFrete} setCobrarFrete={setCobrarFrete}
            comissao={comissao} setComissao={setComissao}
            margemMinima={margemMinima} setMargemMinima={setMargemMinima}
            margemAdequada={margemAdequada} setMargemAdequada={setMargemAdequada}
            comissaoValor={resultado.comissao}
          />
        </Section>

        <Section n="5" icon={<FileText size={18} />} title="Formação de preço" subtitle="Tributos do Lucro Presumido, margem real e sugestão de preço de venda.">
          <FormacaoPreco
            custoAco={totais.custo_total_aco} custoAcessorios={totais.custo_acessorios}
            montagem={montagem} frete={frete} cobrarMontagem={cobrarMontagem} cobrarFrete={cobrarFrete}
            custoEmpresa={custoEmpresa} totalCliente={totalCliente}
            carga={carga} comissaoPct={comissao} comissaoValor={resultado.comissao} impostosValor={resultado.impostos}
            resultado={resultado} margemMinima={margemMinima} margemAdequada={margemAdequada}
            precoMinimo={precoMinimo} precoAdequado={precoAdequado}
            onUsarPreco={(v) => setValorVenda(Number(v.toFixed(2)))}
          />
        </Section>
      </main>

      <TotalizadorBar
        pesoTotal={totais.peso_total_aco}
        custoEmpresa={custoEmpresa}
        valorVenda={valorVenda} setValorVenda={setValorVenda}
        totalCliente={totalCliente}
        resultado={resultado}
        margemMinima={margemMinima} margemAdequada={margemAdequada}
        onSave={salvar} onPDF={gerarPDF} saving={saving}
      />
    </div>
  );
}

function Section({ n, icon, title, subtitle, children }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">{n}</div>
        <div className="flex items-center gap-2">
          <span className="text-slate-700">{icon}</span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}