// O Express 4 nao repassa erros de funcoes async para o tratarErros.
// Este wrapper faz isso: router.get('/', capturar(controller.listar))
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
