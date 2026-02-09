const { useEffect, useMemo, useState } = React;

// =========================
// Utilitários
// =========================
const formatBRL = (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
const round2 = (n) => Math.round((n || 0) * 100) / 100;
const onlyDigits = (s) => String(s || "").replace(/\D/g, "");
const maskCPF = (v) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0, 3) + "." + d.slice(3);
  if (d.length <= 9) return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6);
  return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9, 11);
};

// =========================
// Regras de Negócio
// =========================
function calcComissao(f, temFixo, valorFixo) {
  let res = { label: "", p: 0, c: 0, faixa: 0, bonus: 0 };
  if (f <= 10000) res = { label: "Até 10.000", p: 0.10, c: f * 0.10, faixa: 0, bonus: 0 };
  else if (f <= 21000) res = { label: "10.001 a 21.000", p: 0.02, c: f * 0.02, faixa: 1700, bonus: 0 };
  else if (f <= 31000) res = { label: "21.001 a 31.000", p: 0.03, c: f * 0.03, faixa: 2000, bonus: 500 };
  else if (f <= 41000) res = { label: "31.001 a 41.000", p: 0.04, c: f * 0.04, faixa: 2000, bonus: 800 };
  else if (f <= 51000) res = { label: "41.001 a 51.000", p: 0.05, c: f * 0.05, faixa: 2000, bonus: 1200 };
  else if (f <= 100000) res = { label: "51.001 a 100.000", p: 0.06, c: f * 0.06, faixa: 2000, bonus: 1500 };
  else res = { label: "Acima de 100.000", p: 0.06, c: f * 0.06, faixa: 2000, bonus: 3000 };

  if (temFixo) { res.faixa = Number(valorFixo) || 0; res.isFixo = true; }
  res.c = round2(res.c);
  res.total = round2(res.c + res.faixa + res.bonus);
  return res;
}

