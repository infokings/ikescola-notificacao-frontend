<template>
  <div class="cartao">
    <div class="rotulo">Gestão de Escolas</div>
    <h2>Entrar</h2>
    <div class="suave">Acesso restrito à equipe da IKEscola.</div>

    <label for="email" class="rotulo campo-rotulo">E-mail</label>
    <InputText id="email" v-model="email" type="email" fluid autocomplete="username" @keydown.enter="entrar" />

    <label for="senha" class="rotulo campo-rotulo">Senha</label>
    <Password id="senha" v-model="senha" fluid :feedback="false" toggle-mask autocomplete="current-password" @keydown.enter="entrar" />

    <Button label="Entrar" icon="pi pi-sign-in" fluid class="botao-principal" :loading="ocupado" @click="entrar" />

    <div class="msg" :class="erro && 'erro'">{{ erro }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import { adminApi, salvarToken } from '../servicos/adminApi.js'

const emit = defineEmits(['entrou'])
const email = ref('')
const senha = ref('')
const ocupado = ref(false)
const erro = ref('')

async function entrar() {
  ocupado.value = true
  erro.value = ''
  try {
    const { status, corpo } = await adminApi('/login', { metodo: 'POST', corpo: { email: email.value, senha: senha.value } })
    if (status !== 200) { erro.value = corpo?.erro || 'Não foi possível entrar.'; return }
    salvarToken(corpo.token)
    emit('entrou')
  } finally {
    ocupado.value = false
  }
}
</script>

<style scoped>
.cartao {
  background: #fff;
  border: 1px solid var(--ikf-borda);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 14px;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 1px 3px rgba(15, 45, 94, .06);
}
h2 { font-size: 18px; font-weight: 700; margin: 8px 0 4px; }
.campo-rotulo { display: block; margin: 14px 0 5px; }
.botao-principal { margin-top: 16px; }
.msg { margin-top: 10px; font-size: 13px; min-height: 1em; }
.msg.erro { color: #dc2626; }
</style>
