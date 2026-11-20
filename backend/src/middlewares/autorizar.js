// Bloqueia a rota para perfis nao permitidos. Uso: autorizar('SINDICO')
// (Especificacao da API de Autenticacao, secao 7 - matriz de permissoes)
const AppError = require('../utils/AppError');

module.exports = (...perfisPermitidos) => (req, res, next) => {
  if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
    return next(new AppError(403, 'SEM_PERMISSAO', 'Voce nao tem permissao para esta acao.'));
  }
  return next();
};
