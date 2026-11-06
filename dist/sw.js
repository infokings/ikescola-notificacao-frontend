// Service worker do IKEscola 2.0 App: mostra a notificação de entrada/saída e guarda a casca do app para abrir
// rápido (os dados sempre vêm da rede). Mesmo arquivo e mesmo escopo da versão anterior: a inscrição de push
// dos aparelhos continua valendo depois da atualização.
const CACHE = 'ikf-v4'   // v4 = app em Vue (apaga o cache da versão anterior)
const CASCA = ['/', '/index.html', '/manifest.webmanifest', '/icones/icone-192.png', '/icones/badge-96.png', '/icones/logo-infokings.png']

// Cache é só para abrir rápido: se falhar, instala assim mesmo (sem service worker não há notificação)
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CASCA)).catch(() => {}).then(() => self.skipWaiting())) })
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return
  // Arquivos do build (assets/) têm hash no nome e nunca mudam: cache primeiro
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)) }
      return res
    })))
    return
  }
  // O resto: rede primeiro (versão nova do app), cache se estiver sem internet.
  // cache: 'no-cache' = confere com o servidor sempre (o cache HTTP do navegador segurava a versão antiga)
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => {
    if (r.ok && (CASCA.includes(url.pathname) || e.request.mode === 'navigate')) {
      const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request.mode === 'navigate' ? '/' : e.request, copia))
    }
    return r
  }).catch(() => caches.match(e.request).then(r => r || caches.match('/'))))
})

self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch (err) { d = { titulo: 'IKEscola 2.0 App', corpo: e.data ? e.data.text() : '' } }
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.titulo || 'IKEscola 2.0 App', {
      body: d.corpo || '', tag: d.tag, renotify: true,
      icon: '/icones/icone-192.png', badge: '/icones/badge-96.png', data: { url: d.url || '/' },
    }),
    self.clients.matchAll({ type: 'window' }).then(cs => cs.forEach(c => c.postMessage('atualizar'))),
  ]))
})
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const alvo = (e.notification.data && e.notification.data.url) || '/'
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if ('focus' in c) { c.postMessage('atualizar'); return c.focus() }
    return self.clients.openWindow(alvo)
  }))
})
