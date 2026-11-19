const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { unidadeDto } = require('../utils/dto');

const MSG_DUP = 'Já existe uma unidade com esta identificação.';
const identificacaoPadrao = (bloco, numero) => (bloco ? `${bloco}-${numero}` : numero);

async function listar(usuario) {
  const unidades = await prisma.unidade.findMany({
    where: { condominioId: usuario.condominioId },
    orderBy: [{ bloco: 'asc' }, { numero: 'asc' }],
  });
  return { dados: unidades.map(unidadeDto) };
}

async function criar(usuario, { numero, bloco, identificacao }) {
  const ident = identificacao ?? identificacaoPadrao(bloco, numero);
  const existe = await prisma.unidade.findFirst({ where: { condominioId: usuario.condominioId, identificacao: ident } });
  if (existe) throw AppError.conflito(MSG_DUP);
  const u = await prisma.unidade.create({
    data: { condominioId: usuario.condominioId, identificacao: ident, bloco: bloco ?? null, numero },
  });
  return unidadeDto(u);
}

async function atualizar(usuario, id, dados) {
  const atual = await prisma.unidade.findFirst({ where: { id, condominioId: usuario.condominioId } });
  if (!atual) throw AppError.naoEncontrado('Unidade não encontrada.');

  const novo = {
    numero: dados.numero ?? atual.numero,
    bloco: dados.bloco === undefined ? atual.bloco : dados.bloco,
  };
  const ident = dados.identificacao ?? (dados.numero !== undefined || dados.bloco !== undefined
    ? identificacaoPadrao(novo.bloco, novo.numero) : atual.identificacao);
  if (ident !== atual.identificacao) {
    const dup = await prisma.unidade.findFirst({ where: { condominioId: usuario.condominioId, identificacao: ident, NOT: { id } } });
    if (dup) throw AppError.conflito(MSG_DUP);
  }
  const u = await prisma.unidade.update({ where: { id }, data: { ...novo, identificacao: ident } });
  return unidadeDto(u);
}

module.exports = { listar, criar, atualizar };
