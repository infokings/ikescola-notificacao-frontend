#!/bin/sh
# Gera o build do frontend e publica no S3, com o Cache-Control certo para cada arquivo, e limpa o cache do
# CloudFront dos arquivos que não têm hash no nome.
#   BUCKET=ikescola-app-frontend DISTRIBUICAO=E123ABC456 ./deploy/publicar.sh
# Precisa de: Node.js 20+ e AWS CLI configurado (permissão s3:PutObject no bucket e cloudfront:CreateInvalidation).
set -e
: "${BUCKET:?defina BUCKET (nome do bucket S3)}"
: "${DISTRIBUICAO:?defina DISTRIBUICAO (ID da distribuição do CloudFront)}"
cd "$(dirname "$0")/.."

npm ci
npm run build

# 1) arquivos com hash no nome: nunca mudam (vão primeiro, para o index novo não apontar para nada que falta)
aws s3 sync dist/assets "s3://$BUCKET/assets" --cache-control "public, max-age=31536000, immutable"
# 2) imagens: 1 dia
aws s3 sync dist/icones "s3://$BUCKET/icones" --cache-control "public, max-age=86400"
aws s3 sync dist/screenshots "s3://$BUCKET/screenshots" --cache-control "public, max-age=86400"
# 3) casca do app: sempre conferida (o celular pega a versão nova na hora)
aws s3 cp dist/sw.js "s3://$BUCKET/sw.js" --cache-control "no-cache" --content-type "text/javascript; charset=utf-8"
aws s3 cp dist/manifest.webmanifest "s3://$BUCKET/manifest.webmanifest" --cache-control "no-cache" --content-type "application/manifest+json"
aws s3 cp dist/privacidade.html "s3://$BUCKET/privacidade.html" --cache-control "no-cache" --content-type "text/html; charset=utf-8"
aws s3 cp dist/index.html "s3://$BUCKET/index.html" --cache-control "no-cache" --content-type "text/html; charset=utf-8"

aws cloudfront create-invalidation --distribution-id "$DISTRIBUICAO" \
  --paths "/" "/index.html" "/sw.js" "/manifest.webmanifest" "/privacidade.html" >/dev/null
echo "Frontend publicado em s3://$BUCKET (cache do CloudFront limpo)."
