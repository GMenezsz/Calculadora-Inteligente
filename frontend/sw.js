// =========================================================
// sw.js — Service Worker mínimo da Calculadora Inteligente
// Necessário para o navegador considerar o site "instalável" (PWA)
// =========================================================
 
const CACHE_NAME = "calculadora-inteligente-v1";
const ARQUIVOS_PARA_CACHE = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/script.js",
    "./imagens/logo.png",
];
 
// Instala o service worker e guarda os arquivos principais em cache
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ARQUIVOS_PARA_CACHE).catch(() => {
                // Se algum arquivo não existir, não trava a instalação
            });
        })
    );
    self.skipWaiting();
});
 
// Remove caches antigos quando uma nova versão do SW é ativada
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((nomes) =>
            Promise.all(
                nomes
                    .filter((nome) => nome !== CACHE_NAME)
                    .map((nome) => caches.delete(nome))
            )
        )
    );
    self.clients.claim();
});
 
// Estratégia: tenta a rede primeiro, cai pro cache se estiver offline
self.addEventListener("fetch", (event) => {
    // Não interceptar chamadas para a API (deixa sempre ir direto pra rede)
    if (event.request.url.includes("calculadora-inteligente-api.onrender.com")) {
        return;
    }
 
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
