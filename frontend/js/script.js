// Função genérica para enviar requisições POST para a API
async function enviarRequisicao(endpoint, dados) {
    // Substitua pela URL real do seu Render se não estiver usando variável de ambiente
    const API_URL = "https://calculadora-inteligente-api.onrender.com"; 

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dados)
        });

        const resultadoJson = await response.json();

        if (!response.ok) {
            throw new Error(resultadoJson.detail || "Erro ao processar o cálculo.");
        }

        return resultadoJson.resultado;
    } catch (error) {
        console.error("Erro na API:", error);
        alert("Erro: " + error.message);
        return null;
    }
}

// 1. Regra de Três
async function calcularRegraTres() {
    const dados = {
        valor1: parseFloat(document.getElementById("r3-v1").value),
        valor2: parseFloat(document.getElementById("r3-v2").value),
        valor3: parseFloat(document.getElementById("r3-v3").value)
    };

    const res = await enviarRequisicao("/calculadora_regra_tres", dados);
    if (res) {
        document.getElementById("r3-val").innerText = res.valor_encontrada;
    }
}

// 2. Álcool ou Gasolina
async function calcularAlcoolGasolina() {
    const dados = {
        valor_alcool: parseFloat(document.getElementById("ag-alcool").value),
        valor_gasolina: parseFloat(document.getElementById("ag-gasolina").value)
    };

    const res = await enviarRequisicao("/calculadora_alcool_gasolina", dados);
    if (res) {
        document.getElementById("ag-val").innerText = `Melhor opção: ${res.melhor_opcao} (${res.resultado}%)`;
    }
}

// 3. Média Escolar
async function calcularMediaEscolar() {
    const trabalhosInput = document.getElementById("med-trabalhos").value;
    const pontosInput = document.getElementById("med-pontos").value;

    const dados = {
        prova_parcial: parseFloat(document.getElementById("med-parcial").value),
        prova_global: parseFloat(document.getElementById("med-global").value),
        trabalhos: trabalhosInput ? trabalhosInput.split(',').map(Number) : [],
        pontos_extras: pontosInput ? pontosInput.split(',').map(Number) : []
    };

    const res = await enviarRequisicao("/calculadora_media", dados);
    if (res) {
        document.getElementById("med-val").innerText = `Nota Final: ${res.nota_final} - ${res.situacao}`;
    }
}

// 4. Juros Compostos
async function calcularJurosCompostos() {
    const dados = {
        valor_inicial: parseFloat(document.getElementById("jc-inicial").value),
        aporte_mensal: parseFloat(document.getElementById("jc-aporte").value),
        taxa_juros: parseFloat(document.getElementById("jc-taxa").value),
        periodo_anos: parseInt(document.getElementById("jc-periodo").value)
    };

    const res = await enviarRequisicao("/calculadora_juros_compostos", dados);
    if (res) {
        document.getElementById("jc-val").innerText = `Montante Final: R$ ${res.montante_final} | Juros: R$ ${res.juros_ganhos}`;
    }
}

// 5. Orçamento 50/30/20 (Gastos)
async function calcularGastos() {
    const dados = {
        salario_liquido: parseFloat(document.getElementById("gas-salario").value),
        gastos_essenciais: parseFloat(document.getElementById("gas-essenciais").value)
    };

    const res = await enviarRequisicao("/calculadora_gastos", dados);
    if (res) {
        let status = res.porcentagem_dentro_limite ? "Dentro do limite de 50%!" : "Acima do limite de 50%!";
        document.getElementById("gas-val").innerText = `Gastos essenciais: ${res.gastos_essenciais_percentual}% (${status})`;
    }
}

