const prisma = require('../config/prisma');

const buscarUsuarioPorEmail = (email) => prisma.usuario.findUnique({ where: { email } });

// Primeiro vinculo ativo do usuario (o MVP tem um condominio por usuario)
const buscarVinculoAtivo = (usuarioId) =>
  prisma.usuarioCondominio.findFirst({
    where: { usuarioId, ativo: true },
    include: { perfil: true },
    orderBy: { id: 'asc' },
  });

const buscarUnidadePrincipal = (usuarioId, condominioId) =>
  prisma.morador.findFirst({
    where: { usuarioId, unidade: { condominioId } },
    include: { unidade: true },
    orderBy: [{ principal: 'desc' }, { id: 'asc' }],
  });

const buscarUsuarioPorId = (id) => prisma.usuario.findUnique({ where: { id } });

const buscarTokenValido = (tokenHash) =>
  prisma.tokenRedefinicaoSenha.findFirst({
    where: { tokenHash, usadoEm: null, expiraEm: { gt: new Date() }, usuario: { ativo: true } },
    include: { usuario: true },
  });

// Troca a senha e inutiliza o token (e quaisquer outros pendentes do usuario) numa transacao so
const redefinirSenha = (tokenId, usuarioId, senhaHash) =>
  prisma.$transaction([
    prisma.usuario.update({ where: { id: usuarioId }, data: { senhaHash } }),
    prisma.tokenRedefinicaoSenha.updateMany({
      where: { usuarioId, usadoEm: null },
      data: { usadoEm: new Date() },
    }),
  ]);

module.exports = {
  buscarUsuarioPorEmail,
  buscarVinculoAtivo,
  buscarUnidadePrincipal,
  buscarUsuarioPorId,
  buscarTokenValido,
  redefinirSenha,
};
