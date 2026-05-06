import React, { useState, useEffect } from 'react';

/**
 * PANIDASH PRO - MÓDULO INDUSTRIAL V2.0
 * Desenvolvido para: Rodrigo (ADS Curitiba)
 * Foco: Lógica de Fermentação Térmica e Gestão de Produção
 */

const DashboardPani = () => {
  // =======================================================================
  // 1. ESTADOS GLOBAIS (NAVEGAÇÃO E DADOS)
  // =======================================================================
  const [telaAtiva, setTelaAtiva] = useState('menu');
  const [dataAtual] = useState(new Date().toLocaleDateString('pt-BR'));
  
  const [calcParams, setCalcParams] = useState({
    volume: 1,          // 1 = Cheio, 0.5 = Meio
    tempAgora: 26,      
    tempSaida: 17,      
    horarioSaida: '05:40'
  });

  const [resultadoCalculo, setResultadoCalculo] = useState(null);

  // Estado de Insumos com controle de criticidade
  const [insumos, setInsumos] = useState([
    { id: '1', nome: 'Fermento Biológico', qtd: 12.5, unidade: 'kg', status: 'ok', validade: '2026-06-10' },
    { id: '2', nome: 'Farinha Especial', qtd: 50, unidade: 'kg', status: 'critico', validade: '2026-08-20' },
    { id: '3', nome: 'Açúcar Refinado', qtd: 20, unidade: 'kg', status: 'ok', validade: '2026-12-01' },
    { id: '4', nome: 'Sal Refinado', qtd: 10, unidade: 'kg', status: 'ok', validade: '2026-07-15' },
    { id: '5', nome: 'Melhorador', qtd: 5, unidade: 'kg', status: 'critico', validade: '2026-05-30' },
  ]);

  // Estado de Tarefas com Checkbox persistente (simulado)
  const [tarefas, setTarefas] = useState([
    { id: 't1', descricao: 'Limpeza dos Fornos', responsavel: 'Turno Noite', concluida: false, prioridade: 'alta' },
    { id: 't2', descricao: 'Bater Massa Pão Francês', responsavel: 'Padeiro', concluida: false, prioridade: 'urgente' },
    { id: 't3', descricao: 'Receber Farinha', responsavel: 'Estoque', concluida: false, prioridade: 'media' },
    { id: 't4', descricao: 'Organizar Carrinhos', responsavel: 'Ajudante', concluida: true, prioridade: 'baixa' },
    { id: 't5', descricao: 'Verificar Gás/Fogo', responsavel: 'Padeiro', concluida: false, prioridade: 'urgente' },
  ]);

  // =======================================================================
  // 2. LÓGICA DE NEGÓCIO ESPECIALIZADA (REGRAS DO RODRIGO)
  // =======================================================================
  const executarCalculo = () => {
    const vol = parseFloat(calcParams.volume);
    const tSaida = parseInt(calcParams.tempSaida);
    let gramasFinais = 0;
    let notaTecnica = "";

    /**
     * REGRA 1: Frio Intenso (Ex: 20°C agora -> 11°C saída)
     * Alvo: Meio 80g / Cheio 150g
     */
    if (tSaida <= 13) {
      gramasFinais = vol === 1 ? 150 : 80;
      notaTecnica = "AQUECER ÁGUA: Madrugada muito fria detectada.";
    } 
    /**
     * REGRA 2: Clima Padrão Curitiba (Ex: 22°C agora -> 16°C saída)
     * Alvo: Meio 50g / Cheio 100g
     */
    else if (tSaida > 13 && tSaida <= 16) {
      gramasFinais = vol === 1 ? 100 : 50;
      notaTecnica = "CLIMA ESTÁVEL: Seguir tempo padrão de descanso.";
    }
    /**
     * REGRA 3: Calor/Mormaço (Ex: 26°C agora -> 17°C saída)
     * Alvo: Meio 40g / Cheio 80g (Ajustado para 75g-80g no cheio)
     */
    else if (tSaida >= 17) {
      gramasFinais = vol === 1 ? 80 : 40;
      notaTecnica = "CUIDADO CALOR: Risco de passar do ponto se demorar.";
    }
    /**
     * REGRA 4: Extremo Calor (Segurança)
     */
    if (tSaida > 25) {
      gramasFinais -= (vol === 1 ? 10 : 5);
      notaTecnica = "ALERTA TÉRMICO: Reduzir fermento drasticamente.";
    }

    // Ajuste fino por Horário de Saída (Penalidade por espera longa)
    const [h, m] = calcParams.horarioSaida.split(':').map(Number);
    const minSaida = h * 60 + m;
    const minLimite = 6 * 60; // 06:00

    if (minSaida > minLimite) {
      gramasFinais -= (vol === 1 ? 15 : 7);
      notaTecnica += " (Horário tardio: reduzido p/ compensar espera)";
    }

    setResultadoCalculo({
      gramas: gramasFinais,
      alerta: notaTecnica,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  // =======================================================================
  // 3. FUNÇÕES AUXILIARES (CRUD)
  // =======================================================================
  const toggleTarefa = (id) => {
    setTarefas(tarefas.map(t => t.id === id ? { ...t, concluida: !t.concluida } : t));
  };

  const excluirInsumo = (id) => {
    if(window.confirm("Deseja remover este insumo do estoque?")) {
      setInsumos(insumos.filter(i => i.id !== id));
    }
  };

  // =======================================================================
  // 4. COMPONENTES DE INTERFACE (ALTO CONTRASTE / BLACK & WHITE)
  // =======================================================================
  
  const BotaoVoltar = () => (
    <button 
      onClick={() => setTelaAtiva('menu')}
      style={estiloBotaoVoltar}
    >
      ← VOLTAR AO PAINEL PRINCIPAL
    </button>
  );

  const RenderMenu = () => (
    <div style={estiloGridMenu}>
      <div onClick={() => setTelaAtiva('bater_pao')} style={estiloCardMenu}>
        <span style={{ fontSize: '50px' }}>🥖</span>
        <span style={estiloTextoMenu}>BATER PÃO</span>
        <small style={estiloSubtexto}>Cálculo Térmico</small>
      </div>
      <div onClick={() => setTelaAtiva('tarefas')} style={estiloCardMenu}>
        <span style={{ fontSize: '50px' }}>📋</span>
        <span style={estiloTextoMenu}>TAREFAS</span>
        <small style={estiloSubtexto}>{tarefas.filter(t => !t.concluida).length} pendentes</small>
      </div>
      <div onClick={() => setTelaAtiva('estoque')} style={estiloCardMenu}>
        <span style={{ fontSize: '50px' }}>📦</span>
        <span style={estiloTextoMenu}>ESTOQUE</span>
        <small style={estiloSubtexto}>Insumos Industriais</small>
      </div>
      <div onClick={() => alert("Módulo em desenvolvimento para ADS")} style={{ ...estiloCardMenu, opacity: 0.5 }}>
        <span style={{ fontSize: '50px' }}>⚙️</span>
        <span style={estiloTextoMenu}>CONFIG</span>
        <small style={estiloSubtexto}>Ajustes de Sistema</small>
      </div>
    </div>
  );

  const RenderBaterPao = () => (
    <div style={estiloContainerTela}>
      <BotaoVoltar />
      <h2 style={estiloTituloSecao}>PRODUÇÃO: PÃO FRANCÊS</h2>
      
      <div style={estiloCardForm}>
        <div style={estiloGrupoInput}>
          <label style={estiloLabel}>CAPACIDADE DA BATIDA (CARRINHO)</label>
          <select 
            style={estiloInput} 
            value={calcParams.volume} 
            onChange={(e) => setCalcParams({...calcParams, volume: e.target.value})}
          >
            <option value="1">100% - CARRINHO CHEIO</option>
            <option value="0.5">50% - MEIO CARRINHO</option>
          </select>
        </div>

        <div style={estiloLayoutDoisCol}>
          <div style={estiloGrupoInput}>
            <label style={estiloLabel}>TEMP. AGORA (°C)</label>
            <input 
              type="number" 
              style={estiloInput} 
              value={calcParams.tempAgora} 
              onChange={(e) => setCalcParams({...calcParams, tempAgora: e.target.value})} 
            />
          </div>
          <div style={{ ...estiloGrupoInput, backgroundColor: '#fdf2f2', padding: '10px', borderRadius: '10px', border: '1px solid #000' }}>
            <label style={{ ...estiloLabel, color: '#b91c1c' }}>TEMP. SAÍDA (PREVISÃO)</label>
            <input 
              type="number" 
              style={estiloInput} 
              value={calcParams.tempSaida} 
              onChange={(e) => setCalcParams({...calcParams, tempSaida: e.target.value})} 
            />
          </div>
        </div>

        <div style={estiloGrupoInput}>
          <label style={estiloLabel}>HORÁRIO PREVISTO P/ ASSAR</label>
          <input 
            type="time" 
            style={estiloInput} 
            value={calcParams.horarioSaida} 
            onChange={(e) => setCalcParams({...calcParams, horarioSaida: e.target.value})} 
          />
        </div>

        <button onClick={executarCalculo} style={estiloBotaoPrimario}>
          GERAR PRESCRIÇÃO TÉCNICA
        </button>

        {resultadoCalculo && (
          <div style={estiloCardResultado}>
            <div style={{ borderBottom: '2px solid #fff', marginBottom: '15px', paddingBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.8 }}>DOSAGEM RECOMENDADA:</span>
              <h1 style={{ fontSize: '80px', margin: 0, lineHeight: 1 }}>{resultadoCalculo.gramas}<span style={{ fontSize: '20px' }}>g</span></h1>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{resultadoCalculo.alerta}</p>
            <small style={{ display: 'block', marginTop: '10px', opacity: 0.7 }}>Calculado às {resultadoCalculo.timestamp}</small>
          </div>
        )}
      </div>
    </div>
  );

  const RenderEstoque = () => (
    <div style={estiloContainerTela}>
      <BotaoVoltar />
      <h2 style={estiloTituloSecao}>CONTROLE DE INSUMOS</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {insumos.map(item => (
          <div key={item.id} style={{ ...estiloItemLista, borderLeft: item.status === 'critico' ? '12px solid #ef4444' : '12px solid #22c55e' }}>
            <div>
              <div style={{ fontWeight: '900', fontSize: '18px' }}>{item.nome.toUpperCase()}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>VENCIMENTO: {item.validade}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: '900' }}>{item.qtd} {item.unidade}</div>
              <button onClick={() => excluirInsumo(item.id)} style={{ color: 'red', border: 'none', background: 'none', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>REMOVER</button>
            </div>
          </div>
        ))}
      </div>
      <button style={{ ...estiloBotaoPrimario, marginTop: '20px', backgroundColor: '#444' }}>+ ADICIONAR NOVO ITEM</button>
    </div>
  );

  const RenderTarefas = () => (
    <div style={estiloContainerTela}>
      <BotaoVoltar />
      <h2 style={estiloTituloSecao}>AGENDA OPERACIONAL</h2>
      <div style={{ backgroundColor: '#fff', border: '3px solid #000', borderRadius: '15px', overflow: 'hidden' }}>
        {tarefas.map((t, index) => (
          <div 
            key={t.id} 
            onClick={() => toggleTarefa(t.id)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '20px', 
              borderBottom: index === tarefas.length - 1 ? 'none' : '2px solid #000',
              backgroundColor: t.concluida ? '#f1f5f9' : '#fff',
              cursor: 'pointer'
            }}
          >
            <div style={{ 
              width: '30px', 
              height: '30px', 
              border: '3px solid #000', 
              marginRight: '20px',
              backgroundColor: t.concluida ? '#000' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {t.concluida && <span style={{ color: '#fff', fontWeight: 'bold' }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '18px', 
                textDecoration: t.concluida ? 'line-through' : 'none',
                color: t.concluida ? '#94a3b8' : '#000'
              }}>
                {t.descricao}
              </div>
              <div style={{ fontSize: '11px', fontWeight: '900', color: t.prioridade === 'urgente' ? 'red' : '#64748b' }}>
                PRIORIDADE: {t.prioridade.toUpperCase()} | RESP: {t.responsavel.toUpperCase()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // =======================================================================
  // 5. OBJETOS DE ESTILO (SISTEMA DE DESIGN)
  // =======================================================================
  const estiloGridMenu = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' };
  
  const estiloCardMenu = { 
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
    backgroundColor: '#fff', border: '4px solid #000', borderRadius: '25px', padding: '40px 10px', 
    cursor: 'pointer', boxShadow: '8px 8px 0px #000', transition: 'all 0.2s active' 
  };

  const estiloTextoMenu = { color: '#000', fontWeight: '900', fontSize: '20px', marginTop: '15px' };
  const estiloSubtexto = { color: '#666', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' };
  const estiloContainerTela = { padding: '20px' };
  const estiloTituloSecao = { fontWeight: '900', fontSize: '24px', borderBottom: '6px solid #000', paddingBottom: '10px', marginBottom: '25px', color: '#000' };
  
  const estiloBotaoVoltar = { 
    backgroundColor: '#000', color: '#fff', border: 'none', padding: '15px', 
    borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '25px', width: '100%', fontSize: '14px' 
  };

  const estiloCardForm = { display: 'flex', flexDirection: 'column', gap: '20px' };
  const estiloGrupoInput = { display: 'flex', flexDirection: 'column', gap: '5px' };
  const estiloLabel = { fontSize: '12px', fontWeight: '900', color: '#000' };
  const estiloInput = { 
    width: '100%', padding: '18px', border: '3px solid #000', borderRadius: '12px', 
    fontSize: '20px', fontWeight: '900', color: '#000', backgroundColor: '#fff' 
  };

  const estiloLayoutDoisCol = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
  
  const estiloBotaoPrimario = { 
    width: '100%', backgroundColor: '#000', color: '#fff', fontWeight: '900', 
    padding: '25px', borderRadius: '15px', border: 'none', cursor: 'pointer', fontSize: '18px', boxShadow: '0px 10px 20px rgba(0,0,0,0.2)' 
  };

  const estiloCardResultado = { 
    marginTop: '30px', padding: '30px', backgroundColor: '#000', color: '#fff', 
    borderRadius: '20px', textAlign: 'center', boxShadow: '0px 15px 30px rgba(0,0,0,0.3)' 
  };

  const estiloItemLista = { 
    padding: '20px', border: '3px solid #000', borderRadius: '15px', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' 
  };

  // =======================================================================
  // RENDERIZAÇÃO FINAL
  // =======================================================================
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header Fixo */}
      <header style={{ backgroundColor: '#000', color: '#fff', padding: '25px 20px', textAlign: 'center', borderBottom: '8px solid #2563eb' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '2px' }}>PANIDASH <span style={{color: '#2563eb'}}>PRO</span></h1>
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '5px', opacity: 0.8 }}>
          CURITIBA/PR | {dataAtual} | LOGADO: RODRIGO (ADS)
        </div>
      </header>

      {/* Área de Conteúdo */}
      <main style={{ maxWidth: '650px', margin: '0 auto', paddingBottom: '50px' }}>
        {telaAtiva === 'menu' && <RenderMenu />}
        {telaAtiva === 'bater_pao' && <RenderBaterPao />}
        {telaAtiva === 'estoque' && <RenderEstoque />}
        {telaAtiva === 'tarefas' && <RenderTarefas />}
      </main>

      {/* Footer Informativo */}
      {telaAtiva === 'menu' && (
        <footer style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}>
          SISTEMA DE GESTÃO PANIDASH v2.0.4 - AMBIENTE DE PRODUÇÃO
        </footer>
      )}
    </div>
  );
};

export default DashboardPani;