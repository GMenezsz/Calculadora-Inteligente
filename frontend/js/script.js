/* =========================================================
   CONFIGURAÇÃO CENTRAL DA API
========================================================= */
const API_BASE_URL = 'https://calculadora-inteligente-api.onrender.com';

/* =========================================================
   FUNÇÕES AUXILIARES DE FORMATAÇÃO E PARSE
========================================================= */
function parseBrazilianNumber(value) {
    if (typeof value === 'number') return value;
    if (!value || typeof value !== 'string') return 0;
    
    let cleanVal = value.replace(/R\$|\s/g, '');
    if (cleanVal.includes(',') && cleanVal.includes('.')) {
        cleanVal = cleanVal.replace(/\./g, '').replace(',', '.');
    } else if (cleanVal.includes(',')) {
        cleanVal = cleanVal.replace(',', '.');
    }
    
    const parsed = parseFloat(cleanVal);
    return isNaN(parsed) ? 0 : parsed;
}

function formatCurrencyBRL(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function formatNumberBR(value, decimals = 2) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/* =========================================================
   GERENCIAMENTO DE VIEWS E NAVEGAÇÃO
========================================================= */
function navigateTo(viewId) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }
    
    document.querySelectorAll('.sidebar-sublist a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-target') === viewId) {
            link.classList.add('active');
        }
    });
}

/* =========================================================
   MENU LATERAL (Abrir/Fechar Categorias)
========================================================= */
function setupSidebar() {
    document.querySelectorAll('.sidebar-category-header').forEach(header => {
        header.addEventListener('click', () => {
            const category = header.parentElement;
            category.classList.toggle('closed');
        });
    });
}

/* =========================================================
   CONSUMO DA API E REQUISIÇÕES (RETORNADO PARA JSON BODY)
========================================================= */
async function callApi(endpoint, payload, resultElementId, successCallback) {
    const btn = document.activeElement && document.activeElement.tagName === 'BUTTON' ? document.activeElement : null;
    let originalText = '';
    if (btn) {
        originalText = btn.innerText;
        btn.innerText = 'Acordando servidor... (aguarde)';
        btn.disabled = true;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            const errorDetail = data.detail || data.message || 'Erro ao processar o cálculo.';
            throw new Error(typeof errorDetail === 'object' ? JSON.stringify(errorDetail, null, 2) : errorDetail);
        }

        if (successCallback) {
            successCallback(data);
        }

    } catch (error) {
        let errorMsg = 'Erro de conexão com a API. O servidor no Render pode estar iniciando ou bloqueou a requisição.';
        if (typeof error === 'string') {
            errorMsg = error;
        } else if (error && error.message) {
            errorMsg = error.message;
        } else if (error) {
            errorMsg = JSON.stringify(error);
        }
        alert(errorMsg);
    } finally {
        if (btn) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}

/* =========================================================
   CONFIGURAÇÃO DAS CALCULADORAS
========================================================= */

// 1. Regra de Três
function calcularRegraTres() {
    const valor1 = parseBrazilianNumber(document.getElementById('rt-v1').value);
    const valor2 = parseBrazilianNumber(document.getElementById('rt-v2').value);
    const valor3 = parseBrazilianNumber(document.getElementById('rt-v3').value);

    callApi('/calculadora_regra_tres', { valor1, valor2, valor3 }, null, data => {
        const resBox = document.getElementById('rt-result');
        const resVal = document.getElementById('rt-val');
        resBox.classList.add('active', 'success');
        resVal.innerText = `X = ${formatNumberBR(data.resultado, 4)}`;
    });
}

// 2. Média
function calcularMedia() {
    const prova_parcial = parseBrazilianNumber(document.getElementById('med-parcial').value);
    const prova_global = parseBrazilianNumber(document.getElementById('med-global').value);
    
    const trabalhosRaw = document.getElementById('med-trabalhos').value;
    const trabalhos = trabalhosRaw ? trabalhosRaw.split(',').map(v => parseBrazilianNumber(v.trim())) : null;

    const extrasRaw = document.getElementById('med-extras').value;
    const pontos_extras = extrasRaw ? extrasRaw.split(',').map(v => parseBrazilianNumber(v.trim())) : null;

    callApi('/calculadora_media', { prova_parcial, prova_global, trabalhos, pontos_extras }, null, data => {
        const resBox = document.getElementById('med-result');
        const resVal = document.getElementById('med-val');
        const resExp = document.getElementById('med-exp');

        resBox.classList.add('active');
        resVal.innerText = `Média / Pontos: ${formatNumberBR(data.resultado, 2)}`;
        resExp.innerText = data.mensagem || 'Resultado calculado com sucesso.';

        if (data.resultado < 60) {
            resBox.classList.add('danger');
            resBox.classList.remove('success');
        } else {
            resBox.classList.add('success');
            resBox.classList.remove('danger');
        }
    });
}

