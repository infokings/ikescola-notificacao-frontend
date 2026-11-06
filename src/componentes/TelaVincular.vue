<template>
  <div class="cartao">
    <!-- Depois de ler o QR do bilhete: confirma o aluno e ativa com um toque -->
    <template v-if="confirmar">
      <div class="rotulo">Avisos de entrada e saída</div>
      <h2 class="nome-confirmar">{{ confirmar.nome || 'Aluno(a)' }}</h2>
      <div class="suave">{{ [confirmar.turma, confirmar.escola].filter(Boolean).join(' · ') }}</div>

      <!-- iPhone fora da Tela de Início não recebe notificação: mostra os passos no lugar do botão -->
      <PassosIphone v-if="iosSemIcone" class="passos" />
      <Button v-else label="Ativar avisos" icon="pi pi-bell" size="large" fluid class="botao-principal grande"
              :loading="ocupado" @click="$emit('vincular', confirmar.codigo)" />
      <Button label="Não é este aluno? Digitar outro código" link class="link" @click="$emit('digitar')" />
    </template>

    <template v-else>
      <div class="rotulo">Avisos de entrada e saída</div>
      <h2>{{ comCancelar ? 'Adicionar outro aluno' : 'Receber avisos do aluno' }}</h2>
      <div class="suave">Aponte a câmera do celular para o <b>QR code do bilhete</b> que a escola entregou. Ou digite o código:</div>
      <label for="codigo" class="rotulo campo-rotulo">Código do aluno</label>
      <InputText id="codigo" ref="campo" v-model="codigo" fluid class="campo-codigo mono" autocomplete="off" autocapitalize="characters"
                 spellcheck="false" placeholder="XXXX-XXXX-XX" maxlength="20" @keydown.enter="enviar" />
      <Button label="Ativar avisos" icon="pi pi-bell" fluid class="botao-principal" :loading="ocupado" @click="enviar" />
      <Button v-if="comCancelar" label="Cancelar" link class="link" @click="$emit('cancelar')" />
    </template>

    <div class="msg" :class="mensagem?.tipo">{{ mensagem?.texto }}</div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import PassosIphone from './PassosIphone.vue'

const props = defineProps({
  confirmar: { type: Object, default: null },   // { nome, turma, escola, codigo }
  comCancelar: Boolean,
  iosSemIcone: Boolean,
  ocupado: Boolean,
  mensagem: { type: Object, default: null },    // { texto, tipo: 'erro' | 'ok' | '' }
  codigoInicial: { type: String, default: '' },
})
const emit = defineEmits(['vincular', 'digitar', 'cancelar', 'erro'])

const codigo = ref(props.codigoInicial)
const campo = ref(null)
watch(() => props.codigoInicial, v => { codigo.value = v })

function enviar() {
  const c = codigo.value.trim()
  if (c.replace(/[^a-z0-9]/gi, '').length < 8) { emit('erro', 'Digite o código completo.'); return }
  emit('vincular', c)
}
function limpar() { codigo.value = '' }
function focar() { nextTick(() => campo.value?.$el?.focus()) }
defineExpose({ limpar, focar })
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
h2 { font-size: 18px; font-weight: 700; margin: 8px 0 4px; }
.nome-confirmar { font-size: 22px; margin-top: 4px; }
.campo-rotulo { display: block; margin: 14px 0 5px; }
.campo-codigo {
  font-size: 20px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  padding: 11px 12px; background: #f5f8fc;
}
.botao-principal { margin-top: 12px; }
.botao-principal.grande { margin-top: 16px; padding-top: 15px; padding-bottom: 15px; font-size: 17px; }
.link { padding: 6px 0; margin-top: 4px; font-size: 13px; color: var(--ikf-suave); text-decoration: underline; }
.passos { margin-top: 14px; }
.msg { margin-top: 10px; font-size: 13px; min-height: 1em; }
.msg.erro { color: #dc2626; }
.msg.ok { color: var(--ikf-verde); }
</style>
