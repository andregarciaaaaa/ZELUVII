// Express 4 nao captura erros de funcoes async: este wrapper envia o erro para o middleware tratarErros.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
