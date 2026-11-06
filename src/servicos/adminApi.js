// Chamadas à API de Gestão de Escolas. Login próprio (Bearer <jwt>), guardado em sessionStorage — não sobrevive a
// fechar a aba (mesmo espírito do token stateless do backend: sem "lembrar de mim" nesta v1).
const CHAVE_TOKEN = 'ikf-admin-token'

export function tokenSalvo() {
  return sessionStorage.getItem(CHAVE_TOKEN)
}
export function salvarToken(token) {
  sessionStorage.setItem(CHAVE_TOKEN, token)
}
export function sair() {
  sessionStorage.removeItem(CHAVE_TOKEN)
}

/** { status, corpo }. Em 401, derruba a sessão local e avisa quem estiver ouvindo (token expirado/inválido). */
export async function adminApi(caminho, { metodo = 'GET', corpo } = {}) {
  const cab = { 'Content-Type': 'application/json' }
  const token = tokenSalvo()
  if (token) cab.Authorization = 'Bearer ' + token
  const r = await fetch('/api/admin' + caminho, { method: metodo, headers: cab, body: corpo ? JSON.stringify(corpo) : undefined })
  if (r.status === 401) { sair(); window.dispatchEvent(new Event('admin-sessao-expirada')) }
  let d = null
  try { d = await r.json() } catch (e) { /* corpo vazio, ex.: DELETE */ }
  return { status: r.status, corpo: d }
}
