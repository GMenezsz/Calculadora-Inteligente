// =========================================================
// script.js — Calculadora Inteligente
// Navegação SPA + Sidebar + Consumo da API de backend
// =========================================================

const API_BASE_URL = "https://calculadora-inteligente-api.onrender.com";

// ---------------------------------------------------------
// HELPERS GERAIS
// ---------------------------------------------------------

/** Chama a API via POST enviando JSON e tratando erros no padrão da API. */
async function chamarAPI(endpoint, dados) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });

    let data;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    if (!response.ok) {
        const mensagem = (data && data.detail) || `Erro ao chamar ${endpoint} (status ${response.status})`;
        throw new Error(mensagem);
    }

    return data;
}

/**
 * Converte string numérica no formato brasileiro (1.234,56 / 1234,56 / 1234.56 / "R$ 1.234,56")
 * para um Number do JS. Retorna NaN se não for possível interpretar.
 */
function parseNumeroBR(valor) {
    if (valor === null || valor === undefined) return NaN;
    let str = String(valor).trim();
    if (str === "") return NaN;

    // Remove tudo que não seja dígito, vírgula, ponto ou sinal de menos
    str = str.replace(/[^\d,.\-]/g, "");

    const temVirgula = str.includes(",");
    const temPonto = str.includes(".");

    if (temVirgula && temPonto) {
        // Formato "1.234,56" -> remove pontos (milhar) e troca vírgula por ponto (decimal)
        str = str.replace(/\./g, "").replace(",", ".");
    } else if (temVirgula) {
        // Formato "1234,56" -> troca vírgula por ponto
        str = str.replace(",", ".");
    }
    // Se só tem ponto, já está em formato válido para o JS (ex: "12.5")

    const numero = parseFloat(str);
    return numero;
}

/** Converte uma string "80, 90, 100" em uma lista de números, ignorando itens vazios. */
function parseListaBR(valor) {
    if (!valor || String(valor).trim() === "") return [];
    return String(valor)
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map((item) => parseNumeroBR(item))
        .filter((num) => !isNaN(num));
}