// 6. Financiamento
async function calcularFinanciamento() {
    const dados = {
        valor: parseFloat(document.getElementById("fin-valor").value),
        taxa_juros: parseFloat(document.getElementById("fin-taxa").value),
        ano: parseInt(document.getElementById("fin-anos").value),
        valor_entrada: parseFloat(document.getElementById("fin-entrada").value) || 0
    };

    const res = await enviarRequisicao("/calculadora_financiamento", dados);
    if (res) {
        document.getElementById("fin-val").innerText = `Parcela Mensal: R$ ${res["Parcela mensal"]} | Total: R$ ${res["Valor total"]}`;
    }
}

// 7. Eletrodomésticos
async function calcularEletrodomesticos() {
    const dados = {
        potencia: parseInt(document.getElementById("el-potencia").value),
        horas_uso: parseFloat(document.getElementById("el-horas").value),
        dias_uso: parseInt(document.getElementById("el-dias").value),
        valor_kwh: parseFloat(document.getElementById("el-tarifa").value)
    };

    const res = await enviarRequisicao("/calculadora_eletrodomesticos", dados);
    if (res) {
        document.getElementById("el-val").innerText = `Custo: R$ ${res["custo_total_R$"]} (${res.consumo_energia_kwh} kWh)`;
    }
}

// 8. Combustível Viagem
async function calcularCombustivel() {
    const dados = {
        distancia: parseFloat(document.getElementById("comb-distancia").value),
        consumo_medio_kml: parseFloat(document.getElementById("comb-consumo").value),
        valor_combustivel: parseFloat(document.getElementById("comb-valor").value)
    };

    const res = await enviar_requisicao_generica = await enviarRequisicao("/calculadora_combustivel", dados);
    if (res) {
        document.getElementById("comb-val").innerText = `Custo Total: R$ ${res.custo_total} (${res.combustivel_necessario} L)`;
    }
}

// 9. Motorista App
async function calcularMotorista() {
    const dados = {
        distancia: parseFloat(document.getElementById("mot-distancia").value),
        ganhos: parseFloat(document.getElementById("mot-ganhos").value),
        consumo_veiculo: parseFloat(document.getElementById("mot-consumo").value),
        valor_combustivel: parseFloat(document.getElementById("mot-combustivel").value),
        alimentacao: parseFloat(document.getElementById("mot-alimentacao").value) || 0,
        cafe: parseFloat(document.getElementById("mot-cafe").value) || 0,
        outros_gastos: parseFloat(document.getElementById("mot-outros").value) || 0
    };

    // Note que a rota do motorista retorna um objeto contendo { resultado, desempenho }
    const API_URL = "https://calculadora-inteligente-api.onrender.com";
    try {
        const response = await fetch(`${API_URL}/calculadora_motorista`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });
        const json = await response.json();
        if (response.ok) {
            document.getElementById("mot-val").innerText = `Lucro: R$ ${json.resultado.lucro_liquido} - ${json.desempenho}`;
        } else {
            alert(json.detail || "Erro");
        }
    } catch (e) {
        console.error(e);
    }
}

// 10. Autônomos / Precificação
async function calcularAutonomos() {
    const opInput = document.getElementById("aut-operacionais").value;
    const descInput = document.getElementById("aut-deslocamento").value;
    const insInput = document.getElementById("aut-insumos").value;

    const dados = {
        custos_operacionais: opInput ? opInput.split(',').map(Number) : [0],
        horas_trabalho: parseFloat(document.getElementById("aut-horas").value),
        valor_hora: parseFloat(document.getElementById("aut-valor-hora").value),
        margem_lucro: parseFloat(document.getElementById("aut-margem").value),
        taxa_maquininha: parseFloat(document.getElementById("aut-maquininha").value) || 0,
        deslocamento: descInput ? descInput.split(',').map(Number) : [0],
        custo_insumos: insInput ? insInput.split(',').map(Number) : [0]
    };

    const res = await enviarRequisicao("/calculadora_autonomos", dados);
    if (res) {
        document.getElementById("aut-val").innerText = `Preço Sugerido: R$ ${res["preco_sugerido_R$"]} | Lucro: R$ ${res["lucro_R$"]}`;
    }
}
