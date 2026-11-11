# IKEscola 2.0 App — instalar o frontend na AWS (S3 + CloudFront)

## Como fica

```
                                        ┌─ padrão (/, /assets/*, /sw.js, ...) ──> S3 (este repositório)
Celular / IKAcesso ──HTTPS──> CloudFront┤
familia.infokings.com.br               └─ /api/*  e  /.well-known/* ──HTTPS──> ALB ──> API (ikescola-notificacao-api)
```

**Por que um domínio só.** O app dos pais, as notificações (service worker), os dados salvos no celular e o app
Android dependem de o site e a API estarem **no mesmo endereço**. O CloudFront entrega o frontend a partir do S3
e repassa só `/api/*` e `/.well-known/*` para a API — veja o `INSTALAR-NA-AWS.md` do repositório
`ikescola-notificacao-api` para o lado da API (EC2, PostgreSQL, ALB). Este documento cobre só a parte do S3 +
CloudFront.

| Nome | Para quê |
|---|---|
| `familia.infokings.com.br` | endereço público (CloudFront). É o que os pais e o IKAcesso usam |
| `familia-api.infokings.com.br` | endereço interno da API no ALB (o CloudFront usa como origem) |

Os nomes são exemplos. Troque pelos definitivos. Para homologação, use um bucket/distribuição separados (ex.:
`hml.familia.infokings.com.br`), e gere o build com `npm run build:homologacao`.

**Certificado:** um certificado `*.infokings.com.br` no ACM **us-east-1** cobre o domínio (o CloudFront só aceita
certificados de us-east-1).

---

## 1. Pasta no bucket compartilhado

Mesmo padrão dos outros frontends (`cliente-mfe/`, `ikacesso-escola-mfe/`, `ikeventos-front/`, etc.): usamos o
bucket **já existente** `ikponto-docs-hom`, numa pasta própria — não criamos um bucket novo.

- Pasta: `ikescola-notificacao-mfe/` (criada sozinha no primeiro `aws s3 sync`, ou manualmente via *Criar pasta*).
- O bucket já é privado (block public access ligado) e só o CloudFront lê, via as políticas OAC existentes — só
  precisamos **acrescentar** (nunca substituir) a declaração que o passo 3 vai gerar pra nossa distribuição nova.

## 2. Função do CloudFront

CloudFront → *Functions* → *Create function*:
1. Nome `ikescola-spa`, runtime **cloudfront-js-2.0**.
2. Cole o conteúdo de `deploy/cloudfront-funcao.js`.
3. *Save* e depois *Publish*.

Ela faz qualquer caminho de página (inclusive `/admin`, a Gestão de Escolas) abrir o app; os arquivos com
extensão passam direto.

## 3. Distribuição

CloudFront → *Create distribution*.

**Origem 1 (S3):**
- *Origin domain*: escolha o bucket `ikponto-docs-hom`.
- *Origin path*: `/ikescola-notificacao-mfe`.
- *Origin access*: **Origin access control settings** → *Create new OAC*.
- No fim, o console mostra uma **declaração de política do bucket**: abra S3 → `ikponto-docs-hom` → *Permissions* →
  *Bucket policy* e **acrescente** essa declaração ao array `Statement` existente (não substitua a política toda —
  o bucket já serve outros frontends com suas próprias declarações).

**Comportamento padrão (`*`) → S3:**

| Opção | Valor |
|---|---|
| Viewer protocol policy | **Redirect HTTP to HTTPS** |
| Allowed HTTP methods | GET, HEAD |
| Cache policy | **CachingOptimized** |
| Compress objects | Yes |
| Function associations | *Viewer request* → CloudFront Functions → **`ikescola-spa`** |

**Configurações gerais:**

| Opção | Valor |
|---|---|
| Alternate domain name (CNAME) | `familia.infokings.com.br` |
| Custom SSL certificate | `*.infokings.com.br` (ACM us-east-1) |
| Default root object | `index.html` |
| Price class | **Use all edge locations**. É a única que inclui a América do Sul (servidores no Brasil) |

Crie a distribuição e depois acrescente a segunda origem.

**Origem 2 (API):** aba *Origins* → *Create origin*.

| Opção | Valor |
|---|---|
| Origin domain | `familia-api.infokings.com.br` |
| Protocol | **HTTPS only** |
| Minimum origin SSL protocol | TLSv1.2 |

**Comportamentos da API:** aba *Behaviors* → *Create behavior*, **duas vezes**, uma para `/api/*` e outra para
`/.well-known/*`, ambas para a origem `familia-api.infokings.com.br`:

| Opção | Valor |
|---|---|
| Viewer protocol policy | **Redirect HTTP to HTTPS** |
| Allowed HTTP methods | **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE** |
| Cache policy | **CachingDisabled** |
| Origin request policy | **AllViewerExceptHostHeader** (repassa Authorization, query string e Origin) |
| Function associations | nenhuma |

> **Não configure "Error pages"** (respostas de erro personalizadas) na distribuição. Elas valeriam também para a
> API e trocariam os erros dela, que o app, o IKAcesso e a Gestão de Escolas precisam ler, por HTML. A função do
> passo 2 já resolve as rotas do app.

## 4. DNS

Crie um **CNAME** de `familia.infokings.com.br` para o domínio da distribuição (`dxxxxxxxxxxxx.cloudfront.net`).
Se usar Route 53, crie um registro A do tipo Alias apontando para a distribuição.

## 5. Publicar

Num computador com **Node.js 20+** e o **AWS CLI** configurado, com permissão no bucket e para invalidar o cache:

```bash
BUCKET=ikponto-docs-hom/ikescola-notificacao-mfe DISTRIBUICAO=<ID da distribuição> ./deploy/publicar.sh
```

O script faz o build e envia cada arquivo com o cache certo (ver README) e, no fim, limpa o cache do CloudFront.
Para atualizar depois, é só rodar o mesmo comando de novo.

**Teste final:**
- `https://familia.infokings.com.br/` abre o app.
- `https://familia.infokings.com.br/admin` abre a Gestão de Escolas.
- `https://familia.infokings.com.br/api/config` responde `{"ok":true,...}`.

---

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `/api/...` dá 403 ou 502 no CloudFront | origem da API com HTTP em vez de HTTPS, ou certificado sem o nome `familia-api...` |
| `/api/...` devolve HTML | falta o comportamento `/api/*`, ou há "Error pages" configuradas |
| `/admin` dá 403/404 direto na URL | função do CloudFront (passo 2) não publicada, ou não associada ao comportamento padrão |
| AccessDenied no site | política do bucket (OAC) não colada, ou `index.html` não publicado |
| App não atualiza no celular | `publicar.sh` não rodou até o fim (ele limpa o cache do `index.html` e do `sw.js`) |