/** Formata um número como moeda brasileira (R$). */
function formatarBRL(valor) {
    if (typeof valor !== "number" || isNaN(valor)) return "R$ 0,00";
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Formata um número simples no padrão brasileiro (2 casas decimais). */
function formatarNumero(valor, casas = 2) {
    if (typeof valor !== "number" || isNaN(valor)) return "0";
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** Exibe o resultado (ou erro) em uma result-box padrão. */
function exibirResultado({ boxId, valId, expId = null, valorTexto, explicacaoTexto = "", tipo = "success" }) {
    const box = document.getElementById(boxId);
    const val = document.getElementById(valId);
    const exp = expId ? document.getElementById(expId) : null;

    if (!box || !val) return;

    val.textContent = valorTexto;
    if (exp) exp.textContent = explicacaoTexto;

    box.classList.remove("success", "danger");
    box.classList.add("active");
    if (tipo === "danger") {
        box.classList.add("danger");
    } else {
        box.classList.add("success");
    }
}

/** Exibe uma mensagem de erro amigável em uma result-box. */
function exibirErro(boxId, valId, expId, erro) {
    exibirResultado({
        boxId,
        valId,
        expId,
        valorTexto: "Ocorreu um erro",
        explicacaoTexto: erro && erro.message ? erro.message : "Não foi possível calcular. Verifique os valores informados.",
        tipo: "danger",
    });
}

function getValor(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
}

// ---------------------------------------------------------
// NAVEGAÇÃO (SPA)
// ---------------------------------------------------------

function navigateTo(viewId) {
    const secoes = document.querySelectorAll(".view-section");
    secoes.forEach((secao) => secao.classList.remove("active"));

    const alvo = document.getElementById(viewId);
    if (alvo) {
        alvo.classList.add("active");
    }

    // Atualiza item ativo na sidebar
    const links = document.querySelectorAll(".sidebar-sublist a");
    links.forEach((link) => {
        if (link.getAttribute("data-target") === viewId) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Toggle das categorias da sidebar (abrir/fechar)
document.addEventListener("DOMContentLoaded", () => {
    const headers = document.querySelectorAll(".sidebar-category-header");
    headers.forEach((header) => {
        header.addEventListener("click", () => {
            const categoria = header.closest(".sidebar-category");
            if (categoria) categoria.classList.toggle("closed");
        });
    });
});

// ---------------------------------------------------------
// PWA — Instalação
// ---------------------------------------------------------

let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    const btn = document.getElementById("pwa-btn");
    if (btn) btn.style.display = "inline-block";
});

function installPWA() {
    if (!deferredPrompt) {
        alert("Para instalar, use a opção 'Adicionar à tela inicial' ou 'Instalar app' do seu navegador.");
        return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(() => {
        deferredPrompt = null;
        const btn = document.getElementById("pwa-btn");
        if (btn) btn.style.display = "none";
    });
}

window.addEventListener("appinstalled", () => {
    const btn = document.getElementById("pwa-btn");
    if (btn) btn.style.display = "none";
    deferredPrompt = null;
});

// =========================================================
// 1) REGRA DE TRÊS
// =========================================================
async function calcularRegraTres() {
    const valor1 = parseNumeroBR(getValor("rt-v1"));
    const valor2 = parseNumeroBR(getValor("rt-v2"));
    const valor3 = parseNumeroBR(getValor("rt-v3"));

    if ([valor1, valor2, valor3].some((v) => isNaN(v))) {
        exibirErro("rt-result", "rt-val", null, new Error("Preencha os três campos com valores numéricos."));
        return;
    }

    try {
        const data = await chamarAPI("/calculadora_regra_tres", { valor1, valor2, valor3 });
        const x = data.resultado.valor_encontrada;
        exibirResultado({
            boxId: "rt-result",
            valId: "rt-val",
            valorTexto: `X = ${formatarNumero(x)}`,
        });
    } catch (erro) {
        exibirErro("rt-result", "rt-val", null, erro);
    }
}

// =========================================================
// 2) MÉDIA
// =========================================================
async function calcularMedia() {
    const prova_parcial = parseNumeroBR(getValor("med-parcial"));
    const prova_global = parseNumeroBR(getValor("med-global"));
    const trabalhos = parseListaBR(getValor("med-trabalhos"));
    const pontos_extras = parseListaBR(getValor("med-extras"));

    if (isNaN(prova_parcial) || isNaN(prova_global)) {
        exibirErro("med-result", "med-val", "med-exp", new Error("Preencha a prova parcial e a prova global."));
        return;
    }

    try {
        const data = await chamarAPI("/calculadora_media", {
            prova_parcial,
            prova_global,
            trabalhos: trabalhos.length ? trabalhos : null,
            pontos_extras: pontos_extras.length ? pontos_extras : null,
        });
        const r = data.resultado;
        exibirResultado({
            boxId: "med-result",
            valId: "med-val",
            expId: "med-exp",
            valorTexto: `Nota final: ${formatarNumero(r.nota_final)}`,
            explicacaoTexto: r.situacao,
            tipo: r.situacao && r.situacao.toLowerCase().includes("reprovado") ? "danger" : "success",
        });
    } catch (erro) {
        exibirErro("med-result", "med-val", "med-exp", erro);
    }
}

// =========================================================
// 3) COMBUSTÍVEL
// =========================================================
async function calcularCombustivel() {
    const distancia = parseNumeroBR(getValor("comb-dist"));
    const consumo_medio_kml = parseNumeroBR(getValor("comb-consumo"));
    const valor_combustivel = parseNumeroBR(getValor("comb-valor"));

    if ([distancia, consumo_medio_kml, valor_combustivel].some((v) => isNaN(v))) {
        exibirErro("comb-result", "comb-val", "comb-exp", new Error("Preencha todos os campos com valores válidos."));
        return;
    }

    try {
        const data = await chamarAPI("/calculadora_combustivel", {
            distancia,
            consumo_medio_kml,
            valor_combustivel,
        });
        const r = data.resultado;
        exibirResultado({
            boxId: "comb-result",
            valId: "comb-val",
            expId: "comb-exp",
            valorTexto: formatarBRL(r.custo_total),
            explicacaoTexto: `Combustível necessário: ${formatarNumero(r.combustivel_necessario)} litros`,
        });
    } catch (erro) {
        exibirErro("comb-result", "comb-val", "comb-exp", erro);
    }
}

// =========================================================
// 4) MOTORISTA AUTÔNOMO
// =========================================================
async function calcularMotorista() {
    const distancia = parseNumeroBR(getValor("mot-dist"));
    const ganhos = parseNumeroBR(getValor("mot-ganhos"));
    const consumo_veiculo = parseNumeroBR(getValor("mot-consumo"));
    const valor_combustivel = parseNumeroBR(getValor("mot-valor"));

    const alimentacaoRaw = getValor("mot-alim");
    const cafeRaw = getValor("mot-cafe");
    const outrosRaw = getValor("mot-outros");

    const alimentacao = alimentacaoRaw.trim() === "" ? null : parseNumeroBR(alimentacaoRaw);
    const cafe = cafeRaw.trim() === "" ? null : parseNumeroBR(cafeRaw);
    const outros_gastos = outrosRaw.trim() === "" ? null : parseNumeroBR(outrosRaw);

    if ([distancia, ganhos, consumo_veiculo, valor_combustivel].some((v) => isNaN(v))) {
        exibirErro("mot-result", "mot-val", "mot-exp", new Error("Preencha distância, ganhos, consumo e valor do combustível."));
        return;
    }

    try {
        const data = await chamarAPI("/calculadora_motorista", {
            distancia,
            ganhos,
            consumo_veiculo,
            valor_combustivel,
            alimentacao,
            cafe,
            outros_gastos,
        });
        const r = data.resultado;
        exibirResultado({
            boxId: "mot-result",
            valId: "mot-val",
            expId: "mot-exp",
            valorTexto: `Lucro líquido: ${formatarBRL(r.lucro_liquido)}`,
            explicacaoTexto: `${data.desempenho} • Ganho por km: ${formatarBRL(r.ganhos_por_km)} • Combustível: ${formatarBRL(r.custo_total_combustivel)}`,
            tipo: r.lucro_liquido < 0 ? "danger" : "success",
        });
    } catch (erro) {
        exibirErro("mot-result", "mot-val", "mot-exp", erro);
    }
}

// =========================================================
// 5) ÁLCOOL OU GASOLINA
// =========================================================
async function calcularAlcoolGasolina() {
    const valor_alcool = parseNumeroBR(getValor("alg-alcool"));
    const valor_gasolina = parseNumeroBR(getValor("alg-gasolina"));

    if ([valor_alcool, valor_gasolina].some((v) => isNaN(v))) {
        exibirErro("alg-result", "alg-val", null, new Error("Preencha os preços do álcool e da gasolina."));
        return;
    }

    try {
        const data = await chamarAPI("/calculadora_alcool_gasolina", {
            valor_alcool,
            valor_gasolina,
        });
        const r = data.resultado;
        exibirResultado({
            boxId: "alg-result",
            valId: "alg-val",
            valorTexto: `Vale mais a pena: ${r.melhor_opcao} (${formatarNumero(r.resultado)}%)`,
        });
    } catch (erro) {
        exibirErro("alg-result", "alg-val", null, erro);
    }
}

// =========================================================
// 6) GASTOS (REGRA 50/30/20)
// =========================================================
async function calcularGastos() {
    const salario_liquido = parseNumeroBR(getValor("gas-salario"));
    const gastos_essenciais = parseNumeroBR(getValor("gas-essenciais"));

    if ([salario_liquido, gastos_essenciais].some((v) => isNaN(v))) {
        exibirErro("gas-result", "gas-val", "gas-exp", new Error("Preencha o salário líquido e os gastos essenciais."));
        return;
    }

    try {
        const data = await chamarAPI("/calculadora_gastos", {
            salario_liquido,
            gastos_essenciais,
        });
        const r = data.resultado;
        const explicacao =
            `Gastos essenciais: ${formatarBRL(r.gastos_essenciais_valor)} (${formatarNumero(r.gastos_essenciais_percentual)}%)\n` +
            `Lazer (30%): ${formatarBRL(r.valor_lazer_30)}\n` +
            `Guardar (20%): ${formatarBRL(r.valor_guardar_20)}`;

        exibirResultado({
            boxId: "gas-result",
            valId: "gas-val",
            expId: "gas-exp",
            valorTexto: r.porcentagem_dentro_limite ? "Dentro do limite recomendado (até 50%)" : "Acima do limite recomendado (50%)",
            explicacaoTexto: explicacao,
            tipo: r.porcentagem_dentro_limite ? "success" : "danger",
        });
    } catch (erro) {
        exibirErro("gas-result", "gas-val", "gas-exp", erro);
    }
}

// =========================================================
// 7) FINANCIAMENTO
// =========================================================
async function calcularFinanciamento() {
    const valor = parseNumeroBR(getValor("fin-valor"));
    const taxa_juros = parseNumeroBR(getValor("fin-juros"));
    const ano = parseNumeroBR(getValor("fin-ano"));
    const entradaRaw = getValor("fin-entrada");
    const valor_entrada = entradaRaw.trim() === "" ? 0 : parseNumeroBR(entradaRaw);

    if ([valor, taxa_juros, ano].some((v) => isNaN(v)) || isNaN(valor_entrada)) {
        exibirErro("fin-result", "fin-val", null, new Error("Preencha valor do produto, taxa de juros e prazo em anos."));
        return;
    }

    try {
        const data = await chamarAPI("/calculadora_financiamento", {
            valor,
            taxa_juros,
            ano,
            valor_entrada,
        });
        const r = data.resultado;
        exibirResultado({
            boxId: "fin-result",
            valId: "fin-val",
            valorTexto: `Parcela mensal: ${formatarBRL(r["Parcela mensal"])}`,
        });
    } catch (erro) {
        exibirErro("fin-result", "fin-val", null, erro);
    }
}

// =========================================================
// 8) JUROS COMPOSTOS
// =========================================================
async function calcularJurosCompostos() {
    const valor_inicial = parseNumeroBR(getValor("jc-inicial"));
    const aporte_mensal = parseNumeroBR(getValor("jc-aporte"));
    const taxa_juros = parseNumeroBR(getValor("jc-taxa"));
    const periodo_anos = parseNumeroBR(getValor("jc-periodo"));

    if ([valor_inicial, aporte_mensal, taxa_juros, periodo_anos].some((v) => isNaN(v))) {
        exibirErro("jc-result", "jc-val", null, new Error("Preencha todos os campos com valores válidos."));
        return;
    }

    try {
        const data = await chamarAPI("/calculadora_juros_compostos", {
            valor_inicial,
            aporte_mensal,
            taxa_juros,
            periodo_anos: Math.trunc(periodo_anos),
        });
        // A API retorna um objeto "resultado" aninhado duas vezes: data.resultado.resultado
        const r = (data.resultado && data.resultado.resultado) ? data.resultado.resultado : data.resultado;
        exibirResultado({
            boxId: "jc-result",
            valId: "jc-val",
            valorTexto: `Montante final: ${formatarBRL(r.montante_final)}`,
        });
    } catch (erro) {
        exibirErro("jc-result", "jc-val", null, erro);
    }
}

// =========================================================
// 9) ELETRODOMÉSTICOS
// =========================================================
async function calcularEletrodomesticos() {
    const potencia = parseNumeroBR(getValor("el-potencia"));
    const horas_uso = parseNumeroBR(getValor("el-horas"));
    const dias_uso = parseNumeroBR(getValor("el-dias"));
    const valor_kwh = parseNumeroBR(getValor("el-kwh"));

    if ([potencia, horas_uso, dias_uso, valor_kwh].some((v) => isNaN(v))) {
        exibirErro("el-result", "el-val", null, new Error("Preencha todos os campos com valores válidos."));
        return;
    }

    try {
        const data = await chamarAPI("/calculadora_eletrodomesticos", {
            potencia: Math.trunc(potencia),
            horas_uso,
            dias_uso: Math.trunc(dias_uso),
            valor_kwh,
        });
        const r = data.resultado;
        exibirResultado({
            boxId: "el-result",
            valId: "el-val",
            valorTexto: formatarBRL(r["custo_total_R$"]),
        });
    } catch (erro) {
        exibirErro("el-result", "el-val", null, erro);
    }
}

// =========================================================
// 10) AUTÔNOMOS
// =========================================================
async function calcularAutonomos() {
    const custoOperacional = parseNumeroBR(getValor("aut-custos"));
    const horas_trabalho = parseNumeroBR(getValor("aut-horas"));
    const valor_hora = parseNumeroBR(getValor("aut-valorhora"));
    const margem_lucro = parseNumeroBR(getValor("aut-margem"));
    const taxaMaqRaw = getValor("aut-taxamaq");
    const taxa_maquininha = taxaMaqRaw.trim() === "" ? null : parseNumeroBR(taxaMaqRaw);

    if ([custoOperacional, horas_trabalho, valor_hora, margem_lucro].some((v) => isNaN(v))) {
        exibirErro("aut-result", "aut-val", null, new Error("Preencha custos, horas, valor da hora e margem de lucro."));
        return;
    }

    try {
        const data = await chamarAPI("/calculadora_autonomos", {
            custos_operacionais: [custoOperacional],
            horas_trabalho,
            valor_hora,
            margem_lucro,
            taxa_maquininha,
            deslocamento: null,
            custo_insumos: null,
        });
        const r = data.resultado;
        exibirResultado({
            boxId: "aut-result",
            valId: "aut-val",
            valorTexto: `Preço sugerido: ${formatarBRL(r["preco_sugerido_R$"])}`,
        });
    } catch (erro) {
        exibirErro("aut-result", "aut-val", null, erro);
    }
}
