const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Perfis do banco (minusculo) -> perfis da API (maiusculo). "administrador" tem os mesmos direitos do sindico.
function perfilDaApi(nomeBanco) {
  const p = String(nomeBanco).toUpperCase();
  return p === 'ADMINISTRADOR' ? 'SINDICO' : p;
}

// Valida o JWT e confere no banco se o usuario e o vinculo continuam ativos.
// Coloca em req.usuario: { id, perfil, condominioId }
module.exports = asyncHandler(async (req, res, next) => {
  const cabecalho = req.headers.authorization;
  if (!cabecalho) throw AppError.naoAutenticado('Token não enviado.');
  const [tipo, token] = cabecalho.split(' ');
  if (tipo !== 'Bearer' || !token) throw AppError.naoAutenticado('Token inválido ou expirado.');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    throw AppError.naoAutenticado('Token inválido ou expirado.');
  }

  const vinculo = await prisma.usuarioCondominio.findFirst({
    where: {
      usuarioId: Number(payload.sub),
      condominioId: Number(payload.condominioId),
      ativo: true,
      usuario: { ativo: true },
    },
    include: { perfil: true },
  });
  if (!vinculo) throw AppError.naoAutenticado('Token inválido ou expirado.');

  req.usuario = {
    id: vinculo.usuarioId,
    perfil: perfilDaApi(vinculo.perfil.nome),
    condominioId: vinculo.condominioId,
  };
  next();
});

module.exports.perfilDaApi = perfilDaApi;
