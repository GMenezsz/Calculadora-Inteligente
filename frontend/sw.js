// =========================================================
// sw.js — Service Worker Atualizado
// Estratégia: Network First (Sempre atualiza quando tem internet)
// =========================================================

// ⚠️ MUDE ESSE NÚMERO SEMPRE QUE ATUALIZAR O SITE!
const CACHE_NAME = "calculadora-inteligente-v2.0.0"; 

const ARQUIVOS_PARA_CACHE = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/script.js",
    "./imagens/logo.png",
    "./manifest.json"
];

// INSTALAÇÃO: Força o novo SW a assumir e pré-cacheia os arquivos
self.addEventListener("install", (event) => {
    self.skipWaiting(); // Força o novo service worker a ativar imediatamente
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ARQUIVOS_PARA_CACHE).catch(() => {
                // Se algum arquivo não existir, não trava a instalação
            });
        })
    );
});

// ATIVAÇÃO: Deleta IMPIEDOSAMENTE os caches antigos e assume o controle
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((nomes) =>
            Promise.all(
                nomes
                    .filter((nome) => nome !== CACHE_NAME)
                    .map((nome) => caches.delete(nome)) // Limpa tudo que é antigo!
            )
        ).then(() => self.clients.claim()) // Assume o controle das abas sem precisar fechar
    );
});

// FETCH: Tenta SEMPRE a internet primeiro. Se falhar, usa o cache MAIS NOVO.
self.addEventListener("fetch", (event) => {
    // Não interceptar chamadas para a API (deixa sempre ir direto pra rede)
    if (event.request.url.includes("calculadora-inteligente-api.onrender.com")) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Se baixou da internet, salva a cópia MAIS NOVA no cache
                if (response && response.status === 200 && response.type === "basic") {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Sem internet: usa o cache (que já estará atualizado)
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    
                    // Se for navegação de página e não tiver cache, cai no index.html
                    if (event.request.mode === "navigate") {
                        return caches.match("./index.html");
                    }
                    
                    return new Response("", { status: 408, statusText: "Offline" });
                });
            })
    );
});
