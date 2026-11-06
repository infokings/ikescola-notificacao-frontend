<template>
  <Message :severity="tipo" class="aviso" :pt="{ text: { class: 'aviso-texto' } }">
    <template #icon><i :class="icone" class="aviso-icone" /></template>
    <div>
      <b class="aviso-titulo">{{ titulo }}</b>
      <slot />
    </div>
  </Message>
</template>

<script setup>
import { computed } from 'vue'
import Message from 'primevue/message'

const props = defineProps({
  titulo: { type: String, required: true },
  tipo: { type: String, default: 'warn' },   // warn | success
})
const icone = computed(() => props.tipo === 'success' ? 'pi pi-check-circle' : 'pi pi-bell')
</script>

<style scoped>
.aviso { margin-bottom: 14px; }
.aviso-icone { font-size: 18px; align-self: flex-start; margin-top: 2px; }
.aviso-titulo { display: block; margin-bottom: 4px; font-size: 15px; }
:deep(.aviso-texto) { font-size: 14px; font-weight: 400; line-height: 1.45; }
</style>
