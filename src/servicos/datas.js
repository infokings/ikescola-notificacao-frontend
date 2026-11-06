// Datas das passagens: 'AAAA-MM-DD HH:MM:SS' na hora local da escola.

const iso = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')

export const hojeIso = () => iso(new Date())

/** "Hoje", "Ontem" ou "quinta-feira, 30/10" */
export function nomeDia(data) {
  const hoje = new Date()
  const ontem = new Date(hoje.getTime() - 86400e3)
  if (data === iso(hoje)) return 'Hoje'
  if (data === iso(ontem)) return 'Ontem'
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
}

export const hora = (quando) => String(quando).slice(11, 16)

/** Passagens agrupadas por dia, na ordem em que vieram (mais novas primeiro). */
export function porDia(eventos) {
  const grupos = []
  for (const e of eventos || []) {
    const d = e.quando.slice(0, 10)
    let g = grupos[grupos.length - 1]
    if (!g || g.data !== d) { g = { data: d, nome: nomeDia(d), eventos: [] }; grupos.push(g) }
    g.eventos.push(e)
  }
  return grupos
}
