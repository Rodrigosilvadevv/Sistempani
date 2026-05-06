import React, { useState, useCallback } from 'react';

/**
 * PANIDASH PRO V4 — MÓDULO INDUSTRIAL
 * Rodrigo (ADS Curitiba) | Fermentação Térmica + CRUD + Estoque + Tarefas
 */

const TODAY_ISO = new Date().toISOString().split('T')[0];
const TODAY_FMT = new Date().toLocaleDateString('pt-BR');

// ─── DADOS INICIAIS ─────────────────────────────────────────────────────────

const INITIAL_INSUMOS = [
  { id: 'i1', nome: 'Farinha Especial',    qtd: 50, unidade: 'kg', dataChegada: '2026-05-01', diasDuracao: 6  },
  { id: 'i2', nome: 'Fermento Biológico',  qtd: 10, unidade: 'kg', dataChegada: '2026-05-04', diasDuracao: 15 },
  { id: 'i3', nome: 'Açúcar Refinado',     qtd: 20, unidade: 'kg', dataChegada: '2026-04-20', diasDuracao: 30 },
  { id: 'i4', nome: 'Sal',                 qtd: 5,  unidade: 'kg', dataChegada: '2026-05-02', diasDuracao: 60 },
  { id: 'i5', nome: 'Margarina',           qtd: 8,  unidade: 'kg', dataChegada: '2026-05-03', diasDuracao: 20 },
];

const INITIAL_TAREFAS = [
  { id: 't1', descricao: 'Limpeza Pesada dos Fornos',   responsavel: 'Noturno',  concluida: false, frequencia: 'dia_sim_dia_nao', ultimaExecucao: '2026-05-05' },
  { id: 't2', descricao: 'Bater Massa Pão Francês',     responsavel: 'Padeiro',  concluida: false, frequencia: 'diario',           ultimaExecucao: '2026-05-05' },
  { id: 't3', descricao: 'Limpar Carrinhos',            responsavel: 'Ajudante', concluida: false, frequencia: 'dia_sim_dia_nao', ultimaExecucao: '2026-05-04' },
  { id: 't4', descricao: 'Repor Insumos na Bancada',    responsavel: 'Padeiro',  concluida: false, frequencia: 'diario',           ultimaExecucao: '2026-05-05' },
  { id: 't5', descricao: 'Limpeza Câmara de Crescimento', responsavel: 'Noturno', concluida: false, frequencia: 'dia_sim_dia_nao', ultimaExecucao: '2026-05-03' },
];

const INITIAL_RECEITAS = [
  { id: 'r1', nome: 'Pão Francês Tradicional', rendimento: '100 pães / ~5kg', ingredientes: '5kg Farinha Especial\n100g Sal fino\n50g Melhorador de Farinha\n150g Fermento Biológico\nÁgua gelada (conforme textura)\nGelo (em dias quentes)', preparo: '1. Misture os secos.\n2. Adicione o fermento e a água gelada aos poucos.\n3. Sove por 12 min (ponto de véu).\n4. Fermentar 45–90 min conforme temp.\n5. Modelar e assar a 220°C.' },
  { id: 'r2', nome: 'Pão Doce Massa Rica',     rendimento: '50 pães / ~3kg',  ingredientes: '2kg Farinha\n400g Açúcar Refinado\n200g Margarina\n4 Ovos\n100g Fermento Biológico\n1 pitada de Sal\nLeite morno q.b.', preparo: '1. Misture os secos e os ovos.\n2. Incorpore a margarina e o leite.\n3. Sove até desgrudar das mãos.\n4. Fermentar 1h.\n5. Modelar e assar a 180°C por 18 min.' },
];

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const calcStatusEstoque = (dataChegada, diasDuracao) => {
  const hoje = new Date(TODAY_ISO);
  const chegada = new Date(dataChegada);
  const fim = new Date(chegada);
  fim.setDate(fim.getDate() + diasDuracao);
  const diasRestantes = Math.ceil((fim - hoje) / 86400000);
  if (diasRestantes < 0)  return { label: 'ESGOTADO',        cor: '#ef4444', bg: '#fef2f2', dias: diasRestantes };
  if (diasRestantes <= 2) return { label: 'PEDIR URGENTE',   cor: '#f97316', bg: '#fff7ed', dias: diasRestantes };
  if (diasRestantes <= 5) return { label: 'ATENÇÃO',         cor: '#eab308', bg: '#fefce8', dias: diasRestantes };
  return                         { label: 'OK',              cor: '#22c55e', bg: '#f0fdf4', dias: diasRestantes };
};

