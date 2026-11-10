# IKEscola 2.0 App — frontend (Vue 3 + PrimeVue)

App web dos responsáveis (PWA) e tela de **Gestão de Escolas** (`/admin`, uso interno da IKEscola). Publicado
como site estático no S3 + CloudFront — a API (repositório `ikescola-notificacao-api`) fica no mesmo domínio,
atrás do mesmo CloudFront, em `/api/*`.

| | |
|---|---|
| Framework | Vue 3 + PrimeVue 4.5 |
| Build | Vite 7 |
| Hospedagem | S3 (privado) + CloudFront |

## Desenvolvimento

Pré-requisitos: **Node.js 20+**, e a API (`ikescola-notificacao-api`) rodando em `http://localhost:3110`.

```bash
npm install
npm run local      # http://localhost:5173 — chama a API local via proxy (vite.config.js)
```

Para apontar o dev server para uma API remota em vez da local: `IKF_API_DEV=https://outra-api npm run local`.

## Ambientes e build

| Ambiente | Comando | Lê |
|---|---|---|
| Desenvolvimento | `npm run local` (ou `npm run dev`) | `.env.development` |
| Homologação | `npm run build:homologacao` | `.env.homologacao` |
| Produção | `npm run build` | `.env.production` |

Todos deixam `VITE_API_URL` vazio de propósito: em qualquer ambiente publicado, o app chama a API por caminho
relativo (`/api/...`) no **mesmo domínio**, porque é o CloudFront quem repassa `/api/*` para o ALB da API (ver
`INSTALAR-NA-AWS.md` no repositório da API). Só preencha essa variável se a API realmente ficar num domínio
diferente do frontend nesse ambiente — e nesse caso a API também precisa liberar CORS para esse domínio
(`Roteador.ORIGENS_APP`, hoje só libera os apps nativos).

`npm run preview` serve o build de `dist/` localmente, para conferir antes de publicar.

## Gestão de Escolas (`/admin`)

Tela administrativa (cadastro/renovação de chave/exclusão de escolas), embutida no mesmo app mas carregada à
parte (`import()` dinâmico) — o bundle público dos pais não inclui esse código. Não tem link visível no app: o
acesso é direto pela URL (`/admin`), com login próprio (usuário/senha, criado via `novo-admin` na API). Veja o
README da API para como criar o primeiro usuário.

## Deploy (S3 + CloudFront)

Passo a passo completo (bucket, função do CloudFront, distribuição, DNS) em
**[INSTALAR-NA-AWS.md](INSTALAR-NA-AWS.md)**. Publicar uma versão nova:

```bash
BUCKET=ikescola-app-frontend DISTRIBUICAO=<ID da distribuição> ./deploy/publicar.sh
```

O script (`deploy/publicar.sh`) faz `npm run build`, envia cada arquivo com o cache certo (arquivos com hash: 1
ano; imagens: 1 dia; casca do app — `index.html`, `sw.js`, manifesto — sempre conferida) e limpa o cache do
CloudFront no fim. Precisa de **Node 20+** e **AWS CLI** configurado (permissão `s3:PutObject` no bucket e
`cloudfront:CreateInvalidation`).

Para publicar homologação, gere o build com `npm run build:homologacao` antes de rodar o `publicar.sh` apontando
para o bucket/distribuição de hml (ajuste o script ou rode os comandos à mão, se os buckets forem diferentes).

## Organização

```
src/
├── main.js            monta App.vue, ou AdminApp.vue (lazy) se o caminho for /admin
├── App.vue             app dos pais: vincular aluno, lista de alunos, notificações
├── admin/               Gestão de Escolas: AdminApp, TelaAdminLogin, TelaAdminEscolas
├── componentes/        CabecalhoApp, CartaoAluno, AvisoDestaque, TelaVincular, PassosIphone
└── servicos/            api.js (app dos pais), adminApi.js (Gestão de Escolas), dispositivo.js, notificacoes.js, datas.js
```
