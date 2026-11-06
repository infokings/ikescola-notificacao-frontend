<template>
  <Card class="cartao-aluno">
    <template #content>
      <div class="topo">
        <div class="identidade">
          <img v-if="foto" :src="foto" alt="" class="foto">
          <div>
            <h2>{{ aluno.nome || ('Matrícula ' + aluno.eid) }}</h2>
            <div class="suave">{{ [aluno.turma, aluno.escola].filter(Boolean).join(' · ') }}</div>
          </div>
        </div>
        <Button label="Remover" link size="small" class="remover" @click="$emit('remover', aluno)" />
      </div>

      <div class="situacao">
        <span class="ponto" :class="situacao.classe" />
        <div>
          <strong>{{ situacao.titulo }}</strong>
          <div v-if="situacao.detalhe" class="suave">{{ situacao.detalhe }}</div>
        </div>
      </div>

      <template v-if="dias.length">
        <div v-for="d in dias" :key="d.data">
          <div class="rotulo dia">{{ d.nome }}</div>
          <div v-for="(e, i) in d.eventos" :key="i" class="passagem" :class="e.tipo === 'IN' ? 'entrada' : 'saida'">
            <span class="tipo">{{ e.tipo === 'IN' ? 'Entrada' : 'Saída' }}</span>
            <span class="hora mono">{{ hora(e.quando) }}</span>
          </div>
        </div>
      </template>
      <div v-else class="suave nenhuma">Nenhuma passagem nos últimos 7 dias.</div>
    </template>
  </Card>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import { hojeIso, hora, porDia } from '../servicos/datas.js'
import { urlDaFoto } from '../servicos/api.js'

const props = defineProps({ aluno: { type: Object, required: true } })
defineEmits(['remover'])

const dias = computed(() => porDia(props.aluno.eventos))

const situacao = computed(() => {
  const ultimo = (props.aluno.eventos || [])[0]
  if (ultimo && ultimo.quando.slice(0, 10) === hojeIso()) {
    const dentro = ultimo.tipo === 'IN'
    return { titulo: dentro ? 'Na escola' : 'Saiu da escola', detalhe: (dentro ? 'Entrou' : 'Saiu') + ' às ' + hora(ultimo.quando), classe: dentro ? 'dentro' : 'fora' }
  }
  return { titulo: 'Sem passagem hoje', detalhe: '', classe: '' }
})

// Foto do aluno (só se a escola ligou a opção): baixada com a chave do aparelho e guardada por versão
const foto = ref(null)
watchEffect(async () => {
  const a = props.aluno
  if (!a.foto) { foto.value = null; return }
  try { foto.value = await urlDaFoto(a.escola_id, a.eid, a.foto) } catch (e) { foto.value = null }
})
</script>

<style scoped>
.cartao-aluno {
  margin-bottom: 14px;
  border: 1px solid var(--ikf-borda);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(15, 45, 94, .06);
}
.cartao-aluno :deep(.p-card-body) { padding: 16px; }
.topo { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.identidade { display: flex; gap: 12px; align-items: center; min-width: 0; }
.foto {
  width: 56px; height: 56px; border-radius: 50%; object-fit: cover; flex: none;
  border: 2px solid var(--ikf-laranja); background: var(--ikf-fundo3);
}
h2 { font-size: 18px; font-weight: 700; margin: 0; }
.remover { padding: 2px 0; font-size: 12px; color: var(--ikf-suave); text-decoration: underline; }
.situacao {
  display: flex; align-items: center; gap: 10px; margin: 12px 0 4px; padding: 12px;
  border-radius: 8px; background: var(--ikf-fundo); border: 1px solid var(--ikf-borda);
}
.situacao strong { font-size: 16px; }
.ponto { width: 12px; height: 12px; border-radius: 50%; flex: none; background: var(--ikf-suave); }
.ponto.dentro { background: var(--ikf-verde); }
.ponto.fora { background: var(--ikf-laranja); }
.dia { margin: 14px 0 6px; }
.passagem {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 12px; margin-bottom: 6px; border-radius: 8px;
  background: #fff; border: 1px solid var(--ikf-borda); font-size: 14px;
}
.passagem.entrada { border-left: 4px solid var(--ikf-verde); }
.passagem.saida { border-left: 4px solid var(--ikf-laranja); }
.passagem.entrada .tipo { color: var(--ikf-verde); font-weight: 700; }
.passagem.saida .tipo { color: var(--ikf-laranja); font-weight: 700; }
.hora { font-weight: 700; }
.nenhuma { margin-top: 8px; }
</style>