const tarefaApareceHoje = (t) => {
  if (t.frequencia === 'diario') return true;
  const difDias = (new Date(TODAY_ISO) - new Date(t.ultimaExecucao)) / 86400000;
  return difDias >= 2;
};

// ─── LÓGICA TÉRMICA ──────────────────────────────────────────────────────────

const calcFermento = ({ volume, tempSaida, horarioSaida }) => {
  const vol = parseFloat(volume); // 1 = cheio, 0.5 = meio
  const t = parseInt(tempSaida);
  let base, nota;

  if (t <= 4) {
    base = vol === 1 ? 228 : 114;
    nota = 'FRIO EXTREMO / GEADA — Carga máxima. Aqueça a água se possível.';
  } else if (t <= 10) {
    base = vol === 1 ? 180 : 90;
    nota = 'MUITO FRIO — Madrugada gelada. Dosagem alta necessária.';
  } else if (t <= 14) {
    base = vol === 1 ? 140 : 70;
    nota = 'FRIO MODERADO — Fermentação mais lenta.';
  } else if (t <= 19) {
    base = vol === 1 ? 100 : 50;
    nota = 'PADRÃO CURITIBA — Tempo normal de crescimento.';
  } else if (t <= 24) {
    base = vol === 1 ? 80 : 40;
    nota = 'QUENTE — Reduza para não passar do ponto.';
  } else {
    base = vol === 1 ? 60 : 30;
    nota = 'CALOR EXTREMO — Dosagem de segurança (mínima).';
  }

  const [h, m] = horarioSaida.split(':').map(Number);
  if (h * 60 + m > 360) {
    base -= vol === 1 ? 15 : 7;
    nota += ' (Reduzido: fornada tardia.)';
  }

  return { gramas: Math.round(base * 1.05), nota };
};

// ─── ESTILOS BASE ─────────────────────────────────────────────────────────────

const S = {
  app: {
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: "'JetBrains Mono', 'Fira Mono', 'Courier New', monospace",
  },
  header: {
    backgroundColor: '#000',
    color: '#fff',
    padding: '18px 20px 14px',
    borderBottom: '5px solid #2563eb',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  h1: { margin: 0, fontSize: '20px', fontWeight: 900, letterSpacing: '3px', lineHeight: 1 },
  sub: { fontSize: '10px', fontWeight: 500, marginTop: '4px', opacity: 0.6, letterSpacing: '1px' },
  main: { maxWidth: '600px', margin: '0 auto', paddingBottom: '60px' },
  // Menu grid
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '20px' },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', border: '3px solid #000', borderRadius: '16px',
    padding: '28px 10px', cursor: 'pointer', boxShadow: '5px 5px 0 #000',
    transition: 'transform .1s, box-shadow .1s',
  },
  cardSpan: { gridColumn: 'span 2' },
  cardLabel: { fontSize: '14px', fontWeight: 900, marginTop: '10px', textAlign: 'center', letterSpacing: '1px' },
  // Screen
  screen: { padding: '20px' },
  title: {
    fontWeight: 900, fontSize: '18px', letterSpacing: '2px',
    borderBottom: '5px solid #000', paddingBottom: '8px', marginBottom: '20px',
  },
  // Buttons
  btnBack: {
    display: 'block', width: '100%', padding: '14px',
    backgroundColor: '#000', color: '#fff', border: 'none',
    borderRadius: '10px', fontWeight: 900, fontSize: '13px',
    cursor: 'pointer', marginBottom: '20px', letterSpacing: '1px',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    width: '100%', padding: '18px', backgroundColor: '#000', color: '#fff',
    border: 'none', borderRadius: '10px', fontWeight: 900, fontSize: '15px',
    cursor: 'pointer', letterSpacing: '1px', fontFamily: 'inherit',
  },
  btnEdit: (editing) => ({
    padding: '10px 20px',
    backgroundColor: editing ? '#2563eb' : '#fff',
    color: editing ? '#fff' : '#000',
    border: `3px solid ${editing ? '#2563eb' : '#000'}`,
    borderRadius: '10px', fontWeight: 900, fontSize: '12px',
    cursor: 'pointer', letterSpacing: '1px', fontFamily: 'inherit',
  }),
  btnAdd: {
    width: '100%', padding: '14px', backgroundColor: '#fff', color: '#000',
    border: '3px dashed #000', borderRadius: '10px', fontWeight: 900,
    fontSize: '13px', cursor: 'pointer', letterSpacing: '1px', fontFamily: 'inherit',
    marginTop: '14px',
  },
  btnDel: {
    padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff',
    border: 'none', borderRadius: '6px', fontWeight: 900, fontSize: '11px',
    cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
  },
  // Form
  label: { fontSize: '11px', fontWeight: 900, letterSpacing: '1px', marginBottom: '4px' },
  input: {
    width: '100%', padding: '13px', border: '3px solid #000',
    borderRadius: '10px', fontSize: '17px', fontWeight: 900, color: '#000',
    backgroundColor: '#fff', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  inputSm: {
    padding: '8px 10px', border: '2px solid #000', borderRadius: '8px',
    fontSize: '14px', fontWeight: 700, color: '#000', backgroundColor: '#fff',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '10px', border: '2px solid #000', borderRadius: '8px',
    fontSize: '13px', fontWeight: 500, color: '#000', backgroundColor: '#fff',
    fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical', minHeight: '90px',
  },
};

