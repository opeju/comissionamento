const { useEffect, useMemo, useState, useRef } = React;

// =========================
// Utilidades
// =========================
const formatBRL = (n) => {
  const value = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const parseMoney = (raw) => {
  if (raw == null) return 0;
  let s = String(raw).trim();
  if (!s) return 0;
  s = s.replace(/[^\d,.\-]/g, "");
  if (!s) return 0;
  if (s.includes(",")) {
    s = s.replace(/\./g, "");
    s = s.replace(",", ".");
  }
  const v = parseFloat(s);
  return Number.isFinite(v) ? Math.max(0, v) : 0;
};

const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

const maskCPF = (value) => {
  const d = onlyDigits(value).slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);
  let out = p1;
  if (p2) out += "." + p2;
  if (p3) out += "." + p3;
  if (p4) out += "-" + p4;
  return out;
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// =========================
// Regras de negócio
// =========================
function calcComissaoGeralDetalhada(faturamentoParaComissao, temValorFixo, valorFixoMensal) {
  const f = faturamentoParaComissao;
  let res = {};

  if (f <= 10000) res = { faixaLabel: "Até 10.000", percentual: 0.10, comissaoPercentual: round2(f * 0.10), valorDeFaixa: 0, bonusMeta: 0 };
  else if (f <= 21000) res = { faixaLabel: "10.001 a 21.000", percentual: 0.02, comissaoPercentual: round2(f * 0.02), valorDeFaixa: 1700, bonusMeta: 0 };
  else if (f <= 31000) res = { faixaLabel: "21.001 a 31.000", percentual: 0.03, comissaoPercentual: round2(f * 0.03), valorDeFaixa: 2000, bonusMeta: 500 };
  else if (f <= 41000) res = { faixaLabel: "31.001 a 41.000", percentual: 0.04, comissaoPercentual: round2(f * 0.04), valorDeFaixa: 2000, bonusMeta: 800 };
  else if (f <= 51000) res = { faixaLabel: "41.001 a 51.000", percentual: 0.05, comissaoPercentual: round2(f * 0.05), valorDeFaixa: 2000, bonusMeta: 1200 };
  else if (f <= 100000) res = { faixaLabel: "51.001 a 100.000", percentual: 0.06, comissaoPercentual: round2(f * 0.06), valorDeFaixa: 2000, bonusMeta: 1500 };
  else res = { faixaLabel: "Acima de 100.000", percentual: 0.06, comissaoPercentual: round2(f * 0.06), valorDeFaixa: 2000, bonusMeta: 3000 };

  if (temValorFixo) {
    res.valorDeFaixa = Number(valorFixoMensal) || 0;
    res.isValorFixo = true;
  }

  res.total = round2(res.comissaoPercentual + res.valorDeFaixa + res.bonusMeta);
  return res;
}

function calcComissaoHospedagem(vendasHospedagem) {
  const h = vendasHospedagem;
  let taxa = 0;
  if (h <= 10000) taxa = 0.02;
  else if (h <= 30000) taxa = 0.025;
  else if (h <= 50000) taxa = 0.03;
  else taxa = 0.035;
  return round2(h * taxa);
}

// =========================
// Componentes UI
// =========================
function Pill({ children, tone = "slate" }) {
  const map = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-100 text-blue-800",
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-rose-100 text-rose-800",
    amber: "bg-amber-100 text-amber-800",
  };
  return <span className={"inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold " + (map[tone] || map.slate)}>{children}</span>;
}

function Field({ label, children, error, hint }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

function MoneyInput({ value, onChange, placeholder }) {
  const [displayValue, setDisplayValue] = useState("");
  useEffect(() => {
    if (value === 0) setDisplayValue("");
    else if (parseMoney(displayValue) !== value) setDisplayValue(formatBRL(value));
  }, [value]);
  const handleInput = (e) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (!raw) { setDisplayValue(""); onChange(0); return; }
    let num = parseInt(raw, 10) / 100;
    setDisplayValue(formatBRL(num));
    onChange(num);
  };
  return <input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" inputMode="numeric" placeholder={placeholder} value={displayValue} onChange={handleInput} />;
}

function LoginGate({ onChooseProfile }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
        <div className="space-y-2"><h1 className="text-xl font-bold text-slate-900">Acesso ao Sistema</h1><p className="text-sm text-slate-600">Escolha o perfil para continuar.</p></div>
        <div className="mt-6 grid grid-cols-1 gap-3">
          <button className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700" onClick={() => onChooseProfile("consultor")}>Entrar como Consultor</button>
          <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800" onClick={() => onChooseProfile("outra")}>Acessar como Outra Função (sem senha)</button>
        </div>
      </div>
    </div>
  );
}