// 3. Combustível
function calcularCombustivel() {
    const distancia = parseBrazilianNumber(document.getElementById('comb-dist').value);
    const consumo_medio_kml = parseBrazilianNumber(document.getElementById('comb-consumo').value);
    const valor_combustivel = parseBrazilianNumber(document.getElementById('comb-valor').value);

    callApi('/calculadora_combustivel', { distancia, consumo_medio_kml, valor_combustivel }, null, data => {
        const resBox = document.getElementById('comb-result');
        const resVal = document.getElementById('comb-val');
        const resExp = document.getElementById('comb-exp');

        resBox.classList.add('active', 'success');
        resVal.innerText = `Custo Estimado: ${formatCurrencyBRL(data.resultado)}`;
        resExp.innerText = `Viagem estimada de ${distancia} km com consumo de ${consumo_medio_kml} km/l.`;
    });
}

// 4. Motorista Autônomo
function calcularMotorista() {
    const distancia = parseBrazilianNumber(document.getElementById('mot-dist').value);
    const ganhos = parseBrazilianNumber(document.getElementById('mot-ganhos').value);
    const consumo_veiculo = parseBrazilianNumber(document.getElementById('mot-consumo').value);
    const valor_combustivel = parseBrazilianNumber(document.getElementById('mot-valor').value);
    
    const alimentacaoVal = document.getElementById('mot-alim').value;
    const alimentacao = alimentacaoVal ? parseBrazilianNumber(alimentacaoVal) : null;

    const cafeVal = document.getElementById('mot-cafe').value;
    const cafe = cafeVal ? parseBrazilianNumber(cafeVal) : null;

    const outrosVal = document.getElementById('mot-outros').value;
    const outros_gastos = outrosVal ? parseBrazilianNumber(outrosVal) : null;

    callApi('/calculadora_motorista', {
        distancia, ganhos, consumo_veiculo, valor_combustivel, alimentacao, cafe, outros_gastos
    }, null, data => {
        const resBox = document.getElementById('mot-result');
        const resVal = document.getElementById('mot-val');
        const resExp = document.getElementById('mot-exp');

        resBox.classList.add('active', 'success');
        resVal.innerText = `Lucro Líquido: ${formatCurrencyBRL(data.resultado)}`;
        resExp.innerText = `Desempenho: ${data.desempenho || 'Análise concluída com sucesso.'}`;
    });
}

// 5. Álcool ou Gasolina
function calcularAlcoolGasolina() {
    const valor_alcool = parseBrazilianNumber(document.getElementById('alg-alcool').value);
    const valor_gasolina = parseBrazilianNumber(document.getElementById('alg-gasolina').value);

    callApi('/calculadora_alcool_gasolina', { valor_alcool, valor_gasolina }, null, data => {
        const resBox = document.getElementById('alg-result');
        const resVal = document.getElementById('alg-val');

        resBox.classList.add('active', 'success');
        resVal.innerText = data.resultado || 'Análise concluída.';
    });
}

// 6. Gastos (50/30/20)
function calcularGastos() {
    const salario_liquido = parseBrazilianNumber(document.getElementById('gas-salario').value);
    const gastos_essenciais = parseBrazilianNumber(document.getElementById('gas-essenciais').value);

    callApi('/calculadora_gastos', { salario_liquido, gastos_essenciais }, null, data => {
        const resBox = document.getElementById('gas-result');
        const resVal = document.getElementById('gas-val');
        const resExp = document.getElementById('gas-exp');

        resBox.classList.add('active', 'success');
        resVal.innerText = `Orçamento Analisado`;
        resExp.innerText = data.mensagem || data.resultado || JSON.stringify(data, null, 2);
    });
}

