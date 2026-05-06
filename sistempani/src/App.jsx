import React, { useState, useEffect } from 'react';
import { calcularParametrosEmpresariais } from './calculo';
const DashboardEmpresarial = () => {
  // =======================================================================
  // 1. ESTADO GLOBAL (Simulando o Banco de Dados - Supabase)
  // =======================================================================
  const [activeTab, setActiveTab] = useState('operacao'); // operacao, estoque, tarefas
  const [editMode, setEditMode] = useState(false);

  // Estado da Calculadora de Batida
  const [calcParams, setCalcParams] = useState({
    volume: 1,
    tempAmbiente: 23,
    horarioSaida: '05:40',
    tipoMassa: 'frances'
  });
  const [resultadoCalculo, setResultadoCalculo] = useState(null);

  // Estado do Estoque (Dicionários complexos para fácil mapeamento no SQL)
  const [insumos, setInsumos] = useState([
    { id: '1', nome: 'Fermento Biológico', qtd: 12.5, unidade: 'kg', status: 'ok', validade: '2026-06-10' },
    { id: '2', nome: 'Farinha Especial', qtd: 50, unidade: 'kg', status: 'critico', validade: '2026-08-20' },
    { id: '3', nome: 'Açúcar Refinado', qtd: 20, unidade: 'kg', status: 'ok', validade: '2026-12-01' },
  ]);

  // Estado das Tarefas (Com lógica de recorrência)
  const [tarefas, setTarefas] = useState([
    { id: 't1', descricao: 'Limpeza dos Fornos', frequencia: 'diaria', responsavel: 'Turno Noite', concluida: false },
    { id: 't2', descricao: 'Bater Massa Pão Francês', frequencia: 'diaria', responsavel: 'Padeiro', concluida: false },
    { id: 't3', descricao: 'Receber Farinha', frequencia: 'dia_sim_nao', responsavel: 'Estoque', concluida: false },
  ]);

  // =======================================================================
  // 2. LÓGICA DE NEGÓCIO (Motor de Cálculo Preditivo)
  // =======================================================================
  const executarCalculo = () => {
    // Simulando a "IA" Preditiva de Fermentação
    const K_FERMENTO = 500; // Base: 500g para 20°C
    let ajusteTemp = (calcParams.tempAmbiente - 20) * 15; // Tira 15g por grau acima
    let baseCalculada = (K_FERMENTO - ajusteTemp) * parseFloat(calcParams.volume);

    // Ajuste por tempo de espera (Horário alvo)
    const [h, m] = calcParams.horarioSaida.split(':').map(Number);
    const minSaida = h * 60 + m;
    const minPadrao = 5 * 60 + 40; // 05:40

    if (minSaida > minPadrao) {
      const horasExtra = (minSaida - minPadrao) / 60;
      baseCalculada -= (horasExtra * 20); // Reduz se vai demorar mais
    }

    setResultadoCalculo({
      gramas: Math.max(baseCalculada, 50).toFixed(0), // Nunca menor que 50g
      alerta: calcParams.tempAmbiente > 28 ? 'ALERTA TÉRMICO: Reduzir tempo de descanso' : 'Normal',
      timestamp: new Date().toLocaleTimeString()
    });
  };

  // =======================================================================
  // 3. FUNÇÕES DE CRUD (Estoque e Tarefas)
  // =======================================================================
  const handleInsumoChange = (id, campo, valor) => {
    setInsumos(insumos.map(i => i.id === id ? { ...i, [campo]: valor } : i));
  };

  const adicionarInsumo = () => {
    const novo = { id: Date.now().toString(), nome: '', qtd: 0, unidade: 'kg', status: 'ok', validade: '' };
    setInsumos([...insumos, novo]);
  };

  const removerInsumo = (id) => {
    setInsumos(insumos.filter(i => i.id !== id));
  };

  const handleTarefaChange = (id, campo, valor) => {
    setTarefas(tarefas.map(t => t.id === id ? { ...t, [campo]: valor } : t));
  };

  const adicionarTarefa = () => {
    const nova = { id: Date.now().toString(), descricao: '', frequencia: 'diaria', responsavel: '', concluida: false };
    setTarefas([...tarefas, nova]);
  };

  const removerTarefa = (id) => {
    setTarefas(tarefas.filter(t => t.id !== id));
  };

  // =======================================================================
  // 4. COMPONENTES DE INTERFACE (TABS)
  // =======================================================================

  // ABA 1: OPERAÇÃO (Chão de Fábrica)
  const renderOperacao = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
      <h2 className="text-lg font-bold mb-4 border-b pb-2 flex justify-between items-center">
        <span>PARÂMETROS DE BATIDA</span>
        {resultadoCalculo && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Último: {resultadoCalculo.timestamp}</span>}
      </h2>
      
      <div className="space-y-6">
        <div>
          <label className="text-xs font-bold uppercase text-slate-500">Volume de Carga (Carrinho)</label>
          <select 
            className="w-full mt-1 p-3 bg-slate-100 rounded-lg border-none focus:ring-2 focus:ring-blue-500"
            value={calcParams.volume}
            onChange={(e) => setCalcParams({...calcParams, volume: e.target.value})}
          >
            <option value="1">100% - Carrinho Completo</option>
            <option value="0.5">50% - Meio Carrinho</option>
            <option value="0.25">25% - Quarto de Carrinho</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Temp. Ambiente (°C)</label>
            <input 
              type="number" 
              className="w-full mt-1 p-3 bg-slate-100 rounded-lg"
              value={calcParams.tempAmbiente}
              onChange={(e) => setCalcParams({...calcParams, tempAmbiente: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Horário Alvo (Saída)</label>
            <input 
              type="time" 
              className="w-full mt-1 p-3 bg-slate-100 rounded-lg"
              value={calcParams.horarioSaida}
              onChange={(e) => setCalcParams({...calcParams, horarioSaida: e.target.value})}
            />
          </div>
        </div>

        <button 
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-blue-200 shadow-lg active:scale-95 transition-all hover:bg-blue-700"
          onClick={executarCalculo}
        >
          EXECUTAR CÁLCULO PREDITIVO
        </button>

        {/* Resultado do Cálculo */}
        {resultadoCalculo && (
          <div className="mt-6 p-6 bg-slate-800 text-white rounded-xl border-l-4 border-blue-500">
            <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Prescrição do Sistema:</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-blue-400">{resultadoCalculo.gramas}</span>
              <span className="text-xl text-slate-300">gramas de fermento</span>
            </div>
            {resultadoCalculo.alerta !== 'Normal' && (
              <div className="mt-4 p-2 bg-red-900/50 text-red-300 border border-red-800 rounded text-sm">
                ⚠️ {resultadoCalculo.alerta}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ABA 2: GESTÃO DE ESTOQUE
  const renderEstoque = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-lg font-bold">CONTROLE DE INSUMOS</h2>
        <button 
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${editMode ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}
        >
          {editMode ? 'SAIR MODO EDIÇÃO' : 'EDITAR INSUMOS'}
        </button>
      </div>

      <div className="space-y-3">
        {insumos.map((item) => (
          <div key={item.id} className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${item.status === 'critico' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
            
            {/* Visualização vs Edição */}
            {!editMode ? (
              <>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">{item.nome}</span>
                  <span className="text-xs text-slate-500">Validade: {item.validade || 'N/A'}</span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-black ${item.status === 'critico' ? 'text-red-600' : 'text-slate-700'}`}>
                    {item.qtd} {item.unidade}
                  </span>
                  {item.status === 'critico' && <p className="text-xs text-red-500 font-bold">REPOR IMEDIATAMENTE</p>}
                </div>
              </>
            ) : (
              // MODO EDIÇÃO
              <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                <input className="p-2 border rounded col-span-2" value={item.nome} onChange={(e) => handleInsumoChange(item.id, 'nome', e.target.value)} placeholder="Nome do Insumo" />
                <input className="p-2 border rounded w-full" type="number" value={item.qtd} onChange={(e) => handleInsumoChange(item.id, 'qtd', e.target.value)} placeholder="Qtd" />
                <select className="p-2 border rounded" value={item.status} onChange={(e) => handleInsumoChange(item.id, 'status', e.target.value)}>
                  <option value="ok">Estoque OK</option>
                  <option value="critico">Crítico</option>
                </select>
                <button onClick={() => removerInsumo(item.id)} className="bg-red-500 text-white p-2 rounded font-bold">EXCLUIR</button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {editMode && (
        <button onClick={adicionarInsumo} className="mt-4 w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700">
          + ADICIONAR NOVO INSUMO
        </button>
      )}
    </div>
  );

  // ABA 3: GESTÃO DE TAREFAS
  const renderTarefas = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-lg font-bold">AGENDA DE PROCESSOS</h2>
        <button 
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${editMode ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}
        >
          {editMode ? 'SAIR MODO EDIÇÃO' : 'EDITAR TAREFAS'}
        </button>
      </div>

      <div className="space-y-3">
        {tarefas.map((tarefa) => (
          <div key={tarefa.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {!editMode ? (
              <>
                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    className="w-6 h-6 accent-blue-600"
                    checked={tarefa.concluida}
                    onChange={(e) => handleTarefaChange(tarefa.id, 'concluida', e.target.checked)}
                  />
                  <div>
                    <p className={`font-bold ${tarefa.concluida ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {tarefa.descricao}
                    </p>
                    <p className="text-xs text-slate-500 uppercase">Resp: {tarefa.responsavel} | Freq: {tarefa.frequencia}</p>
                  </div>
                </div>
              </>
            ) : (
              // MODO EDIÇÃO
              <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                <input className="p-2 border rounded col-span-2" value={tarefa.descricao} onChange={(e) => handleTarefaChange(tarefa.id, 'descricao', e.target.value)} placeholder="Descrição da Tarefa" />
                <select className="p-2 border rounded" value={tarefa.frequencia} onChange={(e) => handleTarefaChange(tarefa.id, 'frequencia', e.target.value)}>
                  <option value="diaria">Diária</option>
                  <option value="dia_sim_nao">Dia Sim / Dia Não</option>
                  <option value="semanal">Semanal</option>
                </select>
                <button onClick={() => removerTarefa(tarefa.id)} className="bg-red-500 text-white p-2 rounded font-bold">EXCLUIR</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {editMode && (
        <button onClick={adicionarTarefa} className="mt-4 w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700">
          + ADICIONAR NOVA TAREFA
        </button>
      )}
    </div>
  );

  // =======================================================================
  // RENDER PRINCIPAL
  // =======================================================================
  return (
    <div className="bg-slate-100 min-h-screen text-slate-900 font-sans pb-10">
      {/* Header Corporativo */}
      <header className="bg-slate-900 text-white p-4 flex flex-col md:flex-row justify-between items-center shadow-lg border-b-4 border-blue-500">
        <div className="flex items-center gap-3 mb-2 md:mb-0">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xl">PD</div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SISTEMA ERP PANIDASH</h1>
            <p className="text-xs text-blue-400 font-mono tracking-widest">V2.0.0 - MÓDULO INDUSTRIAL</p>
          </div>
        </div>
        <div className="text-center md:text-right">
          <p className="text-sm font-medium text-slate-300">Operador: <span className="text-white">Admin (ADS)</span></p>
          <p className="text-xs font-mono text-slate-500">{new Date().toLocaleDateString()}</p>
        </div>
      </header>

      {/* Navegação por Abas (Tabs) */}
      <nav className="bg-white shadow-sm mb-6 overflow-x-auto">
        <div className="max-w-5xl mx-auto flex">
          <button 
            onClick={() => {setActiveTab('operacao'); setEditMode(false);}}
            className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider border-b-4 transition-colors ${activeTab === 'operacao' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
          >
            Operação (Painel)
          </button>
          <button 
            onClick={() => {setActiveTab('estoque'); setEditMode(false);}}
            className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider border-b-4 transition-colors ${activeTab === 'estoque' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
          >
            Estoque / Insumos
          </button>
          <button 
            onClick={() => {setActiveTab('tarefas'); setEditMode(false);}}
            className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider border-b-4 transition-colors ${activeTab === 'tarefas' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
          >
            Agenda de Tarefas
          </button>
        </div>
      </nav>

      {/* Conteúdo Dinâmico */}
      <main className="max-w-5xl mx-auto px-4 md:px-0">
        {/* Aviso global se estiver em modo edição */}
        {editMode && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm flex justify-between items-center animate-pulse">
            <span className="font-bold text-sm uppercase">⚠️ Você está no Modo de Edição. Alterações afetam o banco de dados.</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {activeTab === 'operacao' && renderOperacao()}
          {activeTab === 'estoque' && renderEstoque()}
          {activeTab === 'tarefas' && renderTarefas()}
        </div>
      </main>
    </div>
  );
};

export default DashboardEmpresarial;