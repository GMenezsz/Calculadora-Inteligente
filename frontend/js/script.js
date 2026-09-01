// =========================================================
// script.js — Calculadora Inteligente
// Navegação SPA + Sidebar + Consumo da API de backend
// =========================================================

const API_BASE_URL = "https://calculadora-inteligente-api.onrender.com";

// ---------------------------------------------------------
// SERVICE WORKER — necessário para o PWA ser instalável
// ---------------------------------------------------------
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch((erro) => {
            console.warn("Falha ao registrar o service worker:", erro);
        });
    });
}

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

    box.classList.remove("success", "danger", "perf-baixa", "perf-boa", "perf-otima");
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

/**
 * Lê um campo opcional: retorna null se estiver vazio, ou o número parseado.
 * Se inteiro=true, trunca o valor (para quantidades, ex: número de notas).
 * Retorna NaN se o campo tiver algo preenchido mas não for um número válido.
 */
function valorOuNulo(id, inteiro = false) {
    const bruto = getValor(id).trim();
    if (bruto === "") return null;
    const numero = parseNumeroBR(bruto);
    if (isNaN(numero)) return NaN;
    return inteiro ? Math.trunc(numero) : numero;
}

/**
 * Configura um campo de lista (valores separados por vírgula) para que vírgulas
 * digitadas DENTRO de um número (seguidas de dígito) virem ponto decimal automaticamente.
 * Assim, a vírgula "solta" (seguida de espaço ou fim do texto) continua sendo
 * o separador da lista, sem ambiguidade entre "vírgula decimal" e "vírgula separadora".
 * Ex: usuário digita "1,5, 2,3" -> vira "1.5, 2.3" -> lista = [1.5, 2.3]
 */
function configurarCampoListaDecimal(id) {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", () => {
        const cursorPos = el.selectionStart;
        const valorOriginal = el.value;
        // Vírgula seguida imediatamente de dígito => decimal (vira ponto)
        // Vírgula seguida de espaço/fim de texto => permanece separador de lista
        const valorCorrigido = valorOriginal.replace(/,(?=\d)/g, ".");

        if (valorCorrigido !== valorOriginal) {
            el.value = valorCorrigido;
            // Substituição é 1-para-1 (mesmo tamanho), cursor não precisa de ajuste
            el.setSelectionRange(cursorPos, cursorPos);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    configurarCampoListaDecimal("med-trabalhos");
    configurarCampoListaDecimal("med-extras");
    configurarCampoListaDecimal("aut-insumos");
    configurarCampoListaDecimal("aut-deslocamento");
});

// ---------------------------------------------------------
// MÁSCARA DE MOEDA (R$) — formata sozinho enquanto o usuário digita,
// sem precisar que ele mesmo digite vírgulas e pontos.
// ---------------------------------------------------------
function aplicarMascaraMoeda(input) {
    input.addEventListener("input", () => {
        let digitos = input.value.replace(/\D/g, "");

        if (digitos === "") {
            input.value = "";
            return;
        }

        // Garante ao menos 3 dígitos para sempre existirem 2 casas decimais
        while (digitos.length < 3) {
            digitos = "0" + digitos;
        }

        let parteInteira = digitos.slice(0, -2).replace(/^0+(?=\d)/, "");
        const parteDecimal = digitos.slice(-2);

        // Adiciona separador de milhar
        parteInteira = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        input.value = `${parteInteira},${parteDecimal}`;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".money-input").forEach((input) => aplicarMascaraMoeda(input));
});

// ---------------------------------------------------------
// NAVEGAÇÃO (SPA)
// ---------------------------------------------------------

function navigateTo(viewId) {
    closeSidebar(); // fecha o menu mobile ao navegar

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
// MENU HAMBÚRGUER (MOBILE)
// ---------------------------------------------------------
function toggleSidebar() {
    const aside = document.querySelector("aside");
    const overlay = document.querySelector(".sidebar-overlay");
    if (aside) aside.classList.toggle("sidebar-open");
    if (overlay) overlay.classList.toggle("active");
}

function closeSidebar() {
    const aside = document.querySelector("aside");
    const overlay = document.querySelector(".sidebar-overlay");
    if (aside) aside.classList.remove("sidebar-open");
    if (overlay) overlay.classList.remove("active");
}

// ---------------------------------------------------------
// PWA — Instalação
// ---------------------------------------------------------

let deferredPrompt = null;

/** Detecta se o navegador é Safari no iOS/iPadOS (não suporta prompt automático). */
function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Detecta se o app já está rodando "instalado" (modo standalone). */
function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

// Mostra o botão assim que a página carrega, se ainda não estiver instalado
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("pwa-btn");
    if (btn && !isStandalone()) {
        btn.style.display = "inline-block";
    }
});

