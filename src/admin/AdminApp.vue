<template>
  <CabecalhoApp subtitulo="Gestão de Escolas" />
  <main>
    <div v-if="logado" class="barra-sair">
      <Button label="Sair" link class="link" @click="sair" />
    </div>
    <TelaAdminLogin v-if="!logado" @entrou="logado = true" />
    <TelaAdminEscolas v-else />

    <footer>IKAcesso Escola · InfoKings · <a href="/privacidade.html">Privacidade</a></footer>
  </main>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import CabecalhoApp from '../componentes/CabecalhoApp.vue'
import TelaAdminLogin from './TelaAdminLogin.vue'
import TelaAdminEscolas from './TelaAdminEscolas.vue'
import { sair as sairSessao, tokenSalvo } from '../servicos/adminApi.js'

const logado = ref(!!tokenSalvo())

function expirou() {
  logado.value = false
}
onMounted(() => window.addEventListener('admin-sessao-expirada', expirou))
onBeforeUnmount(() => window.removeEventListener('admin-sessao-expirada', expirou))

function sair() {
  sairSessao()
  logado.value = false
}
</script>

<style scoped>
/* Mesma linguagem visual do app dos pais (App.vue), só mais largo — tabela precisa de mais espaço que um cartão de celular */
main { max-width: 900px; margin: 0 auto; padding: 14px 14px calc(24px + env(safe-area-inset-bottom)); }
.barra-sair { display: flex; justify-content: flex-end; margin-bottom: 4px; }
.link { padding: 6px 0; font-size: 13px; color: var(--ikf-suave); text-decoration: underline; }
footer { text-align: center; font-size: 11px; color: var(--ikf-suave); margin-top: 18px; }
footer a { color: var(--ikf-suave); }
</style>
