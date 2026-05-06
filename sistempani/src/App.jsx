import React, { useState, useEffect } from 'react';

/**
 * PANIDASH PRO - MÓDULO INDUSTRIAL V3.0
 * Desenvolvido para: Rodrigo (ADS Curitiba)
 * Foco: Fermentação Térmica, Estoque Inteligente e Tarefas Alternadas
 * Preparado para Integração: Supabase
 */

const DashboardPani = () => {
  // =======================================================================
  // 1. ESTADOS GLOBAIS (NAVEGAÇÃO E DADOS)
  // =======================================================================
  const [telaAtiva, setTelaAtiva] = useState('menu');
  const [dataAtualISO] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD para cálculos
  const [dataAtualFormatada] = useState(new Date().toLocaleDateString('pt-BR'));
  
  const [calcParams, setCalcParams] = useState({
    volume: 1,
    tempAgora: 26,      
    tempSaida: 17,      
    horarioSaida: '05:40'
  });

  const [resultadoCalculo, setResultadoCalculo] = useState(null);

  // ESTOQUE: Lógica de Duração Baseada em Chegada e Média de Consumo
  const [insumos, setInsumos] = useState([
    { id: '1', nome: 'Farinha Especial', qtd: 50, unidade: 'kg', dataChegada: '2026-05-01', diasDuracaoMedia: 6 },
    { id: '2', nome: 'Fermento Biológico', qtd: 10, unidade: 'kg', dataChegada: '2026-05-04', diasDuracaoMedia: 15 },
    { id: '3', nome: 'Açúcar Refinado', qtd: 20, unidade: 'kg', dataChegada: '2026-04-20', diasDuracaoMedia: 30 },
  ]);

  // TAREFAS: Lógica de Dia Sim / Dia Não
  const [tarefas, setTarefas] = useState([
    { id: 't1', descricao: 'Limpeza Pesada dos Fornos', responsavel: 'Noturno', concluida: false, frequencia: 'dia_sim_dia_nao', ultimaExecucao: '2026-05-05' },
    { id: 't2', descricao: 'Bater Massa Pão Francês', responsavel: 'Padeiro', concluida: false, frequencia: 'diario', ultimaExecucao: '2026-05-05' },
    { id: 't3', descricao: 'Limpar Carrinhos', responsavel: 'Ajudante', concluida: false, frequencia: 'dia_sim_dia_nao', ultimaExecucao: '2026-05-04' },
  ]);

  // RECEITAS: Catálogo Base
  const [receitas, setReceitas] = useState([
    { id: 'r1', nome: 'Pão Francês Tradicional', rendimento: '100 pães', ingredientes: '5kg Farinha, 100g Sal, 50g Melhorador, Água gelada' },
    { id: 'r2', nome: 'Pão Doce Massa Rica', rendimento: '50 pães', ingredientes: '2kg Farinha, 400g Açúcar, 200g Margarina, Ovos' },
  ]);

  // =======================================================================
  // 2. LÓGICA DE NEGÓCIO ESPECIALIZADA
  // =======================================================================
  
  // CÁLCULO DO PÃO (+5% DE FERMENTO)
  const executarCalculo = () => {
    const vol = parseFloat(calcParams.volume);
    const tSaida = parseInt(calcParams.tempSaida);
    let gramasBase = 0;
    let notaTecnica = "";

    if (tSaida <= 13) {
      gramasBase = vol === 1 ? 150 : 80;
      notaTecnica = "AQUECER ÁGUA: Madrugada fria.";
    } else if (tSaida > 13 && tSaida <= 16) {
      gramasBase = vol === 1 ? 100 : 50;
      notaTecnica = "CLIMA ESTÁVEL: Tempo padrão.";
    } else if (tSaida >= 17) {
      gramasBase = vol === 1 ? 80 : 40;
      notaTecnica = "CUIDADO CALOR: Risco de passar do ponto.";
    }
    
    if (tSaida > 25) {
      gramasBase -= (vol === 1 ? 10 : 5);
      notaTecnica = "ALERTA TÉRMICO: Reduzido por segurança.";
    }

    const [h, m] = calcParams.horarioSaida.split(':').map(Number);
    const minSaida = h * 60 + m;
    if (minSaida > 360) { // 06:00
      gramasBase -= (vol === 1 ? 15 : 7);
      notaTecnica += " (Horário tardio)";
    }

    // APLICANDO A REGRA DOS +5% PEDIDA PELO RODRIGO
    const gramasComAcrescimo = Math.round(gramasBase * 1.05);

    setResultadoCalculo({
      gramas: gramasComAcrescimo,
      alerta: notaTecnica,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  // =======================================================================
  // 3. FUNÇÕES AUXILIARES (ESTOQUE E TAREFAS)
  // =======================================================================
  
  const calcularStatusEstoque = (dataChegada, duracaoMediaDias) => {
    const hoje = new Date(dataAtualISO);
    const chegada = new Date(dataChegada);
    
    // Calcula quando o produto deve acabar
    const dataFimPrevista = new Date(chegada);
    dataFimPrevista.setDate(dataFimPrevista.getDate() + duracaoMediaDias);
    
    // Calcula dias restantes
    const diferencaTempo = dataFimPrevista - hoje;
    const diasRestantes = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) return { texto: 'ESGOTADO/ATRASADO', cor: '#ef4444', dias: diasRestantes };
    if (diasRestantes <= 2) return { texto: 'ACABANDO (PEDIR MAIS)', cor: '#f97316', dias: diasRestantes };
    return { texto: 'OK', cor: '#22c55e', dias: diasRestantes };
  };

  const tarefasDeHoje = tarefas.filter(t => {
    if (t.frequencia === 'diario') return true;
    if (t.frequencia === 'dia_sim_dia_nao') {
      // Se a última execução foi ontem, hoje não faz. Se foi antes de ontem, faz hoje.
      const hoje = new Date(dataAtualISO).getTime();
      const ultima = new Date(t.ultimaExecucao).getTime();
      const difDias = (hoje - ultima) / (1000 * 3600 * 24);
      return difDias >= 2; // Aparece se já passou 2 ou mais dias desde a última vez
    }
    return true;
  });

  const toggleTarefa = (id) => {
    setTarefas(tarefas.map(t => t.id === id ? { ...t, concluida: !t.concluida, ultimaExecucao: !t.concluida ? dataAtualISO : t.ultimaExecucao } : t));
  };

  // =======================================================================
  // 4. COMPONENTES DE INTERFACE
  // =======================================================================
  const BotaoVoltar = () => (
    <button onClick={() => setTelaAtiva('menu')} style={estilos.botaoVoltar}>
      ← VOLTAR AO PAINEL
    </button>
  );

  const RenderMenu = () => (
    <div style={estilos.gridMenu}>
      <div onClick={() => setTelaAtiva('bater_pao')} style={estilos.cardMenu}>
        <span style={{ fontSize: '40px' }}>🥖</span>
        <span style={estilos.textoMenu}>PRODUÇÃO</span>
      </div>
      <div onClick={() => setTelaAtiva('tarefas')} style={estilos.cardMenu}>
        <span style={{ fontSize: '40px' }}>📋</span>
        <span style={estilos.textoMenu}>AGENDA</span>
      </div>
      <div onClick={() => setTelaAtiva('estoque')} style={estilos.cardMenu}>
        <span style={{ fontSize: '40px' }}>📦</span>
        <span style={estilos.textoMenu}>ESTOQUE</span>
      </div>
      <div onClick={() => setTelaAtiva('receitas')} style={estilos.cardMenu}>
        <span style={{ fontSize: '40px' }}>📖</span>
        <span style={estilos.textoMenu}>RECEITAS</span>
      </div>
      <div onClick={() => setTelaAtiva('relatorios')} style={{ ...estilos.cardMenu, gridColumn: 'span 2' }}>
        <span style={{ fontSize: '40px' }}>📊</span>
        <span style={estilos.textoMenu}>RELATÓRIOS GERENCIAIS</span>
      </div>
    </div>
  );

  // --- ABA: PRODUÇÃO ---
  const RenderBaterPao = () => (
    <div style={estilos.containerTela}>
      <BotaoVoltar />
      <h2 style={estilos.tituloSecao}>CÁLCULO TÉRMICO (+5% APLICADO)</h2>
      <div style={estilos.cardForm}>
        <div style={estilos.grupoInput}>
          <label style={estilos.label}>CAPACIDADE (CARRINHO)</label>
          <select style={estilos.input} value={calcParams.volume} onChange={(e) => setCalcParams({...calcParams, volume: e.target.value})}>
            <option value="1">100% - CHEIO</option>
            <option value="0.5">50% - MEIO</option>
          </select>
        </div>
        <div style={estilos.layoutDoisCol}>
          <div style={estilos.grupoInput}>
            <label style={estilos.label}>TEMP. AGORA (°C)</label>
            <input type="number" style={estilos.input} value={calcParams.tempAgora} onChange={(e) => setCalcParams({...calcParams, tempAgora: e.target.value})} />
          </div>
          <div style={{ ...estilos.grupoInput, backgroundColor: '#fdf2f2', padding: '10px', borderRadius: '10px', border: '1px solid #000' }}>
            <label style={{ ...estilos.label, color: '#b91c1c' }}>TEMP. SAÍDA (°C)</label>
            <input type="number" style={estilos.input} value={calcParams.tempSaida} onChange={(e) => setCalcParams({...calcParams, tempSaida: e.target.value})} />
          </div>
        </div>
        <button onClick={executarCalculo} style={estilos.botaoPrimario}>GERAR PRESCRIÇÃO</button>
        {resultadoCalculo && (
          <div style={estilos.cardResultado}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>DOSAGEM (JÁ COM +5%):</span>
            <h1 style={{ fontSize: '80px', margin: 0 }}>{resultadoCalculo.gramas}<span style={{ fontSize: '20px' }}>g</span></h1>
            <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{resultadoCalculo.alerta}</p>
          </div>
        )}
      </div>
    </div>
  );

  // --- ABA: ESTOQUE INTELIGENTE ---
  const RenderEstoque = () => (
    <div style={estilos.containerTela}>
      <BotaoVoltar />
      <h2 style={estilos.tituloSecao}>PREVISÃO DE CONSUMO</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {insumos.map(item => {
          const status = calcularStatusEstoque(item.dataChegada, item.diasDuracaoMedia);
          return (
            <div key={item.id} style={{ ...estilos.itemLista, borderLeft: `12px solid ${status.cor}` }}>
              <div>
                <div style={{ fontWeight: '900', fontSize: '18px' }}>{item.nome.toUpperCase()}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Chegou: {item.dataChegada} | Média de uso: {item.diasDuracaoMedia} dias
                </div>
                <div style={{ fontSize: '12px', color: status.cor, fontWeight: 'bold', marginTop: '5px' }}>
                  STATUS: {status.texto} ({status.dias > 0 ? `Restam aprox. ${status.dias} dias` : 'Verificar urgência'})
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', textAlign: 'right' }}>
                {item.qtd} {item.unidade}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // --- ABA: TAREFAS ---
  const RenderTarefas = () => (
    <div style={estilos.containerTela}>
      <BotaoVoltar />
      <h2 style={estilos.tituloSecao}>TAREFAS DE HOJE</h2>
      <div style={{ fontSize: '12px', marginBottom: '15px', color: '#666', fontWeight: 'bold' }}>
        *Tarefas de "dia sim, dia não" já foram filtradas com base em ontem.
      </div>
      <div style={{ backgroundColor: '#fff', border: '3px solid #000', borderRadius: '15px', overflow: 'hidden' }}>
        {tarefasDeHoje.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold' }}>Nenhuma tarefa pendente para hoje.</div>
        ) : (
          tarefasDeHoje.map((t, index) => (
            <div key={t.id} onClick={() => toggleTarefa(t.id)} style={{ ...estilos.tarefaRow, borderBottom: index === tarefasDeHoje.length - 1 ? 'none' : '2px solid #000', backgroundColor: t.concluida ? '#f1f5f9' : '#fff' }}>
              <div style={{ ...estilos.checkbox, backgroundColor: t.concluida ? '#000' : '#fff' }}>
                {t.concluida && <span style={{ color: '#fff' }}>✓</span>}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', textDecoration: t.concluida ? 'line-through' : 'none', color: t.concluida ? '#94a3b8' : '#000' }}>{t.descricao}</div>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#64748b' }}>FREQ: {t.frequencia.toUpperCase()} | RESP: {t.responsavel.toUpperCase()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // --- ABA: RECEITAS ---
  const RenderReceitas = () => (
    <div style={estilos.containerTela}>
      <BotaoVoltar />
      <h2 style={estilos.tituloSecao}>LIVRO DE RECEITAS</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {receitas.map(r => (
          <div key={r.id} style={{ padding: '20px', border: '3px solid #000', borderRadius: '15px', backgroundColor: '#fff' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '900' }}>{r.nome.toUpperCase()}</h3>
            <div style={{ fontSize: '14px', marginBottom: '10px', color: '#444' }}><strong>Rendimento:</strong> {r.rendimento}</div>
            <div style={{ fontSize: '14px', color: '#000', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong>Ingredientes:</strong><br/>{r.ingredientes}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- ABA: RELATÓRIOS ---
  const RenderRelatorios = () => (
    <div style={estilos.containerTela}>
      <BotaoVoltar />
      <h2 style={estilos.tituloSecao}>VISÃO GERAL</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div style={{ padding: '20px', backgroundColor: '#000', color: '#fff', borderRadius: '15px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', fontWeight: '900' }}>{tarefas.filter(t => t.concluida).length}</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>TAREFAS CONCLUÍDAS</div>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '15px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', fontWeight: '900' }}>
            {insumos.filter(i => calcularStatusEstoque(i.dataChegada, i.diasDuracaoMedia).dias <= 2).length}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>ALERTAS DE ESTOQUE</div>
        </div>
      </div>
      <div style={{ marginTop: '20px', padding: '20px', border: '3px solid #000', borderRadius: '15px', backgroundColor: '#fff' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Integração Supabase</h4>
        <p style={{ fontSize: '12px', color: '#666' }}>Esta aba está preparada para receber gráficos e históricos assim que conectada às tabelas de logs do Supabase.</p>
      </div>
    </div>
  );

  // =======================================================================
  // 5. ESTILOS GLOBAIS
  // =======================================================================
  const estilos = {
    gridMenu: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '20px' },
    cardMenu: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '4px solid #000', borderRadius: '20px', padding: '30px 10px', cursor: 'pointer', boxShadow: '6px 6px 0px #000' },
    textoMenu: { color: '#000', fontWeight: '900', fontSize: '16px', marginTop: '10px', textAlign: 'center' },
    containerTela: { padding: '20px' },
    tituloSecao: { fontWeight: '900', fontSize: '22px', borderBottom: '6px solid #000', paddingBottom: '10px', marginBottom: '20px', color: '#000' },
    botaoVoltar: { backgroundColor: '#000', color: '#fff', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', width: '100%' },
    cardForm: { display: 'flex', flexDirection: 'column', gap: '15px' },
    grupoInput: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '12px', fontWeight: '900', color: '#000' },
    input: { width: '100%', padding: '15px', border: '3px solid #000', borderRadius: '10px', fontSize: '18px', fontWeight: '900', color: '#000', backgroundColor: '#fff', boxSizing: 'border-box' },
    layoutDoisCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    botaoPrimario: { width: '100%', backgroundColor: '#000', color: '#fff', fontWeight: '900', padding: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '16px' },
    cardResultado: { marginTop: '20px', padding: '20px', backgroundColor: '#000', color: '#fff', borderRadius: '15px', textAlign: 'center' },
    itemLista: { padding: '20px', border: '3px solid #000', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' },
    tarefaRow: { display: 'flex', alignItems: 'center', padding: '20px', cursor: 'pointer' },
    checkbox: { width: '30px', height: '30px', border: '3px solid #000', marginRight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ backgroundColor: '#000', color: '#fff', padding: '20px', textAlign: 'center', borderBottom: '6px solid #2563eb' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>PANIDASH <span style={{color: '#2563eb'}}>PRO</span></h1>
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '5px', opacity: 0.8 }}>
          CURITIBA | {dataAtualFormatada} | RODRIGO (ADS)
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
        {telaAtiva === 'menu' && <RenderMenu />}
        {telaAtiva === 'bater_pao' && <RenderBaterPao />}
        {telaAtiva === 'estoque' && <RenderEstoque />}
        {telaAtiva === 'tarefas' && <RenderTarefas />}
        {telaAtiva === 'receitas' && <RenderReceitas />}
        {telaAtiva === 'relatorios' && <RenderRelatorios />}
      </main>
    </div>
  );
};

export default DashboardPani;