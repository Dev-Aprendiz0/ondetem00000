// script.js

// Lógica de registro do Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso. Escopo:', registration.scope);
      })
      .catch(error => {
        console.log('Falha ao registrar o Service Worker:', error);
      });
  });
}

document.addEventListener('DOMContentLoaded', () => {
    const btnLupaMobile = document.getElementById('btn-lupa-mobile');
    const inputMobile = document.getElementById('input-busca-mobile');
    const inputDesktop = document.querySelector('.search-bar input'); // O que você já tinha
    const cards = document.querySelectorAll('.listings .row > div');

    // 1. Função para filtrar (centralizada para não repetir código)
    function filtrarCards(termo) {
        const searchTerm = termo.toLowerCase();
        cards.forEach(card => {
            const title = card.querySelector('.card-title').innerText.toLowerCase();
            const services = card.querySelector('.card-text').innerText.toLowerCase();
            
            if (title.includes(searchTerm) || services.includes(searchTerm)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    }

    // 2. Evento para o input de Desktop
    inputDesktop.addEventListener('input', (e) => filtrarCards(e.target.value));

    // 3. Lógica da Lupa Mobile
    btnLupaMobile.addEventListener('click', () => {
        inputMobile.classList.toggle('d-none');
        inputMobile.classList.toggle('ativo');
        inputMobile.focus();
    });

    // 4. Evento para o input de Mobile
    inputMobile.addEventListener('input', (e) => filtrarCards(e.target.value));
});