const prisma = require('../config/prisma');

const incluir = { usuario: true, unidade: true };

async function listar({ condominioId, busca, unidadeId, ativo, skip, take }) {
  const where = {
    principal: true,
    unidade: { condominioId, ...(unidadeId ? { id: unidadeId } : {}) },
    usuario: {
      ...(ativo !== undefined ? { ativo } : {}),
      ...(busca
        ? { OR: [{ nome: { contains: busca, mode: 'insensitive' } }, { email: { contains: busca, mode: 'insensitive' } }] }
        : {}),
    },
  };
  const [dados, total] = await prisma.$transaction([
    prisma.morador.findMany({ where, include: incluir, orderBy: { usuario: { nome: 'asc' } }, skip, take }),
    prisma.morador.count({ where }),
  ]);
  return { dados, total };
}

// `id` da API = id do usuario. Devolve a linha principal de morador desse usuario neste condominio.
const buscarPorUsuarioId = (usuarioId, condominioId) =>
  prisma.morador.findFirst({
    where: { usuarioId, principal: true, unidade: { condominioId } },
    include: incluir,
  });

const buscarUnidade = (unidadeId, condominioId) =>
  prisma.unidade.findFirst({ where: { id: unidadeId, condominioId } });

const emailEmUso = async (email, ignorarUsuarioId) => {
  const u = await prisma.usuario.findUnique({ where: { email } });
  return Boolean(u && u.id !== ignorarUsuarioId);
};

const perfilPorNome = (nome) => prisma.perfil.findUnique({ where: { nome } });

module.exports = { listar, buscarPorUsuarioId, buscarUnidade, emailEmUso, perfilPorNome, incluir };
