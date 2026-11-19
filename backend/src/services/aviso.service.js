// "Aviso" na API = tabela comunicado no banco.
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { avisoDto } = require('../utils/dto');
const { paraSkipTake, resposta } = require('../utils/paginacao');

const incluir = { autor: { select: { id: true, nome: true } } };

// Vigente = nao removido e (sem validade ou ainda nao expirou). So o sindico ve expirados.
function filtroVisivel(usuario, incluirExpirados) {
  const base = { condominioId: usuario.condominioId, removidoEm: null };
  if (usuario.perfil === 'SINDICO' && incluirExpirados) return base;
  return { ...base, OR: [{ expiraEm: null }, { expiraEm: { gt: new Date() } }] };
}

async function listar(usuario, filtros) {
  const where = filtroVisivel(usuario, filtros.incluirExpirados);
  const [dados, total] = await prisma.$transaction([
    prisma.comunicado.findMany({ where, include: incluir, orderBy: { dataPublicacao: 'desc' }, ...paraSkipTake(filtros) }),
    prisma.comunicado.count({ where }),
  ]);
  return resposta(dados.map(avisoDto), total, filtros);
}

async function buscar(usuario, id) {
  // Para o sindico, expirado ainda aparece; para os outros vira 404
  const aviso = await prisma.comunicado.findFirst({
    where: { id, ...filtroVisivel(usuario, usuario.perfil === 'SINDICO') },
    include: incluir,
  });
  if (!aviso) throw AppError.naoEncontrado('Aviso não encontrado.');
  return avisoDto(aviso);
}

async function criar(usuario, dados) {
  const aviso = await prisma.comunicado.create({
    data: {
      condominioId: usuario.condominioId,
      autorId: usuario.id,
      titulo: dados.titulo,
      conteudo: dados.conteudo,
      expiraEm: dados.expiraEm ? new Date(dados.expiraEm) : null,
    },
    include: incluir,
  });
  // TODO (integracao): publicar o evento aviso.publicado no canal condominio:{id} (WebSocket/push).
  return avisoDto(aviso);
}

async function atualizar(usuario, id, dados) {
  const existe = await prisma.comunicado.findFirst({ where: { id, condominioId: usuario.condominioId, removidoEm: null } });
  if (!existe) throw AppError.naoEncontrado('Aviso não encontrado.');
  const data = { atualizadoEm: new Date() };
  if (dados.titulo !== undefined) data.titulo = dados.titulo;
  if (dados.conteudo !== undefined) data.conteudo = dados.conteudo;
  if (dados.expiraEm !== undefined) data.expiraEm = dados.expiraEm ? new Date(dados.expiraEm) : null;
  const aviso = await prisma.comunicado.update({ where: { id }, data, include: incluir });
  return avisoDto(aviso);
}

async function remover(usuario, id) {
  const existe = await prisma.comunicado.findFirst({ where: { id, condominioId: usuario.condominioId, removidoEm: null } });
  if (!existe) throw AppError.naoEncontrado('Aviso não encontrado.');
  await prisma.comunicado.update({ where: { id }, data: { removidoEm: new Date() } }); // fica guardado p/ auditoria
}

module.exports = { listar, buscar, criar, atualizar, remover };