function ConsultorLogin({ onBack, onSuccess }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [err, setErr] = useState("");
  const handle = () => {
    if (email.trim().toLowerCase() === "oi@jericar.com.br" && senha === "123456") { setErr(""); onSuccess(); }
    else setErr("Credenciais inválidas.");
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-bold text-slate-900">Login (Consultor)</h1>
        <div className="mt-6 space-y-4">
          <Field label="Email"><input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="oi@jericar.com.br" /></Field>
          <Field label="Senha"><input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••" /></Field>
          {err && <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 font-semibold">{err}</div>}
          <div className="flex gap-3">
            <button className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700" onClick={handle}>Entrar</button>
            <button className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-200" onClick={onBack}>Voltar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsCards({ computed, acessoAgencia, senhaAgencia, setSenhaAgencia }) {
  const { faturamentoParaComissao, comissaoGeralDetalhe, comissaoHospedagem, reembolsos, adiantamentos, totalConsultor, valorFinal, vendasHospedagem, repasseOperacionalTotal, baseNF, repasseComissionamento, baseLiquidaPosComissao, imposto6 } = computed;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><h2 className="text-base font-bold text-slate-900">Resumo Detalhado</h2><Pill tone="blue">Tempo Real</Pill></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Faturamento Vendas</p><p className="mt-1 text-lg font-extrabold text-slate-900">{formatBRL(faturamentoParaComissao)}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Vendas Hospedagem</p><p className="mt-1 text-lg font-extrabold text-slate-900">{formatBRL(vendasHospedagem)}</p></div>
        
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-semibold text-slate-500">Detalhamento da Comissão</p>
            <Pill tone="slate">Faixa: {comissaoGeralDetalhe.faixaLabel}</Pill>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-xs font-semibold text-slate-600">Comissão Vendas (%)</p><p className="mt-1 text-lg font-extrabold text-slate-900">{formatBRL(comissaoGeralDetalhe.comissaoPercentual)}</p></div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-600">{comissaoGeralDetalhe.isValorFixo ? "Valor Fixo Acordado" : "Valor de Faixa"}</p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">{formatBRL(comissaoGeralDetalhe.valorDeFaixa)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-xs font-semibold text-slate-600">Bônus por Meta</p><p className="mt-1 text-lg font-extrabold text-slate-900">{formatBRL(comissaoGeralDetalhe.bonusMeta)}</p></div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-xs font-semibold text-slate-600">Comissão Hospedagem</p><p className="mt-1 text-lg font-extrabold text-slate-900">{formatBRL(comissaoHospedagem)}</p></div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3"><p className="text-xs font-semibold text-emerald-800 font-bold">Total Comissão Geral</p><p className="mt-1 text-xl font-black text-emerald-900">{formatBRL(totalConsultor)}</p></div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Reembolsos (+)</p><p className="mt-1 text-lg font-extrabold text-slate-900">{formatBRL(reembolsos)}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Adiantamentos (-)</p><p className="mt-1 text-lg font-extrabold text-slate-900">{formatBRL(adiantamentos)}</p></div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:col-span-2"><p className="text-xs font-semibold text-blue-700">VALOR FINAL A RECEBER</p><p className="mt-1 text-2xl font-black text-blue-900">{formatBRL(valorFinal)}</p></div>
        
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
          <div className="flex items-center justify-between gap-3 flex-wrap"><p className="text-sm font-extrabold text-slate-900">Gestão da Agência</p>{acessoAgencia ? <Pill tone="green">Acesso liberado</Pill> : <Pill tone="amber">Bloqueado</Pill>}</div>
          {!acessoAgencia ? (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
              <Field label="Senha"><input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none" type="password" value={senhaAgencia} onChange={(e) => setSenhaAgencia(e.target.value)} placeholder="Digite a senha" /></Field>
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-xs font-semibold text-slate-600">Repasse Operacional (Fornecedores)</p><p className="mt-1 text-lg font-extrabold text-slate-900">{formatBRL(repasseOperacionalTotal)}</p></div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-xs font-semibold text-slate-600">Base p/ Nota Fiscal (Margem Agência)</p><p className="mt-1 text-lg font-extrabold text-slate-900">{formatBRL(baseNF)}</p></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3"><p className="text-xs font-semibold text-rose-800">Repasse de Comissionamento</p><p className="mt-1 text-lg font-extrabold text-rose-700">{formatBRL(repasseComissionamento)}</p></div>
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3"><p className="text-xs font-semibold text-blue-800 font-bold">Base Líquida (Pós Repasse)</p><p className="mt-1 text-lg font-black text-blue-900">{formatBRL(baseLiquidaPosComissao)}</p></div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-xs font-semibold text-slate-600">Imposto Estimado (6% sobre Base NF)</p><p className="mt-1 text-lg font-extrabold text-slate-900">{formatBRL(imposto6)}</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [stage, setStage] = useState("choose");
  const [data, setData] = useState({ nome: "", cpf: "", pix: "", faturamentoBruto: 0, descontoValor: 0, vendasHospedagem: 0, reembolsos: 0, adiantamentos: 0, temValorFixo: false, valorFixoMensal: 0 });
  const [errors, setErrors] = useState({});
  const [senhaAgencia, setSenhaAgencia] = useState("");
  const acessoAgencia = senhaAgencia === "0102030405#";

  const computed = useMemo(() => {
    const fBruto = Number(data.faturamentoBruto) || 0;
    const fDesc = Number(data.descontoValor) || 0;
    const fParaComissao = Math.max(0, fBruto - fDesc);
    const vHosp = Number(data.vendasHospedagem) || 0;
    
    const cGeral = calcComissaoGeralDetalhada(fParaComissao, data.temValorFixo, data.valorFixoMensal);
    const cHosp = calcComissaoHospedagem(vHosp);
    const tCons = round2(cGeral.total + cHosp);
    const vFinal = round2((tCons + (Number(data.reembolsos) || 0)) - (Number(data.adiantamentos) || 0));

    const repasseVendas = fParaComissao * 0.625;
    const margemVendas = fParaComissao * 0.375;
    const repasseHosp = vHosp * 0.97;
    const margemHosp = vHosp * 0.03;

    const repasseOperacionalTotal = round2(repasseVendas + repasseHosp);
    const baseNF = round2(margemVendas + margemHosp);
    const repasseComissionamento = tCons;
    const baseLiquidaPosComissao = round2(baseNF - repasseComissionamento);
    const imposto6 = round2(baseNF * 0.06);

    return { faturamentoBruto: fBruto, descontoValor: fDesc, faturamentoParaComissao: fParaComissao, vendasHospedagem: vHosp, comissaoGeralDetalhe: cGeral, comissaoHospedagem: cHosp, totalConsultor: tCons, reembolsos: Number(data.reembolsos) || 0, adiantamentos: Number(data.adiantamentos) || 0, valorFinal: vFinal, repasseOperacionalTotal, baseNF, repasseComissionamento, baseLiquidaPosComissao, imposto6 };
  }, [data]);

  const validate = () => {
    const e = {};
    if (!data.nome.trim()) e.nome = "Obrigatório";
    if (onlyDigits(data.cpf).length !== 11) e.cpf = "Inválido";
    if (!data.pix.trim()) e.pix = "Obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const gerarPDF = () => {
    if (!validate()) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório Detalhado de Gestão Financeira", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Consultor: ${data.nome}`, 15, 25);
    doc.text(`CPF: ${data.cpf}`, 15, 32);
    doc.text(`Chave PIX: ${data.pix}`, 15, 39);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 15, 46);

    doc.autoTable({
      startY: 55,
      head: [['Descrição', 'Valor']],
      body: [
        ['Faturamento Vendas', formatBRL(computed.faturamentoParaComissao)],
        ['Vendas de Hospedagem', formatBRL(computed.vendasHospedagem)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85] }
    });

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Detalhamento da Comissão', 'Valor']],
      body: [
        ['Faixa de Vendas', computed.comissaoGeralDetalhe.faixaLabel],
        ['Comissão Vendas (%)', formatBRL(computed.comissaoGeralDetalhe.comissaoPercentual)],
        [computed.comissaoGeralDetalhe.isValorFixo ? 'Valor Fixo Acordado' : 'Valor de Faixa', formatBRL(computed.comissaoGeralDetalhe.valorDeFaixa)],
        ['Bônus por Meta', formatBRL(computed.comissaoGeralDetalhe.bonusMeta)],
        ['Comissão Hospedagem', formatBRL(computed.comissaoHospedagem)],
        ['Total Comissão Geral', formatBRL(computed.totalConsultor)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Resumo Financeiro', 'Valor']],
      body: [
        ['Reembolsos (+)', formatBRL(computed.reembolsos)],
        ['Adiantamentos (-)', formatBRL(computed.adiantamentos)],
        ['VALOR FINAL A RECEBER', formatBRL(computed.valorFinal)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });

    if (acessoAgencia) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Gestão da Agência', 'Valor']],
        body: [
          ['Repasse Operacional (62,5% Vendas + 97% Hosp)', formatBRL(computed.repasseOperacionalTotal)],
          ['Base p/ Nota Fiscal (Margem Agência)', formatBRL(computed.baseNF)],
          ['Repasse de Comissionamento', formatBRL(computed.repasseComissionamento)],
          ['Base Líquida (Pós Repasse)', formatBRL(computed.baseLiquidaPosComissao)],
          ['Imposto Estimado (6% sobre Base NF)', formatBRL(computed.imposto6)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }
      });
    }
    doc.save(`relatorio_${data.nome.replace(/\s+/g, '_')}.pdf`);
  };

  const enviarWhatsApp = () => {
    if (!validate()) return;
    const txt = `*Resumo Financeiro - ${data.nome}*\n\n` +
                `• Comissão Geral: ${formatBRL(computed.totalConsultor)}\n` +
                `• Reembolsos: ${formatBRL(computed.reembolsos)}\n` +
                `• Adiantamentos: ${formatBRL(computed.adiantamentos)}\n` +
                `*VALOR FINAL: ${formatBRL(computed.valorFinal)}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
  };

  if (stage === "choose") return <LoginGate onChooseProfile={(p) => setStage(p === "consultor" ? "login" : "app")} />;
  if (stage === "login") return <ConsultorLogin onBack={() => setStage("choose")} onSuccess={() => setStage("app")} />;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-black text-slate-900">Gestão Financeira</h1>
          <button className="bg-rose-600 text-white px-4 py-2 rounded-xl font-bold" onClick={() => setStage("choose")}>Sair</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900">Identificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome" error={errors.nome}><input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" value={data.nome} onChange={(e) => setData({ ...data, nome: e.target.value })} placeholder="Nome Completo" /></Field>
                <Field label="CPF" error={errors.cpf}><input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" value={data.cpf} onChange={(e) => setData({ ...data, cpf: maskCPF(e.target.value) })} placeholder="000.000.000-00" /></Field>
                <Field label="Chave PIX" error={errors.pix}><input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" value={data.pix} onChange={(e) => setData({ ...data, pix: e.target.value })} placeholder="Email, CPF ou Celular" /></Field>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="temValorFixo" className="w-4 h-4 rounded text-blue-600" checked={data.temValorFixo} onChange={(e) => setData({ ...data, temValorFixo: e.target.checked })} />
                <label htmlFor="temValorFixo" className="text-sm font-bold text-slate-700">Consultor com Valor Fixo Mensal?</label>
              </div>
              {data.temValorFixo && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                  <Field label="Valor Fixo Mensal Acordado"><MoneyInput value={data.valorFixoMensal} onChange={(v) => setData({ ...data, valorFixoMensal: v })} /></Field>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900">Dados de Vendas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Faturamento Vendas"><MoneyInput value={data.faturamentoBruto} onChange={(v) => setData({ ...data, faturamentoBruto: v })} /></Field>
                <Field label="Desconto Aplicado"><MoneyInput value={data.descontoValor} onChange={(v) => setData({ ...data, descontoValor: v })} /></Field>
                <Field label="Vendas Hospedagem"><MoneyInput value={data.vendasHospedagem} onChange={(v) => setData({ ...data, vendasHospedagem: v })} /></Field>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900">Ajustes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Reembolsos"><MoneyInput value={data.reembolsos} onChange={(v) => setData({ ...data, reembolsos: v })} /></Field>
                <Field label="Adiantamentos"><MoneyInput value={data.adiantamentos} onChange={(v) => setData({ ...data, adiantamentos: v })} /></Field>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <ResultsCards computed={computed} acessoAgencia={acessoAgencia} senhaAgencia={senhaAgencia} setSenhaAgencia={setSenhaAgencia} />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex gap-2">
              <button className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white" onClick={gerarPDF}>Gerar PDF Detalhado</button>
              <button className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white" onClick={enviarWhatsApp}>Enviar WhatsApp</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
