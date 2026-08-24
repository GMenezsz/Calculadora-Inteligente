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

// Função robusta para tratar o formato brasileiro (pontos de milhar e vírgula decimal)
function parseValor(valorStr) {
    if (!valorStr) return NaN;
    let str = valorStr.toString().trim();
    
    // Remove pontos de milhar e troca vírgula por ponto decimal
    str = str.replace(/\./g, '').replace(',', '.');
    
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
                    </div>
                `;
            } else {
                statusCardHtml = `
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <strong>Situação Acadêmica</strong>
                        <div style="font-size: 1.2em; color: #e74c3c; font-weight: bold;">Aluno reprovado com a nota de ${res.nota_final.toFixed(2)}.</div>
                    </div>
                `;
            }

            box.innerHTML = `
                <div style="display: grid; gap: 12px; margin-top: 15px;">
                    ${statusCardHtml}
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1;">
                        <strong>Nota Final:</strong> <span style="font-size: 1.2em; color: #2c3e50; font-weight: bold;">${res.nota_final.toFixed(2)}</span>
                    </div>
                </div>
            `;
        } else {
            const mensagemErro = typeof data.detail === 'object' ? JSON.stringify(data.detail) : (data.detail || 'Valores inválidos');
            box.innerHTML = `<span style="color: red;">Erro: ${mensagemErro}</span>`;
        }
    } catch (error) {
        box.innerHTML = `<span style="color: red;">Erro ao conectar com a API!</span>`;
    }
});

// 2. Calculadora de Financiamento
document.getElementById('form-financiamento').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const valor = parseValor(document.getElementById('fin-valor').value);
    const taxa_juros = parseValor(document.getElementById('fin-juros').value);
    const ano = parseValor(document.getElementById('fin-ano').value);
    const valor_entrada = parseValor(document.getElementById('fin-entrada').value) || 0;

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
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1;">
                        <strong>Valor da Parcela Mensal</strong>
                        <div style="font-size: 1.3em; color: #2c3e50; font-weight: bold;">R$ ${r["Parcela mensal"].toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    </div>
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1;">
                        <strong>Valor Total do Financiamento</strong>
                        <div style="font-size: 1.3em; color: #2980b9; font-weight: bold;">R$ ${r["Valor total"].toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    </div>
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1;">
                        <strong>Valor Total só de Juros</strong>
                        <div style="font-size: 1.3em; color: #e74c3c; font-weight: bold;">R$ ${r["Valor total de juros"].toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    </div>
                </div>
            `;
        } else {
            const mensagemErro = typeof data.detail === 'object' ? JSON.stringify(data.detail) : (data.detail || 'Valores inválidos');
            box.innerHTML = `<span style="color: red;">Erro: ${mensagemErro}</span>`;
        }
    } catch (error) {
        box.innerHTML = `<span style="color: red;">Erro ao conectar com a API!</span>`;
    }
});

// 3. Calculadora de Gastos (Alinhada com a sua API e IDs do HTML)
document.getElementById('form-gastos').addEventListener('submit', async (e) => {
    e.preventDefault();

    const salario_liquido = parseValor(document.getElementById('gastos-salario').value);
    const gastos_essenciais = parseValor(document.getElementById('gastos-essenciais').value);

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

            box.innerHTML = `
                <div style="display: grid; gap: 12px; margin-top: 15px;">
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1;">
                        <strong>Salário Líquido</strong>
                        <div style="font-size: 1.3em; color: #2c3e50; font-weight: bold;">R$ ${r.salario_liquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    </div>
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1;">
                        <strong>Gastos Mensais (50%)</strong>
                        <div style="font-size: 1.3em; color: #2c3e50; font-weight: bold;">R$ ${r.gastos_essenciais_valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <div style="font-size: 1.1em; color: ${passouDos50 ? '#e74c3c' : '#27ae60'}; font-weight: bold; margin-top: 4px;">${r.gastos_essenciais_percentual.toFixed(2)}%</div>
                    </div>
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1;">
                        <strong>Separar para Lazer (30%)</strong>
                        <div style="font-size: 1.3em; color: #2980b9; font-weight: bold;">R$ ${r.valor_lazer_30.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    </div>
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e1e1e1;">
                        <strong>Reserva de Emergência (20%)</strong>
                        <div style="font-size: 1.3em; color: #8e44ad; font-weight: bold;">R$ ${r.valor_guardar_20.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    </div>
                </div>
            `;
        } else {
            const mensagemErro = typeof data.detail === 'object' ? JSON.stringify(data.detail) : (data.detail || 'Valores inválidos');
            box.innerHTML = `<span style="color: red;">Erro: ${mensagemErro}</span>`;
        }
    } catch (error) {
        box.innerHTML = `<span style="color: red;">Erro ao conectar com a API!</span>`;
    }
});
