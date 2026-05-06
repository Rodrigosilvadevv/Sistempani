import React, { useState } from 'react';

const DashboardEmpresarial = () => {
  // =======================================================================
  // 1. ESTADO GLOBAL
  // =======================================================================
  const [activeTab, setActiveTab] = useState('operacao');
  const [editMode, setEditMode] = useState(false);

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
  // 2. LÓGICA DE NEGÓCIO
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
  // 3. FUNÇÕES DE CRUD
  // =======================================================================
  const handleInsumoChange = (id, campo, valor) => {
    setInsumos(insumos.map(i => i.id === id ? { ...i, [campo]: valor } : i));
  };

  const handleTarefaChange = (id, campo, valor) => {
    setTarefas(tarefas.map(t => t.id === id ? { ...t, [campo]: valor } : t));
  };

  // =======================================================================
  // 4. SUB-COMPONENTES (COM GRID FORÇADO)
  // =======================================================================

  const renderOperacao = () => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        PARÂMETROS DE BATIDA
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>VOLUME DE CARGA</label>
          <select 
            style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            value={calcParams.volume}
            onChange={(e) => setCalcParams({...calcParams, volume: e.target.value})}
          >
            <option value="1">100% - Carrinho Completo</option>
            <option value="0.5">50% - Meio Carrinho</option>
            <option value="0.25">25% - Quarto de Carrinho</option>
          </select>
        </div>

        {/* GRADE DE INPUTS (2 COLUNAS) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>TEMP. AMBIENTE (°C)</label>
            <input 
              type="number" 
              style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              value={calcParams.tempAmbiente}
              onChange={(e) => setCalcParams({...calcParams, tempAmbiente: e.target.value})}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>HORÁRIO SAÍDA</label>
            <input 
              type="time" 
              style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              value={calcParams.horarioSaida}
              onChange={(e) => setCalcParams({...calcParams, horarioSaida: e.target.value})}
            />
          </div>
        </div>

        <button 
          style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', padding: '15px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
          onClick={executarCalculo}
        >
          EXECUTAR CÁLCULO PREDITIVO
        </button>

        {resultadoCalculo && (
          <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#1e293b', color: 'white', borderRadius: '12px', borderLeft: '5px solid #3b82f6' }}>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>PRESCRIÇÃO:</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '40px', fontWeight: '900', color: '#60a5fa' }}>{resultadoCalculo.gramas}</span>
              <span style={{ fontSize: '18px' }}>gramas de fermento</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderEstoque = () => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>CONTROLE DE INSUMOS</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {insumos.map(item => (
          <div key={item.id} style={{ padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: item.status === 'critico' ? '#fff1f2' : '#f8fafc' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>{item.nome}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Validade: {item.validade}</div>
            </div>
            <div style={{ textAlign: 'right', fontWeight: '900', color: item.status === 'critico' ? '#e11d48' : '#1e293b' }}>
              {item.qtd} {item.unidade}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // =======================================================================
  // RENDER PRINCIPAL
  // =======================================================================
  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* HEADER */}
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '20px', borderBottom: '4px solid #2563eb' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px' }}>PANIDASH ERP</h1>
            <p style={{ margin: 0, fontSize: '10px', color: '#60a5fa' }}>MÓDULO INDUSTRIAL V2.0</p>
          </div>
          <div style={{ fontSize: '12px', textAlign: 'right' }}>
            <strong>ADMIN (ADS)</strong><br/>
            <span style={{ color: '#94a3b8' }}>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </header>

      {/* NAVEGAÇÃO POR ABAS */}
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex' }}>
          {['operacao', 'estoque', 'tarefas'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '15px',
                border: 'none',
                backgroundColor: 'transparent',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: activeTab === tab ? '#2563eb' : '#64748b',
                borderBottom: activeTab === tab ? '4px solid #2563eb' : '4px solid transparent',
                textTransform: 'uppercase',
                fontSize: '12px'
              }}
            >
              {tab === 'operacao' ? 'Operação' : tab === 'estoque' ? 'Estoque' : 'Agenda'}
            </button>
          ))}
        </div>
      </nav>

      {/* CONTEÚDO */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '0 15px' }}>
        {activeTab === 'operacao' && renderOperacao()}
        {activeTab === 'estoque' && renderEstoque()}
        {activeTab === 'tarefas' && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>AGENDA DE PROCESSOS</h2>
            {tarefas.map(t => (
              <div key={t.id} style={{ display: 'flex', gap: '15px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <input type="checkbox" checked={t.concluida} onChange={() => {}} style={{ width: '20px', height: '20px' }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{t.descricao}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>RESP: {t.responsavel}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardEmpresarial;