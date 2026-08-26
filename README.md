
# 🧮 Calculadora Inteligente

Uma aplicação web full-stack desenvolvida para centralizar diversas ferramentas matemáticas e financeiras úteis para o dia a dia, estudos, trabalho autônomo e mobilidade.

O projeto foi construído com uma arquitetura desacoplada (API em Python com FastAPI e Front-end moderno) e conta com suporte a **PWA (Progressive Web App)**, permitindo que seja instalado diretamente na tela inicial do celular.

---

## 🚀 Funcionalidades

* **Finanças & Investimentos:**
  * Simulador de Juros Compostos
  * Orçamento Pessoal (Regra 50/30/20)
  * Simulador de Financiamentos
* **Mobilidade & Trabalho:**
  * Cálculo de Custo de Combustível para Viagens
  * Viabilidade e Lucratividade para Motoristas de Aplicativo
* **Produtividade & Acadêmico:**
  * Cálculo de Média Escolar (com notas, trabalhos e pontos extras)
  * Precificação e Custos para Profissionais Autônomos
  * Consumo de Eletrodomésticos em kWh
* **Utilidades Gerais:**
  * Regra de Três
  * Comparador de Álcool vs. Gasolina

---

## 🛠️ Tecnologias Utilizadas

### **Back-end (API)**

* **Python**
* **FastAPI** (Alta performance e documentação automática)
* **Pydantic** (Validação rigorosa de dados e modelos)
* **Uvicorn** (Servidor ASGI)

### **Front-end & PWA**

* **HTML5, CSS3 & JavaScript Moderno (ES6+)**
* **Service Workers & Web App Manifest** (Suporte a instalação mobile / PWA)

### **Hospedagem & Deploy**

* **Render** (Deploy do Back-end / API FastAPI)
* **Vercel** (Deploy do Front-end)

---

## 📱 Instalação como Aplicativo (PWA)

Você pode instalar a Calculadora Inteligente no seu celular ou computador sem precisar baixar nada da loja de aplicativos:

1. Acesse o site oficial pelo navegador do seu smartphone.
2. Clique no menu do navegador (três pontinhos ou ícone de compartilhamento).
3. Selecione a opção **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.

---

## 🔌 Endpoints da API (Back-end)

A API roda sob o padrão REST e valida rigorosamente as requisições via JSON. Principais rotas:

* `POST /calculadora_regra_tres`
* `POST /calculadora_alcool_gasolina`
* `POST /calculadora_media`
* `POST /calculadora_juros_compostos`
* `POST /calculadora_gastos`
* `POST /calculadora_financiamento`
* `POST /calculadora_eletrodomesticos`
* `POST /calculadora_combustivel`
* `POST /calculadora_motorista`
* `POST /calculadora_autonomos`

---

## 👨‍💻 Autor

Desenvolvido por **Gabriel Guedes Santiago de Menezes**.

Sinta-se à vontade para contribuir, abrir *issues* ou enviar sugestões de melhoria!
