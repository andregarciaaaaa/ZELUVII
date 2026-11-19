// Financeiro (SCRUM-68 ainda esta "Em analise": estas rotas sao PROVISORIAS, baseadas na matriz da
// especificacao de autenticacao, no dicionario financeiro e na historia 6.1). O sistema so consulta e
// registra: o pagamento nao e feito por aqui (UC08).
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { cobrancaDto, despesaDto } = require('../utils/dto');
const datas = require('../utils/datas');
const { paraSkipTake, resposta } = require('../utils/paginacao');

const dataDoDia = (s) => new Date(`${s}T00:00:00.000Z`); // coluna DATE: meia-noite UTC

async function unidadesDoMorador(usuario) {
  const l = await prisma.morador.findMany({
    where: { usuarioId: usuario.id, unidade: { condominioId: usuario.condominioId } }, select: { unidadeId: true },
  });
  return l.map((x) => x.unidadeId);
}

// ---------------- cobrancas (taxas por unidade) ----------------
async function listarCobrancas(usuario, filtros) {
  const where = { unidade: { condominioId: usuario.condominioId } };
  if (usuario.perfil === 'MORADOR') {
    // RN10: o morador so ve o que e da propria unidade
    const minhas = await unidadesDoMorador(usuario);
    where.unidadeId = { in: filtros.unidadeId ? minhas.filter((u) => u === filtros.unidadeId) : minhas };
  } else if (filtros.unidadeId) {
    where.unidadeId = filtros.unidadeId;
  }
  if (filtros.status) where.status = filtros.status;
  const [dados, total] = await prisma.$transaction([
    prisma.lancamento.findMany({ where, include: { unidade: true }, orderBy: [{ vencimento: 'desc' }, { id: 'desc' }], ...paraSkipTake(filtros) }),
    prisma.lancamento.count({ where }),
  ]);
  const hoje = datas.hoje();
  return resposta(dados.map((l) => cobrancaDto(l, hoje)), total, filtros);
}

async function buscarCobranca(usuario, id) {
  const l = await prisma.lancamento.findFirst({ where: { id, unidade: { condominioId: usuario.condominioId } }, include: { unidade: true } });
  if (!l) throw AppError.naoEncontrado('Cobrança não encontrada.');
  if (usuario.perfil === 'MORADOR' && !(await unidadesDoMorador(usuario)).includes(l.unidadeId)) {
    throw AppError.semPermissao('Você só pode consultar as cobranças da sua unidade.');
  }
  return cobrancaDto(l, datas.hoje());
}

async function criarCobranca(usuario, d) {
  const unidade = await prisma.unidade.findFirst({ where: { id: d.unidadeId, condominioId: usuario.condominioId } });
  if (!unidade) throw AppError.naoEncontrado('Unidade não encontrada.');
  if (d.tipo === 'cota_condominial') {
    const dup = await prisma.lancamento.findFirst({ where: { unidadeId: d.unidadeId, tipo: d.tipo, competencia: dataDoDia(d.competencia) } });
    if (dup) throw AppError.conflito('Esta unidade já tem a cota condominial deste mês.');
  }
  const l = await prisma.lancamento.create({
    data: {
      unidadeId: d.unidadeId, tipo: d.tipo, descricao: d.descricao ?? null, competencia: dataDoDia(d.competencia),
      valor: d.valor, vencimento: dataDoDia(d.vencimento), boletoUrl: d.boletoUrl ?? null,
    },
    include: { unidade: true },
  });
  return cobrancaDto(l, datas.hoje());
}

async function pagarCobranca(usuario, id, { dataPagamento }) {
  const l = await prisma.lancamento.findFirst({ where: { id, unidade: { condominioId: usuario.condominioId } } });
  if (!l) throw AppError.naoEncontrado('Cobrança não encontrada.');
  if (l.status === 'pago') throw AppError.conflito('Esta cobrança já está paga.');
  const atualizada = await prisma.lancamento.update({
    where: { id }, data: { status: 'pago', dataPagamento: dataDoDia(dataPagamento ?? datas.hoje()) }, include: { unidade: true },
  });
  return cobrancaDto(atualizada, datas.hoje());
}

// ---------------- despesas do condominio (so sindico) ----------------
async function listarDespesas(usuario, filtros) {
  const where = { condominioId: usuario.condominioId };
  if (filtros.status) where.status = filtros.status;
  if (filtros.competencia) where.competencia = dataDoDia(filtros.competencia);
  const [dados, total] = await prisma.$transaction([
    prisma.despesa.findMany({ where, orderBy: [{ vencimento: 'desc' }, { id: 'desc' }], ...paraSkipTake(filtros) }),
    prisma.despesa.count({ where }),
  ]);
  const hoje = datas.hoje();
  return resposta(dados.map((d) => despesaDto(d, hoje)), total, filtros);
}

async function criarDespesa(usuario, d) {
  const x = await prisma.despesa.create({
    data: {
      condominioId: usuario.condominioId, categoria: d.categoria, descricao: d.descricao, fornecedor: d.fornecedor ?? null,
      valor: d.valor, competencia: dataDoDia(d.competencia), vencimento: dataDoDia(d.vencimento),
    },
  });
  return despesaDto(x, datas.hoje());
}

async function pagarDespesa(usuario, id, { dataPagamento }) {
  const d = await prisma.despesa.findFirst({ where: { id, condominioId: usuario.condominioId } });
  if (!d) throw AppError.naoEncontrado('Despesa não encontrada.');
  if (d.status === 'pago') throw AppError.conflito('Esta despesa já está paga.');
  const x = await prisma.despesa.update({ where: { id }, data: { status: 'pago', dataPagamento: dataDoDia(dataPagamento ?? datas.hoje()) } });
  return despesaDto(x, datas.hoje());
}

// Painel do sindico: receitas x despesas de uma competencia (padrao: mes atual)
async function resumo(usuario, { competencia }) {
  const hoje = datas.hoje();
  const mes = dataDoDia(competencia ?? `${hoje.slice(0, 7)}-01`);
  const cobrancas = await prisma.lancamento.findMany({ where: { competencia: mes, unidade: { condominioId: usuario.condominioId } } });
  const despesas = await prisma.despesa.findMany({ where: { competencia: mes, condominioId: usuario.condominioId } });
  const soma = (lista, filtro) => lista.filter(filtro).reduce((s, x) => s + Number(x.valor), 0);
  const atrasada = (x) => x.status === 'pendente' && datas.dataSql(x.vencimento) < hoje;
  return {
    competencia: datas.dataSql(mes),
    receitas: {
      previsto: soma(cobrancas, () => true),
      recebido: soma(cobrancas, (c) => c.status === 'pago'),
      pendente: soma(cobrancas, (c) => c.status === 'pendente'),
      emAtraso: soma(cobrancas, atrasada),
    },
    despesas: {
      previsto: soma(despesas, () => true),
      pago: soma(despesas, (d) => d.status === 'pago'),
      pendente: soma(despesas, (d) => d.status === 'pendente'),
      emAtraso: soma(despesas, atrasada),
    },
  };
}

module.exports = { listarCobrancas, buscarCobranca, criarCobranca, pagarCobranca, listarDespesas, criarDespesa, pagarDespesa, resumo };