// ─── COMPONENTES AUXILIARES ──────────────────────────────────────────────────

const BotaoVoltar = ({ onClick }) => (
  <button style={S.btnBack} onClick={onClick}>← VOLTAR AO PAINEL</button>
);

// ─── TELA: MENU ──────────────────────────────────────────────────────────────

const TelaMenu = ({ ir, alertas, concluidas }) => (
  <div style={S.grid}>
    {[
      { tela: 'producao', icon: '🥖', label: 'PRODUÇÃO' },
      { tela: 'tarefas',  icon: '📋', label: 'AGENDA'   },
      { tela: 'estoque',  icon: '📦', label: 'ESTOQUE'  },
      { tela: 'receitas', icon: '📖', label: 'RECEITAS' },
    ].map(({ tela, icon, label }) => (
      <div key={tela} style={S.card} onClick={() => ir(tela)}
        onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)'; e.currentTarget.style.boxShadow='7px 7px 0 #000'; }}
        onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='5px 5px 0 #000'; }}>
        <span style={{ fontSize: '36px' }}>{icon}</span>
        <span style={S.cardLabel}>{label}</span>
      </div>
    ))}
    <div style={{ ...S.card, ...S.cardSpan }} onClick={() => ir('relatorios')}
      onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)'; e.currentTarget.style.boxShadow='7px 7px 0 #000'; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='5px 5px 0 #000'; }}>
      <span style={{ fontSize: '36px' }}>📊</span>
      <span style={S.cardLabel}>RELATÓRIOS GERENCIAIS</span>
      <div style={{ marginTop: '10px', display: 'flex', gap: '12px' }}>
        <span style={{ fontSize: '11px', backgroundColor: '#000', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 900 }}>
          ✓ {concluidas} CONCLUÍDAS
        </span>
        {alertas > 0 && (
          <span style={{ fontSize: '11px', backgroundColor: '#ef4444', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 900 }}>
            ⚠ {alertas} ALERTAS
          </span>
        )}
      </div>
    </div>
  </div>
);

// ─── TELA: PRODUÇÃO ──────────────────────────────────────────────────────────

