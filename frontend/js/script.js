// ============================================================
// api.js — Cliente JS para a API "Calculadora Inteligente"
// Base URL: https://calculadora-inteligente-api.onrender.com
// ============================================================

const API_BASE_URL = "https://calculadora-inteligente-api.onrender.com";

/**
 * Função genérica para chamar a API via POST.
 * @param {string} endpoint - caminho do endpoint (ex: "/calculadora_regra_tres")
 * @param {object} dados - corpo da requisição (será convertido em JSON)
 * @returns {Promise<object>} resultado retornado pela API
 */
async function chamarAPI(endpoint, dados) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    const data = await response.json();

    if (!response.ok) {
      // A API retorna { detail: "Valores inválidos." } em erros
      const mensagem = data?.detail || `Erro ${response.status} ao chamar ${endpoint}`;
      throw new Error(mensagem);
    }

    return data;
  } catch (erro) {
    console.error(`Erro em chamarAPI(${endpoint}):`, erro);
    throw erro;
  }
}

// ------------------------------------------------------------
// 1) Regra de Três
// ------------------------------------------------------------
async function calcularRegraTres(valor1, valor2, valor3) {
  return chamarAPI("/calculadora_regra_tres", { valor1, valor2, valor3 });
}

// ------------------------------------------------------------
// 2) Motorista de App
// ------------------------------------------------------------
async function calcularMotorista({
  distancia,
  ganhos,
  consumo_veiculo,
  valor_combustivel,
  alimentacao = null,
  cafe = null,
  outros_gastos = null,
}) {
  return chamarAPI("/calculadora_motorista", {
    distancia,
    ganhos,
    consumo_veiculo,
    valor_combustivel,
    alimentacao,
    cafe,
    outros_gastos,
  });
}

// ------------------------------------------------------------
// 3) Média Acadêmica
// ------------------------------------------------------------
async function calcularMedia({
  prova_parcial,
  prova_global,
  trabalhos = null,
  pontos_extras = null,
}) {
  return chamarAPI("/calculadora_media", {
    prova_parcial,
    prova_global,
    trabalhos,
    pontos_extras,
  });
}

// ------------------------------------------------------------
// 4) Juros Compostos
// ------------------------------------------------------------
async function calcularJurosCompostos({
  valor_inicial,
  aporte_mensal,
  taxa_juros,
  periodo_anos,
}) {
  return chamarAPI("/calculadora_juros_compostos", {
    valor_inicial,
    aporte_mensal,
    taxa_juros,
    periodo_anos,
  });
}

// ------------------------------------------------------------
// 5) Orçamento 50/30/20
// ------------------------------------------------------------
async function calcularGastos(salario_liquido, gastos_essenciais) {
  return chamarAPI("/calculadora_gastos", {
    salario_liquido,
    gastos_essenciais,
  });
}

// ------------------------------------------------------------
// 6) Financiamento
// ------------------------------------------------------------
async function calcularFinanciamento({
  valor,
  taxa_juros,
  ano,
  valor_entrada = 0,
}) {
  return chamarAPI("/calculadora_financiamento", {
    valor,
    taxa_juros,
    ano,
    valor_entrada,
  });
}

// ------------------------------------------------------------
// 7) Eletrodomésticos (consumo de energia)
// ------------------------------------------------------------
async function calcularEletrodomesticos({
  potencia,
  horas_uso,
  dias_uso,
  valor_kwh,
}) {
  return chamarAPI("/calculadora_eletrodomesticos", {
    potencia,
    horas_uso,
    dias_uso,
    valor_kwh,
  });
}

// ------------------------------------------------------------
// 8) Combustível (consumo de viagem)
// ------------------------------------------------------------
async function calcularCombustivel({
  distancia,
  consumo_medio_kml,
  valor_combustivel,
}) {
  return chamarAPI("/calculadora_combustivel", {
    distancia,
    consumo_medio_kml,
    valor_combustivel,
  });
}

