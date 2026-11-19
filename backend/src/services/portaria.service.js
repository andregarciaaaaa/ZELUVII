// Portaria: encomendas e visitantes. O porteiro registra; o sindico consulta tudo;
// o morador consulta so o que e da propria unidade (regra de dono).
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { encomendaDto, visitanteDto } = require('../utils/dto');
const datas = require('../utils/datas');
const { paraSkipTake, resposta } = require('../utils/paginacao');

const quem = { select: { id: true, nome: true } };
const incluirEncomenda = { unidade: true, registradoPor: quem, retiradoPor: quem };
const incluirVisitante = { unidade: true, registradoPor: quem };

async function unidadesDoMorador(usuario) {
  const linhas = await prisma.morador.findMany({
    where: { usuarioId: usuario.id, unidade: { condominioId: usuario.condominioId } },
    select: { unidadeId: true },
  });
  return linhas.map((l) => l.unidadeId);
}

async function unidadeDoCondominio(usuario, unidadeId) {
  const u = await prisma.unidade.findFirst({ where: { id: unidadeId, condominioId: usuario.condominioId } });
  if (!u) throw AppError.naoEncontrado('Unidade não encontrada.');
  return u;
}

// Morador so enxerga a(s) propria(s) unidade(s): devolve o filtro de unidade conforme o perfil
async function filtroDeUnidade(usuario, unidadeIdPedido) {
  if (usuario.perfil === 'MORADOR') {
    const minhas = await unidadesDoMorador(usuario);
    if (unidadeIdPedido && !minhas.includes(unidadeIdPedido)) return { in: [] };
    return unidadeIdPedido ? unidadeIdPedido : { in: minhas };
  }
  return unidadeIdPedido ?? undefined;
}

async function garantirDono(usuario, unidadeId) {
  if (usuario.perfil !== 'MORADOR') return;
  if (!(await unidadesDoMorador(usuario)).includes(unidadeId)) {
    throw AppError.semPermissao('Você só pode consultar registros da sua unidade.');
  }
}

// ---------------- encomendas ----------------
async function criarEncomenda(usuario, dados) {
  await unidadeDoCondominio(usuario, dados.unidadeId);
  const e = await prisma.encomenda.create({
    data: {
      unidadeId: dados.unidadeId,
      registradoPorId: usuario.id,
      descricao: dados.descricao,
      transportadora: dados.transportadora ?? null,
      codigoRastreio: dados.codigoRastreio ?? null,
    },
    include: incluirEncomenda,
  });
  // TODO (integracao): evento encomenda.recebida para os moradores ativos da unidade.
  return encomendaDto(e);
}

async function listarEncomendas(usuario, filtros) {
  const where = { unidade: { condominioId: usuario.condominioId } };
  const unidadeId = await filtroDeUnidade(usuario, filtros.unidadeId);
  if (unidadeId !== undefined) where.unidadeId = unidadeId;
  if (filtros.status) where.status = filtros.status;
  const [dados, total] = await prisma.$transaction([
    prisma.encomenda.findMany({ where, include: incluirEncomenda, orderBy: { dataRecebimento: 'desc' }, ...paraSkipTake(filtros) }),
    prisma.encomenda.count({ where }),
  ]);
  return resposta(dados.map(encomendaDto), total, filtros);
}

async function buscarEncomenda(usuario, id) {
  const e = await prisma.encomenda.findFirst({ where: { id, unidade: { condominioId: usuario.condominioId } }, include: incluirEncomenda });
  if (!e) throw AppError.naoEncontrado('Encomenda não encontrada.');
  await garantirDono(usuario, e.unidadeId);
  return encomendaDto(e);
}

async function retirarEncomenda(usuario, id, { retiradaPorId }) {
  const e = await prisma.encomenda.findFirst({ where: { id, unidade: { condominioId: usuario.condominioId } } });
  if (!e) throw AppError.naoEncontrado('Encomenda não encontrada.');
  if (e.status === 'entregue') throw AppError.conflito('Esta encomenda já foi retirada.');

  if (retiradaPorId !== undefined) {
    const m = await prisma.morador.findFirst({ where: { usuarioId: retiradaPorId, unidadeId: e.unidadeId, usuario: { ativo: true } } });
    if (!m) throw AppError.validacao([{ campo: 'retiradaPorId', mensagem: 'Informe um morador ativo da unidade de destino.' }]);
  }
  const atualizada = await prisma.encomenda.update({
    where: { id },
    data: { status: 'entregue', dataRetirada: new Date(), retiradoPorId: retiradaPorId ?? null },
    include: incluirEncomenda,
  });
  return encomendaDto(atualizada);
}

// ---------------- visitantes ----------------
async function criarVisitante(usuario, dados) {
  await unidadeDoCondominio(usuario, dados.unidadeId);
  const v = await prisma.visitante.create({
    data: {
      unidadeId: dados.unidadeId,
      registradoPorId: usuario.id,
      nome: dados.nome,
      tipo: dados.tipo,
      observacao: dados.observacao ?? null,
    },
    include: incluirVisitante,
  });
  // TODO (integracao): evento visitante.chegou para os moradores ativos da unidade.
  return visitanteDto(v);
}

async function listarVisitantes(usuario, filtros) {
  const where = { unidade: { condominioId: usuario.condominioId } };
  const unidadeId = await filtroDeUnidade(usuario, filtros.unidadeId);
  if (unidadeId !== undefined) where.unidadeId = unidadeId;
  if (filtros.status === 'no_condominio') where.dataSaida = null;
  if (filtros.status === 'saiu') where.dataSaida = { not: null };
  if (filtros.de || filtros.ate) {
    where.dataEntrada = {};
    if (filtros.de) where.dataEntrada.gte = datas.instanteLocal(filtros.de);
    if (filtros.ate) where.dataEntrada.lt = datas.instanteLocal(datas.somarDias(filtros.ate, 1));
  }
  const [dados, total] = await prisma.$transaction([
    prisma.visitante.findMany({ where, include: incluirVisitante, orderBy: { dataEntrada: 'desc' }, ...paraSkipTake(filtros) }),
    prisma.visitante.count({ where }),
  ]);
  return resposta(dados.map(visitanteDto), total, filtros);
}

async function buscarVisitante(usuario, id) {
  const v = await prisma.visitante.findFirst({ where: { id, unidade: { condominioId: usuario.condominioId } }, include: incluirVisitante });
  if (!v) throw AppError.naoEncontrado('Registro não encontrado.');
  await garantirDono(usuario, v.unidadeId);
  return visitanteDto(v);
}

async function registrarSaida(usuario, id) {
  const v = await prisma.visitante.findFirst({ where: { id, unidade: { condominioId: usuario.condominioId } } });
  if (!v) throw AppError.naoEncontrado('Registro não encontrado.');
  if (v.dataSaida) throw AppError.conflito('A saída deste visitante já foi registrada.');
  const atualizado = await prisma.visitante.update({ where: { id }, data: { dataSaida: new Date() }, include: incluirVisitante });
  return visitanteDto(atualizado);
}

module.exports = {
  criarEncomenda, listarEncomendas, buscarEncomenda, retirarEncomenda,
  criarVisitante, listarVisitantes, buscarVisitante, registrarSaida,
};
