const AppError = require('../utils/AppError');

// Registrado por ultimo no app.js. Converte qualquer erro no formato unico da API.
function tratarErros(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    const corpo = { codigo: err.codigo, mensagem: err.mensagem };
    if (err.detalhes) corpo.detalhes = err.detalhes;
    return res.status(err.status).json({ erro: corpo });
  }

  // JSON mal formatado (body-parser)
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      erro: { codigo: 'VALIDACAO', mensagem: 'Dados inválidos.', detalhes: [{ campo: 'corpo', mensagem: 'JSON mal formatado.' }] },
    });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(400).json({ erro: { codigo: 'VALIDACAO', mensagem: 'Corpo da requisição grande demais.' } });
  }

  // Restricao unica do banco que escapou da checagem do service (corrida entre dois pedidos)
  if (err && err.code === 'P2002') {
    return res.status(409).json({ erro: { codigo: 'CONFLITO', mensagem: 'Já existe um registro com estes dados.' } });
  }

  console.error(err); // o detalhe tecnico fica so no log do servidor
  res.status(500).json({ erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno no servidor.' } });
}

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: { codigo: 'NAO_ENCONTRADO', mensagem: 'Rota não encontrada.' } });
}

module.exports = tratarErros;
module.exports.rotaNaoEncontrada = rotaNaoEncontrada;
