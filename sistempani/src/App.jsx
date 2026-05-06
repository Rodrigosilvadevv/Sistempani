import React, { useState, useEffect, useRef, useCallback } from 'react';

const TODAY_ISO = new Date().toISOString().split('T')[0];
const TODAY_FMT = new Date().toLocaleDateString('pt-BR');

const INITIAL_INSUMOS = [
  { id: 'i1', nome: 'Farinha Especial',     qtd: 50, unidade: 'kg', dataChegada: '2026-05-01', diasDuracao: 6  },
  { id: 'i2', nome: 'Fermento Biológico',   qtd: 10, unidade: 'kg', dataChegada: '2026-05-04', diasDuracao: 15 },
  { id: 'i3', nome: 'Açúcar Refinado',      qtd: 20, unidade: 'kg', dataChegada: '2026-04-20', diasDuracao: 30 },
  { id: 'i4', nome: 'Sal',                  qtd: 5,  unidade: 'kg', dataChegada: '2026-05-02', diasDuracao: 60 },
  { id: 'i5', nome: 'Margarina',            qtd: 8,  unidade: 'kg', dataChegada: '2026-05-03', diasDuracao: 20 },
];
const INITIAL_TAREFAS = [
  { id: 't1', descricao: 'Limpeza Pesada dos Fornos',      responsavel: 'Noturno',  concluida: false, frequencia: 'dia_sim_dia_nao', ultimaExecucao: '2026-05-05' },
  { id: 't2', descricao: 'Bater Massa Pão Francês',        responsavel: 'Padeiro',  concluida: false, frequencia: 'diario',           ultimaExecucao: '2026-05-05' },
  { id: 't3', descricao: 'Limpar Carrinhos',               responsavel: 'Ajudante', concluida: false, frequencia: 'dia_sim_dia_nao', ultimaExecucao: '2026-05-04' },
  { id: 't4', descricao: 'Repor Insumos na Bancada',       responsavel: 'Padeiro',  concluida: false, frequencia: 'diario',           ultimaExecucao: '2026-05-05' },
  { id: 't5', descricao: 'Limpeza Câmara de Crescimento',  responsavel: 'Noturno',  concluida: false, frequencia: 'dia_sim_dia_nao', ultimaExecucao: '2026-05-03' },
];
const INITIAL_RECEITAS = [
  { id: 'r1', nome: 'Pão Francês Tradicional', rendimento: '100 pães / ~5kg',
    ingredientes: '5kg Farinha Especial\n100g Sal fino\n50g Melhorador de Farinha\n150g Fermento Biológico\nÁgua gelada (conforme textura)\nGelo (em dias quentes)',
    preparo: '1. Misture os secos.\n2. Adicione o fermento e a água gelada aos poucos.\n3. Sove por 12 min (ponto de véu).\n4. Fermentar 45–90 min conforme temp.\n5. Modelar e assar a 220°C.' },
  { id: 'r2', nome: 'Pão Doce Massa Rica', rendimento: '50 pães / ~3kg',
    ingredientes: '2kg Farinha\n400g Açúcar Refinado\n200g Margarina\n4 Ovos\n100g Fermento Biológico\n1 pitada de Sal\nLeite morno q.b.',
    preparo: '1. Misture os secos e os ovos.\n2. Incorpore a margarina e o leite.\n3. Sove até desgrudar das mãos.\n4. Fermentar 1h.\n5. Modelar e assar a 180°C por 18 min.' },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const calcStatusEstoque = (dataChegada, diasDuracao) => {
  const hoje = new Date(TODAY_ISO);
  const fim = new Date(dataChegada);
  fim.setDate(fim.getDate() + diasDuracao);
  const dias = Math.ceil((fim - hoje) / 86400000);
  const pct = Math.max(0, Math.min(100, Math.round((dias / diasDuracao) * 100)));
  if (dias < 0)   return { label: 'ESGOTADO',       cor: '#ef4444', dias, pct: 0 };
  if (dias <= 2)  return { label: 'PEDIR URGENTE',  cor: '#f97316', dias, pct };
  if (dias <= 5)  return { label: 'ATENÇÃO',        cor: '#eab308', dias, pct };
  return                 { label: 'OK',             cor: '#16a34a', dias, pct };
};

const tarefaApareceHoje = (t) => {
  if (t.frequencia === 'diario') return true;
  return (new Date(TODAY_ISO) - new Date(t.ultimaExecucao)) / 86400000 >= 2;
};

const calcFermento = ({ volume, tempSaida, horarioSaida }) => {
  const vol = parseFloat(volume), t = parseInt(tempSaida);
  let base, nota, emoji;
  if (t <= 4)       { base = vol===1?228:114; nota='FRIO EXTREMO / GEADA — Carga máxima. Aqueça a água.'; emoji='🧊'; }
  else if (t <= 10) { base = vol===1?180:90;  nota='MUITO FRIO — Dosagem alta necessária.'; emoji='❄️'; }
  else if (t <= 14) { base = vol===1?140:70;  nota='FRIO MODERADO — Fermentação mais lenta.'; emoji='🌬️'; }
  else if (t <= 19) { base = vol===1?100:50;  nota='PADRÃO CURITIBA — Crescimento normal.'; emoji='✅'; }
  else if (t <= 24) { base = vol===1?80:40;   nota='QUENTE — Reduza para não passar do ponto.'; emoji='🌡️'; }
  else              { base = vol===1?60:30;   nota='CALOR EXTREMO — Dosagem mínima de segurança.'; emoji='🔥'; }
  const [h, m] = horarioSaida.split(':').map(Number);
  if (h * 60 + m > 360) { base -= vol===1?15:7; nota += ' (Reduzido: fornada tardia.)'; }
  return { gramas: Math.round(base * 1.05), nota, emoji };
};

const FAIXA_COR = (t) => {
  const n = parseInt(t);
  if (n <= 4)  return { cor: '#1d4ed8', bg: '#dbeafe', label: 'FRIO EXTREMO' };
  if (n <= 10) return { cor: '#0e7490', bg: '#cffafe', label: 'MUITO FRIO' };
  if (n <= 14) return { cor: '#0369a1', bg: '#e0f2fe', label: 'FRIO MODERADO' };
  if (n <= 19) return { cor: '#15803d', bg: '#dcfce7', label: 'PADRÃO CURITIBA' };
  if (n <= 24) return { cor: '#c2410c', bg: '#ffedd5', label: 'QUENTE' };
  return              { cor: '#991b1b', bg: '#fee2e2', label: 'CALOR EXTREMO' };
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
const ToastCtx = React.createContext(null);
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = uid();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2600);
  }, []);
  const bgMap = { success: '#16a34a', warn: '#f97316', error: '#dc2626', info: '#1d4ed8' };
  const icMap = { success: '✓', warn: '⚠', error: '✕', info: 'ℹ' };
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div style={{ position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)', zIndex:9999, display:'flex', flexDirection:'column', gap:'8px', alignItems:'center', width:'320px', pointerEvents:'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ padding:'11px 18px', borderRadius:'10px', fontWeight:800, fontSize:'13px', letterSpacing:'0.5px', backgroundColor:bgMap[t.type]||bgMap.success, color:'#fff', boxShadow:'0 4px 20px rgba(0,0,0,0.25)', animation:'slideUp 0.3s ease', fontFamily:"'JetBrains Mono',monospace" }}>
            {icMap[t.type]||'✓'} {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};
