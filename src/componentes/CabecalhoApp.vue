<template>
  <header class="cabecalho">
    <img class="logo" src="/icones/logo-infokings.png" alt="InfoKings">
    <span class="titulo"><b>IKEscola 2.0</b> <span class="app">App</span></span>
  </header>
  <div class="subbarra">{{ subtitulo }}</div>
</template>

<script setup>
defineProps({
  subtitulo: { type: String, default: 'Entrada e saída do aluno na escola' },
})
</script>

<style scoped>
.cabecalho {
  background: var(--ikf-marinho);
  padding: calc(10px + env(safe-area-inset-top)) 16px 10px;
  min-height: 54px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .25);
}
.logo { height: 34px; width: auto; display: block; }
.titulo { color: #fff; font-size: 18px; letter-spacing: -.2px; }
.titulo b { font-weight: 800; }
.app { color: var(--ikf-laranja); font-weight: 600; }
.subbarra {
  background: var(--ikf-marinho2);
  color: rgba(255, 255, 255, .7);
  font-size: 12px;
  padding: 8px 16px;
  border-bottom: 3px solid var(--ikf-laranja);
}
</style>
