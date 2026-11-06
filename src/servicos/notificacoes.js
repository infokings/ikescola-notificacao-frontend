// Notificações: web push (navegador e app Android, que roda no Chrome) ou nativa da Apple (app iPhone da loja,
// Capacitor — o WKWebView não tem web push).
import { ref } from 'vue'
import { api } from './api.js'

export const ehIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const CAP = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() ? window.Capacitor : null
const PN = CAP && CAP.Plugins && CAP.Plugins.PushNotifications
export const nativo = !!PN
export const instalado = !!CAP || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
export const temPush = PN ? true : ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)

/** 'default' | 'granted' | 'denied' (reativo, para o aviso na tela) */
export const permissao = ref(PN ? 'default' : (temPush ? Notification.permission : 'default'))
function atualizarPermissao(v) { permissao.value = v || (PN ? permissao.value : Notification.permission) }

/** Inscrição → corpo da API ({ sub } ou { nativo }) e chave para saber se mudou */
export function corpoInscricao(x) { return x.nativo ? { nativo: x.nativo } : { sub: x } }
export function chaveInscricao(x) { return x.nativo ? x.nativo.token : x.endpoint }

// A tela não espera o service worker (se ele demorar ou falhar, o app abre mesmo assim); só ativar os avisos
// precisa dele — aí espera até 8 s.
let registro = null
const swPronto = (CAP || !('serviceWorker' in navigator)) ? Promise.resolve(null)
  : navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready)
    .then(r => { registro = r; return r }).catch(() => null)
const esperarSW = () => Promise.race([swPronto, new Promise(r => setTimeout(() => r(null), 8000))])

function chaveVapid(b64) {
  const pad = '='.repeat((4 - b64.length % 4) % 4), bin = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Pede permissão (precisa ser num toque do usuário, se `pedir`) e devolve a inscrição, ou null. */
export async function inscreverPush(pedir) {
  if (PN) return inscreverNativo(pedir)
  if (!temPush) return null
  if (!registro) await esperarSW()
  if (!registro) return null
  if (Notification.permission === 'denied') { atualizarPermissao(); return null }
  if (Notification.permission !== 'granted') {
    if (!pedir) return null
    const p = await Notification.requestPermission()
    atualizarPermissao()
    if (p !== 'granted') return null
  }
  let sub = await registro.pushManager.getSubscription()
  if (!sub) {
    const cfg = await api('/api/config')
    if (!cfg.ok || !cfg.vapidPublica) return null
    // sem serviço de push (celular sem Google, rede bloqueada) a inscrição pode não responder: limite de 15 s
    sub = await Promise.race([registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveVapid(cfg.vapidPublica) }),
      new Promise(r => setTimeout(() => r(null), 15000))])
    if (!sub) return null
  }
  return sub.toJSON()
}

async function inscreverNativo(pedir) {
  let perm = await PN.checkPermissions()
  if (perm.receive !== 'granted' && pedir) perm = await PN.requestPermissions()
  atualizarPermissao(perm.receive === 'granted' ? 'granted' : (perm.receive === 'denied' ? 'denied' : 'default'))
  if (permissao.value !== 'granted') return null
  const token = await new Promise((resolve) => {
    PN.addListener('registration', t => resolve(t && t.value))
    PN.addListener('registrationError', () => resolve(null))
    PN.register()
    setTimeout(() => resolve(null), 15000)
  })
  return token ? { nativo: { canal: 'apns', token } } : null
}

/** Chama `fn` quando chega um aviso com o app aberto (para atualizar a tela). */
export function aoReceberAviso(fn) {
  if (PN) {
    PN.addListener('pushNotificationReceived', () => fn())
    PN.checkPermissions().then(p => atualizarPermissao(p.receive === 'granted' ? 'granted' : (p.receive === 'denied' ? 'denied' : 'default')))
  } else if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', e => { if (e.data === 'atualizar') fn() })
  }
}
