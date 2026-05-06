// engine/calculadoraProducao.js

export const calcularParametrosEmpresariais = (dados) => {
  const { 
    tempInterna, 
    tempExterna, 
    volumeDesejado, 
    horarioSaida, 
    tempoFermentacaoAlvo // em horas
  } = dados;

  // Constantes de Inércia Térmica (Empresarial)
  const K_FERMENTO = 0.085; // Coeficiente biológico
  const AJUSTE_VOLUME = volumeDesejado; 
  
  // Cálculo de Diferencial de Tempo
  const agora = new Date();
  const saida = new Date(horarioSaida);
  const deltaTempoHoras = (saida - agora) / (1000 * 60 * 60);

  // Lógica "IA" Preditiva: 
  // Quanto maior o tempo de espera (deltaTempo), menor a carga de fermento.
  // Quanto maior a temperatura, menor a carga de fermento (exponencial).
  
  const fatorTemp = Math.pow(1.05, (tempInterna - 20)); // Aumenta 5% a cada grau
  const cargaFermentoBase = (1000 / deltaTempoHoras) * K_FERMENTO;
  
  const resultadoFinal = (cargaFermentoBase / fatorTemp) * AJUSTE_VOLUME;

  return {
    gramatura: resultadoFinal.toFixed(2),
    alerta_critico: tempInterna > 28 ? "Risco de fermentação acelerada" : null,
    tempo_estimado_ponto: deltaTempoHoras.toFixed(1)
  };
};