const useToast = () => React.useContext(ToastCtx);

// ─── ANIMATED NUMBER ─────────────────────────────────────────────────────────
const AnimNum = ({ target, duration = 700 }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{val}</>;
};

// ─── LIVE CLOCK ──────────────────────────────────────────────────────────────
const LiveClock = () => {
  const [t, setT] = useState(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));
  useEffect(() => { const id = setInterval(() => setT(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})),1000); return ()=>clearInterval(id); },[]);
  return <>{t}</>;
};

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
const Bar = ({ pct, cor }) => {
  const [w, setW] = useState(0);
  useEffect(() => { const id = setTimeout(() => setW(pct), 100); return ()=>clearTimeout(id); }, [pct]);
  return (
    <div style={{ height:'6px', backgroundColor:'#e2e8f0', borderRadius:'99px', overflow:'hidden', margin:'7px 0 3px' }}>
      <div style={{ height:'100%', width:`${w}%`, backgroundColor:cor, borderRadius:'99px', transition:'width 0.9s cubic-bezier(0.34,1.56,0.64,1)' }} />
    </div>
  );
};

// ─── PULSE DOT ───────────────────────────────────────────────────────────────
const Dot = ({ cor }) => (
  <span style={{ position:'relative', display:'inline-block', width:'10px', height:'10px', marginRight:'6px', verticalAlign:'middle' }}>
    <span style={{ position:'absolute', inset:0, borderRadius:'50%', backgroundColor:cor, opacity:0.4, animation:'ping 1.5s ease infinite' }} />
    <span style={{ position:'absolute', inset:'2px', borderRadius:'50%', backgroundColor:cor }} />
  </span>
);

// ─── SHARED STYLES ───────────────────────────────────────────────────────────
const btnBack   = { display:'block', width:'100%', padding:'13px', backgroundColor:'#000', color:'#fff', border:'none', borderRadius:'10px', fontWeight:900, fontSize:'12px', cursor:'pointer', marginBottom:'18px', letterSpacing:'1px', fontFamily:'inherit', textAlign:'left' };
const ttl       = { fontWeight:900, fontSize:'18px', letterSpacing:'2px', borderBottom:'5px solid #000', paddingBottom:'8px', marginBottom:'20px', color:'#000' };
const lbl       = { fontSize:'11px', fontWeight:900, letterSpacing:'1px', color:'#000', display:'block', marginBottom:'6px' };
const lblSm     = { fontSize:'10px', fontWeight:900, letterSpacing:'1px', color:'#475569', marginBottom:'3px' };
const inp       = { width:'100%', padding:'13px', border:'3px solid #000', borderRadius:'10px', fontSize:'17px', fontWeight:900, color:'#000', backgroundColor:'#fff', boxSizing:'border-box', fontFamily:'inherit' };
const inpSm     = { padding:'8px 10px', border:'2px solid #000', borderRadius:'8px', fontSize:'13px', fontWeight:700, color:'#000', backgroundColor:'#fff', fontFamily:'inherit', width:'100%', boxSizing:'border-box' };
const txa       = { width:'100%', padding:'10px', border:'2px solid #000', borderRadius:'8px', fontSize:'13px', fontWeight:600, color:'#000', backgroundColor:'#fff', fontFamily:'inherit', boxSizing:'border-box', resize:'vertical', minHeight:'90px' };
const btnP      = { width:'100%', padding:'18px', backgroundColor:'#000', color:'#fff', border:'none', borderRadius:'12px', fontWeight:900, fontSize:'14px', cursor:'pointer', letterSpacing:'1.5px', fontFamily:'inherit' };
const btnE = (e)=> ({ padding:'10px 18px', backgroundColor:e?'#1d4ed8':'#fff', color:e?'#fff':'#000', border:`3px solid ${e?'#1d4ed8':'#000'}`, borderRadius:'10px', fontWeight:900, fontSize:'12px', cursor:'pointer', letterSpacing:'0.5px', fontFamily:'inherit' });
const btnAdd    = { width:'100%', padding:'14px', backgroundColor:'#fff', color:'#1d4ed8', border:'3px dashed #1d4ed8', borderRadius:'10px', fontWeight:900, fontSize:'13px', cursor:'pointer', letterSpacing:'1px', fontFamily:'inherit', marginTop:'12px' };
const btnDel    = { padding:'7px 12px', backgroundColor:'#dc2626', color:'#fff', border:'none', borderRadius:'7px', fontWeight:900, fontSize:'11px', cursor:'pointer', fontFamily:'inherit', flexShrink:0 };

