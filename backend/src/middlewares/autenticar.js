// Verifica o token JWT do cabecalho Authorization e coloca o usuario em req.usuario
// (Especificacao da API de Autenticacao, secoes 5 e 6)
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const AppError = require('../utils/AppError');

module.exports = (req, res, next) => {
  const cabecalho = req.headers.authorization || '';
  const [tipo, token] = cabecalho.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return next(new AppError(401, 'NAO_AUTENTICADO', 'Token nao enviado.'));
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.usuario = {
      id: Number(payload.sub),
      perfil: payload.perfil,
      condominioId: payload.condominioId,
    };
    return next();
  } catch {
    return next(new AppError(401, 'NAO_AUTENTICADO', 'Token invalido ou expirado.'));
  }
};