// Chrome/Android dispara este evento quando o site cumpre os requisitos de instalação
window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    const btn = document.getElementById("pwa-btn");
    if (btn) btn.style.display = "inline-block";
});

function installPWA() {
    // Android / Chrome / Edge: usa o prompt nativo do navegador
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(() => {
            deferredPrompt = null;
            const btn = document.getElementById("pwa-btn");
            if (btn) btn.style.display = "none";
        });
        return;
    }

    // iPhone / iPad (Safari): não existe prompt automático, precisa instruir manualmente
    if (isIOS()) {
        alert(
            "Para instalar no iPhone/iPad:\n\n" +
            "1. Toque no ícone de compartilhar (o quadrado com uma seta ↑) na barra do Safari.\n" +
            "2. Role para baixo e toque em 'Adicionar à Tela de Início'.\n" +
            "3. Toque em 'Adicionar' no canto superior direito."
        );
        return;
    }

    // Outros navegadores/desktop sem suporte ao prompt automático
    alert("Para instalar, procure a opção 'Instalar app' ou 'Adicionar à tela inicial' no menu do seu navegador.");
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
        const desempenho = data.desempenho || "";

        const box = document.getElementById("mot-result");
        const val = document.getElementById("mot-val");
        const exp = document.getElementById("mot-exp");

        if (box && val && exp) {
            val.textContent = `Saldo do dia: ${formatarBRL(r.lucro_liquido)}`;

            // Monta a lista de resultados, um item embaixo do outro (sem numeração, com bolinha)
            exp.innerHTML = "";
            const itens = [
                desempenho,
                `Ganho por km: ${formatarBRL(r.ganhos_por_km)}`,
                `Gastos com combustível: ${formatarBRL(r.custo_total_combustivel)}`,
            ];
            itens.forEach((texto) => {
                if (!texto) return;
                const li = document.createElement("li");
                li.textContent = texto;
                exp.appendChild(li);
            });

            // Define a cor da caixa de acordo com a qualidade da quilometragem (desempenho)
            box.classList.remove("success", "danger", "perf-baixa", "perf-boa", "perf-otima");
            box.classList.add("active");

            const desempenhoNormalizado = desempenho
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();

            if (desempenhoNormalizado.includes("baixa")) {
                box.classList.add("perf-baixa"); // vermelho
            } else if (desempenhoNormalizado.includes("boa")) {
                box.classList.add("perf-boa"); // amarelo
            } else if (desempenhoNormalizado.includes("otima") || desempenhoNormalizado.includes("excelente")) {
                box.classList.add("perf-otima"); // verde
            } else {
                box.classList.add(r.lucro_liquido < 0 ? "danger" : "success");
            }
        }
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
        exibirErro("alg-result", "alg-val", "alg-exp", new Error("Preencha os preços do álcool e da gasolina."));
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
            expId: "alg-exp",
            valorTexto: `Vale mais a pena: ${r.melhor_opcao} (${formatarNumero(r.resultado)}%)`,
            explicacaoTexto: `Isso significa que o preço do álcool corresponde a ${formatarNumero(r.resultado)}% do preço da gasolina. Quanto menor essa porcentagem, mais vantajoso é abastecer com álcool; quanto mais perto de 100%, mais a gasolina compensa.`,
        });
    } catch (erro) {
        exibirErro("alg-result", "alg-val", "alg-exp", erro);
    }
}

