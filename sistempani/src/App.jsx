import React, { useState } from 'react';

const DashboardPani = () => {
  // =======================================================================
  // 1. ESTADO E NAVEGAÇÃO
  // =======================================================================
  const [telaAtiva, setTelaAtiva] = useState('menu');

  const [calcParams, setCalcParams] = useState({
    volume: 1,
    tempAgora: 26,      // Temperatura no momento da batida
    tempSaida: 17,      // Temperatura prevista para a madrugada/manhã
    horarioSaida: '05:40'
  });

  const [resultadoCalculo, setResultadoCalculo] = useState(null);

  const [insumos, setInsumos] = useState([
    { id: '1', nome: 'Fermento Biológico', qtd: 12.5, unidade: 'kg', status: 'ok', validade: '2026-06-10' },
    { id: '2', nome: 'Farinha Especial', qtd: 50, unidade: 'kg', status: 'critico', validade: '2026-08-20' },
    { id: '3', nome: 'Açúcar Refinado', qtd: 20, unidade: 'kg', status: 'ok', validade: '2026-12-01' },
  ]);

  const [tarefas, setTarefas] = useState([
    { id: 't1', descricao: 'Limpeza dos Fornos', responsavel: 'Turno Noite', concluida: false },
    { id: 't2', descricao: 'Bater Massa Pão Francês', responsavel: 'Padeiro', concluida: false },
    { id: 't3', descricao: 'Receber Farinha', responsavel: 'Estoque', concluida: false },
  ]);

  // =======================================================================
  // 2. LÓGICA DE NEGÓCIO (AJUSTADA PARA O CLIMA DE CURITIBA)
  // =======================================================================
  const executarCalculo = () => {
    const K_FERMENTO = 500;
    
    // A conta agora é baseada na temperatura da SAÍDA (madrugada)
    // Se a saída estiver 17°C, ajusteTemp será negativo, aumentando o fermento.
    let ajusteTemp = (calcParams.tempSaida - 20) * 15;
    let baseCalculada = (K_FERMENTO - ajusteTemp) * parseFloat(calcParams.volume);

    // Ajuste de tempo (se demorar mais que o padrão, reduzimos a força)
    const [h, m] = calcParams.horarioSaida.split(':').map(Number);
    const minSaida = h * 60 + m;
    const minPadrao = 5 * 60 + 40; // 05:40

    if (minSaida > minPadrao) {
      const horasExtra = (minSaida - minPadrao) / 60;
      baseCalculada -= (horasExtra * 25); // Reduzimos p/ não passar do ponto no calor
    }

    setResultadoCalculo({
      gramas: Math.max(baseCalculada, 40).toFixed(0),
      alerta: calcParams.tempSaida < 18 ? 'MADRUGADA FRIA: O fermento precisará de mais tempo/força.' : 'Normal',
      timestamp: new Date().toLocaleTimeString()
    });
  };

  // =======================================================================
  // 3. COMPONENTES DE INTERFACE (ALTO CONTRASTE)
  // =======================================================================

  const BotaoVoltar = () => (
    <button 
      onClick={() => setTelaAtiva('menu')}
      style={{ backgroundColor: '#eee', border: '3px solid #000', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', color: '#000', width: '100%' }}
    >
      ← VOLTAR AO MENU
    </button>
  );

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
      <div style={{ ...estiloCardMenu, opacity: 0.4 }}>
        <span style={{ fontSize: '45px' }}>⚙️</span>
        <span style={estiloTextoMenu}>CONFIG</span>
      </div>
    </div>
  );

  const RenderBaterPao = () => (
    <div style={{ padding: '20px' }}>
      <BotaoVoltar />
      <h2 style={{ borderBottom: '4px solid #000', color: '#000', fontWeight: '900' }}>PARÂMETROS DE BATIDA</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <div>
          <label style={estiloLabel}>VOLUME (CARRINHO)</label>
          <select style={estiloInput} value={calcParams.volume} onChange={(e) => setCalcParams({...calcParams, volume: e.target.value})}>
            <option value="1">100% - Cheio</option>
            <option value="0.5">50% - Meio</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={estiloLabel}>TEMP. AGORA (°C)</label>
            <input type="number" style={estiloInput} value={calcParams.tempAgora} onChange={(e) => setCalcParams({...calcParams, tempAgora: e.target.value})} />
          </div>
          <div style={{ backgroundColor: '#fff3cd', padding: '5px', borderRadius: '8px', border: '1px solid #000' }}>
            <label style={estiloLabel}>TEMP. AMANHÃ (°C)</label>
            <input type="number" style={estiloInput} value={calcParams.tempSaida} onChange={(e) => setCalcParams({...calcParams, tempSaida: e.target.value})} />
          </div>
        </div>

        <div>
          <label style={estiloLabel}>HORÁRIO DE SAÍDA</label>
          <input type="time" style={estiloInput} value={calcParams.horarioSaida} onChange={(e) => setCalcParams({...calcParams, horarioSaida: e.target.value})} />
        </div>

        <button onClick={executarCalculo} style={estiloBotaoAcao}>CALCULAR FERMENTO</button>

        {resultadoCalculo && (
          <div style={{ marginTop: '20px', padding: '25px', backgroundColor: '#000', color: '#fff', borderRadius: '15px', textAlign: 'center' }}>
            <span style={{ fontSize: '14px', color: '#60a5fa', fontWeight: 'bold' }}>QUANTIDADE PARA USAR:</span>
            <h1 style={{ fontSize: '65px', margin: '10px 0', fontWeight: '900', color: '#fff' }}>{resultadoCalculo.gramas}g</h1>
            <p style={{ fontWeight: 'bold', color: '#ff4d4d' }}>{resultadoCalculo.alerta}</p>
          </div>
        )}
      </div>
    </div>
  );

  const RenderEstoque = () => (
    <div style={{ padding: '20px' }}>
      <BotaoVoltar />
      <h2 style={{ borderBottom: '4px solid #000', color: '#000', fontWeight: '900' }}>ESTOQUE</h2>
      {insumos.map(item => (
        <div key={item.id} style={{ padding: '15px', border: '2px solid #000', marginBottom: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', backgroundColor: item.status === 'critico' ? '#fee2e2' : '#fff' }}>
          <strong style={{ color: '#000' }}>{item.nome}</strong>
          <span style={{ fontWeight: '900', color: '#000' }}>{item.qtd} {item.unidade}</span>
        </div>
      ))}
    </div>
  );

  const RenderTarefas = () => (
    <div style={{ padding: '20px' }}>
      <BotaoVoltar />
      <h2 style={{ borderBottom: '4px solid #000', color: '#000', fontWeight: '900' }}>TAREFAS</h2>
      {tarefas.map(t => (
        <div key={t.id} style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '2px solid #000', alignItems: 'center' }}>
          <input type="checkbox" style={{ width: '30px', height: '30px' }} />
          <div style={{ color: '#000', fontWeight: 'bold', fontSize: '18px' }}>{t.descricao}</div>
        </div>
      ))}
    </div>
  );

  // =======================================================================
  // ESTILOS
  // =======================================================================
  const estiloCardMenu = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '3px solid #000', borderRadius: '20px', padding: '30px 10px', cursor: 'pointer', boxShadow: '6px 6px 0px #000' };
  const estiloTextoMenu = { color: '#000', fontWeight: '900', fontSize: '18px', marginTop: '10px' };
  const estiloLabel = { fontSize: '11px', fontWeight: '900', color: '#000' };
  const estiloInput = { width: '100%', padding: '15px', marginTop: '5px', borderRadius: '10px', border: '2px solid #000', fontSize: '18px', fontWeight: 'bold', color: '#000' };
  const estiloBotaoAcao = { width: '100%', backgroundColor: '#000', color: '#fff', fontWeight: '900', padding: '20px', borderRadius: '15px', border: 'none', cursor: 'pointer', fontSize: '18px' };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ backgroundColor: '#000', color: '#fff', padding: '15px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>PANIDASH</h1>
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