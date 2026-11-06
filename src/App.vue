<template>
  <CabecalhoApp />
  <main>
    <AvisoDestaque v-if="avisoIos" titulo="No iPhone, instale o app para receber avisos">
      Toque em <b>Compartilhar</b> (o quadrado com a seta) → <b>Adicionar à Tela de Início</b>. Depois abra o IKEscola pelo
      ícone e ative os avisos por lá. Precisa do iOS 16.4 ou mais novo.
    </AvisoDestaque>

    <AvisoDestaque v-if="avisoNotif.visivel" titulo="Notificações desligadas">
      {{ avisoNotif.texto }}
      <div v-if="avisoNotif.botao" class="aviso-acao">
        <Button label="Ativar notificações" icon="pi pi-bell" severity="secondary" outlined size="small" @click="ativarNotificacoes" />
      </div>
    </AvisoDestaque>

    <TelaVincular v-if="tela === 'vincular'" ref="telaVincular" :confirmar="confirmar" :com-cancelar="comCancelar"
                  :ios-sem-icone="ehIOS && !instalado" :ocupado="ocupado" :mensagem="msgVincular" :codigo-inicial="codigoInicial"
                  @vincular="vincular" @digitar="digitarOutro" @cancelar="carregar" @erro="t => msgVincular = { texto: t, tipo: 'erro' }" />

    <section v-else-if="tela === 'alunos'">
      <AvisoDestaque v-if="ativado" tipo="success" titulo="Pronto!">{{ ativado }}</AvisoDestaque>
      <CartaoAluno v-for="a in alunos" :key="a.escola_id + '|' + a.eid" :aluno="a" @remover="remover" />
      <div class="acoes">
        <Button label="Adicionar outro aluno" icon="pi pi-plus" severity="secondary" outlined @click="adicionarOutro" />
        <Button label="Atualizar" icon="pi pi-refresh" severity="secondary" outlined :loading="atualizando" @click="atualizar" />
      </div>
      <Button v-if="podeInstalar" label="Instalar app na tela do celular" icon="pi pi-mobile" severity="secondary" outlined fluid
              class="instalar" @click="instalar" />
      <div class="msg" :class="msgAlunos?.tipo">{{ msgAlunos?.texto }}</div>
    </section>

    <div v-else class="carregando"><i class="pi pi-spin pi-spinner" /></div>

    <footer>
      IKAcesso Escola · InfoKings · <a href="/privacidade.html">Privacidade</a><br>
      <span>versão {{ VERSAO_APP }}</span>
    </footer>
  </main>
  <ConfirmDialog :style="{ width: 'min(92vw, 380px)' }" />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import CabecalhoApp from './componentes/CabecalhoApp.vue'
import AvisoDestaque from './componentes/AvisoDestaque.vue'
import TelaVincular from './componentes/TelaVincular.vue'
import CartaoAluno from './componentes/CartaoAluno.vue'
import { api } from './servicos/api.js'
import { dispositivo, salvarDispositivo, esquecerDispositivo, endpointSalvo } from './servicos/dispositivo.js'
import { ehIOS, instalado, nativo, temPush, permissao, inscreverPush, corpoInscricao, chaveInscricao, aoReceberAviso } from './servicos/notificacoes.js'

const VERSAO_APP = '2.0 (03/11/2026)'   // aparece no rodapé: o suporte confere se o celular está com a versão nova

const confirm = useConfirm()
const tela = ref('carregando')            // carregando | vincular | alunos
const alunos = ref([])
const confirmar = ref(null)               // aluno do QR, antes de ativar
const comCancelar = ref(false)
const codigoInicial = ref('')
const ocupado = ref(false)
const atualizando = ref(false)
const ativado = ref('')
const msgVincular = ref(null)
const msgAlunos = ref(null)
const inscritoNoServidor = ref(false)
const avisoIos = ref(false)
const telaVincular = ref(null)

