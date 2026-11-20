// Unicas funcoes do modulo de autenticacao que acessam o banco
const prisma = require('../config/prisma');

const incluirVinculos = {
  vinculos: {
    where: { ativo: true },
    include: { perfil: true },
    orderBy: { id: 'asc' },
  },
  moradias: {
    include: { unidade: true },
    orderBy: [{ principal: 'desc' }, { id: 'asc' }],
  },
};

module.exports = {
  buscarPorEmail(email) {
    return prisma.usuario.findUnique({ where: { email }, include: incluirVinculos });
  },

  buscarPorId(id) {
    return prisma.usuario.findUnique({ where: { id }, include: incluirVinculos });
  },
};
