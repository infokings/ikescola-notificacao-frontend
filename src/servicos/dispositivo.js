// Identidade do aparelho: id + segredo criados no primeiro vínculo e guardados no navegador.
// As chaves do localStorage são as mesmas da versão anterior: quem já usa o app continua com seus alunos.
import { ref } from 'vue'

const CHAVE = 'ikf_dispositivo'
const CHAVE_ENDPOINT = 'ikf_endpoint'

function ler(chave) {
  try { return localStorage.getItem(chave) } catch (e) { return null }
}
function gravar(chave, valor) {
  try { valor == null ? localStorage.removeItem(chave) : localStorage.setItem(chave, valor) } catch (e) { /* navegação privada */ }
}

let inicial = null
try { inicial = JSON.parse(ler(CHAVE) || 'null') } catch (e) { inicial = null }

/** { id, segredo } ou null */
export const dispositivo = ref(inicial)

export function salvarDispositivo(d) {
  dispositivo.value = d
  gravar(CHAVE, d ? JSON.stringify(d) : null)
}
export function esquecerDispositivo() { salvarDispositivo(null) }

/** Última inscrição de notificação enviada ao servidor (para saber se mudou). */
export const endpointSalvo = {
  ler: () => ler(CHAVE_ENDPOINT),
  gravar: (v) => gravar(CHAVE_ENDPOINT, v),
}

export function cabecalhoAparelho() {
  const d = dispositivo.value
  return d ? 'Dispositivo ' + d.id + '.' + d.segredo : null
}