// ── Aviso de notificações ──
const avisoNotif = computed(() => {
  const oculto = { visivel: false }
  if (!dispositivo.value || tela.value === 'carregando') return oculto
  if (ehIOS && !instalado) return oculto   // o aviso do iPhone já explica
  if (!temPush) {
    return { visivel: true, botao: false, texto: 'Este navegador não recebe notificações. Use o Chrome no Android ou instale o app no iPhone (iOS 16.4+).' }
  }
  if (permissao.value === 'denied') {
    return { visivel: true, botao: false, texto: nativo ? 'As notificações foram bloqueadas. Libere em Ajustes → IKEscola → Notificações e abra o app de novo.'
      : 'As notificações foram bloqueadas. Libere nas configurações do navegador para este site e abra o app de novo.' }
  }
  if (permissao.value === 'granted' && inscritoNoServidor.value) return oculto
  return { visivel: true, botao: true, texto: 'Ative para saber na hora quando o aluno entrar ou sair.' }
})

async function ativarNotificacoes() {
  const sub = await inscreverPush(true)
  if (!sub) { inscritoNoServidor.value = false; return }
  const r = await api('/api/inscricao', { metodo: 'POST', corpo: corpoInscricao(sub) })
  if (r.ok) endpointSalvo.gravar(chaveInscricao(sub))
  inscritoNoServidor.value = !!r.ok
}

// ── Telas ──
function mostrarVincular(cancelar) {
  tela.value = 'vincular'
  confirmar.value = null
  comCancelar.value = cancelar
  msgVincular.value = null
}
function mostrarConfirmar(aluno, codigo) {
  tela.value = 'vincular'
  confirmar.value = { ...aluno, codigo }
  avisoIos.value = false
  msgVincular.value = null
}
function digitarOutro() {
  history.replaceState(null, '', '/')
  mostrarVincular(!!dispositivo.value)
  telaVincular.value?.focar()
}
function adicionarOutro() {
  ativado.value = ''
  codigoInicial.value = ''
  mostrarVincular(true)
  telaVincular.value?.focar()
}

async function carregar() {
  if (!dispositivo.value) { mostrarVincular(false); return }
  let d
  try { d = await api('/api/feed') } catch (e) { d = { ok: false } }
  if (d.status === 401) { esquecerDispositivo(); mostrarVincular(false); return }
  if (!d.ok) { tela.value = 'alunos'; msgAlunos.value = { texto: d.erro || 'Sem conexão. Tente de novo.', tipo: 'erro' }; return }
  inscritoNoServidor.value = !!d.inscrito
  if (!d.alunos.length) { mostrarVincular(false); return }
  alunos.value = d.alunos
  tela.value = 'alunos'
  msgAlunos.value = null
  // Inscrição mudou (navegador renovou)? manda a atual
  if (temPush && permissao.value === 'granted') {
    const sub = await inscreverPush(false)
    if (sub && (!d.inscrito || endpointSalvo.ler() !== chaveInscricao(sub))) {
      const r = await api('/api/inscricao', { metodo: 'POST', corpo: corpoInscricao(sub) })
      if (r.ok) { endpointSalvo.gravar(chaveInscricao(sub)); inscritoNoServidor.value = true }
    }
  }
}
async function atualizar() {
  atualizando.value = true
  msgAlunos.value = { texto: 'Atualizando…', tipo: '' }
  try { await carregar() } finally { atualizando.value = false }
}

async function vincular(codigo) {
  ocupado.value = true
  msgVincular.value = { texto: 'Ativando…', tipo: '' }
  try {
    let sub = null
    try { sub = await inscreverPush(true) } catch (e) { sub = null }
    const d = await api('/api/vincular', { metodo: 'POST', corpo: Object.assign({ codigo }, sub ? corpoInscricao(sub) : {}) })
    if (!d.ok) { msgVincular.value = { texto: d.erro || 'Não foi possível ativar.', tipo: 'erro' }; return }
    if (d.dispositivo) salvarDispositivo(d.dispositivo)
    if (sub) endpointSalvo.gravar(chaveInscricao(sub))
    telaVincular.value?.limpar()
    codigoInicial.value = ''
    history.replaceState(null, '', '/')
    msgVincular.value = null
    const nome = d.aluno.nome || 'o aluno'
    ativado.value = sub ? 'Você vai receber um aviso quando ' + nome + ' entrar ou sair da escola.'
      : nome + ' foi adicionado(a), mas as notificações estão desligadas — veja o aviso acima.'
    await carregar()
  } catch (e) {
    msgVincular.value = { texto: 'Sem conexão. Tente de novo.', tipo: 'erro' }
  } finally { ocupado.value = false }
}

