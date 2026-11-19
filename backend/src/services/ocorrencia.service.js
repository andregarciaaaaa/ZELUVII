const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { ocorrenciaDto } = require('../utils/dto');
const { perfilDaApi } = require('../middlewares/autenticar');
const { paraSkipTake, resposta } = require('../utils/paginacao');

const incluirLista = {
  autor: { select: { id: true, nome: true, vinculos: { include: { perfil: true } } } },
  morador: { include: { unidade: true } },
};
const incluirDetalhe = {
  ...incluirLista,
  historicos: { include: { usuario: { select: { id: true, nome: true } } }, orderBy: { dataAlteracao: 'asc' } },
};

function paraDto(o, opts) {
  const vinculo = o.autor.vinculos.find((v) => true); // um condominio por usuario no MVP
  return ocorrenciaDto({ ...o, autorPerfil: vinculo ? perfilDaApi(vinculo.perfil.nome) : null }, opts);
}

async function criar(usuario, dados) {
  const morador = usuario.perfil === 'MORADOR'
    ? await prisma.morador.findFirst({
      where: { usuarioId: usuario.id, unidade: { condominioId: usuario.condominioId } },
      orderBy: [{ principal: 'desc' }, { id: 'asc' }],
    })
    : null;

  const criada = await prisma.$transaction(async (tx) => {
    const o = await tx.ocorrencia.create({
      data: {
        condominioId: usuario.condominioId,
        autorId: usuario.id,
        moradorId: morador ? morador.id : null,
        assunto: dados.assunto,
        descricao: dados.descricao,
        categoria: dados.categoria,
        local: dados.local ?? null,
        status: 'solicitada',
      },
    });
    // primeira linha do historico: (nenhum) -> solicitada
    await tx.historicoOcorrencia.create({
      data: { ocorrenciaId: o.id, usuarioId: usuario.id, statusAnterior: null, statusNovo: 'solicitada' },
    });
    return tx.ocorrencia.findUnique({ where: { id: o.id }, include: incluirDetalhe });
  });
  return paraDto(criada, { comHistorico: true });
}

async function listar(usuario, filtros) {
  const where = { condominioId: usuario.condominioId };
  if (usuario.perfil !== 'SINDICO') where.autorId = usuario.id; // morador e porteiro: so as proprias
  if (filtros.status) where.status = filtros.status;
  if (filtros.categoria) where.categoria = filtros.categoria;
  const [dados, total] = await prisma.$transaction([
    prisma.ocorrencia.findMany({ where, include: incluirLista, orderBy: { dataAbertura: 'desc' }, ...paraSkipTake(filtros) }),
    prisma.ocorrencia.count({ where }),
  ]);
  return resposta(dados.map((o) => paraDto(o)), total, filtros);
}

async function buscar(usuario, id) {
  const o = await prisma.ocorrencia.findFirst({ where: { id, condominioId: usuario.condominioId }, include: incluirDetalhe });
  if (!o) throw AppError.naoEncontrado('Ocorrência não encontrada.');
  if (usuario.perfil !== 'SINDICO' && o.autorId !== usuario.id) {
    throw AppError.semPermissao('Você só pode consultar as ocorrências que abriu.');
  }
  return paraDto(o, { comHistorico: true });
}

async function mudarStatus(usuario, id, { status, observacao }) {
  const atual = await prisma.ocorrencia.findFirst({ where: { id, condominioId: usuario.condominioId } });
  if (!atual) throw AppError.naoEncontrado('Ocorrência não encontrada.');
  if (atual.status === status) throw AppError.conflito('A ocorrência já está neste status.');

  // Qualquer mudanca e permitida, inclusive reabrir. Cada uma grava uma linha de historico.
  const nova = await prisma.$transaction(async (tx) => {
    await tx.ocorrencia.update({ where: { id }, data: { status } });
    await tx.historicoOcorrencia.create({
      data: { ocorrenciaId: id, usuarioId: usuario.id, statusAnterior: atual.status, statusNovo: status, observacao: observacao ?? null },
    });
    return tx.ocorrencia.findUnique({ where: { id }, include: incluirDetalhe });
  });
  // TODO (integracao): evento ocorrencia.status_alterado para quem abriu (WebSocket/push).
  return paraDto(nova, { comHistorico: true });
}

module.exports = { criar, listar, buscar, mudarStatus };
