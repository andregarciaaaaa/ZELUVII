// Unicas funcoes de avisos que acessam o banco (tabela comunicado).
// Toda consulta e restrita ao condominio do token e ignora os avisos removidos.
const prisma = require('../config/prisma');

const incluirAutor = { autor: { select: { id: true, nome: true } } };

function apenasVigentes(agora) {
  return { OR: [{ expiraEm: null }, { expiraEm: { gt: agora } }] };
}

module.exports = {
  // Paginacao por cursor: busca limite + 1 para saber se existe proxima pagina
  listar({ condominioId, incluirExpirados, limite, cursor }) {
    return prisma.comunicado.findMany({
      where: {
        condominioId,
        removidoEm: null,
        ...(incluirExpirados ? {} : apenasVigentes(new Date())),
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      include: incluirAutor,
      orderBy: { id: 'desc' },
      take: limite + 1,
    });
  },

  buscarPorId(id, condominioId) {
    return prisma.comunicado.findFirst({
      where: { id, condominioId, removidoEm: null },
      include: incluirAutor,
    });
  },

  criar(dados) {
    return prisma.comunicado.create({ data: dados, include: incluirAutor });
  },

  atualizar(id, dados) {
    return prisma.comunicado.update({ where: { id }, data: dados, include: incluirAutor });
  },

  // Exclusao logica: o registro fica guardado para auditoria
  remover(id) {
    return prisma.comunicado.update({ where: { id }, data: { removidoEm: new Date() } });
  },
};