function remover(aluno) {
  confirm.require({
    header: 'Remover aluno',
    message: 'Parar de receber os avisos de ' + (aluno.nome || 'este aluno') + ' neste aparelho?',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { label: 'Remover', severity: 'danger' },
    rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
    accept: async () => {
      await api('/api/desvincular', { metodo: 'POST', corpo: { escola_id: aluno.escola_id, eid: aluno.eid } })
      ativado.value = ''
      carregar()
    },
  })
}

// ── Android: botão "Instalar app" (o Chrome oferece quando o site pode virar app) ──
const pedidoInstalar = ref(null)
const podeInstalar = computed(() => !!pedidoInstalar.value && !instalado)
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pedidoInstalar.value = e })
async function instalar() {
  const p = pedidoInstalar.value
  if (!p) return
  p.prompt()
  try { await p.userChoice } catch (e) { /* */ }
  pedidoInstalar.value = null
}

// ── Início: código vindo do QR/link do bilhete (/?c=XXXXXXXXXX) ──
async function inicio() {
  const codigoUrl = new URLSearchParams(location.search).get('c')
  avisoIos.value = ehIOS && !instalado && !codigoUrl
  if (!codigoUrl) return carregar()
  const manifesto = document.getElementById('manifesto')   // ícone do iPhone já abre neste aluno
  if (manifesto) manifesto.href = '/api/manifest?c=' + encodeURIComponent(codigoUrl)
  let r
  try { r = await api('/api/aluno?c=' + encodeURIComponent(codigoUrl)) } catch (e) { r = { ok: false, erro: 'Sem conexão. Tente de novo.' } }
  if (!r.ok) {
    await carregar()
    // Código do link/ícone não vale mais (a escola gerou um novo, ou foi digitado errado), mas o aparelho já tem
    // alunos: fica na lista.
    if (dispositivo.value && tela.value === 'alunos') {
      history.replaceState(null, '', '/')
      msgAlunos.value = { texto: 'O código do link não vale mais (a escola pode ter gerado um novo). Seus alunos continuam aqui.', tipo: '' }
      return
    }
    mostrarVincular(!!dispositivo.value)
    codigoInicial.value = codigoUrl
    msgVincular.value = { texto: r.erro || 'Código não encontrado.', tipo: 'erro' }
    return
  }
  // Ícone do iPhone abre sempre com o código: se o aluno já está ativo neste aparelho, só mostra a lista
  if (dispositivo.value) {
    const f = await api('/api/feed')
    if (f.ok && f.alunos.some(a => a.escola_id === r.aluno.escola_id && a.eid === r.aluno.eid)) { history.replaceState(null, '', '/'); return carregar() }
  }
  mostrarConfirmar(r.aluno, codigoUrl)
}

onMounted(() => {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && dispositivo.value && tela.value === 'alunos') carregar() })
  aoReceberAviso(() => { if (dispositivo.value) carregar() })
  inicio()
})
</script>

<style scoped>
main { max-width: 560px; margin: 0 auto; padding: 14px 14px calc(24px + env(safe-area-inset-bottom)); }
.aviso-acao { margin-top: 10px; }
.acoes { display: flex; gap: 8px; flex-wrap: wrap; }
.acoes > * { flex: 1; }
.instalar { margin-top: 8px; }
.msg { margin-top: 10px; font-size: 13px; min-height: 1em; color: var(--ikf-suave); }
.msg.erro { color: #dc2626; }
.carregando { text-align: center; padding: 40px 0; color: var(--ikf-suave); font-size: 22px; }
footer { text-align: center; font-size: 11px; color: var(--ikf-suave); margin-top: 18px; }
footer a { color: var(--ikf-suave); }
</style>
