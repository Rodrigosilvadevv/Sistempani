import React, { useState } from 'react';

const DashboardPani = () => {
  // =======================================================================
  // 1. ESTADO E NAVEGAÇÃO
  // =======================================================================
  const [telaAtiva, setTelaAtiva] = useState('menu'); // menu, bater_pao, estoque, tarefas

  const [calcParams, setCalcParams] = useState({
    volume: 1,
    tempAmbiente: 23,
    horarioSaida: '05:40',
    tipoMassa: 'frances'
  });
  const [resultadoCalculo, setResultadoCalculo] = useState(null);

  const [insumos, setInsumos] = useState([
    { id: '1', nome: 'Fermento Biológico', qtd: 12.5, unidade: 'kg', status: 'ok', validade: '2026-06-10' },
    { id: '2', nome: 'Farinha Especial', qtd: 50, unidade: 'kg', status: 'critico', validade: '2026-08-20' },
    { id: '3', nome: 'Açúcar Refinado', qtd: 20, unidade: 'kg', status: 'ok', validade: '2026-12-01' },
  ]);

  const [tarefas, setTarefas] = useState([
    { id: 't1', descricao: 'Limpeza dos Fornos', frequencia: 'diaria', responsavel: 'Turno Noite', concluida: false },
    { id: 't2', descricao: 'Bater Massa Pão Francês', frequencia: 'diaria', responsavel: 'Padeiro', concluida: false },
    { id: 't3', descricao: 'Receber Farinha', frequencia: 'dia_sim_nao', responsavel: 'Estoque', concluida: false },
  ]);

  // =======================================================================
  // 2. SUA LÓGICA DE NEGÓCIO (PRESERVADA)
  // =======================================================================
  const executarCalculo = () => {
    const K_FERMENTO = 500;
    let ajusteTemp = (calcParams.tempAmbiente - 20) * 15;
    let baseCalculada = (K_FERMENTO - ajusteTemp) * parseFloat(calcParams.volume);

    const [h, m] = calcParams.horarioSaida.split(':').map(Number);
    const minSaida = h * 60 + m;
    const minPadrao = 5 * 60 + 40;

    if (minSaida > minPadrao) {
      const horasExtra = (minSaida - minPadrao) / 60;
      baseCalculada -= (horasExtra * 20);
    }

    setResultadoCalculo({
      gramas: Math.max(baseCalculada, 50).toFixed(0),
      alerta: calcParams.tempAmbiente > 28 ? 'ALERTA TÉRMICO: Reduzir tempo de descanso' : 'Normal',
      timestamp: new Date().toLocaleTimeString()
    });
  };

  // =======================================================================
  // 3. COMPONENTES DE TELA
  // =======================================================================

  const BotaoVoltar = () => (
    <button 
      onClick={() => setTelaAtiva('menu')}
      style={{ backgroundColor: '#e2e8f0', border: '2px solid #000', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', color: '#000' }}
    >
      ← VOLTAR AO MENU
    </button>
  );

  // MENU PRINCIPAL (GRID)
  const RenderMenu = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' }}>
      <div onClick={() => setTelaAtiva('bater_pao')} style={estiloCardMenu}>
        <span style={{ fontSize: '45px' }}>🥖</span>
        <span style={estiloTextoMenu}>BATER PÃO</span>
      </div>
      <div onClick={() => setTelaAtiva('tarefas')} style={estiloCardMenu}>
        <span style={{ fontSize: '45px' }}>📋</span>
        <span style={estiloTextoMenu}>TAREFAS</span>
      </div>
      <div onClick={() => setTelaAtiva('estoque')} style={estiloCardMenu}>
        <span style={{ fontSize: '45px' }}>📦</span>
        <span style={estiloTextoMenu}>ESTOQUE</span>
      </div>
      <div style={{ ...estiloCardMenu, opacity: 0.4, cursor: 'not-allowed' }}>
        <span style={{ fontSize: '45px' }}>📊</span>
        <span style={estiloTextoMenu}>RELATÓRIOS</span>
      </div>
    </div>
  );

  // TELA OPERAÇÃO (BATER PÃO)
  const RenderBaterPao = () => (
    <div style={{ padding: '20px', color: '#000' }}>
      <BotaoVoltar />
      <h2 style={{ borderBottom: '3px solid #000', paddingBottom: '10px', fontWeight: '900' }}>BATER PÃO</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        <div>
          <label style={estiloLabel}>VOLUME DE CARGA</label>
          <select 
            style={estiloInput}
            value={calcParams.volume}
            onChange={(e) => setCalcParams({...calcParams, volume: e.target.value})}
          >
            <option value="1">100% - Carrinho Completo</option>
            <option value="0.5">50% - Meio Carrinho</option>
            <option value="0.25">25% - Quarto de Carrinho</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={estiloLabel}>TEMP. AMBIENTE (°C)</label>
            <input type="number" style={estiloInput} value={calcParams.tempAmbiente} onChange={(e) => setCalcParams({...calcParams, tempAmbiente: e.target.value})} />
          </div>
          <div>
            <label style={estiloLabel}>HORÁRIO SAÍDA</label>
            <input type="time" style={estiloInput} value={calcParams.horarioSaida} onChange={(e) => setCalcParams({...calcParams, horarioSaida: e.target.value})} />
          </div>
        </div>

        <button onClick={executarCalculo} style={estiloBotaoAcao}>EXECUTAR CÁLCULO PREDITIVO</button>

        {resultadoCalculo && (
          <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#000', color: '#fff', borderRadius: '12px', borderLeft: '10px solid #2563eb' }}>
            <p style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 'bold' }}>RESULTADO:</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '48px', fontWeight: '900', color: '#fff' }}>{resultadoCalculo.gramas}g</span>
            </div>
            <p style={{ margin: '10px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: resultadoCalculo.alerta.includes('ALERTA') ? '#ff4d4d' : '#4ade80' }}>
              {resultadoCalculo.alerta}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // TELA ESTOQUE
  const RenderEstoque = () => (
    <div style={{ padding: '20px', color: '#000' }}>
      <BotaoVoltar />
      <h2 style={{ borderBottom: '3px solid #000', paddingBottom: '10px', fontWeight: '900' }}>ESTOQUE</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
        {insumos.map(item => (
          <div key={item.id} style={{ padding: '15px', borderRadius: '8px', border: '2px solid #000', display: 'flex', justifyContent: 'space-between', backgroundColor: item.status === 'critico' ? '#fee2e2' : '#fff' }}>
            <div style={{ fontWeight: 'bold' }}>{item.nome}</div>
            <div style={{ fontWeight: '900' }}>{item.qtd} {item.unidade}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // TELA TAREFAS
  const RenderTarefas = () => (
    <div style={{ padding: '20px', color: '#000' }}>
      <BotaoVoltar />
      <h2 style={{ borderBottom: '3px solid #000', paddingBottom: '10px', fontWeight: '900' }}>TAREFAS</h2>
      {tarefas.map(t => (
        <div key={t.id} style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '2px solid #eee', alignItems: 'center' }}>
          <input type="checkbox" style={{ width: '25px', height: '25px', cursor: 'pointer' }} />
          <div style={{ color: '#000', fontWeight: 'bold' }}>{t.descricao} <span style={{ fontSize: '10px', color: '#666', display: 'block' }}>RESP: {t.responsavel}</span></div>
        </div>
      ))}
    </div>
  );

  // =======================================================================
  // 4. ESTILOS OBJETIVOS (ALTO CONTRASTE)
  // =======================================================================
  const estiloCardMenu = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', border: '3px solid #000', borderRadius: '20px', padding: '30px 10px',
    cursor: 'pointer', boxShadow: '6px 6px 0px #000', transition: '0.2s'
  };

  const estiloTextoMenu = { color: '#000', fontWeight: '900', fontSize: '16px', marginTop: '10px', textAlign: 'center' };
  const estiloLabel = { fontSize: '12px', fontWeight: '900', color: '#000', textTransform: 'uppercase' };
  const estiloInput = { width: '100%', padding: '15px', marginTop: '5px', borderRadius: '8px', border: '2px solid #000', fontSize: '16px', fontWeight: 'bold', color: '#000', backgroundColor: '#fff' };
  const estiloBotaoAcao = { width: '100%', backgroundColor: '#000', color: '#fff', fontWeight: '900', padding: '20px', borderRadius: '12px', border: 'none', cursor: 'pointer', marginTop: '10px', fontSize: '16px' };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ backgroundColor: '#000', color: '#fff', padding: '15px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '1px' }}>PANIDASH</h1>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        {telaAtiva === 'menu' && <RenderMenu />}
        {telaAtiva === 'bater_pao' && <RenderBaterPao />}
        {telaAtiva === 'estoque' && <RenderEstoque />}
        {telaAtiva === 'tarefas' && <RenderTarefas />}
      </main>
    </div>
  );
};

export default DashboardPani;