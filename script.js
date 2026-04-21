// 1. Registro do Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('SW registrado:', reg.scope))
            .catch(err => console.log('Erro SW:', err));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // --- SELEÇÃO DE ELEMENTOS ---
    const btnLupaMobile = document.getElementById('btn-lupa-mobile');
    const inputMobile = document.getElementById('input-busca-mobile');
    const inputDesktop = document.querySelector('.search-bar input'); 
    const cardsElements = document.querySelectorAll('.card-salao'); // Ajustado para a classe correta dos seus cards
    
    const modalElement = document.getElementById('modalAgendamento');
    const bModal = new bootstrap.Modal(modalElement);
    const form = document.getElementById('formAgendamento');
    const statusPagamento = document.getElementById('statusPagamento');

    // Troca entre Modais e força a aba correta
document.querySelectorAll('.abrir-cadastro').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 1. Fecha o modal de login
        const modalLoginEl = document.getElementById('modalLogin');
        const modalLoginBS = bootstrap.Modal.getInstance(modalLoginEl);
        if (modalLoginBS) modalLoginBS.hide();

        // 2. Abre o modal de cadastro
        const modalCadEl = document.getElementById('modalCadastro');
        const modalCadBS = new bootstrap.Modal(modalCadEl);
        modalCadBS.show();

        // 3. Lógica para forçar a aba correta
        const textoLink = e.target.innerText.toLowerCase();
        
        // Pequeno delay para garantir que o modal carregou no DOM antes de trocar a aba
        setTimeout(() => {
            let selector = '#cad-usuario-tab'; // Padrão: Cliente
            
            if (textoLink.includes('empresa') || textoLink.includes('parceiro')) {
                selector = 'button[data-bs-target="#cad-empresa"]';
            } else {
                selector = 'button[data-bs-target="#cad-usuario"]';
            }

            const abaAlvo = document.querySelector(selector);
            if (abaAlvo) {
                const tab = new bootstrap.Tab(abaAlvo);
                tab.show();
            }
        }, 150);
    });
});

    // --- CONFIGURAÇÕES DO MAPA ---
    // Inicializa o mapa focado em Saquarema (Fallback)
    const map = L.map('map', { zoomControl: false }).setView([-22.9345, -42.4951], 14);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Reposiciona o zoom para a direita (estilo Airbnb)
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dados dos Comércios
    const comercios = [
        { nome: "Studio Bella Donna", lat: -22.901844995221147, lng: -42.474725201148125, preco: "R$ 120" }, 
        { nome: "Clínica Estética Flores", lat: -22.930476325777267, lng: -42.48981265383228, preco: "R$ 150" },  
        { nome: "Espaço Glow", lat: -22.888828721719282, lng: -42.467136122927414, preco: "R$ 80" }
    ];

    const marcadores = [];

    // --- ÍCONES E MARCADORES ---
    const iconeAzul = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41]
    });

    const iconeVermelho = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41]
    });

    // Criar marcadores iniciais
    comercios.forEach((local, index) => {
        const marker = L.marker([local.lat, local.lng], { icon: iconeAzul }).addTo(map);
        marker.bindPopup(`<b>${local.nome}</b>`);
        marcadores.push(marker);

        // Evento: Clicar no marcador do mapa foca o card
        marker.on('click', function() {
            selecionarSalao(index);
            this.openPopup();
        });
    });

    // --- FUNÇÃO DE SELEÇÃO E SINCRONIA ---
    function selecionarSalao(indexAtivo) {
        marcadores.forEach((m, i) => {
            const card = cardsElements[i];
            if (!card) return;

            if (i === indexAtivo) {
                m.setIcon(iconeVermelho);
                m.setZIndexOffset(1000);
                map.flyTo(m.getLatLng(), 15, { duration: 1 });

                card.querySelector('.card').classList.add('card-ativo-mapa');
                card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            } else {
                m.setIcon(iconeAzul);
                m.setZIndexOffset(0);
                card.querySelector('.card').classList.remove('card-ativo-mapa');
            }
        });
    }

    // Eventos nos Cards
    cardsElements.forEach((card, index) => {
        // No PC: Ao passar o mouse
        card.addEventListener('mouseenter', () => {
            if (window.innerWidth > 768) selecionarSalao(index);
        });
        
        // No Mobile: Ao clicar (exceto no botão agendar)
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-danger')) {
                selecionarSalao(index);
            }
        });
    });

    // --- GEOLOCALIZAÇÃO ---
    map.locate({ setView: true, maxZoom: 15 });

    map.on('locationfound', (e) => {
        L.marker(e.latlng).addTo(map).bindPopup("<b>Você está aqui!</b>").openPopup();
        L.circle(e.latlng, { radius: e.accuracy, color: '#d93d3d', fillOpacity: 0.1 }).addTo(map);

        // Atualiza distâncias reais nos cards
        comercios.forEach((local, index) => {
            const pontoComercio = L.latLng(local.lat, local.lng);
            const dist = e.latlng.distanceTo(pontoComercio);
            
            let textoDistancia = dist >= 1000 ? (dist / 1000).toFixed(1) + " km" : Math.round(dist) + " m";
            const el = document.getElementById(`dist-${index}`);
            if (el) el.innerText = textoDistancia;
        });
    });

    map.on('locationerror', () => {
        console.log("Localização negada.");
        map.setView([-22.9345, -42.4951], 13);
    });

    // --- LÓGICA DE BUSCA ---
    function filtrarCards(termo) {
        const searchTerm = termo.toLowerCase();
        cardsElements.forEach(cardDiv => {
            const title = cardDiv.querySelector('.card-title').innerText.toLowerCase();
            const services = cardDiv.querySelector('.card-text').innerText.toLowerCase();
            cardDiv.style.display = (title.includes(searchTerm) || services.includes(searchTerm)) ? "block" : "none";
        });
    }

    if(inputDesktop) inputDesktop.addEventListener('input', (e) => filtrarCards(e.target.value));
    if(inputMobile) inputMobile.addEventListener('input', (e) => filtrarCards(e.target.value));

    if(btnLupaMobile) {
        btnLupaMobile.addEventListener('click', () => {
            inputMobile.classList.toggle('d-none');
            inputMobile.classList.toggle('ativo');
            if (inputMobile.classList.contains('ativo')) inputMobile.focus();
        });
    }

    // --- LÓGICA DO MODAL E AGENDAMENTO ---
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-danger') && e.target.closest('.card-body')) {
            const nomeLocal = e.target.closest('.card-body').querySelector('.card-title').innerText;
            document.getElementById('modalAgendamentoLabel').innerText = `Agendar em: ${nomeLocal}`;
            bModal.show();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = form.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processando...';
        
        const dadosAgendamento = {
            local: document.getElementById('modalAgendamentoLabel').innerText,
            data: document.getElementById('dataAgendamento').value,
            hora: document.getElementById('horaAgendamento').value,
            pagamento: document.getElementById('metodoPagamento').value
        };

        try {
            const resposta = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                body: JSON.stringify(dadosAgendamento),
                headers: { 'Content-type': 'application/json; charset=UTF-8' }
            });

            if(resposta.ok) {
                statusPagamento.innerHTML = '<b class="text-success">Pagamento Aprovado!</b>';
                setTimeout(() => {
                    bModal.hide();
                    form.reset();
                    statusPagamento.innerHTML = '';
                    btnSubmit.disabled = false;
                    btnSubmit.innerText = 'Confirmar e Pagar';
                    alert("Sucesso! Agendamento confirmado.");
                }, 2000);
            }
        } catch (erro) {
            statusPagamento.innerHTML = '<b class="text-danger">Erro no processamento.</b>';
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Confirmar e Pagar';
        }
    });
});