// 7. Financiamento
function calcularFinanciamento() {
    const valor = parseBrazilianNumber(document.getElementById('fin-valor').value);
    const taxa_juros = parseBrazilianNumber(document.getElementById('fin-juros').value);
    const ano = parseInt(document.getElementById('fin-ano').value) || 1;
    const valEntrada = document.getElementById('fin-entrada').value;
    const valor_entrada = valEntrada ? parseBrazilianNumber(valEntrada) : 0;

    callApi('/calculadora_financiamento', { valor, taxa_juros, ano, valor_entrada }, null, data => {
        const resBox = document.getElementById('fin-result');
        const resVal = document.getElementById('fin-val');

        resBox.classList.add('active', 'success');
        const valorFinal = data.resultado || data.prestacao_mensal || data.valor || 0;
        resVal.innerText = `Prestação Mensal: ${formatCurrencyBRL(valorFinal)}`;
    });
}

// 8. Juros Compostos
function calcularJurosCompostos() {
    const valor_inicial = parseBrazilianNumber(document.getElementById('jc-inicial').value);
    const aporte_mensal = parseBrazilianNumber(document.getElementById('jc-aporte').value);
    const taxa_juros = parseBrazilianNumber(document.getElementById('jc-taxa').value);
    const periodo_anos = parseInt(document.getElementById('jc-periodo').value) || 1;

    callApi('/calculadora_juros_compostos', { valor_inicial, aporte_mensal, taxa_juros, periodo_anos }, null, data => {
        const resBox = document.getElementById('jc-result');
        const resVal = document.getElementById('jc-val');

        resBox.classList.add('active', 'success');
        const montanteFinal = data.resultado || data.montante_final || data.valor || 0;
        resVal.innerText = `Montante Final: ${formatCurrencyBRL(montanteFinal)}`;
    });
}

// 9. Eletrodomésticos
function calcularEletrodomesticos() {
    const potencia = parseInt(document.getElementById('el-potencia').value) || 0;
    const horas_uso = parseBrazilianNumber(document.getElementById('el-horas').value);
    const dias_uso = parseInt(document.getElementById('el-dias').value) || 1;
    const valor_kwh = parseBrazilianNumber(document.getElementById('el-kwh').value);

    callApi('/calculadora_eletrodomesticos', { potencia, horas_uso, dias_uso, valor_kwh }, null, data => {
        const resBox = document.getElementById('el-result');
        const resVal = document.getElementById('el-val');

        resBox.classList.add('active', 'success');
        resVal.innerText = `Custo Estimado: ${formatCurrencyBRL(data.resultado)}`;
    });
}

// 10. Autônomos
function calcularAutonomos() {
    const custos_operacionais = [parseBrazilianNumber(document.getElementById('aut-custos').value)];
    const horas_trabalho = parseBrazilianNumber(document.getElementById('aut-horas').value);
    const valor_hora = parseBrazilianNumber(document.getElementById('aut-valorhora').value);
    const margem_lucro = parseBrazilianNumber(document.getElementById('aut-margem').value);
    const taxa_maquininha = parseBrazilianNumber(document.getElementById('aut-taxamaq').value);

    callApi('/calculadora_autonomos', {
        custos_operacionais, horas_trabalho, valor_hora, margem_lucro, taxa_maquininha
    }, null, data => {
        const resBox = document.getElementById('aut-result');
        const resVal = document.getElementById('aut-val');

        resBox.classList.add('active', 'success');
        const valorHoraFinal = data.resultado || data.valor_hora_sugerido || data.valor || 0;
        resVal.innerText = `Valor Hora Sugerido: ${formatCurrencyBRL(valorHoraFinal)}`;
    });
}

/* =========================================================
   PWA INSTALL HANDLER
========================================================= */
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('pwa-btn');
    if (btn) btn.style.display = 'block';
});

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Usuário aceitou a instalação do PWA');
            }
            deferredPrompt = null;
        });
    } else {
        alert('O aplicativo já está instalado ou seu navegador não suporta instalação direta.');
    }
}

/* =========================================================
   INICIALIZAÇÃO DO EVENT LISTENER
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    setupSidebar();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Service Worker registrado com sucesso.'))
            .catch(err => console.log('Erro ao registrar Service Worker:', err));
    }
});
