// 1. Registra o Service Worker ao carregar a página
if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.register('/service-worker.js')
    .then(reg => {
    console.log('SW registrado:', reg.scope);
    configurarBotao(reg);
    })
    .catch(err => console.error('Erro ao registrar SW:', err));
   }
   
   // 2. Configura o botão de inscrição
   function configurarBotao(registration) {
    const btn = document.getElementById('btn-subscribe');
    btn.addEventListener('click', async () => {
    const permissao = await Notification.requestPermission();
    if (permissao === 'granted') {
    await inscreverUsuario(registration);
    btn.disabled = true;
    btn.textContent = '    Notificações Ativadas';
    } else {
    btn.textContent = ' Permissão Negada';
    }
    });
   }

   // 3. Cria a subscription com a chave VAPID pública
   async function inscreverUsuario(registration) {
    const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array('BKCecrufpaBFNlscGD0MAlkEfFMbwuav-zHLa_0cwuzOtcyNftQB0g9ZuhPx46-zKSgtbfx4W862tSa795rkff0')
    });
    console.log('Subscription:', JSON.stringify(subscription));
    // Envie 'subscription' para o seu back-end aqui
   }
   
   // Utilitário: converte chave VAPID de Base64 para Uint8Array
   function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
    .replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
   }