// ─── MENU ─────────────────────────────────────────────────────────────────────
const TelaMenu = ({ ir, alertas, concluidas, totalTarefas }) => {
  const [rdy, setRdy] = useState(false);
  useEffect(() => { const id = setTimeout(()=>setRdy(true),50); return ()=>clearTimeout(id); },[]);
  const pct = totalTarefas > 0 ? Math.round((concluidas/totalTarefas)*100) : 0;
  const items = [
    { tela:'producao', emoji:'🥖', label:'PRODUÇÃO',  sub:'Cálculo térmico' },
    { tela:'tarefas',  emoji:'📋', label:'AGENDA',    sub:`${concluidas}/${totalTarefas} hoje` },
    { tela:'estoque',  emoji:'📦', label:'ESTOQUE',   sub: alertas>0?`${alertas} alertas`:'Tudo OK' },
    { tela:'receitas', emoji:'📖', label:'RECEITAS',  sub:'Livro de receitas' },
  ];
  return (
    <div style={{ padding:'20px' }}>
      <div style={{ backgroundColor:'#fff', border:'3px solid #000', borderRadius:'16px', padding:'18px', marginBottom:'18px', boxShadow:'4px 4px 0 #000', opacity:rdy?1:0, transform:rdy?'none':'translateY(12px)', transition:'all .4s' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
          <span style={{ fontWeight:900, fontSize:'12px', letterSpacing:'1px', color:'#000' }}>PROGRESSO DO DIA</span>
          <span style={{ fontWeight:900, fontSize:'22px', color:pct===100?'#16a34a':'#1d4ed8' }}>{pct}%</span>
        </div>
        <Bar pct={pct} cor={pct===100?'#16a34a':'#1d4ed8'} />
        <div style={{ fontSize:'11px', color:'#475569', fontWeight:700, marginTop:'3px' }}>{concluidas} de {totalTarefas} tarefas concluídas</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
        {items.map(({ tela, emoji, label, sub }, i) => {
          const [pressed, setP] = useState(false);
          return (
            <div key={tela} onClick={()=>ir(tela)}
              onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)}
              onTouchStart={()=>setP(true)} onTouchEnd={()=>setP(false)}
              style={{ backgroundColor:'#fff', border:'3px solid #000', borderRadius:'16px', padding:'24px 12px', cursor:'pointer',
                boxShadow:pressed?'2px 2px 0 #000':'5px 5px 0 #000',
                transform:rdy?(pressed?'translate(3px,3px)':'none'):'translateY(20px)',
                opacity:rdy?1:0, transition:`all .1s, opacity .4s ${i*60}ms, transform .4s ${i*60}ms`,
                display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
              {tela==='estoque' && alertas>0 && <span style={{ position:'absolute', top:'10px', right:'10px', width:'10px', height:'10px', backgroundColor:'#ef4444', borderRadius:'50%', border:'2px solid #fff' }} />}
              <span style={{ fontSize:'36px' }}>{emoji}</span>
              <span style={{ fontWeight:900, fontSize:'13px', marginTop:'10px', letterSpacing:'1px', color:'#000' }}>{label}</span>
              <span style={{ fontWeight:700, fontSize:'11px', marginTop:'3px', color:'#64748b' }}>{sub}</span>
            </div>
          );
        })}
        <div style={{ gridColumn:'span 2', backgroundColor:'#000', color:'#fff', border:'3px solid #000', borderRadius:'16px', padding:'18px 22px', cursor:'pointer', boxShadow:'4px 4px 0 #1d4ed8', display:'flex', justifyContent:'space-between', alignItems:'center', opacity:rdy?1:0, transform:rdy?'none':'translateY(20px)', transition:'opacity .4s 240ms, transform .4s 240ms' }}
          onClick={()=>ir('relatorios')}
          onMouseEnter={e=>{e.currentTarget.style.transform='translate(-2px,-2px)';e.currentTarget.style.boxShadow='6px 6px 0 #1d4ed8';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='4px 4px 0 #1d4ed8';}}>
          <div>
            <div style={{ fontWeight:900, fontSize:'15px', letterSpacing:'1.5px' }}>📊 RELATÓRIOS</div>
            <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'3px', fontWeight:700 }}>Visão gerencial completa</div>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            {alertas>0 && <span style={{ backgroundColor:'#f97316', color:'#fff', fontSize:'11px', fontWeight:900, padding:'4px 10px', borderRadius:'20px' }}>⚠ {alertas}</span>}
            <span style={{ backgroundColor:'#1d4ed8', color:'#fff', fontSize:'11px', fontWeight:900, padding:'4px 10px', borderRadius:'20px' }}>→</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PRODUÇÃO ─────────────────────────────────────────────────────────────────
const TelaProducao = ({ voltar }) => {
  const toast = useToast();
  const [params, setParams] = useState({ volume:'1', tempSaida:1, horarioSaida:'05:40' });
  const [resultado, setResultado] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [copied, setCopied] = useState(false);
  const fi = FAIXA_COR(params.tempSaida);
  const preview = calcFermento(params);

  const calcular = () => {
    setCalculando(true);
    setTimeout(() => {
      const r = calcFermento(params);
      setResultado(r);
      setCalculando(false);
      toast(`Prescrição: ${r.gramas}g gerada!`);
    }, 500);
  };

  const copiar = () => {
    const r = calcFermento(params);
    navigator.clipboard?.writeText(`PANIDASH — ${r.gramas}g | ${r.nota}`).catch(()=>{});
    setCopied(true); toast('Dosagem copiada!','info');
    setTimeout(()=>setCopied(false),2000);
  };

  const [h, m] = params.horarioSaida.split(':').map(Number);
  const tardio = h * 60 + m > 360;

  return (
    <div style={{ padding:'20px' }}>
      <button style={btnBack} onClick={voltar}>← PAINEL</button>
      <h2 style={ttl}>CÁLCULO TÉRMICO</h2>

      <div style={{ backgroundColor:fi.cor, color:'#fff', padding:'12px 18px', borderRadius:'12px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:`0 4px 14px ${fi.cor}55`, transition:'background .4s, box-shadow .4s' }}>
        <div>
          <div style={{ fontWeight:900, fontSize:'14px', letterSpacing:'1px' }}>{fi.label}</div>
          <div style={{ fontSize:'11px', opacity:0.9, marginTop:'2px' }}>Preview: ~{preview.gramas}g</div>
        </div>
        <div style={{ fontSize:'32px' }}>{preview.emoji}</div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
        <div>
          <div style={lbl}>CARRINHO</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            {[['1','100% CHEIO','🟩'],['0.5','50% MEIO','🟨']].map(([val,txt,ico])=>(
              <button key={val} onClick={()=>setParams(p=>({...p,volume:val}))} style={{ padding:'14px 8px', border:`3px solid ${params.volume===val?fi.cor:'#000'}`, borderRadius:'12px', backgroundColor:params.volume===val?fi.bg:'#fff', fontWeight:900, fontSize:'12px', cursor:'pointer', fontFamily:'inherit', color:params.volume===val?fi.cor:'#000', transition:'all .2s', boxShadow:params.volume===val?`0 0 0 3px ${fi.cor}33`:'none' }}>
                {ico} {txt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ ...lbl, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>TEMPERATURA DE SAÍDA (°C)</span>
            <span style={{ backgroundColor:fi.cor, color:'#fff', padding:'3px 12px', borderRadius:'20px', fontSize:'15px', fontWeight:900, boxShadow:`0 2px 8px ${fi.cor}55`, transition:'background .3s' }}>
              {params.tempSaida}°C
            </span>
          </div>
          <input type="range" min="-5" max="35" step="1"
            value={params.tempSaida}
            onChange={e=>setParams(p=>({...p,tempSaida:e.target.value}))}
            style={{ width:'100%', margin:'10px 0 4px', accentColor:fi.cor, cursor:'pointer' }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', fontWeight:800, color:'#64748b' }}>
            <span>-5° 🧊</span><span>15° ✅</span><span>35° 🔥</span>
          </div>
        </div>

        <div>
          <div style={lbl}>HORÁRIO DE ASSAMENTO</div>
          <input type="time" style={inp} value={params.horarioSaida} onChange={e=>setParams(p=>({...p,horarioSaida:e.target.value}))} />
          {tardio && <div style={{ fontSize:'11px', color:'#f97316', fontWeight:900, marginTop:'5px' }}>⚠ Fornada tardia — dosagem reduzida automaticamente</div>}
        </div>

        <button style={{ ...btnP, backgroundColor:calculando?'#374151':'#000' }} onClick={calcular} disabled={calculando}>
          {calculando
            ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                <span style={{ display:'inline-block', width:'16px', height:'16px', border:'3px solid rgba(255,255,255,0.3)', borderTop:'3px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                CALCULANDO...
              </span>
            : '⚗ GERAR PRESCRIÇÃO'}
        </button>

        {resultado && (
          <div style={{ backgroundColor:'#0f172a', color:'#fff', borderRadius:'18px', padding:'24px', textAlign:'center', border:`3px solid ${fi.cor}`, boxShadow:`0 8px 30px ${fi.cor}44`, animation:'fadeIn .3s ease' }}>
            <div style={{ fontSize:'11px', fontWeight:900, letterSpacing:'2px', color:'#94a3b8', marginBottom:'6px' }}>DOSAGEM FINAL (+5% INCLUÍDO)</div>
            <div style={{ fontSize:'88px', fontWeight:900, lineHeight:1, color:fi.cor }}>
              <AnimNum target={resultado.gramas} /><span style={{ fontSize:'24px', color:'#e2e8f0' }}>g</span>
            </div>
            <div style={{ fontSize:'36px', margin:'6px 0' }}>{resultado.emoji}</div>
            <div style={{ fontSize:'13px', fontWeight:800, color:'#e2e8f0', lineHeight:1.5, borderTop:'1px solid #334155', paddingTop:'12px' }}>{resultado.nota}</div>
            <button onClick={copiar} style={{ marginTop:'14px', padding:'10px 24px', backgroundColor:copied?'#16a34a':fi.cor, color:'#fff', border:'none', borderRadius:'8px', fontWeight:900, fontSize:'12px', cursor:'pointer', fontFamily:'inherit', letterSpacing:'1px', transition:'background .3s' }}>
              {copied?'✓ COPIADO!':'📋 COPIAR DOSAGEM'}
            </button>
          </div>
        )}

        <div style={{ border:'3px solid #000', borderRadius:'14px', overflow:'hidden' }}>
          <div style={{ backgroundColor:'#0f172a', color:'#94a3b8', padding:'10px 16px', fontSize:'10px', fontWeight:900, letterSpacing:'1.5px' }}>TABELA DE REFERÊNCIA — 100% / 50% (c/ +5%)</div>
          {[['≤ 4°C','Frio Extremo','239g','120g'],['5–10°C','Muito Frio','189g','95g'],['11–14°C','Frio Moderado','147g','74g'],['15–19°C','Padrão CWB','105g','53g'],['20–24°C','Quente','84g','42g'],['≥ 25°C','Calor Extremo','63g','32g']].map(([faixa,nome,c,m],i)=>{
            const t=parseInt(params.tempSaida);
            const ativo=[t<=4,t>=5&&t<=10,t>=11&&t<=14,t>=15&&t<=19,t>=20&&t<=24,t>=25][i];
            return (
              <div key={faixa} style={{ display:'grid', gridTemplateColumns:'72px 1fr 56px 56px', padding:'10px 16px', fontSize:'12px', fontWeight:700, borderTop:i===0?'none':'1px solid #e2e8f0', backgroundColor:ativo?fi.bg:'#fff', transition:'background .3s' }}>
                <span style={{ fontWeight:900, fontSize:'11px', color:ativo?fi.cor:'#000' }}>{faixa}</span>
                <span style={{ color:ativo?fi.cor:'#475569', fontWeight:ativo?900:600 }}>{nome}</span>
                <span style={{ color:'#1d4ed8', textAlign:'center', fontWeight:ativo?900:700 }}>{c}</span>
                <span style={{ color:'#64748b', textAlign:'center' }}>{m}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── ESTOQUE ──────────────────────────────────────────────────────────────────
const TelaEstoque = ({ insumos, setInsumos, voltar }) => {
  const toast = useToast();
  const [editando, setEditando] = useState(false);
  const upd = (id,k,v) => setInsumos(p=>p.map(i=>i.id===id?{...i,[k]:v}:i));
  const del = (id) => { setInsumos(p=>p.filter(i=>i.id!==id)); toast('Insumo removido','error'); };
  const add = () => { setInsumos(p=>[...p,{id:uid(),nome:'Novo Insumo',qtd:0,unidade:'kg',dataChegada:TODAY_ISO,diasDuracao:7}]); toast('Insumo adicionado!'); };
  return (
    <div style={{ padding:'20px' }}>
      <button style={btnBack} onClick={voltar}>← PAINEL</button>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ ...ttl, marginBottom:0, borderBottom:'none' }}>ESTOQUE</h2>
        <button style={btnE(editando)} onClick={()=>{ setEditando(e=>!e); if(editando)toast('Estoque salvo!'); }}>{editando?'💾 SALVAR':'✏ EDITAR'}</button>
      </div>
      <div style={{ borderBottom:'5px solid #000', margin:'12px 0 20px' }} />
      <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
        {insumos.map((item,i) => {
          const st = calcStatusEstoque(item.dataChegada, item.diasDuracao);
          return (
            <div key={item.id} style={{ backgroundColor:'#fff', border:'3px solid #000', borderLeft:`8px solid ${st.cor}`, borderRadius:'14px', overflow:'hidden', animation:`fadeIn 0.3s ease ${i*50}ms both` }}>
              <div style={{ padding:'14px 16px' }}>
                {editando ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <input style={{ ...inpSm, flex:1, fontWeight:900, fontSize:'15px' }} value={item.nome} onChange={e=>upd(item.id,'nome',e.target.value)} />
                      <button style={btnDel} onClick={()=>del(item.id)}>✕</button>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
                      <div><div style={lblSm}>QUANTIDADE</div><input type="number" style={inpSm} value={item.qtd} onChange={e=>upd(item.id,'qtd',e.target.value)} /></div>
                      <div><div style={lblSm}>UNIDADE</div><input style={inpSm} value={item.unidade} onChange={e=>upd(item.id,'unidade',e.target.value)} /></div>
                      <div><div style={lblSm}>DURAÇÃO (d)</div><input type="number" style={inpSm} value={item.diasDuracao} onChange={e=>upd(item.id,'diasDuracao',e.target.value)} /></div>
                    </div>
                    <div><div style={lblSm}>DATA CHEGADA</div><input type="date" style={inpSm} value={item.dataChegada} onChange={e=>upd(item.id,'dataChegada',e.target.value)} /></div>
                  </div>
                ) : (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:900, fontSize:'16px', color:'#0f172a' }}>{item.nome.toUpperCase()}</div>
                        <div style={{ fontSize:'11px', color:'#475569', marginTop:'3px', fontWeight:600 }}>Chegou: {item.dataChegada} · Duração: {item.diasDuracao}d</div>
                        <div style={{ display:'flex', alignItems:'center', marginTop:'6px' }}>
                          <Dot cor={st.cor} />
                          <span style={{ fontSize:'12px', fontWeight:900, color:st.cor }}>{st.label} · {st.dias>0?`~${st.dias}d restantes`:'VERIFICAR AGORA'}</span>
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0, marginLeft:'12px' }}>
                        <div style={{ fontSize:'28px', fontWeight:900, color:'#0f172a' }}>{item.qtd}</div>
                        <div style={{ fontSize:'12px', color:'#64748b', fontWeight:800 }}>{item.unidade}</div>
                      </div>
                    </div>
                    <Bar pct={st.pct} cor={st.cor} />
                    <div style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textAlign:'right' }}>{st.pct}% estimado restante</div>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {editando && <button style={btnAdd} onClick={add}>+ ADICIONAR INSUMO</button>}
      </div>
    </div>
  );
};

// ─── TAREFAS ──────────────────────────────────────────────────────────────────
const TelaTarefas = ({ tarefas, setTarefas, voltar }) => {
  const toast = useToast();
  const [editando, setEditando] = useState(false);
  const [filtro, setFiltro] = useState('hoje');
  const [bounce, setBounce] = useState(new Set());

  const toggle = (id) => {
    const t = tarefas.find(x=>x.id===id);
    const nova = !t.concluida;
    setBounce(s=>new Set([...s,id]));
    setTimeout(()=>setBounce(s=>{const n=new Set(s);n.delete(id);return n;}),350);
    setTarefas(p=>p.map(x=>x.id===id?{...x,concluida:nova,ultimaExecucao:nova?TODAY_ISO:x.ultimaExecucao}:x));
    if(nova) toast(`✓ ${t.descricao.slice(0,30)}${t.descricao.length>30?'...':''}`);
    else toast('Tarefa reaberta','info');
  };

  const upd = (id,k,v) => setTarefas(p=>p.map(t=>t.id===id?{...t,[k]:v}:t));
  const del = (id) => { setTarefas(p=>p.filter(t=>t.id!==id)); toast('Tarefa removida','error'); };
  const add = () => { setTarefas(p=>[...p,{id:uid(),descricao:'Nova Tarefa',responsavel:'Padeiro',concluida:false,frequencia:'diario',ultimaExecucao:'2026-01-01'}]); toast('Tarefa adicionada!'); };

  const lista = filtro==='hoje'?tarefas.filter(tarefaApareceHoje):filtro==='todas'?tarefas:tarefas.filter(t=>t.frequencia===filtro);
  const conc = lista.filter(t=>t.concluida).length;
  const pct = lista.length>0?Math.round(conc/lista.length*100):0;

  return (
    <div style={{ padding:'20px' }}>
      <button style={btnBack} onClick={voltar}>← PAINEL</button>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ ...ttl, marginBottom:0, borderBottom:'none' }}>TAREFAS</h2>
        <button style={btnE(editando)} onClick={()=>{ setEditando(e=>!e); if(editando)toast('Tarefas salvas!'); }}>{editando?'💾 SALVAR':'✏ EDITAR'}</button>
      </div>
      <div style={{ borderBottom:'5px solid #000', margin:'12px 0 16px' }} />

      <div style={{ backgroundColor:'#fff', border:'3px solid #000', borderRadius:'12px', padding:'14px 16px', marginBottom:'16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
          <span style={{ fontWeight:900, fontSize:'12px', color:'#000' }}>{conc}/{lista.length} CONCLUÍDAS</span>
          <span style={{ fontWeight:900, fontSize:'18px', color:pct===100?'#16a34a':'#1d4ed8' }}>{pct}%</span>
        </div>
        <Bar pct={pct} cor={pct===100?'#16a34a':'#1d4ed8'} />
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px', overflowX:'auto', paddingBottom:'4px' }}>
        {[['hoje','HOJE'],['diario','DIÁRIAS'],['dia_sim_dia_nao','ALTERNADAS'],['todas','TODAS']].map(([val,txt])=>(
          <button key={val} onClick={()=>setFiltro(val)} style={{ padding:'8px 14px', border:`2px solid ${filtro===val?'#1d4ed8':'#d1d5db'}`, borderRadius:'20px', fontWeight:900, fontSize:'11px', cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', backgroundColor:filtro===val?'#1d4ed8':'#fff', color:filtro===val?'#fff':'#374151', transition:'all .15s' }}>
            {txt}
          </button>
        ))}
      </div>

      <div style={{ border:'3px solid #000', borderRadius:'14px', overflow:'hidden', backgroundColor:'#fff' }}>
        {lista.length===0
          ? <div style={{ padding:'30px', textAlign:'center', fontWeight:900, fontSize:'14px', color:'#64748b' }}>✓ Nenhuma tarefa neste filtro.</div>
          : lista.map((t,i)=>(
            <div key={t.id} style={{ borderTop:i===0?'none':'2px solid #e2e8f0', padding:'14px 16px', backgroundColor:t.concluida?'#f8fafc':'#fff', transform:bounce.has(t.id)?'scale(0.97)':'scale(1)', transition:'transform .2s, background .3s' }}>
              {editando ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <input style={{ ...inpSm, flex:1, fontWeight:900 }} value={t.descricao} onChange={e=>upd(t.id,'descricao',e.target.value)} />
                    <button style={btnDel} onClick={()=>del(t.id)}>✕</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    <div><div style={lblSm}>RESPONSÁVEL</div><input style={inpSm} value={t.responsavel} onChange={e=>upd(t.id,'responsavel',e.target.value)} /></div>
                    <div><div style={lblSm}>FREQUÊNCIA</div>
                      <select style={inpSm} value={t.frequencia} onChange={e=>upd(t.id,'frequencia',e.target.value)}>
                        <option value="diario">Diário</option>
                        <option value="dia_sim_dia_nao">Alternada</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:'14px', cursor:'pointer' }} onClick={()=>toggle(t.id)}>
                  <div style={{ width:'28px', height:'28px', border:`3px solid ${t.concluida?'#16a34a':'#000'}`, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:t.concluida?'#16a34a':'#fff', flexShrink:0, transition:'all .25s', boxShadow:t.concluida?'0 2px 10px #16a34a55':'none' }}>
                    {t.concluida && <span style={{ color:'#fff', fontWeight:900, fontSize:'16px' }}>✓</span>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:900, fontSize:'15px', color:t.concluida?'#94a3b8':'#0f172a', textDecoration:t.concluida?'line-through':'none', transition:'color .2s' }}>{t.descricao}</div>
                    <div style={{ fontSize:'10px', fontWeight:800, marginTop:'4px', display:'flex', gap:'6px', flexWrap:'wrap' }}>
                      <span style={{ backgroundColor:'#f1f5f9', color:'#475569', padding:'2px 8px', borderRadius:'20px' }}>{t.responsavel.toUpperCase()}</span>
                      <span style={{ backgroundColor:t.frequencia==='diario'?'#dcfce7':'#dbeafe', color:t.frequencia==='diario'?'#15803d':'#1d4ed8', padding:'2px 8px', borderRadius:'20px', fontWeight:900 }}>
                        {t.frequencia==='diario'?'DIÁRIO':'ALTERNADA'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
      {editando && <button style={btnAdd} onClick={add}>+ NOVA TAREFA</button>}
    </div>
  );
};

// ─── RECEITAS ─────────────────────────────────────────────────────────────────
const TelaReceitas = ({ receitas, setReceitas, voltar }) => {
  const toast = useToast();
  const [editando, setEditando] = useState(false);
  const [aberta, setAberta] = useState(null);
  const upd = (id,k,v) => setReceitas(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));
  const del = (id) => { setReceitas(p=>p.filter(r=>r.id!==id)); setAberta(null); toast('Receita removida','error'); };
  const add = () => { const id=uid(); setReceitas(p=>[...p,{id,nome:'Nova Receita',rendimento:'—',ingredientes:'Ingredientes...',preparo:'Modo de preparo...'}]); setAberta(id); toast('Receita criada!'); };
  return (
    <div style={{ padding:'20px' }}>
      <button style={btnBack} onClick={voltar}>← PAINEL</button>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ ...ttl, marginBottom:0, borderBottom:'none' }}>RECEITAS</h2>
        <button style={btnE(editando)} onClick={()=>{ setEditando(e=>!e); if(editando)toast('Receitas salvas!'); }}>{editando?'💾 SALVAR':'✏ EDITAR'}</button>
      </div>
      <div style={{ borderBottom:'5px solid #000', margin:'12px 0 20px' }} />
      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
        {receitas.map(r=>(
          <div key={r.id} style={{ border:'3px solid #000', borderRadius:'14px', overflow:'hidden', backgroundColor:'#fff' }}>
            <div style={{ padding:'16px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', backgroundColor:aberta===r.id?'#0f172a':'#fff', transition:'background .25s' }}
              onClick={()=>setAberta(aberta===r.id?null:r.id)}>
              {editando
                ? <input style={{ ...inpSm, fontWeight:900, fontSize:'15px', flex:1, marginRight:'8px', backgroundColor:aberta===r.id?'#1e293b':'#fff', color:aberta===r.id?'#f1f5f9':'#000', borderColor:aberta===r.id?'#334155':'#000' }} value={r.nome} onClick={e=>e.stopPropagation()} onChange={e=>upd(r.id,'nome',e.target.value)} />
                : <span style={{ fontWeight:900, fontSize:'15px', color:aberta===r.id?'#f1f5f9':'#0f172a' }}>{r.nome.toUpperCase()}</span>}
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                {editando && <button style={btnDel} onClick={e=>{e.stopPropagation();del(r.id);}}>✕</button>}
                <span style={{ fontSize:'18px', color:aberta===r.id?'#94a3b8':'#000', display:'inline-block', transform:aberta===r.id?'rotate(180deg)':'none', transition:'transform .25s' }}>▼</span>
              </div>
            </div>
            {aberta===r.id && (
              <div style={{ borderTop:'3px solid #000', padding:'16px', display:'flex', flexDirection:'column', gap:'14px', animation:'fadeIn .25s ease' }}>
                <div>
                  <div style={lblSm}>RENDIMENTO</div>
                  {editando?<input style={inpSm} value={r.rendimento} onChange={e=>upd(r.id,'rendimento',e.target.value)} />
                    :<div style={{ fontSize:'14px', fontWeight:800, color:'#1d4ed8', marginTop:'4px' }}>{r.rendimento}</div>}
                </div>
                <div>
                  <div style={lblSm}>INGREDIENTES</div>
                  {editando?<textarea style={txa} value={r.ingredientes} onChange={e=>upd(r.id,'ingredientes',e.target.value)} />
                    :<div style={{ fontSize:'13px', lineHeight:1.9, whiteSpace:'pre-line', backgroundColor:'#f8fafc', padding:'12px', borderRadius:'10px', border:'2px solid #e2e8f0', color:'#0f172a', fontWeight:600, marginTop:'4px' }}>{r.ingredientes}</div>}
                </div>
                <div>
                  <div style={lblSm}>MODO DE PREPARO</div>
                  {editando?<textarea style={{ ...txa, minHeight:'120px' }} value={r.preparo} onChange={e=>upd(r.id,'preparo',e.target.value)} />
                    :<div style={{ fontSize:'13px', lineHeight:1.9, whiteSpace:'pre-line', backgroundColor:'#eff6ff', padding:'12px', borderRadius:'10px', border:'2px solid #bfdbfe', color:'#1e3a8a', fontWeight:600, marginTop:'4px' }}>{r.preparo}</div>}
                </div>
              </div>
            )}
          </div>
        ))}
        {editando && <button style={btnAdd} onClick={add}>+ NOVA RECEITA</button>}
      </div>
    </div>
  );
};

// ─── RELATÓRIOS ───────────────────────────────────────────────────────────────
const TelaRelatorios = ({ tarefas, insumos, voltar }) => {
  const conc   = tarefas.filter(t=>t.concluida).length;
  const hoje   = tarefas.filter(tarefaApareceHoje).length;
  const alert  = insumos.filter(i=>calcStatusEstoque(i.dataChegada,i.diasDuracao).dias<=5).length;
  const esgt   = insumos.filter(i=>calcStatusEstoque(i.dataChegada,i.diasDuracao).dias<0).length;
  const kpis = [
    { val:conc,  total:hoje,          label:'CONCLUÍDAS', sub:`de ${hoje} hoje`,     bg:'#0f172a', tc:'#e2e8f0', acc:'#3b82f6' },
    { val:alert, total:insumos.length, label:'ALERTAS',   sub:'no estoque',          bg:alert>0?'#7c2d12':'#14532d', tc:'#fef3c7', acc:alert>0?'#f97316':'#22c55e' },
    { val:esgt,  total:insumos.length, label:'ESGOTADOS', sub:'insumos',             bg:esgt>0?'#7f1d1d':'#14532d',  tc:'#fecaca', acc:esgt>0?'#ef4444':'#22c55e' },
    { val:tarefas.filter(t=>t.frequencia==='dia_sim_dia_nao').length, total:tarefas.length, label:'ALTERNADAS', sub:'cadastradas', bg:'#1e1b4b', tc:'#e0e7ff', acc:'#818cf8' },
  ];
  return (
    <div style={{ padding:'20px' }}>
      <button style={btnBack} onClick={voltar}>← PAINEL</button>
      <h2 style={ttl}>VISÃO GERAL</h2>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'24px' }}>
        {kpis.map(({ val, total, label, sub, bg, tc, acc })=>(
          <div key={label} style={{ backgroundColor:bg, color:tc, borderRadius:'16px', padding:'20px 16px', textAlign:'center', boxShadow:`0 4px 16px ${acc}44` }}>
            <div style={{ fontSize:'52px', fontWeight:900, lineHeight:1, color:acc }}><AnimNum target={val} /></div>
            <div style={{ fontSize:'11px', fontWeight:900, letterSpacing:'1px', marginTop:'6px' }}>{label}</div>
            <div style={{ fontSize:'10px', opacity:0.7, marginTop:'2px' }}>{sub}</div>
            {total>0 && <div style={{ marginTop:'10px', height:'4px', backgroundColor:'rgba(255,255,255,0.15)', borderRadius:'99px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.round(val/total*100)}%`, backgroundColor:acc, borderRadius:'99px', transition:'width 1s ease' }} />
            </div>}
          </div>
        ))}
      </div>
      <h3 style={{ fontWeight:900, fontSize:'12px', letterSpacing:'1.5px', marginBottom:'12px', borderBottom:'4px solid #000', paddingBottom:'6px', color:'#000' }}>STATUS DOS INSUMOS</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'24px' }}>
        {insumos.map(item=>{
          const st=calcStatusEstoque(item.dataChegada,item.diasDuracao);
          return (
            <div key={item.id} style={{ backgroundColor:'#fff', border:'3px solid #000', borderLeft:`8px solid ${st.cor}`, borderRadius:'12px', padding:'12px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:900, fontSize:'14px', color:'#0f172a' }}>{item.nome}</div>
                  <div style={{ display:'flex', alignItems:'center', marginTop:'3px' }}><Dot cor={st.cor} /><span style={{ fontSize:'11px', fontWeight:900, color:st.cor }}>{st.label}</span></div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:900, fontSize:'18px', color:'#0f172a' }}>{item.qtd}{item.unidade}</div>
                  <div style={{ fontSize:'10px', color:'#64748b', fontWeight:700 }}>{st.dias>0?`~${st.dias}d`:'VERIFICAR'}</div>
                </div>
              </div>
              <Bar pct={st.pct} cor={st.cor} />
            </div>
          );
        })}
      </div>
      <div style={{ padding:'16px', border:'2px dashed #1d4ed8', borderRadius:'12px', backgroundColor:'#eff6ff' }}>
        <div style={{ fontWeight:900, fontSize:'12px', letterSpacing:'1px', color:'#1d4ed8', marginBottom:'6px' }}>⚡ INTEGRAÇÃO SUPABASE</div>
        <div style={{ fontSize:'12px', color:'#1e3a8a', fontWeight:600, lineHeight:1.6 }}>Esta aba receberá gráficos históricos e logs de produção ao conectar ao Supabase.</div>
      </div>
    </div>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────
const DashboardPani = () => {
  const [tela, setTela] = useState('menu');
  const [insumos, setInsumos] = useState(INITIAL_INSUMOS);
  const [tarefas, setTarefas] = useState(INITIAL_TAREFAS);
  const [receitas, setReceitas] = useState(INITIAL_RECEITAS);
  const voltar = () => setTela('menu');
  const alertas    = insumos.filter(i=>calcStatusEstoque(i.dataChegada,i.diasDuracao).dias<=5).length;
  const concluidas = tarefas.filter(t=>t.concluida).length;
  const totalHoje  = tarefas.filter(tarefaApareceHoje).length;

  return (
    <ToastProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes ping{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.9);opacity:0}}
        @keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        input[type=range]{height:6px;cursor:pointer;}
        input[type=range]::-webkit-slider-thumb{width:22px;height:22px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);}
        input:focus,select:focus,textarea:focus{outline:none;box-shadow:0 0 0 3px rgba(29,78,216,0.25);}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px;}
      `}</style>
      <div style={{ backgroundColor:'#f1f5f9', minHeight:'100vh', fontFamily:"'JetBrains Mono','Fira Mono','Courier New',monospace" }}>
        <header style={{ backgroundColor:'#000', color:'#fff', padding:'16px 20px 12px', borderBottom:'5px solid #1d4ed8', position:'sticky', top:0, zIndex:100 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h1 style={{ margin:0, fontSize:'20px', fontWeight:900, letterSpacing:'3px' }}>PANI<span style={{ color:'#1d4ed8' }}>DASH</span> <span style={{ color:'#1d4ed8', fontSize:'12px' }}>PRO</span></h1>
            <div style={{ fontSize:'13px', fontWeight:900, color:'#3b82f6', letterSpacing:'1px', fontVariantNumeric:'tabular-nums' }}><LiveClock /></div>
          </div>
          <div style={{ fontSize:'10px', fontWeight:700, marginTop:'4px', color:'#64748b', letterSpacing:'1px' }}>CURITIBA · {TODAY_FMT} · RODRIGO (ADS)</div>
        </header>
        <main style={{ maxWidth:'600px', margin:'0 auto', paddingBottom:'60px' }}>
          {tela==='menu'       && <TelaMenu ir={setTela} alertas={alertas} concluidas={concluidas} totalTarefas={totalHoje} />}
          {tela==='producao'   && <TelaProducao voltar={voltar} />}
          {tela==='estoque'    && <TelaEstoque insumos={insumos} setInsumos={setInsumos} voltar={voltar} />}
          {tela==='tarefas'    && <TelaTarefas tarefas={tarefas} setTarefas={setTarefas} voltar={voltar} />}
          {tela==='receitas'   && <TelaReceitas receitas={receitas} setReceitas={setReceitas} voltar={voltar} />}
          {tela==='relatorios' && <TelaRelatorios tarefas={tarefas} insumos={insumos} voltar={voltar} />}
        </main>
      </div>
    </ToastProvider>
  );
};

export default DashboardPani;s