// CloudFront Function (runtime cloudfront-js-2.0), evento "Viewer request", só no comportamento padrão (S3).
// Caminho de arquivo (com extensão) passa direto; caminho de página vai para o index.html — o app trata o resto
// (ex.: /?c=CODIGO do QR do bilhete). A query string é preservada.
function handler(event) {
  var req = event.request
  var uri = req.uri
  if (uri === '/' || uri.lastIndexOf('.') <= uri.lastIndexOf('/')) {
    req.uri = '/index.html'
  }
  return req
}