// =========================================================
// 6) GASTOS (REGRA 50/30/20)
// =========================================================
async function calcularGastos() {
    const salario_liquido = parseNumeroBR(getValor("gas-salario"));
    const gastos_essenciais = parseNumeroBR(getValor("gas-essenciais"));

    if ([salario_liquido, gastos_essenciais].some((v) => isNaN(v))) {
        exibirErro("gas-result", "gas-val", "gas-exp", new Error("Preencha o salário líquido e os gastos fixos."));
        return;
    }

    try {
        const data = await chamarAPI("/calculadora_gastos", {
            salario_liquido,
            gastos_essenciais,
        });
        const r = data.resultado;

        const box = document.getElementById("gas-result");
        const val = document.getElementById("gas-val");
        const exp = document.getElementById("gas-exp");

        if (box && val && exp) {
            const percentual = r.gastos_essenciais_percentual;
            const dentroDoLimite = r.porcentagem_dentro_limite;

            exp.innerHTML = "";
            const itens = [];

            // Usa o valor que o usuário realmente digitou, em vez do valor devolvido pela API
            itens.push(`Gastos fixos: ${formatarBRL(gastos_essenciais)} (${formatarNumero(percentual)}%)`);

            if (dentroDoLimite) {
                itens.push(`Lazer (30%): ${formatarBRL(r.valor_lazer_30)}`);
                itens.push(`Guardar (20%): ${formatarBRL(r.valor_guardar_20)}`);
            } else {
                itens.push(
                    "Seus gastos fixos já ultrapassam metade da sua renda. Antes de pensar em lazer ou em guardar dinheiro para a reserva de emergência, o ideal agora é colocar as contas em dia, priorizar o pagamento de dívidas e buscar reduzir esses gastos fixos para recuperar o equilíbrio financeiro."
                );
            }

            itens.forEach((texto) => {
                if (!texto) return;
                const li = document.createElement("li");
                li.textContent = texto;
                exp.appendChild(li);
            });

            val.textContent = dentroDoLimite ? "Dentro do limite recomendado (até 50%)" : "Acima do limite recomendado (50%)";

            box.classList.remove("success", "danger", "perf-baixa", "perf-boa", "perf-otima");
            box.classList.add("active");
            box.classList.add(dentroDoLimite ? "success" : "danger");
        }
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
        exibirErro("fin-result", "fin-val", "fin-exp", new Error("Preencha valor do produto, taxa de juros e prazo em anos."));
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

        const box = document.getElementById("fin-result");
        const val = document.getElementById("fin-val");
        const exp = document.getElementById("fin-exp");

        if (box && val && exp) {
            const parcelaMensal = r["Parcela mensal"];
            const prazoMeses = Math.round(ano * 12);
            const valorFinanciado = valor - valor_entrada;
            const valorTotalFinanciamento = parcelaMensal * prazoMeses;
            const totalJuros = valorTotalFinanciamento - valorFinanciado;

            val.textContent = `Parcela mensal: ${formatarBRL(parcelaMensal)}`;

            exp.innerHTML = "";
            const itens = [
                `Valor total do financiamento: ${formatarBRL(valorTotalFinanciamento)}`,
                `Total de juros: ${formatarBRL(totalJuros)}`,
                `Prazo: ${prazoMeses} meses`,
            ];
            itens.forEach((texto) => {
                const li = document.createElement("li");
                li.textContent = texto;
                exp.appendChild(li);
            });

            box.classList.remove("success", "danger", "perf-baixa", "perf-boa", "perf-otima");
            box.classList.add("active", "success");
        }
    } catch (erro) {
        exibirErro("fin-result", "fin-val", "fin-exp", erro);
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
        exibirErro("jc-result", "jc-val", "jc-exp", new Error("Preencha todos os campos com valores válidos."));
        return;
    }

    try {
        const periodoMesesEnviado = Math.trunc(periodo_anos);
        const data = await chamarAPI("/calculadora_juros_compostos", {
            valor_inicial,
            aporte_mensal,
            taxa_juros,
            periodo_anos: periodoMesesEnviado,
        });
        // A API retorna um objeto "resultado" aninhado duas vezes: data.resultado.resultado
        const r = (data.resultado && data.resultado.resultado) ? data.resultado.resultado : data.resultado;

        const box = document.getElementById("jc-result");
        const val = document.getElementById("jc-val");
        const exp = document.getElementById("jc-exp");

        if (box && val && exp) {
            const meses = periodoMesesEnviado * 12;
            const totalInvestido = valor_inicial + aporte_mensal * meses;
            const jurosGanho = r.montante_final - totalInvestido;
            const rentabilidadeTotal = totalInvestido > 0 ? (jurosGanho / totalInvestido) * 100 : 0;

            val.textContent = `Montante final: ${formatarBRL(r.montante_final)}`;

            exp.innerHTML = "";
            const itens = [
                `Total investido: ${formatarBRL(totalInvestido)}`,
                `Juros ganho: ${formatarBRL(jurosGanho)}`,
                `Rentabilidade total: ${formatarNumero(rentabilidadeTotal)}%`,
            ];
            itens.forEach((texto) => {
                const li = document.createElement("li");
                li.textContent = texto;
                exp.appendChild(li);
            });

            box.classList.remove("success", "danger", "perf-baixa", "perf-boa", "perf-otima");
            box.classList.add("active", "success");
        }
    } catch (erro) {
        exibirErro("jc-result", "jc-val", "jc-exp", erro);
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
        exibirErro("el-result", "el-val", "el-exp", new Error("Preencha todos os campos com valores válidos."));
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

        const box = document.getElementById("el-result");
        const val = document.getElementById("el-val");
        const exp = document.getElementById("el-exp");

        if (box && val && exp) {
            const consumoKwh = (potencia / 1000) * horas_uso * dias_uso;

            val.textContent = `Custo de energia: ${formatarBRL(r["custo_total_R$"])}`;

            exp.innerHTML = "";
            const li = document.createElement("li");
            li.textContent = `Consumo de energia: ${formatarNumero(consumoKwh)} kWh`;
            exp.appendChild(li);

            box.classList.remove("success", "danger", "perf-baixa", "perf-boa", "perf-otima");
            box.classList.add("active", "success");
        }
    } catch (erro) {
        exibirErro("el-result", "el-val", "el-exp", erro);
    }
}

