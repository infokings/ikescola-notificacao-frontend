<template>
  <div class="cartao">
    <div class="topo-lista">
      <div class="rotulo">Escolas cadastradas</div>
      <Button label="Novo" icon="pi pi-plus" size="small" @click="abrirCadastro" />
    </div>
    <DataTable :value="escolas" :loading="carregando" striped-rows size="small" class="tabela">
      <Column field="nome" header="Nome" />
      <Column field="cnpj" header="CNPJ" />
      <Column field="email" header="E-mail" />
      <Column header="Cadastro">
        <template #body="{ data }">{{ formatarData(data.criada) }}</template>
      </Column>
      <Column header="Ações">
        <template #body="{ data }">
          <Button label="Nova chave" link class="link" @click="confirmarRenovacao(data)" />
          <Button label="Excluir" link class="link link-perigo" @click="confirmarExclusao(data)" />
        </template>
      </Column>
    </DataTable>
  </div>

  <Dialog v-model:visible="cadastroVisivel" header="Cadastrar escola" modal :style="{ width: 'min(92vw, 420px)' }">
    <label for="nome" class="rotulo campo-rotulo">Nome da escola</label>
    <InputText id="nome" v-model="novo.nome" fluid />

    <label for="cnpj" class="rotulo campo-rotulo">CNPJ</label>
    <InputText id="cnpj" v-model="novo.cnpj" fluid placeholder="00.000.000/0000-00" />

    <label for="email-escola" class="rotulo campo-rotulo">E-mail</label>
    <InputText id="email-escola" v-model="novo.email" type="email" fluid />

    <Button label="Cadastrar escola" icon="pi pi-plus" fluid class="botao-principal" :loading="ocupado" @click="cadastrar" />
    <div class="msg" :class="erroCadastro && 'erro'">{{ erroCadastro }}</div>
  </Dialog>

  <Dialog v-model:visible="chaveVisivel" header="Chave de acesso" modal :style="{ width: 'min(92vw, 460px)' }">
    <p>Copie e envie para a escola configurar no IKAcesso (Integrações → IKEscola 2.0 App). <b>Só aparece agora.</b></p>
    <div class="chave-caixa mono">{{ chaveGerada }}</div>
    <Button label="Copiar chave" icon="pi pi-copy" class="botao-principal" @click="copiarChave" />
    <span v-if="copiado" class="suave copiado">Copiada!</span>
  </Dialog>

  <ConfirmDialog />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { adminApi } from '../servicos/adminApi.js'

const confirm = useConfirm()
const escolas = ref([])
const carregando = ref(false)
const novo = ref({ nome: '', cnpj: '', email: '' })
const ocupado = ref(false)
const erroCadastro = ref('')
const cadastroVisivel = ref(false)
const chaveVisivel = ref(false)
const chaveGerada = ref('')
const copiado = ref(false)

async function carregar() {
  carregando.value = true
  try {
    const { status, corpo } = await adminApi('/escolas')
    if (status === 200) escolas.value = corpo
  } finally {
    carregando.value = false
  }
}
onMounted(carregar)

function abrirCadastro() {
  novo.value = { nome: '', cnpj: '', email: '' }
  erroCadastro.value = ''
  cadastroVisivel.value = true
}

async function cadastrar() {
  ocupado.value = true
  erroCadastro.value = ''
  try {
    const { status, corpo } = await adminApi('/escolas', { metodo: 'POST', corpo: novo.value })
    if (status !== 200) { erroCadastro.value = corpo?.erro || 'Não foi possível cadastrar.'; return }
    cadastroVisivel.value = false
    mostrarChave(corpo.chave)
    await carregar()
  } finally {
    ocupado.value = false
  }
}

function confirmarRenovacao(escola) {
  confirm.require({
    message: `Gerar uma nova chave para "${escola.nome}"? A chave atual deixa de funcionar imediatamente.`,
    header: 'Renovar chave', acceptLabel: 'Gerar nova chave', rejectLabel: 'Cancelar',
    accept: async () => {
      const { status, corpo } = await adminApi(`/escolas/${escola.id}/renovar-chave`, { metodo: 'POST' })
      if (status === 200) mostrarChave(corpo.chave)
    },
  })
}

function confirmarExclusao(escola) {
  confirm.require({
    message: `Excluir "${escola.nome}" permanentemente? Isso apaga alunos, vínculos e histórico dessa escola.`,
    header: 'Excluir escola', acceptLabel: 'Excluir', rejectLabel: 'Cancelar', acceptProps: { severity: 'danger' },
    accept: async () => {
      const { status } = await adminApi(`/escolas/${escola.id}`, { metodo: 'DELETE' })
      if (status === 200) await carregar()
    },
  })
}

function mostrarChave(chave) {
  chaveGerada.value = chave
  chaveVisivel.value = true
  copiado.value = false
}
function copiarChave() {
  navigator.clipboard?.writeText(chaveGerada.value)
  copiado.value = true
}
function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString('pt-BR') : ''
}
</script>

<style scoped>
.cartao {
  background: #fff;
  border: 1px solid var(--ikf-borda);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 14px;
  box-shadow: 0 1px 3px rgba(15, 45, 94, .06);
}
.topo-lista { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.campo-rotulo { display: block; margin: 14px 0 5px; }
.campo-rotulo:first-child { margin-top: 0; }
.botao-principal { margin-top: 16px; }
.msg { margin-top: 10px; font-size: 13px; min-height: 1em; }
.msg.erro { color: #dc2626; }
.link { padding: 2px 0; font-size: 13px; color: var(--ikf-suave); text-decoration: underline; margin-right: 10px; }
.link-perigo { color: #dc2626; }
.tabela :deep(.p-datatable-table) { font-size: 14px; }
.chave-caixa {
  font-size: 15px; background: #f5f8fc; border: 1px solid var(--ikf-borda);
  padding: 12px; border-radius: 8px; word-break: break-all; margin: 12px 0;
}
.copiado { margin-left: 10px; color: var(--ikf-verde); }
</style>