// ------------------------------------------------------------
// 9) Autônomos (precificação de serviços)
// ------------------------------------------------------------
async function calcularAutonomos({
  custos_operacionais,
  horas_trabalho,
  valor_hora,
  margem_lucro,
  taxa_maquininha = null,
  deslocamento = null,
  custo_insumos = null,
}) {
  return chamarAPI("/calculadora_autonomos", {
    custos_operacionais,
    horas_trabalho,
    valor_hora,
    margem_lucro,
    taxa_maquininha,
    deslocamento,
    custo_insumos,
  });
}

// ------------------------------------------------------------
// 10) Álcool ou Gasolina
// ------------------------------------------------------------
async function calcularAlcoolGasolina(valor_alcool, valor_gasolina) {
  return chamarAPI("/calculadora_alcool_gasolina", {
    valor_alcool,
    valor_gasolina,
  });
}

// ============================================================
// Exemplos de uso (descomente para testar no console/navegador)
// ============================================================

// calcularRegraTres(2, 4, 10)
//   .then((res) => console.log("Regra de 3:", res))
//   .catch((err) => alert(err.message));

// calcularMotorista({
//   distancia: 120,
//   ganhos: 250,
//   consumo_veiculo: 12,
//   valor_combustivel: 5.9,
//   alimentacao: 20,
//   cafe: 10,
// })
//   .then((res) => console.log("Motorista:", res))
//   .catch((err) => alert(err.message));

// calcularMedia({
//   prova_parcial: 7,
//   prova_global: 8,
//   trabalhos: [1, 1.5],
//   pontos_extras: [0.5],
// })
//   .then((res) => console.log("Média:", res))
//   .catch((err) => alert(err.message));

// calcularJurosCompostos({
//   valor_inicial: 1000,
//   aporte_mensal: 200,
//   taxa_juros: 12,
//   periodo_anos: 5,
// })
//   .then((res) => console.log("Juros compostos:", res))
//   .catch((err) => alert(err.message));

// calcularGastos(3000, 1500)
//   .then((res) => console.log("Orçamento 50/30/20:", res))
//   .catch((err) => alert(err.message));

// calcularFinanciamento({
//   valor: 30000,
//   taxa_juros: 1.5,
//   ano: 4,
//   valor_entrada: 5000,
// })
//   .then((res) => console.log("Financiamento:", res))
//   .catch((err) => alert(err.message));

// calcularEletrodomesticos({
//   potencia: 1500,
//   horas_uso: 2.5,
//   dias_uso: 30,
//   valor_kwh: 0.75,
// })
//   .then((res) => console.log("Eletrodomésticos:", res))
//   .catch((err) => alert(err.message));

// calcularCombustivel({
//   distancia: 300,
//   consumo_medio_kml: 12,
//   valor_combustivel: 5.9,
// })
//   .then((res) => console.log("Combustível:", res))
//   .catch((err) => alert(err.message));

// calcularAutonomos({
//   custos_operacionais: [100, 50],
//   horas_trabalho: 8,
//   valor_hora: 30,
//   margem_lucro: 20,
//   taxa_maquininha: 3,
//   deslocamento: [15],
//   custo_insumos: [40],
// })
//   .then((res) => console.log("Autônomos:", res))
//   .catch((err) => alert(err.message));

// calcularAlcoolGasolina(4.5, 6.2)
//   .then((res) => console.log("Álcool x Gasolina:", res))
//   .catch((err) => alert(err.message));

// Se estiver usando módulos ES (import/export), descomente abaixo:
// export {
//   API_BASE_URL,
//   chamarAPI,
//   calcularRegraTres,
//   calcularMotorista,
//   calcularMedia,
//   calcularJurosCompostos,
//   calcularGastos,
//   calcularFinanciamento,
//   calcularEletrodomesticos,
//   calcularCombustivel,
//   calcularAutonomos,
//   calcularAlcoolGasolina,
// };
