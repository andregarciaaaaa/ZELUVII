// Sindicos e porteiros (moradores usam /moradores). So o sindico cria.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const mailer = require('../utils/mailer');
const { criarTokenSenha } = require('./token.service');
const { perfilDaApi } = require('../middlewares/autenticar');

const dto = (u, v, extra = {}) => ({
  id: u.id, nome: u.nome, email: u.email, telefone: u.telefone,
  perfil: perfilDaApi(v.perfil.nome), ativo: u.ativo, criadoEm: u.criadoEm.toISOString(), ...extra,
});

async function listar(usuario) {
  const vinculos = await prisma.usuarioCondominio.findMany({
    where: { condominioId: usuario.condominioId, perfil: { nome: { in: ['sindico', 'administrador', 'porteiro'] } } },
    include: { usuario: true, perfil: true },
    orderBy: { usuario: { nome: 'asc' } },
  });
  return { dados: vinculos.map((v) => dto(v.usuario, v)) };
}

async function criar(usuario, { nome, email, telefone, perfil }) {
  if (await prisma.usuario.findUnique({ where: { email } })) throw AppError.conflito('Já existe um usuário com este e-mail.');
  const perfilBanco = await prisma.perfil.findUnique({ where: { nome: perfil } });
  if (!perfilBanco) throw new Error(`Perfil "${perfil}" nao existe: rode o seed.`);
  const senhaHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);

  const { criado, token } = await prisma.$transaction(async (tx) => {
    const u = await tx.usuario.create({ data: { nome, email, telefone: telefone ?? null, senhaHash } });
    await tx.usuarioCondominio.create({ data: { usuarioId: u.id, condominioId: usuario.condominioId, perfilId: perfilBanco.id } });
    const t = await criarTokenSenha(u.id, env.conviteHoras * 3600 * 1000, tx);
    return { criado: u, token: t };
  });

  await mailer.enviar({
    para: email,
    assunto: 'ZELUVI - convite de cadastro',
    texto: `Olá, ${nome}. Você foi cadastrado como ${perfil.toUpperCase()} no ZELUVI. Crie sua senha pelo link (vale ${env.conviteHoras} horas):\n${mailer.linkRedefinicao(token)}`,
  });
  return dto(criado, { perfil: perfilBanco }, { conviteEnviado: true });
}

module.exports = { listar, criar };
