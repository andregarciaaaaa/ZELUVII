// Registrado por ultimo no app.js: converte qualquer erro no formato unico da API
// { erro: { codigo, mensagem, detalhes? } } (Arquitetura do Back-end, 3.2)
const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  if (err instanceof AppError) {
    const { status, codigo, mensagem, detalhes } = err;
    return res.status(status).json({ erro: { codigo, mensagem, detalhes } });
  }

  // JSON mal formatado no corpo da requisicao
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: { codigo: 'VALIDACAO', mensagem: 'JSON mal formatado.' } });
  }

  // Erro inesperado: o detalhe tecnico fica so no log do servidor
  console.error(err);
  return res.status(500).json({
    erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno no servidor.' },
  });
};
