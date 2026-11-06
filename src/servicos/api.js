// Chamadas à API. No navegador e no app Android o endereço é o mesmo site; no app iPhone (Capacitor)
// window.IKF_API traz o endereço do servidor.
import { cabecalhoAparelho } from './dispositivo.js'

const base = () => window.IKF_API || import.meta.env.VITE_API_URL || ''

/** Devolve o JSON da resposta com o status HTTP em `status`. Nunca lança por erro HTTP. */
export async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const cab = { 'Content-Type': 'application/json' }
  const auth = cabecalhoAparelho()
  if (auth) cab.Authorization = auth
  const r = await fetch(base() + caminho, { method: metodo, headers: cab, body: corpo ? JSON.stringify(corpo) : undefined })
  let d
  try { d = await r.json() } catch (e) { d = { ok: false, erro: 'Resposta inválida do servidor.' } }
  d.status = r.status
  return d
}

/** Foto do aluno (só se a escola ligou a opção), como URL local (blob). Guardada por versão. */
const fotos = new Map()
export async function urlDaFoto(escolaId, eid, versao) {
  const chave = escolaId + '|' + eid + '|' + versao
  if (fotos.has(chave)) return fotos.get(chave)
  const r = await fetch(base() + '/api/foto?escola=' + encodeURIComponent(escolaId) + '&eid=' + encodeURIComponent(eid),
    { headers: { Authorization: cabecalhoAparelho() } })
  if (!r.ok) throw new Error(String(r.status))
  const url = URL.createObjectURL(await r.blob())
  fotos.set(chave, url)
  return url
}