// =========================================================
// 10) AUTÔNOMOS
// =========================================================
async function calcularAutonomos() {
    const custosRaw = getValor("aut-custos");
    const custoOperacional = custosRaw.trim() === "" ? null : parseNumeroBR(custosRaw);
    const custos_operacionais = custoOperacional === null ? [] : [custoOperacional];

    const horas_trabalho = parseNumeroBR(getValor("aut-horas"));
    const valor_hora = parseNumeroBR(getValor("aut-valorhora"));
    const margem_lucro = parseNumeroBR(getValor("aut-margem"));

    const taxaMaqRaw = getValor("aut-taxamaq");
    const taxa_maquininha = taxaMaqRaw.trim() === "" ? null : parseNumeroBR(taxaMaqRaw);

    const custo_insumos_lista = parseListaBR(getValor("aut-insumos"));
    const custo_insumos = custo_insumos_lista.length ? custo_insumos_lista : null;

    const deslocamento_lista = parseListaBR(getValor("aut-deslocamento"));
    const deslocamento = deslocamento_lista.length ? deslocamento_lista : null;

    if ([horas_trabalho, valor_hora, margem_lucro].some((v) => isNaN(v))) {
        exibirErro("aut-result", "aut-val", "aut-exp", new Error("Preencha horas, valor da hora e margem de lucro."));
        return;
    }
    if (custoOperacional !== null && isNaN(custoOperacional)) {
        exibirErro("aut-result", "aut-val", "aut-exp", new Error("Custos operacionais inválidos."));
        return;
    }

    try {
        const data = await chamarAPI("/calculadora_autonomos", {
            horas_trabalho: horas_trabalho,
            valor_hora: valor_hora,
            margem_lucro: margem_lucro,
            custos_operacionais: custos_operacionais,
            taxa_maquininha: taxa_maquininha,
            deslocamento: deslocamento,
            custo_insumos: custo_insumos

        });

        const r = data.resultado;

        const box = document.getElementById("aut-result");
        const val = document.getElementById("aut-val");
        const exp = document.getElementById("aut-exp");

        if (box && val && exp) {
            const precoSugerido = r["preco_sugerido_R$"];
            const custoOperacional = r["custo_operacional_R$"];
            const custoMaterial = r["custo_material_R$"];
            const valorDeslocamento = r["deslocamento_R$"];
            const maoDeObra = r["mao_de_obra_R$"];
            const valorMaquininha = r["taxa_maquininha_R$"];
            const lucro = r["lucro_R$"];
            const ganhoTotal = r["ganho_total_R$"];

            val.textContent = `Preço sugerido: ${formatarBRL(precoSugerido)}`;

            exp.innerHTML = "";
            const itens = [`Mão de obra (sua hora): ${formatarBRL(maoDeObra)}`];

            // Cada campo opcional só aparece na lista se o usuário informou algum valor
            if (custos_operacionais.length && custoOperacional > 0) {
                itens.push(`Custo operacional: ${formatarBRL(custoOperacional)}`);
            }
            if (custo_insumos && custo_insumos.length && custoMaterial > 0) {
                itens.push(`Custo com insumos: ${formatarBRL(custoMaterial)}`);
            }
            if (deslocamento && deslocamento.length && valorDeslocamento > 0) {
                itens.push(`Deslocamento: ${formatarBRL(valorDeslocamento)}`);
            }
            if (taxa_maquininha !== null && valorMaquininha > 0) {
                itens.push(`Taxa da maquininha: ${formatarBRL(valorMaquininha)}`);
            }

            itens.push(`Lucro (margem): ${formatarBRL(lucro)}`);
            itens.push(`Você embolsa no total: ${formatarBRL(ganhoTotal)}`);

            itens.forEach((texto) => {
                const li = document.createElement("li");
                li.textContent = texto;
                exp.appendChild(li);
            });

            box.classList.remove("success", "danger", "perf-baixa", "perf-boa", "perf-otima");
            box.classList.add("active", "success");
        }
    } catch (erro) {
        exibirErro("aut-result", "aut-val", "aut-exp", erro);
    }
}

