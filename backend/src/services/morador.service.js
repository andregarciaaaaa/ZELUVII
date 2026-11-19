const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const mailer = require('../utils/mailer');
const repo = require('../repositories/morador.repository');
const { criarTokenSenha } = require('./token.service');
const { moradorDto } = require('../utils/dto');
const { paraSkipTake, resposta } = require('../utils/paginacao');

async function listar(usuario, filtros) {
  const { dados, total } = await repo.listar({
    condominioId: usuario.condominioId,
    busca: filtros.busca,
    unidadeId: filtros.unidadeId,
    ativo: filtros.ativo,
    ...paraSkipTake(filtros),
  });
  return resposta(dados.map(moradorDto), total, filtros);
}

async function buscar(usuario, id) {
  const m = await repo.buscarPorUsuarioId(id, usuario.condominioId);
  if (!m) throw AppError.naoEncontrado('Morador não encontrado.');
  return moradorDto(m);
}

async function criar(usuario, dados) {
  const unidade = await repo.buscarUnidade(dados.unidadeId, usuario.condominioId);
  if (!unidade) throw AppError.naoEncontrado('Unidade não encontrada.');
  if (await repo.emailEmUso(dados.email)) throw AppError.conflito('Já existe um usuário com este e-mail.');

  const perfil = await repo.perfilPorNome('morador');
  if (!perfil) throw new Error('Perfil "morador" nao existe: rode o seed (npm run db:seed).');
  // Sem senha: o morador cria a propria pelo link do convite (48 h)
  const senhaHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);

  const { morador, token } = await prisma.$transaction(async (tx) => {
    const novo = await tx.usuario.create({
      data: { nome: dados.nome, email: dados.email, telefone: dados.telefone ?? null, senhaHash },
    });
    await tx.usuarioCondominio.create({
      data: { usuarioId: novo.id, condominioId: usuario.condominioId, perfilId: perfil.id },
    });
    await tx.morador.create({
      data: { usuarioId: novo.id, unidadeId: unidade.id, tipoVinculo: dados.tipo, principal: true },
    });
    const t = await criarTokenSenha(novo.id, env.conviteHoras * 3600 * 1000, tx);
    const m = await tx.morador.findFirst({ where: { usuarioId: novo.id, principal: true }, include: repo.incluir });
    return { morador: m, token: t };
  });

  let conviteEnviado = true;
  try {
    await mailer.enviar({
      para: dados.email,
      assunto: 'ZELUVI - convite de cadastro',
      texto: `Olá, ${dados.nome}. O síndico cadastrou você no ZELUVI. Crie sua senha pelo link (vale ${env.conviteHoras} horas):\n${mailer.linkRedefinicao(token)}`,
    });
  } catch (e) {
    conviteEnviado = false;
    console.error('Falha ao enviar convite:', e.message);
  }
  return { ...moradorDto(morador), conviteEnviado };
}

async function atualizar(usuario, id, dados) {
  const atual = await repo.buscarPorUsuarioId(id, usuario.condominioId);
  if (!atual) throw AppError.naoEncontrado('Morador não encontrado.');

  if (dados.unidadeId !== undefined) {
    const u = await repo.buscarUnidade(dados.unidadeId, usuario.condominioId);
    if (!u) throw AppError.naoEncontrado('Unidade não encontrada.');
  }
  if (dados.email !== undefined && (await repo.emailEmUso(dados.email, id))) {
    throw AppError.conflito('Já existe um usuário com este e-mail.');
  }

  const dadosUsuario = {};
  for (const campo of ['nome', 'email', 'telefone', 'ativo']) {
    if (dados[campo] !== undefined) dadosUsuario[campo] = dados[campo];
  }
  const dadosMorador = {};
  if (dados.unidadeId !== undefined) dadosMorador.unidadeId = dados.unidadeId;
  if (dados.tipo !== undefined) dadosMorador.tipoVinculo = dados.tipo;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(dadosUsuario).length) await tx.usuario.update({ where: { id }, data: dadosUsuario });
    if (Object.keys(dadosMorador).length) await tx.morador.update({ where: { id: atual.id }, data: dadosMorador });
  });
  return moradorDto(await repo.buscarPorUsuarioId(id, usuario.condominioId));
}

module.exports = { listar, buscar, criar, atualizar };