// =========================
// Componentes UI
// =========================
function MoneyInput({ value, onChange, label, hint, dark = false }) {
  const [display, setDisplay] = useState("");
  useEffect(() => { setDisplay(value === 0 ? "" : formatBRL(value)); }, [value]);
  const handle = (e) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (!raw) { setDisplay(""); onChange(0); return; }
    let num = parseInt(raw, 10) / 100;
    setDisplay(formatBRL(num));
    onChange(num);
  };
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className={`text-[10px] font-black uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
        {hint && <span className="text-[10px] text-slate-400 italic">{hint}</span>}
      </div>
      <input className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all ${dark ? 'bg-slate-800 text-white border-none focus:ring-2 focus:ring-blue-500/50' : 'bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} inputMode="numeric" value={display} onChange={handle} placeholder="R$ 0,00" />
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full py-4 flex justify-between items-center text-left">
        <span className="text-sm font-bold text-slate-700">{question}</span>
        <span className={`text-blue-500 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <div className="pb-4 text-xs text-slate-500 leading-relaxed animate-fade-in">{answer}</div>}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const handle = (e) => {
    e.preventDefault();
    if (email === "oi@jericar.com.br" && pass === "123456") onLogin();
    else setError("Credenciais inválidas.");
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-[2rem] p-10 card-shadow border border-slate-100 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">ACESSO JERICAR</h1>
        </div>
        <form onSubmit={handle} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase">E-mail</label>
            <input type="email" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" value={email} onChange={e => setEmail(e.target.value)} placeholder="oi@jericar.com.br" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase">Senha</label>
            <input type="password" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••" />
          </div>
          {error && <p className="text-xs text-rose-600 font-bold text-center">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100">Entrar</button>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ onLogout }) {
  const [data, setData] = useState({ 
    nome: "", cpf: "", pix: "", fVendas: 0, fHospPadrao: 0, fHospAlta: 0, desc: 0, reemb: 0, adiant: 0, temFixo: false, vFixo: 0,
    listaDescAut: [] 
  });
  const [newDescAut, setNewDescAut] = useState({ valor: 0, por: "", data: "", reserva: "" });
  const [senha, setSenha] = useState("");
  const acessoAgencia = senha === "0102030405#";

  const addDescAut = () => {
    if (newDescAut.valor <= 0 || !newDescAut.por) {
      alert("Por favor, preencha pelo menos o valor e quem autorizou.");
      return;
    }
    setData({ ...data, listaDescAut: [...data.listaDescAut, { ...newDescAut, id: Date.now() }] });
    setNewDescAut({ valor: 0, por: "", data: "", reserva: "" });
  };

  const removeDescAut = (id) => {
    setData({ ...data, listaDescAut: data.listaDescAut.filter(item => item.id !== id) });
  };

  const computed = useMemo(() => {
    const fV = data.fVendas;
    const fHP = data.fHospPadrao;
    const fHA = data.fHospAlta;
    const d = data.desc;
    const totalDescAut = data.listaDescAut.reduce((acc, item) => acc + item.valor, 0);
    
    const limiteDesc = round2(fV * 0.10);
    const excessoDesc = Math.max(0, round2(d - limiteDesc));
    
    const percDesc = fV > 0 ? (d / fV) : 0;
    let bonusPerformance = 0;
    let selo = { label: "Sem Vendas", color: "text-slate-400", bg: "bg-slate-100", border: "border-slate-200", premioPerc: 0 };

    if (fV > 0) {
      if (percDesc <= 0.03) {
        selo = { label: "Vendedor Ouro", color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-400", premioPerc: 0.01 };
        bonusPerformance = round2(fV * 0.01);
      } else if (percDesc <= 0.07) {
        selo = { label: "Vendedor Prata", color: "text-slate-700", bg: "bg-slate-200", border: "border-slate-400", premioPerc: 0.005 };
        bonusPerformance = round2(fV * 0.005);
      } else if (percDesc <= 0.10) {
        selo = { label: "Vendedor Bronze", color: "text-orange-800", bg: "bg-orange-100", border: "border-orange-400", premioPerc: 0.002 };
        bonusPerformance = round2(fV * 0.002);
      } else {
        selo = { label: "Alerta de Margem", color: "text-rose-700", bg: "bg-rose-100", border: "border-rose-400", premioPerc: 0 };
        bonusPerformance = 0;
      }
    }

    const baseCalcVendas = Math.max(0, fV - totalDescAut);
    const cG = calcComissao(baseCalcVendas, data.temFixo, data.vFixo);
    const cHPadrao = round2(fHP * 0.015);
    const mHPadraoAgencia = round2(fHP * 0.085);
    const cHAlta = round2(fHA * 0.10);
    const mHAltaAgencia = round2(fHA * 0.20);
    
    const totalComHosp = round2(cHPadrao + cHAlta);
    const tCons = round2(cG.total + totalComHosp + bonusPerformance);
    const vFinal = round2(tCons - excessoDesc + data.reemb - data.adiant);
    
    const fatBruto = round2(fV + fHP + fHA);
    const repFornecedor = round2(baseCalcVendas * 0.625 + fHP * 0.90 + fHA * 0.70);
    const margemBrutaTotal = round2(baseCalcVendas * 0.375 + mHPadraoAgencia + mHAltaAgencia);
    const margemAposDesconto = round2(margemBrutaTotal - d);
    const comissaoLiquidaPaga = round2(Math.max(0, vFinal));
    const baseNF = Math.max(0, round2(margemAposDesconto - comissaoLiquidaPaga));
    const imp = round2(baseNF * 0.06);
    const lucroLiquido = round2(baseNF - imp);
    
    // Autogestão: cálculos de margem de desconto restante para cada selo
    const franquiaUsada = fV > 0 ? Math.min(100, round2((d / (fV * 0.10)) * 100)) : 0;
    const descMaxOuro = round2(fV * 0.03);
    const descMaxPrata = round2(fV * 0.07);
    const descMaxBronze = round2(fV * 0.10);
    const restanteOuro = round2(Math.max(0, descMaxOuro - d));
    const restantePrata = round2(Math.max(0, descMaxPrata - d));
    const restanteBronze = round2(Math.max(0, descMaxBronze - d));
    
    return { fV, fHP, fHA, d, totalDescAut, limiteDesc, excessoDesc, percDesc, bonusPerformance, selo, cG, cHPadrao, cHAlta, totalComHosp, tCons, vFinal, 
             fatBruto, repFornecedor, margemBrutaTotal, margemAposDesconto, comissaoLiquidaPaga, baseNF, imp, lucroLiquido, mHPadraoAgencia, mHAltaAgencia,
             franquiaUsada, descMaxOuro, descMaxPrata, descMaxBronze, restanteOuro, restantePrata, restanteBronze };
  }, [data]);

  const gerarPDF = (isAdmin = false) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const primaryColor = [30, 41, 59];
    const accentColor = [37, 99, 235];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(isAdmin ? "JERICAR - GESTÃO AGÊNCIA" : "JERICAR FINANCEIRO", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`RELATÓRIO ${isAdmin ? 'ADMINISTRATIVO' : 'DE COMISSIONAMENTO'} v4.8`, 105, 28, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CONSULTOR", 15, 55);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 57, 195, 57);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${data.nome || '---'}`, 15, 65);
    doc.text(`CPF: ${data.cpf || '---'}`, 15, 71);
    doc.text(`Chave PIX: ${data.pix || '---'}`, 15, 77);
    doc.text(`Status Performance: ${computed.selo.label}`, 140, 65);

    if (data.listaDescAut.length > 0) {
      doc.autoTable({
        startY: 85,
        head: [['AUDITORIA DE DESCONTOS AUTORIZADOS', 'QUEM', 'DATA', 'RESERVA', 'VALOR']],
        body: data.listaDescAut.map(item => [
          'Autorizado', item.por, item.data, item.reserva, formatBRL(item.valor)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [100, 116, 139] }
      });
    }

    const startYTable = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 85;

    if (!isAdmin) {
      doc.autoTable({
        startY: startYTable,
        head: [['FATURAMENTOS E PERFORMANCE', 'VALORES']],
        body: [
          ['Vendas Gerais', formatBRL(computed.fV)],
          ['Hospedagem Margem Padrão (1.5%)', formatBRL(computed.fHP)],
          ['Hospedagem Alta Margem (10%)', formatBRL(computed.fHA)],
          ['Desconto do Consultor', formatBRL(computed.d)],
          ['Total Isenções (Autorizados)', formatBRL(computed.totalDescAut)],
          ['Status de Eficiência Comercial', computed.selo.label],
          [`Prêmio Performance (${(computed.selo.premioPerc * 100).toFixed(1)}%)`, formatBRL(computed.bonusPerformance)],
        ],
        theme: 'striped',
        headStyles: { fillColor: primaryColor }
      });

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['DETALHAMENTO DA COMISSÃO', 'VALORES']],
        body: [
          [`Comissão sobre Vendas (${(computed.cG.p * 100).toFixed(0)}%)`, formatBRL(computed.cG.c)],
          [computed.cG.isFixo ? 'Valor Fixo Mensal' : 'Valor de Faixa', formatBRL(computed.cG.faixa)],
          ['Bônus Meta', formatBRL(computed.cG.bonus)],
          ['Comissão Hospedagens', formatBRL(computed.totalComHosp)],
          ['Prêmio Eficiência Comercial', formatBRL(computed.bonusPerformance)],
          ['TOTAL ACUMULADO', { content: formatBRL(computed.tCons), styles: { fontStyle: 'bold', textColor: [16, 185, 129] } }],
        ],
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['FECHAMENTO FINAL', 'VALORES']],
        body: [
          ['Total Acumulado', formatBRL(computed.tCons)],
          ['Dedução Excesso Desconto (>10%)', computed.excessoDesc > 0 ? `- ${formatBRL(computed.excessoDesc)}` : 'R$ 0,00'],
          ['Ajustes (Reembolsos/Adiantamentos)', formatBRL(data.reemb - data.adiant)],
          ['LÍQUIDO A RECEBER', { content: formatBRL(computed.vFinal), styles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 12 } }],
        ],
        theme: 'plain',
        headStyles: { fillColor: accentColor, textColor: [255, 255, 255] }
      });
    } else {
      doc.autoTable({
        startY: startYTable,
        head: [['FLUXO FINANCEIRO DA AGÊNCIA', 'VALORES']],
        body: [
          ['Faturamento Bruto Total', formatBRL(computed.fatBruto)],
          ['(-) Repasse Operacional Fornecedores', formatBRL(computed.repFornecedor)],
          ['(=) Margem Bruta Agência', { content: formatBRL(computed.margemBrutaTotal), styles: { fontStyle: 'bold' } }],
          ['(-) Desconto Concedido ao Cliente', formatBRL(computed.d)],
          ['(=) Margem Após Desconto', { content: formatBRL(computed.margemAposDesconto), styles: { fontStyle: 'bold', textColor: computed.margemAposDesconto < 0 ? [220, 38, 38] : [0, 0, 0] } }],
          ['(-) Comissão Líquida Paga ao Consultor', formatBRL(computed.comissaoLiquidaPaga)],
          ['    • Comissão Bruta', formatBRL(computed.tCons)],
          ['    • Dedução Excesso Desconto', computed.excessoDesc > 0 ? `- ${formatBRL(computed.excessoDesc)}` : 'R$ 0,00'],
          ['    • Ajustes (Reemb./Adiant.)', formatBRL(data.reemb - data.adiant)],
          ['(=) BASE PARA NOTA FISCAL', { content: formatBRL(computed.baseNF), styles: { fontStyle: 'bold', textColor: [37, 99, 235] } }],
          ['(-) Imposto Estimado (6%)', formatBRL(computed.imp)],
          ['(=) LUCRO LÍQUIDO FINAL AGÊNCIA', { content: formatBRL(computed.lucroLiquido), styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } }],
          ['', ''],
          ['Isenções de Desconto (Auditado)', formatBRL(computed.totalDescAut)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }
      });
    }

    doc.save(`${isAdmin ? 'GESTAO' : 'FINANCEIRO'}_jericar_${data.nome || 'consultor'}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 animate-fade-in">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">JERICAR FINANCEIRO</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">v4.8 - Autogestão do Consultor</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => gerarPDF(false)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">PDF Consultor</button>
          <button onClick={onLogout} className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">Sair</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-[2rem] p-8 card-shadow border border-slate-100 space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 tracking-tight">👤 Identificação</h2>
            <div className="space-y-4">
              <input className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" value={data.nome} onChange={e=>setData({...data, nome: e.target.value})} placeholder="Nome do Consultor" />
              <div className="grid grid-cols-2 gap-4">
                <input className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" value={data.cpf} onChange={e=>setData({...data, cpf: maskCPF(e.target.value)})} placeholder="CPF" />
                <input className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" value={data.pix} onChange={e=>setData({...data, pix: e.target.value})} placeholder="Chave PIX" />
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl flex items-center gap-3">
              <input type="checkbox" id="fixo" checked={data.temFixo} onChange={e=>setData({...data, temFixo: e.target.checked})} />
              <label htmlFor="fixo" className="text-sm font-black text-blue-900 cursor-pointer">Consultor com Valor Fixo Mensal?</label>
            </div>
            {data.temFixo && <MoneyInput label="Fixo" value={data.vFixo} onChange={v=>setData({...data, vFixo: v})} />}
          </section>

          <section className="bg-white rounded-[2rem] p-8 card-shadow border border-slate-100 space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 tracking-tight">📊 Vendas e Descontos</h2>
            <div className="space-y-5">
              <MoneyInput label="Vendas Gerais" value={data.fVendas} onChange={v=>setData({...data, fVendas: v})} />
              <MoneyInput label="Desconto do Consultor" hint="Impacta Performance" value={data.desc} onChange={v=>setData({...data, desc: v})} />
            </div>
          </section>

          <section className="bg-indigo-50 rounded-[2rem] p-8 border border-indigo-100 space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 tracking-tight text-indigo-900">🏨 Hospedagens</h2>
            <div className="space-y-6">
              <div className="bg-white/60 p-6 rounded-[2rem] border border-indigo-200">
                <MoneyInput label="Margem Padrão (3-20%)" hint="Comissão: 1,5% sobre o total" value={data.fHospPadrao} onChange={v=>setData({...data, fHospPadrao: v})} />
              </div>
              <div className="bg-white/60 p-6 rounded-[2rem] border border-indigo-200">
                <MoneyInput label="Alta Margem (>20%)" hint="Comissão: 10,0% sobre o total" value={data.fHospAlta} onChange={v=>setData({...data, fHospAlta: v})} />
              </div>
            </div>
          </section>

          <section className="bg-slate-50 rounded-[2rem] p-8 border border-slate-200 space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 tracking-tight text-slate-700">🔓 Descontos Autorizados</h2>
            <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <MoneyInput label="Valor" value={newDescAut.valor} onChange={v=>setNewDescAut({...newDescAut, valor: v})} />
              <input className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" value={newDescAut.por} onChange={e=>setNewDescAut({...newDescAut, por: e.target.value})} placeholder="Quem autorizou?" />
              <div className="grid grid-cols-2 gap-4">
                <input className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" value={newDescAut.data} onChange={e=>setNewDescAut({...newDescAut, data: e.target.value})} placeholder="Data" />
                <input className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none" value={newDescAut.reserva} onChange={e=>setNewDescAut({...newDescAut, reserva: e.target.value})} placeholder="Reserva" />
              </div>
              <button onClick={addDescAut} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">+ Adicionar Autorização</button>
            </div>
            {data.listaDescAut.length > 0 && (
              <div className="space-y-2">
                {data.listaDescAut.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center animate-fade-in">
                    <div className="text-[10px] text-slate-600"><span className="font-black text-blue-600">{formatBRL(item.valor)}</span> | {item.por} | Res: {item.reserva}</div>
                    <button onClick={() => removeDescAut(item.id)} className="text-rose-500 hover:text-rose-700 font-black text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-[2rem] p-8 card-shadow border border-slate-100 space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 tracking-tight">⚖️ Ajustes</h2>
            <div className="grid grid-cols-2 gap-4">
              <MoneyInput label="Reembolsos" value={data.reemb} onChange={v=>setData({...data, reemb: v})} />
              <MoneyInput label="Adiantamentos" value={data.adiant} onChange={v=>setData({...data, adiant: v})} />
            </div>
          </section>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className={`rounded-[2rem] p-8 border-2 transition-all card-shadow ${computed.selo.bg} ${computed.selo.border}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-black uppercase tracking-tighter ${computed.selo.color}`}>Performance Comercial</h3>
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border-2 ${computed.selo.border} ${computed.selo.color}`}>
                {computed.selo.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Desconto Real</p><p className={`text-3xl font-black ${computed.selo.color}`}>{(computed.percDesc * 100).toFixed(1)}%</p></div>
              <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase">Prêmio Extra</p><p className={`text-3xl font-black ${computed.bonusPerformance > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>{computed.bonusPerformance > 0 ? `+ ${formatBRL(computed.bonusPerformance)}` : 'R$ 0,00'}</p></div>
            </div>
          </div>

          {computed.fV > 0 && (
          <div className="rounded-[2rem] p-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 card-shadow transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase tracking-tighter text-blue-900">📊 Autogestão</h3>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Acompanhe seu mês</span>
            </div>
            {/* Barra de Franquia */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black text-slate-500 uppercase">Franquia Utilizada (10%)</p>
                <p className={`text-sm font-black ${computed.franquiaUsada >= 100 ? 'text-rose-600' : computed.franquiaUsada >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{computed.franquiaUsada.toFixed(1)}%</p>
              </div>
              <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${computed.franquiaUsada >= 100 ? 'bg-rose-500' : computed.franquiaUsada >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, computed.franquiaUsada)}%`}}></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-slate-400">0%</span>
                <span className="text-[9px] text-slate-400">Limite: {formatBRL(computed.limiteDesc)}</span>
              </div>
            </div>
            {/* Margem Restante por Selo */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-4 rounded-2xl text-center border-2 transition-all ${computed.restanteOuro > 0 ? 'bg-amber-50 border-amber-300' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                <p className="text-[9px] font-black text-amber-700 uppercase mb-1">🥇 Ouro (até 3%)</p>
                <p className={`text-lg font-black ${computed.restanteOuro > 0 ? 'text-amber-700' : 'text-slate-400 line-through'}`}>{computed.restanteOuro > 0 ? formatBRL(computed.restanteOuro) : 'Perdido'}</p>
                <p className="text-[8px] text-slate-400 mt-1">restante p/ manter</p>
              </div>
              <div className={`p-4 rounded-2xl text-center border-2 transition-all ${computed.restantePrata > 0 ? 'bg-slate-100 border-slate-300' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                <p className="text-[9px] font-black text-slate-600 uppercase mb-1">🥈 Prata (até 7%)</p>
                <p className={`text-lg font-black ${computed.restantePrata > 0 ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{computed.restantePrata > 0 ? formatBRL(computed.restantePrata) : 'Perdido'}</p>
                <p className="text-[8px] text-slate-400 mt-1">restante p/ manter</p>
              </div>
              <div className={`p-4 rounded-2xl text-center border-2 transition-all ${computed.restanteBronze > 0 ? 'bg-orange-50 border-orange-300' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                <p className="text-[9px] font-black text-orange-700 uppercase mb-1">🥉 Bronze (até 10%)</p>
                <p className={`text-lg font-black ${computed.restanteBronze > 0 ? 'text-orange-700' : 'text-slate-400 line-through'}`}>{computed.restanteBronze > 0 ? formatBRL(computed.restanteBronze) : 'Perdido'}</p>
                <p className="text-[8px] text-slate-400 mt-1">restante p/ manter</p>
              </div>
            </div>
            {computed.fV > 0 && computed.percDesc <= 0.10 && (
              <div className="mt-4 p-4 bg-white/70 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-800">💡 <span className="font-black">Dica:</span> {computed.percDesc <= 0.03 ? `Você está no Ouro! Ainda pode dar até ${formatBRL(computed.restanteOuro)} de desconto sem perder o selo.` : computed.percDesc <= 0.07 ? `Você está no Prata. Para recuperar o Ouro, aumente suas vendas sem desconto. Ainda tem ${formatBRL(computed.restantePrata)} de margem para manter o Prata.` : `Atenção! Você está no Bronze. Restam apenas ${formatBRL(computed.restanteBronze)} antes de perder todos os selos.`}</p>
              </div>
            )}
            {computed.percDesc > 0.10 && (
              <div className="mt-4 p-4 bg-rose-100 rounded-2xl border border-rose-300">
                <p className="text-[10px] text-rose-800 font-black">⚠️ Você ultrapassou a franquia de 10%. Aumente o volume de vendas sem desconto para diluir o percentual e recuperar seu selo.</p>
              </div>
            )}
          </div>
          )}

          <div className={`rounded-[2rem] p-8 border-2 transition-all card-shadow ${computed.excessoDesc > 0 ? 'border-rose-500 bg-rose-50' : 'border-slate-100 bg-white'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-black uppercase tracking-tighter ${computed.excessoDesc > 0 ? 'text-rose-700' : 'text-slate-900'}`}>Trava de Segurança (10%)</h3>
              <span className="text-[10px] font-black text-slate-400 uppercase">Limite: {formatBRL(computed.limiteDesc)}</span>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Limite</p><p className="text-lg font-black">{formatBRL(computed.limiteDesc)}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Desconto Dado</p><p className="text-lg font-black">{formatBRL(computed.d)}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Dedução</p><p className={`text-2xl font-black ${computed.excessoDesc > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{computed.excessoDesc > 0 ? `- ${formatBRL(computed.excessoDesc)}` : 'R$ 0,00'}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 card-shadow border border-slate-100 space-y-6">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Detalhamento da Comissão</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl text-center"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Comissão ({(computed.cG.p * 100).toFixed(0)}%)</p><p className="text-sm font-black text-blue-600">{formatBRL(computed.cG.c)}</p></div>
              <div className="p-4 bg-slate-50 rounded-2xl text-center"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Faixa/Fixo</p><p className="text-sm font-black">{formatBRL(computed.cG.faixa)}</p></div>
              <div className="p-4 bg-slate-50 rounded-2xl text-center"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Bônus Meta</p><p className="text-sm font-black">{formatBRL(computed.cG.bonus)}</p></div>
              <div className="p-4 bg-indigo-50 rounded-2xl text-center border border-indigo-100"><p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Hospedagens</p><p className="text-sm font-black text-indigo-700">{formatBRL(computed.totalComHosp)}</p></div>
              <div className="p-4 bg-amber-50 rounded-2xl text-center border border-amber-100"><p className="text-[10px] font-black text-amber-600 uppercase mb-1">Prêmio Efic.</p><p className="text-sm font-black text-amber-700">{formatBRL(computed.bonusPerformance)}</p></div>
            </div>
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center"><p className="text-xs font-black text-emerald-600 uppercase">Total Acumulado</p><p className="text-2xl font-black text-emerald-700">{formatBRL(computed.tCons)}</p></div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 card-shadow border border-slate-100">
            <h3 className="text-xl font-black mb-8 uppercase tracking-tighter">Resumo Final</h3>
            <div className="space-y-4 text-sm font-bold">
              <div className="flex justify-between"><span>Total Acumulado:</span><span>{formatBRL(computed.tCons)}</span></div>
              {computed.excessoDesc > 0 && <div className="flex justify-between text-rose-600"><span>Dedução Excesso Desconto:</span><span>-{formatBRL(computed.excessoDesc)}</span></div>}
              <div className="flex justify-between text-slate-400 italic"><span>Isenção Descontos Autorizados:</span><span>-{formatBRL(computed.totalDescAut)}</span></div>
              <div className="border-t-2 pt-8 flex justify-between items-end"><span className="text-lg font-black uppercase tracking-tighter">Líquido a Receber</span><span className="text-5xl font-black text-blue-600 tracking-tighter">{formatBRL(computed.vFinal)}</span></div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black uppercase tracking-tighter">Gestão Agência</h3>
              <div className="flex gap-2">
                {acessoAgencia && <button onClick={() => gerarPDF(true)} className="bg-blue-600 text-white px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-blue-700">PDF Admin</button>}
                <span className="px-3 py-1 bg-slate-800 rounded-full text-[8px] font-black text-slate-500 uppercase tracking-widest">v4.8</span>
              </div>
            </div>
            <input type="password" placeholder="Senha Admin" className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white mb-8 outline-none border border-slate-700 focus:border-blue-500" value={senha} onChange={e=>setSenha(e.target.value)} />
            {acessoAgencia && (
              <div className="space-y-6 animate-fade-in">
                {/* Fluxo Financeiro Detalhado */}
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-500 uppercase font-black">Fluxo Financeiro</p>
                  <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
                    <table className="w-full text-[11px] text-left">
                      <tbody className="divide-y divide-slate-700/50">
                        <tr><td className="p-3 text-slate-400">Faturamento Bruto</td><td className="p-3 text-right font-bold text-white">{formatBRL(computed.fatBruto)}</td></tr>
                        <tr><td className="p-3 text-slate-400">(-) Repasse Fornecedores</td><td className="p-3 text-right font-bold text-rose-400">{formatBRL(computed.repFornecedor)}</td></tr>
                        <tr className="bg-slate-700/30"><td className="p-3 font-bold text-white">(=) Margem Bruta</td><td className="p-3 text-right font-bold text-white">{formatBRL(computed.margemBrutaTotal)}</td></tr>
                        <tr><td className="p-3 text-slate-400">(-) Desconto Concedido</td><td className="p-3 text-right font-bold text-rose-400">{formatBRL(computed.d)}</td></tr>
                        <tr className={`bg-slate-700/30 ${computed.margemAposDesconto < 0 ? '' : ''}`}><td className="p-3 font-bold text-white">(=) Margem Após Desconto</td><td className={`p-3 text-right font-bold ${computed.margemAposDesconto < 0 ? 'text-rose-400' : 'text-amber-400'}`}>{formatBRL(computed.margemAposDesconto)}</td></tr>
                        <tr><td className="p-3 text-slate-400">(-) Comissão Líquida Paga</td><td className="p-3 text-right font-bold text-rose-400">{formatBRL(computed.comissaoLiquidaPaga)}</td></tr>
                        <tr><td className="p-3 pl-6 text-[10px] text-slate-500">• Comissão Bruta</td><td className="p-3 text-right text-[10px] text-slate-500">{formatBRL(computed.tCons)}</td></tr>
                        {computed.excessoDesc > 0 && <tr><td className="p-3 pl-6 text-[10px] text-slate-500">• Dedução Excesso</td><td className="p-3 text-right text-[10px] text-emerald-500">-{formatBRL(computed.excessoDesc)}</td></tr>}
                        {(data.reemb > 0 || data.adiant > 0) && <tr><td className="p-3 pl-6 text-[10px] text-slate-500">• Ajustes (Reemb./Adiant.)</td><td className="p-3 text-right text-[10px] text-slate-500">{formatBRL(data.reemb - data.adiant)}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cards de Resultado */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-5 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <p className="text-[9px] text-slate-500 uppercase font-black mb-2">Base Nota Fiscal</p>
                    <p className="text-lg font-black text-emerald-400">{formatBRL(computed.baseNF)}</p>
                  </div>
                  <div className="p-5 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <p className="text-[9px] text-slate-500 uppercase font-black mb-2">Imposto (6%)</p>
                    <p className="text-lg font-black text-blue-400">{formatBRL(computed.imp)}</p>
                  </div>
                  <div className="p-5 bg-emerald-900/30 rounded-2xl border border-emerald-700/50">
                    <p className="text-[9px] text-emerald-500 uppercase font-black mb-2">Lucro Líquido</p>
                    <p className="text-lg font-black text-emerald-300">{formatBRL(computed.lucroLiquido)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] text-slate-500 uppercase font-black">Auditoria de Descontos Isentos</p>
                  <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-slate-700 text-slate-400 uppercase font-black">
                        <tr><th className="p-3">Quem</th><th className="p-3">Reserva</th><th className="p-3 text-right">Valor</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {data.listaDescAut.length > 0 ? data.listaDescAut.map(item => (
                          <tr key={item.id}><td className="p-3 font-bold">{item.por}</td><td className="p-3 text-slate-400">{item.reserva}</td><td className="p-3 text-right font-bold text-blue-400">{formatBRL(item.valor)}</td></tr>
                        )) : (<tr><td colSpan="3" className="p-3 text-center text-slate-500">Nenhum desconto isento lançado.</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] p-8 card-shadow border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Orientações Gerais (FAQ)</h3>
            <div className="space-y-1">
              <FAQItem question="Como funcionam os Prêmios de Eficiência?" answer="Seus descontos sobre Vendas Gerais definem seu selo: Ouro (0-3%) ganha +1,0%, Prata (3-7%) ganha +0,5% e Bronze (7-10%) ganha +0,2% de bônus extra." />
              <FAQItem question="O que acontece se eu passar de 10% de desconto?" answer="A Jericar permite até 10% de franquia. O valor que ultrapassar esse limite será descontado integralmente (100%) da sua comissão final." />
              <FAQItem question="Como são calculadas as Hospedagens?" answer="Temos duas regras fixas: Margem Padrão (lucro 3-20%) paga 1,5% de comissão sobre o total. Alta Margem (lucro >20%) paga 10,0% de comissão sobre o total." />
              <FAQItem question="O que é o Desconto Autorizado?" answer="São descontos com aval da gerência para fechar vendas estratégicas. Eles NÃO contam para a trava de 10% e NÃO prejudicam seu selo de performance, desde que auditados." />
              <FAQItem question="Como funciona a Base para Nota Fiscal?" answer="A agência emite NF sobre o lucro real: Margem Bruta (-) Desconto Concedido (-) Comissão Líquida Paga ao Consultor. O desconto sai da margem da agência (não do fornecedor), e a comissão líquida já considera a dedução por excesso de desconto. Isso garante a saúde fiscal e financeira da Jericar." />
              <FAQItem question="O que é o Valor Fixo Mensal?" answer="Alguns consultores possuem um acordo de remuneração diferenciado, no qual recebem um valor fixo mensal definido em contrato. Esse valor substitui a faixa de comissão variável que normalmente seria calculada com base no volume de vendas. Independentemente de quanto o consultor venda no mês, o componente de faixa será sempre o valor fixo acordado. Os demais componentes (comissão percentual, bônus de meta, prêmio de eficiência e hospedagens) continuam sendo calculados normalmente." />
              <FAQItem question="Como funciona a Autogestão?" answer="O painel de Autogestão permite que você acompanhe em tempo real o uso da sua franquia de desconto ao longo do mês. Ele mostra a barra de progresso da franquia utilizada, quanto ainda pode dar de desconto para manter cada selo (Ouro, Prata, Bronze) e dicas personalizadas. Use a ferramenta durante o mês para tomar decisões mais inteligentes sobre descontos." />
              <FAQItem question="Posso recuperar meu selo dando mais vendas sem desconto?" answer="Sim. O selo é calculado sobre o percentual total de desconto em relação ao total de vendas do mês. Se você deu um desconto alto em uma venda, pode diluir esse percentual aumentando o volume de vendas sem desconto. Por exemplo: R$ 840 de desconto em R$ 3.560 de vendas = 23,6% (Alerta). Mas se vender mais R$ 40.000 sem desconto, o percentual cai para 1,93% (Ouro)." />
              <FAQItem question="O que acontece quando meu valor líquido fica negativo?" answer="Se o excesso de desconto superar sua comissão total, o valor líquido ficará negativo. Isso significa que o desconto dado foi tão alto que não só consumiu toda a sua comissão, como gerou um débito. Esse saldo negativo será considerado nos acertos futuros." />
              <FAQItem question="Como funcionam Reembolsos e Adiantamentos?" answer="Reembolsos são valores que a agência deve devolver ao consultor (ex: despesas operacionais aprovadas) e são somados ao valor final. Adiantamentos são valores já recebidos antecipadamente e são descontados do valor final. Ambos aparecem no Resumo Final do relatório." />
              <FAQItem question="Qual a diferença entre Desconto do Consultor e Desconto Autorizado?" answer="O Desconto do Consultor é dado por iniciativa própria e impacta diretamente seu selo de performance e pode gerar dedução se ultrapassar 10%. Já o Desconto Autorizado é aprovado pela gerência, não conta para a trava de 10%, não prejudica o selo, e é auditado separadamente na seção de Gestão Agência." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Main() {
  const [isLogged, setIsLogged] = useState(false);
  return isLogged ? <Dashboard onLogout={() => setIsLogged(false)} /> : <LoginScreen onLogin={() => setIsLogged(true)} />;
}
ReactDOM.createRoot(document.getElementById("root")).render(<Main />);
