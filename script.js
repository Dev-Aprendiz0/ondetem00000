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
    const cardsElements = document.querySelectorAll('.service-card');
    
    const modalElement = document.getElementById('modalAgendamento');
    const bModal = new bootstrap.Modal(modalElement);
    const form = document.getElementById('formAgendamento');
    const statusPagamento = document.getElementById('statusPagamento');

// --- LÓGICA DE INTERAÇÃO COM O MAPA ---
    function focarNoMapa(card) {
        const lat = card.closest('[data-lat]').getAttribute('data-lat');
        const lng = card.closest('[data-lng]').getAttribute('data-lng');
        const nome = card.querySelector('.card-title').innerText;

        if (lat && lng && typeof map !== 'undefined') {
            map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
            L.popup().setLatLng([lat, lng]).setContent(`<b>${nome}</b>`).openOn(map);
        }
    }

    cardsElements.forEach(card => {
        // No PC: Ao passar o mouse
        card.addEventListener('mouseenter', () => focarNoMapa(card));
        
        // No Mobile: Ao clicar/tocar
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-danger')) {
                focarNoMapa(card);
            }
        });
    });

// --- LÓGICA DE BUSCA ---
    function filtrarCards(termo) {
        const searchTerm = termo.toLowerCase();
        document.querySelectorAll('.listings .row > div').forEach(cardDiv => {
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
            inputMobile.focus();
        });
    }

// --- LÓGICA DO MODAL ---
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-danger') && e.target.closest('.card-body')) {
            const nomeLocal = e.target.closest('.card-body').querySelector('.card-title').innerText;
            document.getElementById('modalAgendamentoLabel').innerText = `Agendar em: ${nomeLocal}`;
            bModal.show();
        }
    });

// --- LÓGICA DE PAGAMENTO ---
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
                const resultado = await resposta.json();
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
        }
    });
});

// 1. Coordenadas dos Comércios (Latitude, Longitude)
const comercios = [
    { nome: "Studio Bella Donna", lat: -22.901844995221147, lng: -42.474725201148125 }, 
    { nome: "Clínica Estética Flores", lat: -22.930476325777267, lng: -42.48981265383228 },  
    { nome: "Espaço Glow", lat: -22.888828721719282, lng: -42.467136122927414 } , 
];

const marcadores = [];
const cardsElements = document.querySelectorAll('.card-salao');

// Ícones
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

// 2. Inicializar Mapa
var map = L.map('map').setView([-22.9345, -42.4951], 14);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// 3. Criar Marcadores e Vincular Eventos
comercios.forEach((local, index) => {
    const marker = L.marker([local.lat, local.lng], { icon: iconeAzul }).addTo(map);
    marker.bindPopup(`<b>${local.nome}</b>`);
    marcadores.push(marker);

    // EVENTO: Passar o mouse no ÍCONE DO MAPA
    marker.on('mouseover', function() {
        selecionarSalao(index);
        this.openPopup();
    });
});

// 4. EVENTO: Passar o mouse no CARD
cardsElements.forEach((card, index) => {
    card.addEventListener('mouseenter', () => {
        selecionarSalao(index);
    });
});

// 5. FUNÇÃO DE SELEÇÃO (O CORAÇÃO DA SINCRONIA)
function selecionarSalao(indexAtivo) {
    marcadores.forEach((m, i) => {
        const card = cardsElements[i];
        
        if (i === indexAtivo) {
            // Destaque no Mapa
            m.setIcon(iconeVermelho);
            m.setZIndexOffset(1000);
            map.flyTo(m.getLatLng(), 15, { duration: 1 });

            // Destaque no Card
            card.querySelector('.card').classList.add('card-ativo-mapa');
            // No mobile, faz o carrossel deslizar para o card
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
            // Remove destaque dos outros
            m.setIcon(iconeAzul);
            m.setZIndexOffset(0);
            card.querySelector('.card').classList.remove('card-ativo-mapa');
        }
    });
}

// 6. Geolocalização (mantendo sua lógica anterior)
map.locate({ setView: true, maxZoom: 15 });
map.on('locationfound', (e) => {
    L.circle(e.latlng, { radius: e.accuracy, color: '#d93d3d' }).addTo(map);
    // Cálculo de Distância para cada card
    comercios.forEach((local, index) => {
        const pontoComercio = L.latLng(local.lat, local.lng);
        const pontoUsuario = e.latlng;
        
        // Distância em metros
        const distanciaMetros = pontoUsuario.distanceTo(pontoComercio);
        
        // Formata o texto (ex: 1.2 km ou 300 m)
        let textoDistancia = "";
        if (distanciaMetros >= 1000) {
            textoDistancia = (distanciaMetros / 1000).toFixed(1) + " km";
        } else {
            textoDistancia = Math.round(distanciaMetros) + " m";
        }

        // Atualiza no HTML
        const elementoDist = document.getElementById(`dist-${index}`);
        if (elementoDist) elementoDist.innerText = textoDistancia;
    });
});

map.on('locationerror', function() {
    alert("Localização negada. As distâncias não serão exibidas.");
    map.setView([-22.9345, -42.4951], 13);
});