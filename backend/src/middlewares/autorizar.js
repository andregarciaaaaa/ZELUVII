const AppError = require('../utils/AppError');

// Bloqueia a rota inteira por perfil. Ex.: autorizar('SINDICO') ou autorizar('SINDICO', 'PORTEIRO').
// Deve vir DEPOIS de autenticar. Quem nao tem o perfil recebe 403 SEM_PERMISSAO.
module.exports = (...perfisPermitidos) => (req, res, next) => {
  if (!req.usuario) return next(AppError.naoAutenticado('Token não enviado.'));
  if (!perfisPermitidos.includes(req.usuario.perfil)) return next(AppError.semPermissao());
  next();
};
