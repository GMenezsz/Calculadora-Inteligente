const API_URL = "https://calculadora-inteligente-api.onrender.com";

// Alternar entre abas do menu lateral
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.calc-section');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(item => item.classList.remove('active'));
        sections.forEach(sec => sec.classList.remove('active'));

        link.classList.add('active');
        const target = document.getElementById(link.getAttribute('data-target'));
        target.classList.add('active');
    });
});

// Função segura para tratar pontos de milhar e vírgulas decimais
function parseValor(valorStr) {
    if (!valorStr) return NaN;
    let str = valorStr.toString().trim();
    
    if (str.includes('.') && str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes('.')) {
        const partes = str.split('.');
        if (partes.length > 2 || (partes.length === 2 && partes[1].length === 3 && partes[0].length <= 3)) {
            str = str.replace(/\./g, '');
        }
    } else if (str.includes(',')) {
        str = str.replace(',', '.');
    }
    
    return parseFloat(str);
}

function parseList(text) {
    if (!text || !text.trim()) return null;
    return text.split(',').map(item => parseValor(item)).filter(item => !isNaN(item));
}

// 1. Calculadora de Média
document.getElementById('form-media').addEventListener('submit', async (e) => {
    e.preventDefault();
    const prova_parcial = parseValor(document.getElementById('media-parcial').value);
    const prova_global = parseValor(document.getElementById('media-global').value);
    const trabalhos = parseList(document.getElementById('media-trabalhos').value);
    const pontos_extras = parseList(document.getElementById('media-extras').value);

    const box = document.getElementById('resultado-media');
    box.classList.remove('hidden');

    if (isNaN(prova_parcial) || isNaN(prova_global)) {
        box.innerHTML = `<span style="color: red;">Erro: Digite apenas números válidos nas provas.</span>`;
        return;
    }

    const url = `${API_URL}/calculadora_media?prova_parcial=${prova_parcial}&prova_global=${prova_global}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trabalhos, pontos_extras })
        });
        
        const data = await response.json();

        if (response.ok) {
            const res = data.resultado;
            
            let statusCardHtml = "";
            if (res.aprovado) {
                statusCardHtml = `
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Situação Acadêmica</strong>
                        <div style="font-size: 1.2em; color: #27ae60; font-weight: bold;">Aluno aprovado com a nota de ${res.nota_final.toFixed(2)}.</div>
                        <small style="color: #666; display: block; margin-top: 5px;">A nota final atingiu o critério mínimo necessário para aprovação.</small>
                    </div>
                `;
            } else {
                statusCardHtml = `
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Situação Acadêmica</strong>
                        <div style="font-size: 1.2em; color: #e74c3c; font-weight: bold;">Aluno reprovado com a nota de ${res.nota_final.toFixed(2)}.</div>
                        <small style="color: #666; display: block; margin-top: 5px;">A nota final ficou abaixo da média mínima exigida.</small>
                    </div>
                `;
            }

            box.innerHTML = `
                <div style="display: grid; gap: 12px; margin-top: 15px;">
                    ${statusCardHtml}

                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Prova Parcial</strong>
                        <div style="font-size: 1.2em; color: #2c3e50; font-weight: bold;">${res.prova_parcial.toFixed(2)}</div>
                        <small style="color: #666; display: block; margin-top: 5px;">Nota obtida na avaliação parcial do período.</small>
                    </div>

                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Prova Global</strong>
                        <div style="font-size: 1.2em; color: #2c3e50; font-weight: bold;">${res.prova_global.toFixed(2)}</div>
                        <small style="color: #666; display: block; margin-top: 5px;">Nota obtida na avaliação global/final.</small>
                    </div>

                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Total de Trabalhos</strong>
                        <div style="font-size: 1.2em; color: #2980b9; font-weight: bold;">${res.total_trabalhos_somado.toFixed(2)}</div>
                        <small style="color: #666; display: block; margin-top: 5px;">Soma dos pontos obtidos através dos trabalhos entregues.</small>
                    </div>

                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Pontos Extras</strong>
                        <div style="font-size: 1.2em; color: #8e44ad; font-weight: bold;">${res.total_pontos_extras.toFixed(2)}</div>
                        <small style="color: #666; display: block; margin-top: 5px;">Pontuação adicional acumulada por atividades extras.</small>
                    </div>
                </div>
            `;
        } else {
            const mensagemErro = typeof data.detail === 'object' ? JSON.stringify(data.detail) : (data.detail || 'Valores inválidos');
            box.innerHTML = `<span style="color: red;">Erro: ${mensagemErro}</span>`;
        }
    } catch (error) {
        console.error("Detalhe do erro de conexão:", error);
        box.innerHTML = `<span style="color: red;">Erro ao conectar com a API! (Verifique se o servidor no Render acordou ou se há bloqueio de CORS).</span>`;
    }
});

// 2. Calculadora de Financiamento
document.getElementById('form-financiamento').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const elValor = document.getElementById('fin-valor') || document.getElementById('valor');
    const elJuros = document.getElementById('fin-juros') || document.getElementById('taxa_juros');
    const elAno = document.getElementById('fin-ano') || document.getElementById('ano') || document.getElementById('prazo');
    const elEntrada = document.getElementById('fin-entrada') || document.getElementById('valor_entrada');

    const valor = parseValor(elValor ? elValor.value : '');
    const taxa_juros = parseValor(elJuros ? elJuros.value : '');
    const ano = parseValor(elAno ? elAno.value : '');
    const valor_entrada = parseValor(elEntrada ? elEntrada.value : '0') || 0;

    const box = document.getElementById('resultado-financiamento');
    box.classList.remove('hidden');

    if (isNaN(valor) || isNaN(taxa_juros) || isNaN(ano)) {
        box.innerHTML = `<span style="color: red;">Erro: Preencha todos os campos obrigatórios com números válidos.</span>`;
        return;
    }

    const url = `${API_URL}/Calculadora_financiamento?valor=${valor}&taxa_juros=${taxa_juros}&ano=${ano}&valor_entrada=${valor_entrada}`;

    try {
        const response = await fetch(url, { method: 'POST' });
        const data = await response.json();

        if (response.ok) {
            const r = data.resultado;
            box.innerHTML = `
                <div style="display: grid; gap: 12px; margin-top: 15px;">
                    
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Valor da Parcela Mensal</strong>
                        <div style="font-size: 1.3em; color: #2c3e50; font-weight: bold;">R$ ${r["Parcela mensal"].toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <small style="color: #666; display: block; margin-top: 5px;">Quantia fixa a ser paga todos os meses durante o prazo do financiamento.</small>
                    </div>

                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Valor de Entrada</strong>
                        <div style="font-size: 1.3em; color: #27ae60; font-weight: bold;">R$ ${r["Valor entrada"].toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <small style="color: #666; display: block; margin-top: 5px;">Quantia paga à vista no momento inicial da contratação.</small>
                    </div>

                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Valor Total do Financiamento</strong>
                        <div style="font-size: 1.3em; color: #2980b9; font-weight: bold;">R$ ${r["Valor total"].toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <small style="color: #666; display: block; margin-top: 5px;">Soma total de todos os pagamentos realizados ao longo do contrato.</small>
                    </div>

                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Valor Total só de Juros</strong>
                        <div style="font-size: 1.3em; color: #e74c3c; font-weight: bold;">R$ ${r["Valor total de juros"].toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <small style="color: #666; display: block; margin-top: 5px;">O custo adicional pago em juros acumulados sobre o valor emprestado.</small>
                    </div>

                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Prazo em Meses</strong>
                        <div style="font-size: 1.3em; color: #8e44ad; font-weight: bold;">${r["Prazo em meses"]} meses</div>
                        <small style="color: #666; display: block; margin-top: 5px;">Duração total da vigência do contrato de financiamento.</small>
                    </div>

                </div>
            `;
        } else {
            const mensagemErro = typeof data.detail === 'object' ? JSON.stringify(data.detail) : (data.detail || 'Valores inválidos');
            box.innerHTML = `<span style="color: red;">Erro: ${mensagemErro}</span>`;
        }
    } catch (error) {
        console.error("Detalhe do erro de conexão:", error);
        box.innerHTML = `<span style="color: red;">Erro ao conectar com a API! (Verifique se o servidor no Render acordou ou se há bloqueio de CORS).</span>`;
    }
});

// 3. Calculadora de Gastos
document.getElementById('form-gastos').addEventListener('submit', async (e) => {
    e.preventDefault();

    const elSalario = document.getElementById('gastos-salario') || document.getElementById('salario_liquido');
    const elGastos = document.getElementById('gastos-essenciais') || document.getElementById('gastos_essenciais');

    const salario_liquido = parseValor(elSalario ? elSalario.value : '');
    const gastos_essenciais = parseValor(elGastos ? elGastos.value : '');

    const box = document.getElementById('resultado-gastos');
    box.classList.remove('hidden');

    if (isNaN(salario_liquido) || isNaN(gastos_essenciais)) {
        box.innerHTML = `<span style="color: red;">Erro: Digite valores válidos para o salário e gastos essenciais.</span>`;
        return;
    }

    const url = `${API_URL}/calculadora_gastos?salario_liquido=${salario_liquido}&gastos_essenciais=${gastos_essenciais}`;

    try {
        const response = await fetch(url, { method: 'POST' });
        const data = await response.json();

        if (response.ok) {
            const r = data.resultado;
            const passouDos50 = r.gastos_essenciais_percentual > 50;

            let contentLazer = "";
            let contentReserva = "";
            let msgFixos = "Porcentagem do seu salário comprometida com necessidades básicas e obrigações mensais.";

            if (passouDos50) {
                msgFixos = "Atenção: Seus gastos fixos ultrapassaram 50%. Faça um controle financeiro e quite as dívidas antes de começar a dividir para lazer e reservas.";
                
                contentLazer = `
                    <small style="color: #c0392b; display: block; margin-top: 5px; font-weight: bold;">Faça um controle financeiro e quite as dívidas antes de começar a dividir para 30% e 20%.</small>
                `;

                contentReserva = `
                    <small style="color: #c0392b; display: block; margin-top: 5px; font-weight: bold;">Faça um controle financeiro e quite as dívidas antes de começar a dividir para 30% e 20%.</small>
                `;
            } else {
                contentLazer = `
                    <div style="font-size: 1.3em; color: #2980b9; font-weight: bold;">R$ ${r.valor_lazer_30.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    <small style="color: #666; display: block; margin-top: 5px;">Com gastos fixos abaixo ou igual a 50%, você pode destinar essa quantia para lazer e estilo de vida.</small>
                `;

                contentReserva = `
                    <div style="font-size: 1.3em; color: #8e44ad; font-weight: bold;">R$ ${r.valor_guardar_20.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    <small style="color: #666; display: block; margin-top: 5px;">Com gastos fixos abaixo ou igual a 50%, mantenha esse valor guardado para construir sua reserva de emergência.</small>
                `;
            }
            
            box.innerHTML = `
                <div style="display: grid; gap: 12px; margin-top: 15px;">
                    
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Salário Líquido</strong>
                        <div style="font-size: 1.3em; color: #2c3e50; font-weight: bold;">R$ ${r.salario_liquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <small style="color: #666; display: block; margin-top: 5px;">O valor total que você recebe após os descontos básicos.</small>
                    </div>

                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Gastos Mensais (50%)</strong>
                        <div style="font-size: 1.3em; color: #2c3e50; font-weight: bold;">R$ ${r.gastos_essenciais_valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <div style="font-size: 1.1em; color: ${passouDos50 ? '#e74c3c' : '#27ae60'}; font-weight: bold; margin-top: 4px;">${r.gastos_essenciais_percentual.toFixed(2)}%</div>
                        <small style="color: ${passouDos50 ? '#c0392b' : '#666'}; display: block; margin-top: 5px; ${passouDos50 ? 'font-weight: bold;' : ''}">${msgFixos}</small>
                    </div>

                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Separar para Lazer (30%)</strong>
                        ${contentLazer}
                    </div>

                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Reserva de Emergência (20%)</strong>
                        ${contentReserva}
                    </div>

                </div>
            `;
        } else {
            const mensagemErro = typeof data.detail === 'object' ? JSON.stringify(data.detail) : (data.detail || 'Valores inválidos');
            box.innerHTML = `<span style="color: red;">Erro: ${mensagemErro}</span>`;
        }
    } catch (error) {
        console.error("Detalhe do erro de conexão:", error);
        box.innerHTML = `<span style="color: red;">Erro ao conectar com a API! (Verifique se o servidor no Render acordou ou se há bloqueio de CORS).</span>`;
    }
});
