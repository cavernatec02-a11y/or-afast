import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Coins, Calculator, Package, User, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import ClienteForm from "@/components/orcamento/ClienteForm";
import ProdutosSection from "@/components/orcamento/ProdutosSection";
import PesoDiretoCard from "@/components/orcamento/PesoDiretoCard";
import CustoAcoCard from "@/components/orcamento/CustoAcoCard";
import CustosAdicionais from "@/components/orcamento/CustosAdicionais";
import FormacaoPreco from "@/components/orcamento/FormacaoPreco";
import TotalizadorBar from "@/components/orcamento/TotalizadorBar";
import { gerarPDFOrcamento } from "@/lib/pdfOrcamento";
import { exportarOrcamentoExcel } from "@/lib/exportExcel";
import PDFPreviewModal from "@/components/PDFPreviewModal";
import { orcamentosStore, clientesStore, acoStore, catalogoStore } from "@/lib/sharedStore";
import {
  calcTotaisOrcamento, calcCustoEmpresa, calcTotalCliente,
  calcPrecoVendaParaMargem, calcResultadoVenda, newUid,
} from "@/lib/pricingEngine";

const novoProduto = () => ({ uid: newUid(), tipo_produto: "", nome: "", descricao: "" });

export default function NovoOrcamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acoOptions, setAcoOptions] = useState([]);
  const [catalogoComercial, setCatalogoComercial] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [form, setForm] = useState({
    titulo: "", cliente_id: "", cliente_nome: "", contato: "", telefone: "", email: "",
    numero_projeto: "", numero_folha: "", uf: "", data: new Date().toISOString().slice(0, 10), validade_dias: 15,
  });
  const [produtos, setProdutos] = useState([]);
  const [componentes, setComponentes] = useState([]);
  const [comerciais, setComerciais] = useState([]);
  const [modoCalculo, setModoCalculo] = useState("componentes"); // "componentes" | "peso_direto"
  const [pesoDireto, setPesoDireto] = useState(0);
  const [precoAcoKg, setPrecoAcoKg] = useState(15);
  const [montagem, setMontagem] = useState(0);
  const [frete, setFrete] = useState(0);
  const [cobrarMontagem, setCobrarMontagem] = useState(false);
  const [cobrarFrete, setCobrarFrete] = useState(false);
  const [comissao, setComissao] = useState(0);
  const [impostosPercent, setImpostosPercent] = useState(13.37);
  const [margemMinima, setMargemMinima] = useState(15);
  const [margemAdequada, setMargemAdequada] = useState(30);
  const [valorVenda, setValorVenda] = useState(0);
  const [pdfPreview, setPdfPreview] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [aco, catalogo, cli] = await Promise.all([
          acoStore.list(),
          catalogoStore.list(),
          clientesStore.list(),
        ]);
        setAcoOptions(aco || []);
        setCatalogoComercial(catalogo || []);
        setClientes(cli || []);

        if (!id) {
          setProdutos([novoProduto()]);
          setLoading(false);
          return;
        }
        const orc = await orcamentosStore.get(id);
        if (!orc) {
          toast.error("Orçamento não encontrado.");
          navigate("/");
          return;
        }
    setForm({
      titulo: orc.titulo || "", cliente_id: orc.cliente_id || "", cliente_nome: orc.cliente_nome || "",
      contato: orc.contato || "", telefone: orc.telefone || "", email: orc.email || "",
      numero_projeto: orc.numero_projeto || "", numero_folha: orc.numero_folha || "",
      uf: orc.uf || "", data: orc.data || new Date().toISOString().slice(0, 10),
      validade_dias: orc.validade_dias ?? 15,
    });
    const prods = orc.produtos && orc.produtos.length ? orc.produtos : [novoProduto()];
    setProdutos(prods.map((p) => ({ uid: p.id || newUid(), tipo_produto: p.tipo_produto || "", nome: p.nome || "", descricao: p.descricao || "" })));
    setComponentes((orc.componentes || []).map((c) => ({ ...c, uid: c.uid || newUid() })));
    setComerciais((orc.componentes_comerciais || []).map((c) => ({ ...c, uid: c.uid || newUid() })));
    setModoCalculo(orc.modo_calculo || "componentes");
    setPesoDireto(orc.peso_direto || 0);
    setPrecoAcoKg(orc.preco_aco_kg ?? 15);
    setMontagem(orc.montagem ?? 0);
    setFrete(orc.frete ?? 0);
    setCobrarMontagem(!!orc.cobrar_montagem);
    setCobrarFrete(!!orc.cobrar_frete);
    setComissao(orc.comissao_percentual ?? 0);
    setImpostosPercent(orc.carga_tributaria ? orc.carga_tributaria * 100 : 13.37);
    setMargemMinima(orc.margem_minima ?? 15);
    setMargemAdequada(orc.margem_adequada ?? 30);
    setValorVenda(orc.valor_venda ?? 0);
    setLoading(false);
      } catch (e) {
        toast.error("Erro ao carregar dados. Verifique sua conexão.");
        setLoading(false);
      }
    })();
  }, [id]);

  const gerarTitulo = () => {
    const tipos = produtos.map((p) => p.tipo_produto).filter(Boolean).join(", ");
    const base = form.cliente_nome || tipos || "Orçamento";
    const data = new Date(form.data || Date.now()).toLocaleDateString("pt-BR");
    return `${base} — ${data}`;
  };

  const onSelectCliente = (c) =>
    setForm((f) => ({ ...f, cliente_id: c.id, cliente_nome: c.nome, contato: c.contato || "", telefone: c.telefone || "", email: c.email || "" }));

  // Peso calculado a partir das peças (sempre disponível, independente do modo)
  const pesoComponentes = useMemo(
    () => Number((componentes || []).reduce((s, c) => s + (Number(c.peso_total) || 0), 0).toFixed(5)),
    [componentes]
  );

  // Cálculo unificado: ambos os modos usam a mesma base (peso + acessórios + preço/kg).
  // A única diferença é a ORIGEM do peso: componentes (tela 01) ou peso direto (tela 02).
  const totais = useMemo(() => {
    const peso = modoCalculo === "peso_direto"
      ? Number(Number(pesoDireto || 0).toFixed(5))
      : pesoComponentes;
    const custoAco = Number((peso * (Number(precoAcoKg) || 0)).toFixed(2));
    const custo_acessorios = Number((comerciais || []).reduce((s, c) => s + (Number(c.total) || 0), 0).toFixed(2));
    return { peso_total_aco: peso, custo_total_aco: custoAco, custo_acessorios };
  }, [modoCalculo, pesoDireto, pesoComponentes, comerciais, precoAcoKg]);
  const custoEmpresa = useMemo(
    () => calcCustoEmpresa(totais.custo_total_aco, totais.custo_acessorios, montagem, frete, cobrarMontagem, cobrarFrete),
    [totais, montagem, frete, cobrarMontagem, cobrarFrete]
  );
  const resultado = useMemo(() => calcResultadoVenda(valorVenda, custoEmpresa, impostosPercent, comissao), [valorVenda, custoEmpresa, impostosPercent, comissao]);
  const totalCliente = useMemo(() => calcTotalCliente(valorVenda, montagem, frete, cobrarMontagem, cobrarFrete), [valorVenda, montagem, frete, cobrarMontagem, cobrarFrete]);
  const precoMinimo = useMemo(() => calcPrecoVendaParaMargem(custoEmpresa, margemMinima, impostosPercent, comissao), [custoEmpresa, margemMinima, impostosPercent, comissao]);
  const precoAdequado = useMemo(() => calcPrecoVendaParaMargem(custoEmpresa, margemAdequada, impostosPercent, comissao), [custoEmpresa, margemAdequada, impostosPercent, comissao]);

  useEffect(() => {
    if (!id && custoEmpresa > 0 && !valorVenda) setValorVenda(Number(precoAdequado.toFixed(2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custoEmpresa]);

  const sugerirPreco = () => {
    if (custoEmpresa <= 0) { toast.error("Adicione componentes antes de sugerir o preço."); return; }
    setValorVenda(Number(precoAdequado.toFixed(2)));
    toast.success(`Preço sugerido para margem de ${margemAdequada}%`);
  };

  const buildPayload = () => ({
    ...form,
    produtos: produtos.map((p) => ({ id: p.uid, tipo_produto: p.tipo_produto, nome: p.nome, descricao: p.descricao || "" })),
    componentes: componentes.map(({ uid, ...c }) => c),
    componentes_comerciais: comerciais.map(({ uid, ...c }) => c),
    modo_calculo: modoCalculo,
    peso_direto: pesoDireto,
    preco_aco_kg: precoAcoKg,
    peso_total_aco: totais.peso_total_aco,
    custo_total_aco: totais.custo_total_aco,
    custo_acessorios: totais.custo_acessorios,
    montagem, cobrar_montagem: cobrarMontagem,
    frete, cobrar_frete: cobrarFrete,
    comissao_percentual: comissao,
    impostos_percent: impostosPercent,
    margem_minima: margemMinima,
    margem_adequada: margemAdequada,
    valor_venda: valorVenda,
    custo_empresa: custoEmpresa,
    total_cliente: totalCliente,
    carga_tributaria: impostosPercent / 100,
    impostos_valor: resultado.impostos,
    comissao_valor: resultado.comissao,
    margem_real: resultado.margem,
    lucro_real: resultado.lucro,
  });

  const salvar = async () => {
    const tituloFinal = form.titulo || gerarTitulo();
    if (!tituloFinal) { toast.error("Selecione um cliente ou informe um título."); return; }
    setForm((f) => ({ ...f, titulo: tituloFinal }));
    setSaving(true);
    try {
      const payload = { ...buildPayload(), titulo: tituloFinal };
      if (id) {
        await orcamentosStore.update(id, payload);
        toast.success("Orçamento atualizado!");
      } else {
        await orcamentosStore.create(payload);
        toast.success("Orçamento salvo!");
      }
      navigate("/");
    } catch (e) {
      toast.error("Erro ao salvar orçamento.");
    } finally {
      setSaving(false);
    }
  };

  const gerarPDF = async () => {
    if (!valorVenda) { toast.error("Defina o valor de venda antes de gerar o PDF."); return; }
    const result = await gerarPDFOrcamento(buildPayload());
    setPdfPreview(result);
  };

  const exportarExcel = () => {
    if (!valorVenda) { toast.error("Defina o valor de venda antes de exportar."); return; }
    exportarOrcamentoExcel(buildPayload());
    toast.success("Planilha Excel exportada!");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin dark:border-slate-700"></div></div>;
  }

  return (
    <div className="min-h-screen pb-28 bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{id ? "Editar orçamento" : "Novo orçamento"}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Cliente, produtos e formação de preço</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Section n="1" icon={<User size={18} />} title="Cliente" subtitle="Selecione um cliente cadastrado ou preencha manualmente.">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 dark:bg-slate-900 dark:border-slate-700">
            <ClienteForm form={form} onChange={setForm} clientes={clientes} onSelectCliente={onSelectCliente} />
          </div>
        </Section>

        <Section n="2" icon={<Package size={18} />} title="Produtos do orçamento" subtitle="Escolha o modo de cálculo: por componentes (peças) ou por peso direto.">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setModoCalculo("componentes")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${modoCalculo === "componentes" ? "bg-primary text-primary-foreground" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"}`}
            >
              Por Componentes
            </button>
            <button
              type="button"
              onClick={() => { setPesoDireto(pesoComponentes); setModoCalculo("peso_direto"); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${modoCalculo === "peso_direto" ? "bg-primary text-primary-foreground" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"}`}
            >
              Por Peso Direto
            </button>
          </div>
          {modoCalculo === "componentes" ? (
            <ProdutosSection
              produtos={produtos} componentes={componentes} comerciais={comerciais}
              acoOptions={acoOptions} catalogoComercial={catalogoComercial} precoKg={precoAcoKg}
              onChangeProdutos={setProdutos} onChangeComponentes={setComponentes} onChangeComerciais={setComerciais}
            />
          ) : (
            <PesoDiretoCard pesoDireto={pesoDireto} setPesoDireto={setPesoDireto} precoKg={precoAcoKg} setPrecoKg={setPrecoAcoKg} custoAco={totais.custo_total_aco} />
          )}
        </Section>

        <Section n="3" icon={<Coins size={18} />} title="Custo do Aço" subtitle="Informe o preço de mercado do aço (R$/kg). O sistema calcula peso total × preço.">
          <CustoAcoCard pesoTotal={totais.peso_total_aco} precoKg={precoAcoKg} setPrecoKg={setPrecoAcoKg} custoAco={totais.custo_total_aco} />
        </Section>

        <Section n="4" icon={<Calculator size={18} />} title="Custos adicionais" subtitle="Montagem e frete (marque se o cliente paga), comissão e metas de margem.">
          <CustosAdicionais
            montagem={montagem} setMontagem={setMontagem} cobrarMontagem={cobrarMontagem} setCobrarMontagem={setCobrarMontagem}
            frete={frete} setFrete={setFrete} cobrarFrete={cobrarFrete} setCobrarFrete={setCobrarFrete}
            comissao={comissao} setComissao={setComissao}
            impostos={impostosPercent} setImpostos={setImpostosPercent}
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
            impostosPct={impostosPercent} comissaoPct={comissao} comissaoValor={resultado.comissao} impostosValor={resultado.impostos}
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
        precoAdequado={precoAdequado}
        onSugerir={sugerirPreco}
        onSave={salvar} onPDF={gerarPDF} onExcel={exportarExcel} saving={saving}
      />

      <PDFPreviewModal
        pdfUrl={pdfPreview?.url}
        fileName={pdfPreview?.fileName}
        onClose={() => setPdfPreview(null)}
      />
    </div>
  );
}

function Section({ n, icon, title, subtitle, children }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">{n}</div>
        <div className="flex items-center gap-2">
          <span className="text-slate-700 dark:text-slate-300">{icon}</span>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}