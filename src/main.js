import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import './estilo.css'
import App from './App.vue'

// Tema do IKAcesso Escola 2.0: laranja como cor principal, marinho nos textos e no cabeçalho
const IKEscola = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
      500: '#f07316', 600: '#e06010', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff', 50: '#f5f8fc', 100: '#f0f4f8', 200: '#e8eef5', 300: '#d5dfeb', 400: '#9fb0c8',
          500: '#6b7fa3', 600: '#4a5f85', 700: '#1a3f7a', 800: '#163566', 900: '#0f2d5e', 950: '#0a1f42',
        },
        text: { color: '#0f2d5e', mutedColor: '#6b7fa3' },
      },
    },
  },
})

function montar(componenteRaiz) {
  createApp(componenteRaiz)
    .use(PrimeVue, { theme: { preset: IKEscola, options: { darkModeSelector: '.ikf-escuro' } }, locale: { accept: 'Sim', reject: 'Não' } })
    .use(ConfirmationService)
    .mount('#app')
}

// /admin é a Gestão de Escolas (uso interno) — carregada à parte pra não engordar o app dos pais.
if (location.pathname === '/admin') {
  import('./admin/AdminApp.vue').then(m => montar(m.default))
} else {
  montar(App)
}