// =========================================================
// 11) CONTROLE DE CAIXA
// =========================================================
async function calcularCaixa() {
    // Todos os campos são opcionais: null se vazio, número se preenchido
    const caixa = valorOuNulo("caixa-inicial");
    const saida = valorOuNulo("caixa-saida");
    const qtd_100 = valorOuNulo("caixa-100", true);
    const qtd_50 = valorOuNulo("caixa-50", true);
    const qtd_20 = valorOuNulo("caixa-20", true);
    const qtd_10 = valorOuNulo("caixa-10", true);
    const qtd_5 = valorOuNulo("caixa-5", true);
    const qtd_2 = valorOuNulo("caixa-2", true);
    const qtd_1 = valorOuNulo("caixa-1", true);

    const camposPreenchidos = [caixa, saida, qtd_100, qtd_50, qtd_20, qtd_10, qtd_5, qtd_2, qtd_1];

    // Se algum campo preenchido não for um número válido, avisa o erro
    if (camposPreenchidos.some((v) => Number.isNaN(v))) {
        exibirErro("caixa-result", "caixa-val", "caixa-exp", new Error("Preencha apenas números válidos nos campos (ou deixe em branco)."));
        return;
    }

    try {
        const data = await chamarAPI("/calculadora_caixa", {
            caixa,
            qtd_100,
            qtd_50,
            qtd_20,
            qtd_10,
            qtd_5,
            qtd_2,
            qtd_1,
            saida,
        });

        const box = document.getElementById("caixa-result");
        const val = document.getElementById("caixa-val");
        const exp = document.getElementById("caixa-exp");

        if (box && val && exp) {
            val.textContent = `Total em caixa: ${formatarBRL(data.total_caixa)}`;

            const caixaInicialTexto = data.caixa_inicial !== null && data.caixa_inicial !== undefined
                ? formatarBRL(data.caixa_inicial)
                : "Não informado";

            exp.innerHTML = "";
            const itens = [`Caixa inicial informado: ${caixaInicialTexto}`];
            itens.forEach((texto) => {
                const li = document.createElement("li");
                li.textContent = texto;
                exp.appendChild(li);
            });

            box.classList.remove("success", "danger", "perf-baixa", "perf-boa", "perf-otima");
            box.classList.add("active", "success");
        }
    } catch (erro) {
        exibirErro("caixa-result", "caixa-val", "caixa-exp", erro);
    }
}
