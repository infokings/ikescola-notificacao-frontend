<template>
  <div class="passos-ios">
    <div class="titulo">No iPhone, falta um passo:</div>
    <div class="passo"><span class="n">1</span><span>Toque em <i class="pi pi-upload compartilhar" /> <b>Compartilhar</b>, na barra do Safari</span></div>
    <div class="passo"><span class="n">2</span><span>Escolha <b>Adicionar à Tela de Início</b></span></div>
    <div class="passo"><span class="n">3</span><span>Abra o <b>IKEscola</b> pelo ícone e toque em <b>Ativar avisos</b></span></div>
  </div>
</template>

<style scoped>
.passos-ios {
  padding: 12px 14px; border-radius: 8px;
  background: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid var(--ikf-laranja);
}
.titulo { font-weight: 700; font-size: 14px; color: #9a3412; margin-bottom: 8px; }
.passo { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; margin-bottom: 8px; line-height: 1.4; }
.n {
  flex: none; width: 22px; height: 22px; border-radius: 50%;
  background: var(--ikf-laranja); color: #fff; font-weight: 700; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
}
.compartilhar { color: #2563eb; font-size: 14px; }
</style>