const TelaProducao = ({ voltar }) => {
  const [params, setParams] = useState({ volume: '1', tempAgora: '8', tempSaida: '1', horarioSaida: '05:40' });
  const [resultado, setResultado] = useState(null);

  const p = (k, v) => setParams(prev => ({ ...prev, [k]: v }));

  const calcular = () => {
    const r = calcFermento(params);
    setResultado({ ...r, ts: new Date().toLocaleTimeString('pt-BR') });
  };

  const faixaInfo = () => {
    const t = parseInt(params.tempSaida);
    if (t <= 4)  return { cor: '#2563eb', label: 'FRIO EXTREMO' };
    if (t <= 10) return { cor: '#0891b2', label: 'MUITO FRIO' };
    if (t <= 14) return { cor: '#0284c7', label: 'FRIO MODERADO' };
    if (t <= 19) return { cor: '#16a34a', label: 'PADRÃO CURITIBA' };
    if (t <= 24) return { cor: '#f97316', label: 'QUENTE' };
    return              { cor: '#ef4444', label: 'CALOR EXTREMO' };
  };

  const fi = faixaInfo();

  return (
    <div style={S.screen}>
      <BotaoVoltar onClick={voltar} />
      <h2 style={S.title}>CÁLCULO TÉRMICO</h2>

      <div style={{ backgroundColor: fi.cor, color: '#fff', padding: '10px 16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 900, fontSize: '12px', letterSpacing: '1px' }}>{fi.label}</span>
        <span style={{ fontSize: '11px', opacity: 0.85 }}>Temp. Saída: {params.tempSaida}°C</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <div style={S.label}>VOLUME DO CARRINHO</div>
          <select style={S.input} value={params.volume} onChange={e => p('volume', e.target.value)}>
            <option value="1">🟩 100% — CARRINHO CHEIO</option>
            <option value="0.5">🟨 50% — MEIO CARRINHO</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={S.label}>TEMP. AGORA (°C)</div>
            <input type="number" style={S.input} value={params.tempAgora} onChange={e => p('tempAgora', e.target.value)} />
          </div>
          <div>
            <div style={{ ...S.label, color: '#2563eb' }}>TEMP. SAÍDA (°C) ⭐</div>
            <input type="number" style={{ ...S.input, borderColor: '#2563eb', borderWidth: '4px' }}
              value={params.tempSaida} onChange={e => p('tempSaida', e.target.value)} />
          </div>
        </div>

        <div>
          <div style={S.label}>HORÁRIO PREVISTO DE ASSAMENTO</div>
          <input type="time" style={S.input} value={params.horarioSaida} onChange={e => p('horarioSaida', e.target.value)} />
        </div>

        <button style={S.btnPrimary} onClick={calcular}>⚗ GERAR PRESCRIÇÃO</button>

        {resultado && (
          <div style={{ backgroundColor: '#000', color: '#fff', borderRadius: '16px', padding: '24px', textAlign: 'center', marginTop: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '2px', opacity: 0.7, marginBottom: '8px' }}>DOSAGEM FINAL (+5% INCLUÍDO)</div>
            <div style={{ fontSize: '88px', fontWeight: 900, lineHeight: 1, color: '#2563eb' }}>
              {resultado.gramas}<span style={{ fontSize: '24px', color: '#fff' }}>g</span>
            </div>
            <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: 700, lineHeight: 1.5, borderTop: '2px solid #333', paddingTop: '14px' }}>{resultado.nota}</div>
            <div style={{ fontSize: '10px', opacity: 0.4, marginTop: '8px' }}>Calculado às {resultado.ts}</div>
          </div>
        )}

        {/* Tabela de referência rápida */}
        <div style={{ border: '3px solid #000', borderRadius: '12px', overflow: 'hidden', marginTop: '10px' }}>
          <div style={{ backgroundColor: '#000', color: '#fff', padding: '10px 16px', fontSize: '11px', fontWeight: 900, letterSpacing: '1px' }}>
            TABELA DE REFERÊNCIA (100% / 50%) — c/ +5%
          </div>
          {[
            ['≤ 4°C',   'Frio Extremo',   '239g', '120g'],
            ['5–10°C',  'Muito Frio',      '189g', '95g'],
            ['11–14°C', 'Frio Moderado',   '147g', '74g'],
            ['15–19°C', 'Padrão Curitiba', '105g', '53g'],
            ['20–24°C', 'Quente',          '84g',  '42g'],
            ['≥ 25°C',  'Calor Extremo',   '63g',  '32g'],
          ].map(([faixa, nome, cheio, meio], i) => (
            <div key={faixa} style={{
              display: 'grid', gridTemplateColumns: '80px 1fr 60px 60px',
              padding: '10px 16px', fontSize: '12px', fontWeight: 700,
              borderTop: i === 0 ? 'none' : '1px solid #e2e8f0',
              backgroundColor: parseInt(params.tempSaida) === [4, 10, 14, 19, 24, 99][i] || (
                ([t => t <= 4, t => t >= 5 && t <= 10, t => t >= 11 && t <= 14, t => t >= 15 && t <= 19, t => t >= 20 && t <= 24, t => t >= 25][i])(parseInt(params.tempSaida))
              ) ? '#eff6ff' : '#fff',
            }}>
              <span style={{ fontWeight: 900, fontSize: '11px' }}>{faixa}</span>
              <span style={{ opacity: 0.6, fontSize: '11px' }}>{nome}</span>
              <span style={{ color: '#2563eb', textAlign: 'center' }}>{cheio}</span>
              <span style={{ color: '#64748b', textAlign: 'center' }}>{meio}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── TELA: ESTOQUE ───────────────────────────────────────────────────────────

const TelaEstoque = ({ insumos, setInsumos, voltar }) => {
  const [editando, setEditando] = useState(false);

  const atualizar = (id, campo, valor) =>
    setInsumos(prev => prev.map(i => i.id === id ? { ...i, [campo]: valor } : i));

  const remover = (id) => setInsumos(prev => prev.filter(i => i.id !== id));

  const adicionar = () => setInsumos(prev => [...prev, {
    id: uid(), nome: 'Novo Insumo', qtd: 0, unidade: 'kg',
    dataChegada: TODAY_ISO, diasDuracao: 7,
  }]);

  return (
    <div style={S.screen}>
      <BotaoVoltar onClick={voltar} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ ...S.title, margin: 0, borderBottom: 'none' }}>ESTOQUE</h2>
        <button style={S.btnEdit(editando)} onClick={() => setEditando(e => !e)}>
          {editando ? '💾 SALVAR' : '✏ EDITAR'}
        </button>
      </div>
      <div style={{ borderBottom: '5px solid #000', marginBottom: '20px' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {insumos.map(item => {
          const st = calcStatusEstoque(item.dataChegada, item.diasDuracao);
          return (
            <div key={item.id} style={{
              border: '3px solid #000', borderRadius: '14px', overflow: 'hidden',
              backgroundColor: '#fff', borderLeft: `10px solid ${st.cor}`,
            }}>
              <div style={{ padding: '14px 16px' }}>
                {editando ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <input style={{ ...S.inputSm, flex: 1, fontSize: '16px', fontWeight: 900 }}
                        value={item.nome} onChange={e => atualizar(item.id, 'nome', e.target.value)} />
                      <button style={S.btnDel} onClick={() => remover(item.id)}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ ...S.label, fontSize: '10px' }}>QUANTIDADE</div>
                        <input type="number" style={S.inputSm} value={item.qtd}
                          onChange={e => atualizar(item.id, 'qtd', e.target.value)} />
                      </div>
                      <div>
                        <div style={{ ...S.label, fontSize: '10px' }}>UNIDADE</div>
                        <input style={S.inputSm} value={item.unidade}
                          onChange={e => atualizar(item.id, 'unidade', e.target.value)} />
                      </div>
                      <div>
                        <div style={{ ...S.label, fontSize: '10px' }}>DURAÇÃO (dias)</div>
                        <input type="number" style={S.inputSm} value={item.diasDuracao}
                          onChange={e => atualizar(item.id, 'diasDuracao', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <div style={{ ...S.label, fontSize: '10px' }}>DATA DE CHEGADA</div>
                      <input type="date" style={S.inputSm} value={item.dataChegada}
                        onChange={e => atualizar(item.id, 'dataChegada', e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '17px', letterSpacing: '0.5px' }}>{item.nome.toUpperCase()}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        Chegou: {item.dataChegada} · Duração média: {item.diasDuracao}d
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: st.cor, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: st.cor, display: 'inline-block' }} />
                        {st.label} · {st.dias > 0 ? `~${st.dias} dias restantes` : 'VERIFICAR'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                      <div style={{ fontSize: '28px', fontWeight: 900 }}>{item.qtd}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>{item.unidade}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {editando && (
          <button style={S.btnAdd} onClick={adicionar}>+ ADICIONAR INSUMO</button>
        )}
      </div>
    </div>
  );
};

// ─── TELA: TAREFAS ───────────────────────────────────────────────────────────

const TelaTarefas = ({ tarefas, setTarefas, voltar }) => {
  const [editando, setEditando] = useState(false);
  const [filtro, setFiltro] = useState('hoje');

  const toggle = (id) =>
    setTarefas(prev => prev.map(t =>
      t.id === id ? { ...t, concluida: !t.concluida, ultimaExecucao: !t.concluida ? TODAY_ISO : t.ultimaExecucao } : t
    ));

  const atualizar = (id, campo, valor) =>
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, [campo]: valor } : t));

  const remover = (id) => setTarefas(prev => prev.filter(t => t.id !== id));

  const adicionar = () => setTarefas(prev => [...prev, {
    id: uid(), descricao: 'Nova Tarefa', responsavel: 'Padeiro',
    concluida: false, frequencia: 'diario', ultimaExecucao: '2026-01-01',
  }]);

  const lista = filtro === 'hoje'
    ? tarefas.filter(tarefaApareceHoje)
    : filtro === 'todas' ? tarefas : tarefas.filter(t => t.frequencia === filtro);

  const pendentes = lista.filter(t => !t.concluida).length;

  return (
    <div style={S.screen}>
      <BotaoVoltar onClick={voltar} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h2 style={{ ...S.title, margin: 0, borderBottom: 'none' }}>TAREFAS</h2>
        <button style={S.btnEdit(editando)} onClick={() => setEditando(e => !e)}>
          {editando ? '💾 SALVAR' : '✏ EDITAR'}
        </button>
      </div>
      <div style={{ borderBottom: '5px solid #000', marginBottom: '16px' }} />

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
        {[
          ['hoje', 'HOJE'],
          ['diario', 'DIÁRIAS'],
          ['dia_sim_dia_nao', 'ALTERNADAS'],
          ['todas', 'TODAS'],
        ].map(([val, label]) => (
          <button key={val} onClick={() => setFiltro(val)} style={{
            padding: '8px 14px', border: '2px solid #000', borderRadius: '8px',
            fontWeight: 900, fontSize: '11px', letterSpacing: '0.5px',
            cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            backgroundColor: filtro === val ? '#000' : '#fff',
            color: filtro === val ? '#fff' : '#000',
          }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '12px', letterSpacing: '1px' }}>
        {pendentes} PENDENTE{pendentes !== 1 ? 'S' : ''} · {lista.filter(t => t.concluida).length} CONCLUÍDA{lista.filter(t => t.concluida).length !== 1 ? 'S' : ''}
      </div>

      <div style={{ border: '3px solid #000', borderRadius: '14px', overflow: 'hidden', backgroundColor: '#fff' }}>
        {lista.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', fontWeight: 900, fontSize: '14px', color: '#64748b' }}>
            ✓ Nenhuma tarefa para este filtro.
          </div>
        ) : lista.map((t, i) => (
          <div key={t.id} style={{
            borderTop: i === 0 ? 'none' : '2px solid #000',
            padding: '16px',
            backgroundColor: t.concluida ? '#f8fafc' : '#fff',
          }}>
            {editando ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={{ ...S.inputSm, flex: 1, fontWeight: 900 }}
                    value={t.descricao} onChange={e => atualizar(t.id, 'descricao', e.target.value)} />
                  <button style={S.btnDel} onClick={() => remover(t.id)}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ ...S.label, fontSize: '10px' }}>RESPONSÁVEL</div>
                    <input style={S.inputSm} value={t.responsavel}
                      onChange={e => atualizar(t.id, 'responsavel', e.target.value)} />
                  </div>
                  <div>
                    <div style={{ ...S.label, fontSize: '10px' }}>FREQUÊNCIA</div>
                    <select style={S.inputSm} value={t.frequencia}
                      onChange={e => atualizar(t.id, 'frequencia', e.target.value)}>
                      <option value="diario">Diário</option>
                      <option value="dia_sim_dia_nao">Dia Sim / Dia Não</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '14px' }}
                onClick={() => toggle(t.id)}>
                <div style={{
                  width: '28px', height: '28px', border: '3px solid #000', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: t.concluida ? '#000' : '#fff', flexShrink: 0,
                }}>
                  {t.concluida && <span style={{ color: '#fff', fontWeight: 900, fontSize: '16px' }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 900, fontSize: '16px', letterSpacing: '0.3px',
                    textDecoration: t.concluida ? 'line-through' : 'none',
                    color: t.concluida ? '#94a3b8' : '#000',
                  }}>{t.descricao}</div>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginTop: '3px', letterSpacing: '0.5px' }}>
                    {t.responsavel.toUpperCase()} · {t.frequencia === 'diario' ? 'DIÁRIO' : 'DIA SIM / DIA NÃO'}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {editando && (
        <button style={S.btnAdd} onClick={adicionar}>+ NOVA TAREFA</button>
      )}
    </div>
  );
};

// ─── TELA: RECEITAS ──────────────────────────────────────────────────────────

const TelaReceitas = ({ receitas, setReceitas, voltar }) => {
  const [editando, setEditando] = useState(false);
  const [aberta, setAberta] = useState(null);

  const atualizar = (id, campo, valor) =>
    setReceitas(prev => prev.map(r => r.id === id ? { ...r, [campo]: valor } : r));

  const remover = (id) => { setReceitas(prev => prev.filter(r => r.id !== id)); setAberta(null); };

  const adicionar = () => {
    const novaId = uid();
    setReceitas(prev => [...prev, {
      id: novaId, nome: 'Nova Receita', rendimento: '—',
      ingredientes: 'Liste os ingredientes aqui...', preparo: 'Modo de preparo...',
    }]);
    setAberta(novaId);
  };

  return (
    <div style={S.screen}>
      <BotaoVoltar onClick={voltar} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h2 style={{ ...S.title, margin: 0, borderBottom: 'none' }}>RECEITAS</h2>
        <button style={S.btnEdit(editando)} onClick={() => setEditando(e => !e)}>
          {editando ? '💾 SALVAR' : '✏ EDITAR'}
        </button>
      </div>
      <div style={{ borderBottom: '5px solid #000', marginBottom: '20px' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {receitas.map(r => (
          <div key={r.id} style={{ border: '3px solid #000', borderRadius: '14px', overflow: 'hidden', backgroundColor: '#fff' }}>
            {/* Header */}
            <div
              style={{ padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: aberta === r.id ? '#000' : '#fff' }}
              onClick={() => setAberta(aberta === r.id ? null : r.id)}>
              {editando ? (
                <input style={{ ...S.inputSm, fontWeight: 900, fontSize: '16px', flex: 1, marginRight: '8px' }}
                  value={r.nome} onClick={e => e.stopPropagation()}
                  onChange={e => atualizar(r.id, 'nome', e.target.value)} />
              ) : (
                <span style={{ fontWeight: 900, fontSize: '16px', letterSpacing: '0.5px', color: aberta === r.id ? '#fff' : '#000' }}>{r.nome.toUpperCase()}</span>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {editando && <button style={S.btnDel} onClick={e => { e.stopPropagation(); remover(r.id); }}>✕</button>}
                <span style={{ fontSize: '18px', color: aberta === r.id ? '#fff' : '#000' }}>{aberta === r.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Corpo expandido */}
            {aberta === r.id && (
              <div style={{ borderTop: '3px solid #000', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ ...S.label, marginBottom: '6px' }}>RENDIMENTO</div>
                  {editando
                    ? <input style={S.inputSm} value={r.rendimento} onChange={e => atualizar(r.id, 'rendimento', e.target.value)} />
                    : <div style={{ fontSize: '14px', fontWeight: 700, color: '#2563eb' }}>{r.rendimento}</div>
                  }
                </div>
                <div>
                  <div style={{ ...S.label, marginBottom: '6px' }}>INGREDIENTES</div>
                  {editando
                    ? <textarea style={S.textarea} value={r.ingredientes} onChange={e => atualizar(r.id, 'ingredientes', e.target.value)} />
                    : <div style={{ fontSize: '13px', lineHeight: 1.8, whiteSpace: 'pre-line', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>{r.ingredientes}</div>
                  }
                </div>
                <div>
                  <div style={{ ...S.label, marginBottom: '6px' }}>MODO DE PREPARO</div>
                  {editando
                    ? <textarea style={{ ...S.textarea, minHeight: '120px' }} value={r.preparo} onChange={e => atualizar(r.id, 'preparo', e.target.value)} />
                    : <div style={{ fontSize: '13px', lineHeight: 1.8, whiteSpace: 'pre-line', backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>{r.preparo}</div>
                  }
                </div>
              </div>
            )}
          </div>
        ))}

        {editando && <button style={S.btnAdd} onClick={adicionar}>+ NOVA RECEITA</button>}
      </div>
    </div>
  );
};

// ─── TELA: RELATÓRIOS ────────────────────────────────────────────────────────

const TelaRelatorios = ({ tarefas, insumos, voltar }) => {
  const concluidas = tarefas.filter(t => t.concluida).length;
  const totalHoje = tarefas.filter(tarefaApareceHoje).length;
  const alertas = insumos.filter(i => calcStatusEstoque(i.dataChegada, i.diasDuracao).dias <= 5).length;
  const esgotados = insumos.filter(i => calcStatusEstoque(i.dataChegada, i.diasDuracao).dias < 0).length;

  return (
    <div style={S.screen}>
      <BotaoVoltar onClick={voltar} />
      <h2 style={S.title}>VISÃO GERAL</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {[
          { val: concluidas, label: 'CONCLUÍDAS', bg: '#000', tc: '#fff', sub: `de ${totalHoje} hoje` },
          { val: alertas,    label: 'ALERTAS',    bg: alertas > 0 ? '#f97316' : '#22c55e', tc: '#fff', sub: 'no estoque' },
          { val: esgotados,  label: 'ESGOTADOS',  bg: esgotados > 0 ? '#ef4444' : '#22c55e', tc: '#fff', sub: 'insumos' },
          { val: tarefas.filter(t => t.frequencia === 'dia_sim_dia_nao').length, label: 'ALTERNADAS', bg: '#2563eb', tc: '#fff', sub: 'tarefas cadastradas' },
        ].map(({ val, label, bg, tc, sub }) => (
          <div key={label} style={{ padding: '20px', backgroundColor: bg, color: tc, borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '1px', marginTop: '6px' }}>{label}</div>
            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Status dos insumos */}
      <h3 style={{ fontWeight: 900, fontSize: '14px', letterSpacing: '1px', marginBottom: '12px', borderBottom: '3px solid #000', paddingBottom: '6px' }}>STATUS INSUMOS</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {insumos.map(item => {
          const st = calcStatusEstoque(item.dataChegada, item.diasDuracao);
          return (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '2px solid #000', borderLeft: `8px solid ${st.cor}`, borderRadius: '10px', backgroundColor: '#fff' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: '14px' }}>{item.nome}</div>
                <div style={{ fontSize: '11px', color: st.cor, fontWeight: 900 }}>{st.label}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 900, fontSize: '16px' }}>{item.qtd} {item.unidade}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  {st.dias > 0 ? `~${st.dias}d restantes` : 'VERIFICAR'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nota Supabase */}
      <div style={{ padding: '16px', border: '2px dashed #000', borderRadius: '12px', backgroundColor: '#eff6ff' }}>
        <div style={{ fontWeight: 900, fontSize: '12px', letterSpacing: '1px', color: '#2563eb', marginBottom: '6px' }}>⚡ INTEGRAÇÃO SUPABASE</div>
        <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.6 }}>
          Esta aba está preparada para receber gráficos históricos, logs de produção e dashboards em tempo real ao conectar nas tabelas do Supabase.
        </div>
      </div>
    </div>
  );
};

// ─── APP PRINCIPAL ───────────────────────────────────────────────────────────

const DashboardPani = () => {
  const [tela, setTela] = useState('menu');
  const [insumos, setInsumos] = useState(INITIAL_INSUMOS);
  const [tarefas, setTarefas] = useState(INITIAL_TAREFAS);
  const [receitas, setReceitas] = useState(INITIAL_RECEITAS);

  const voltar = () => setTela('menu');

  const alertasCount = insumos.filter(i => calcStatusEstoque(i.dataChegada, i.diasDuracao).dias <= 5).length;
  const concluidasCount = tarefas.filter(t => t.concluida).length;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;900&display=swap" rel="stylesheet" />
      <div style={S.app}>
        <header style={S.header}>
          <h1 style={S.h1}>PANIDASH <span style={{ color: '#2563eb' }}>PRO</span></h1>
          <div style={S.sub}>CURITIBA · {TODAY_FMT} · RODRIGO (ADS)</div>
        </header>

        <main style={S.main}>
          {tela === 'menu'      && <TelaMenu ir={setTela} alertas={alertasCount} concluidas={concluidasCount} />}
          {tela === 'producao'  && <TelaProducao voltar={voltar} />}
          {tela === 'estoque'   && <TelaEstoque insumos={insumos} setInsumos={setInsumos} voltar={voltar} />}
          {tela === 'tarefas'   && <TelaTarefas tarefas={tarefas} setTarefas={setTarefas} voltar={voltar} />}
          {tela === 'receitas'  && <TelaReceitas receitas={receitas} setReceitas={setReceitas} voltar={voltar} />}
          {tela === 'relatorios'&& <TelaRelatorios tarefas={tarefas} insumos={insumos} voltar={voltar} />}
        </main>
      </div>
    </>
  );
};

export default DashboardPani;