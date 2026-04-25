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
    
    const modalElement = document.getElementById('modalAgendamento');
    const bModal = modalElement ? new bootstrap.Modal(modalElement) : null;
    const formAgendamento = document.getElementById('formAgendamento');
    const statusPagamento = document.getElementById('statusPagamento');

    // Troca entre Modais e força a aba correta
    document.querySelectorAll('.abrir-cadastro').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const modalLoginEl = document.getElementById('modalLogin');
            const modalLoginBS = bootstrap.Modal.getInstance(modalLoginEl);
            if (modalLoginBS) modalLoginBS.hide();

            const modalCadEl = document.getElementById('modalCadastro');
            const modalCadBS = new bootstrap.Modal(modalCadEl);
            modalCadBS.show();

            const textoLink = e.target.innerText.toLowerCase();
            setTimeout(() => {
                let selector = '#cad-usuario-tab';
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
    const map = L.map('map', { zoomControl: false }).setView([-22.9345, -42.4951], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

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

    // --- CARREGAMENTO DINÂMICO DE SALÕES ---
    const saloesIniciais = [
        { nome: "Studio Bella Donna", email: "ficticio1@email.com", lat: -22.901844995221147, lng: -42.474725201148125, servicos: "Cabelo • Unhas • Sobrancelhas", img: "https://frizzar.com.br/blog/wp-content/uploads/2025/01/salao-de-beleza-moderno.webp" },
        { nome: "Clínica Estética Flores", email: "ficticio2@email.com", lat: -22.930476325777267, lng: -42.48981265383228, servicos: "Rosto • Depilação • Massagem", img: "https://s2.glbimg.com/Ha2q-YYa3pCWtwM4E51zi_p-POI=/940x523/e.glbimg.com/og/ed/f/original/2019/02/20/blow-dry-bar-del-mar-chairs-counter-853427.jpg" },
        { nome: "Espaço Glow", email: "ficticio3@email.com", lat: -22.888828721719282, lng: -42.467136122927414, servicos: "Unhas • Sobrancelhas • Rosto", img: "https://ferrante.com.br/wp-content/uploads/2024/11/decoracao-minimalista-salao.jpg.jpeg" }
    ];

    const bancoUsuarios = JSON.parse(localStorage.getItem('usuarios_pwa')) || [];
    const novosSaloes = bancoUsuarios.filter(u => u.tipo === 'empresa' && u.lat && u.lng);
    const todosSaloes = [...saloesIniciais];

    novosSaloes.forEach(emp => {
        todosSaloes.push({
            nome: emp.nomeFantasia,
            email: emp.email,
            lat: emp.lat,
            lng: emp.lng,
            servicos: "Novo Parceiro • Saquarema",
            img: "https://frizzar.com.br/blog/wp-content/uploads/2025/01/salao-de-beleza-moderno.webp",
            isNovo: true
        });
    });

    const marcadores = [];
    const containerCards = document.getElementById('container-cards');

    if (containerCards) {
        containerCards.innerHTML = ""; 
        todosSaloes.forEach((salao, index) => {
            const cardHTML = `
                <div class="col-12 col-xl-6 card-salao" data-index="${index}">
                    <div class="card service-card shadow-sm h-100 border-0">
                        <img src="${salao.img}" class="card-img-top rounded-4">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <h6 class="card-title mb-0 fw-bold">${salao.nome}</h6>
                                <span class="small fw-bold"><i class="bi bi-star-fill text-warning"></i> ${salao.isNovo ? '5.0' : '4.8'} (<span id="dist-${index}">...</span>)</span>
                            </div>
                            <p class="card-text text-muted small mb-3">${salao.servicos}</p>
                            <div class="mt-auto d-flex gap-2">
                                <button class="btn btn-danger flex-fill rounded-pill btn-agendar-real" data-email="${salao.email}" data-nome="${salao.nome}">Agendar</button>
                                <button class="btn btn-outline-danger rounded-pill btn-favoritar" data-nome="${salao.nome}" data-img="${salao.img}" data-servicos="${salao.servicos}" title="Favoritar">
                                    <i class="bi bi-heart"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
            containerCards.insertAdjacentHTML('beforeend', cardHTML);
            const marker = L.marker([salao.lat, salao.lng], { icon: iconeAzul }).addTo(map);
            marker.bindPopup(`<b>${salao.nome}</b>`);
            marcadores.push(marker);
            marker.on('click', () => selecionarSalao(index));
        });
    }

    // Adicione isso logo após o loop que cria os marcadores
        document.querySelectorAll('.card-salao').forEach(card => {
            card.addEventListener('click', () => {
                const index = card.getAttribute('data-index');
                selecionarSalao(parseInt(index));
            });
        });

    function selecionarSalao(indexAtivo) {
        const cardsElements = document.querySelectorAll('.card-salao');
        marcadores.forEach((m, i) => {
            const card = cardsElements[i];
            if (!card) return;
            if (i === indexAtivo) {
                m.setIcon(iconeVermelho);
                m.setZIndexOffset(1000);
                map.flyTo(m.getLatLng(), 15, { duration: 1 });
                card.querySelector('.card').classList.add('card-ativo-mapa');
            } else {
                m.setIcon(iconeAzul);
                m.setZIndexOffset(0);
                card.querySelector('.card').classList.remove('card-ativo-mapa');
            }
        });
    }

    document.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.card-salao');
        if (card && window.innerWidth > 768) {
            const index = card.getAttribute('data-index');
            selecionarSalao(parseInt(index));
        }
    });

    // --- GEOLOCALIZAÇÃO ---
    map.locate({ setView: true, maxZoom: 15 });
    map.on('locationfound', (e) => {
        L.marker(e.latlng).addTo(map).bindPopup("<b>Você está aqui!</b>").openPopup();
        L.circle(e.latlng, { radius: e.accuracy, color: '#d93d3d', fillOpacity: 0.1 }).addTo(map);

        todosSaloes.forEach((local, index) => {
            const pontoComercio = L.latLng(local.lat, local.lng);
            const dist = e.latlng.distanceTo(pontoComercio);
            let textoDistancia = dist >= 1000 ? (dist / 1000).toFixed(1) + " km" : Math.round(dist) + " m";
            const el = document.getElementById(`dist-${index}`);
            if (el) el.innerText = textoDistancia;
        });
    });

    // --- LÓGICA DE BUSCA ---
    function filtrarCards(termo) {
        const searchTerm = termo.toLowerCase();
        document.querySelectorAll('.card-salao').forEach(cardDiv => {
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

// --- AGENDAMENTO DINÂMICO (COM MODAL BONITO) ---
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-agendar-real')) {
            
            const usuarioAtivo = JSON.parse(localStorage.getItem('usuario_logado'));

            if (!usuarioAtivo) {
                // 1. Em vez de alert, abrimos o nosso novo modal de aviso
                const modalAviso = new bootstrap.Modal(document.getElementById('modalAvisoLogin'));
                modalAviso.show();
                return; 
            }

            // 2. Se logado, segue o fluxo normal
            const email = e.target.getAttribute('data-email');
            const nome = e.target.getAttribute('data-nome');
            
            const modalLabel = document.getElementById('modalAgendamentoLabel');
            if(modalLabel) modalLabel.innerText = `Agendar em: ${nome}`;

            // ... (restante do seu código de preencher horários) ...
            
            if(bModal) bModal.show();
        }
    });

    // Função auxiliar para trocar de modal suavemente
    window.irParaLogin = function() {
        const modalAviso = bootstrap.Modal.getInstance(document.getElementById('modalAvisoLogin'));
        modalAviso.hide();
        
        setTimeout(() => {
            const modalLogin = new bootstrap.Modal(document.getElementById('modalLogin'));
            modalLogin.show();
        }, 400); // Pequeno delay para a animação de saída terminar
    };

    if(formAgendamento) {
        formAgendamento.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = formAgendamento.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processando...';
            
            setTimeout(() => {
                statusPagamento.innerHTML = '<b class="text-success">Pagamento Aprovado!</b>';
                setTimeout(() => {
                    // Salvar agendamento no localStorage do usuario
                    const usuarioAtivo = JSON.parse(localStorage.getItem('usuario_logado'));
                    if (usuarioAtivo && usuarioAtivo.tipo === 'cliente') {
                        const chave = `agendamentos_${usuarioAtivo.email}`;
                        const agendamentos = JSON.parse(localStorage.getItem(chave)) || [];
                        agendamentos.push({
                            salao: document.getElementById('modalAgendamentoLabel').innerText.replace('Agendar em: ', ''),
                            data: document.getElementById('dataAgendamento').value,
                            hora: document.getElementById('horaAgendamento').value,
                            pagamento: document.getElementById('metodoPagamento').value,
                            status: 'confirmado',
                            criadoEm: new Date().toISOString()
                        });
                        localStorage.setItem(chave, JSON.stringify(agendamentos));
                    }

                    if(bModal) bModal.hide();
                    formAgendamento.reset();
                    statusPagamento.innerHTML = '';
                    btnSubmit.disabled = false;
                    btnSubmit.innerText = 'Confirmar e Pagar';
                    alert("Sucesso! Agendamento confirmado.");
                }, 2000);
            }, 1500);
        });
    }

    // --- FAVORITAR SALAO ---
    document.addEventListener('click', (e) => {
        const btnFav = e.target.closest('.btn-favoritar');
        if (!btnFav) return;
        e.stopPropagation();

        const usuarioAtivo = JSON.parse(localStorage.getItem('usuario_logado'));
        if (!usuarioAtivo || usuarioAtivo.tipo !== 'cliente') {
            const modalAviso = new bootstrap.Modal(document.getElementById('modalAvisoLogin'));
            modalAviso.show();
            return;
        }

        const nome = btnFav.getAttribute('data-nome');
        const img = btnFav.getAttribute('data-img');
        const servicos = btnFav.getAttribute('data-servicos');
        const chave = `favoritos_${usuarioAtivo.email}`;
        const favoritos = JSON.parse(localStorage.getItem(chave)) || [];

        const jaFavoritou = favoritos.findIndex(f => f.nome === nome);
        const icone = btnFav.querySelector('i');

        if (jaFavoritou >= 0) {
            favoritos.splice(jaFavoritou, 1);
            icone.classList.remove('bi-heart-fill');
            icone.classList.add('bi-heart');
            btnFav.classList.remove('btn-danger');
            btnFav.classList.add('btn-outline-danger');
        } else {
            favoritos.push({ nome, img, servicos });
            icone.classList.remove('bi-heart');
            icone.classList.add('bi-heart-fill');
            btnFav.classList.remove('btn-outline-danger');
            btnFav.classList.add('btn-danger');
        }
        localStorage.setItem(chave, JSON.stringify(favoritos));
    });

    // Marcar favoritos ja existentes ao carregar
    const sessaoFav = JSON.parse(localStorage.getItem('usuario_logado'));
    if (sessaoFav && sessaoFav.tipo === 'cliente') {
        const favs = JSON.parse(localStorage.getItem(`favoritos_${sessaoFav.email}`)) || [];
        document.querySelectorAll('.btn-favoritar').forEach(btn => {
            const nome = btn.getAttribute('data-nome');
            if (favs.find(f => f.nome === nome)) {
                const icone = btn.querySelector('i');
                icone.classList.remove('bi-heart');
                icone.classList.add('bi-heart-fill');
                btn.classList.remove('btn-outline-danger');
                btn.classList.add('btn-danger');
            }
        });
    }

    // --- SISTEMA DE LOGIN E CADASTRO (COM REDIRECIONAMENTO AJUSTADO) ---
    const salvarLocalmente = (usuario) => {
        const banco = JSON.parse(localStorage.getItem('usuarios_pwa')) || [];
        if (banco.find(u => u.email === usuario.email)) return alert("Este e-mail já está cadastrado!");
        
        banco.push(usuario);
        localStorage.setItem('usuarios_pwa', JSON.stringify(banco));
        localStorage.setItem('usuario_logado', JSON.stringify(usuario));
        
        alert("Cadastro realizado com sucesso!");
        
        // Regra de Redirecionamento
        if (usuario.tipo === 'empresa') {
            window.location.href = 'painel-empresa.html';
        } else {
            window.location.reload(); // Cliente fica na página
        }
    };

    const realizarLogin = (email, senha, tipoDesejado) => {
        const banco = JSON.parse(localStorage.getItem('usuarios_pwa')) || [];
        const user = banco.find(u => u.email === email.toLowerCase().trim() && u.senha === senha);
        
        if (!user || user.tipo !== tipoDesejado) return alert("E-mail ou senha incorretos.");
        
        localStorage.setItem('usuario_logado', JSON.stringify(user));

        // Regra de Redirecionamento
        if (user.tipo === 'empresa') {
            window.location.href = 'painel-empresa.html';
        } else {
            window.location.reload(); // Cliente fica na página
        }
    };

    // Listeners dos formulários
    const fCadUser = document.getElementById('formCadUsuario');
    if(fCadUser) fCadUser.addEventListener('submit', (e) => {
        e.preventDefault();
        if (document.getElementById('cad-senha-usuario').value !== document.getElementById('cad-confirmar-senha-usuario').value) return alert("Senhas não coincidem!");
        salvarLocalmente({
            nome: document.getElementById('cad-nome-usuario').value.trim(),
            sobrenome: document.getElementById('cad-sobrenome-usuario').value.trim(),
            email: document.getElementById('cad-email-usuario').value.toLowerCase().trim(),
            senha: document.getElementById('cad-senha-usuario').value,
            tipo: 'cliente'
        });
    });

    const fCadEmp = document.getElementById('formCadEmpresa');
    if(fCadEmp) fCadEmp.addEventListener('submit', (e) => {
        e.preventDefault();
        if (document.getElementById('cad-senha-empresa').value !== document.getElementById('cad-confirmar-senha-empresa').value) return alert("Senhas não coincidem!");
        salvarLocalmente({
            nomeFantasia: document.getElementById('cad-nome-fantasia').value.trim(),
            razaoSocial: document.getElementById('cad-razao-social').value.trim(),
            email: document.getElementById('cad-email-empresa').value.toLowerCase().trim(),
            senha: document.getElementById('cad-senha-empresa').value,
            tipo: 'empresa'
        });
    });

    const fLogUser = document.getElementById('formLoginUsuario');
    if(fLogUser) fLogUser.addEventListener('submit', (e) => {
        e.preventDefault();
        realizarLogin(document.getElementById('login-email-usuario').value, document.getElementById('login-senha-usuario').value, 'cliente');
    });

    const fLogEmp = document.getElementById('formLoginEmpresa');
    if(fLogEmp) fLogEmp.addEventListener('submit', (e) => {
        e.preventDefault();
        realizarLogin(document.getElementById('login-email-empresa').value, document.getElementById('login-senha-empresa').value, 'empresa');
    });

    // --- DROPDOWN DE SESSÃO ATIVA ---
    const sessao = JSON.parse(localStorage.getItem('usuario_logado'));
    if (sessao) {
        const headerAction = document.querySelector('.header-action');
        const btnLoginOriginal = document.querySelector('button[data-bs-target="#modalLogin"]');
        if (headerAction && btnLoginOriginal) {
            const nomeExibicao = (sessao.nome || sessao.nomeFantasia).split(' ')[0];
            headerAction.innerHTML = `
                <button id="btn-notificacao" class="btn btn-link text-dark position-relative p-0 border-0 me-3">
                    <i class="bi bi-bell fs-4"></i>
                    <span id="badge-notificacao" class="position-absolute top-0 start-100 translate-middle p-1 bg-success border border-light rounded-circle d-none"></span>
                </button>
                <div class="dropdown">
                    <button class="btn btn-outline-dark rounded-pill px-3 dropdown-toggle d-flex align-items-center" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle me-2"></i> ${nomeExibicao}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                        <li><a class="dropdown-item py-2" href="${sessao.tipo === 'empresa' ? 'painel-empresa.html' : 'painel-usuario.html'}"><i class="bi bi-person me-2"></i>Meu Painel</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item py-2 text-danger" href="#" id="fazerLogout"><i class="bi bi-box-arrow-right me-2"></i>Sair</a></li>
                    </ul>
                </div>`;
            document.getElementById('fazerLogout').addEventListener('click', () => {
                localStorage.removeItem('usuario_logado');
                window.location.reload();
            });
        }
    }
});

// --- NOTIFICAÇÕES ---
document.addEventListener('DOMContentLoaded', () => {
    const btnNotificacao = document.getElementById('btn-notificacao');
    const badge = document.getElementById('badge-notificacao');
    if (Notification.permission === 'granted' && badge) badge.classList.remove('d-none');
    if (btnNotificacao) {
        btnNotificacao.addEventListener('click', async () => {
            if (!('Notification' in window)) return alert('Navegador sem suporte.');
            const permissao = await Notification.requestPermission();
            if (permissao === 'granted') {
                alert('Notificações ativadas!');
                if(badge) badge.classList.remove('d-none');
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const categorias = document.querySelectorAll('.category-item');
    const cards = document.querySelectorAll('.card-salao');
    const listingsSide = document.querySelector('.listings-side'); // Referência para o scroll

    categorias.forEach(item => {
        item.style.cursor = 'pointer';

        item.addEventListener('click', function() {
            // Prioriza o data-categoria, senão pega o texto do parágrafo
            const filtro = (this.getAttribute('data-categoria') || this.querySelector('p').innerText).toLowerCase().trim();

            // Ação para o botão "Todos"
            if (filtro === 'todos') {
                cards.forEach(card => card.style.display = 'block');
                categorias.forEach(c => c.style.opacity = '1');
                if (listingsSide) listingsSide.scrollTop = 0; 
                return;
            }

            // Mapeamento de termos (Ex: Manicure vira Unhas para bater com o card)
            let termoBusca = filtro;
            if (filtro === 'manicure') termoBusca = 'unhas';

            cards.forEach(card => {
                const textoServicos = card.querySelector('.card-text').innerText.toLowerCase();
                
                // Exibe se encontrar o termo, senão esconde
                if (textoServicos.includes(termoBusca)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });

            // Feedback visual: destaca a categoria ativa e suaviza as outras
            categorias.forEach(c => c.style.opacity = '0.5');
            this.style.opacity = '1';

            // No mobile, volta para o topo da lista ao filtrar
            if (listingsSide) listingsSide.scrollTop = 0;
        });
    });
});

