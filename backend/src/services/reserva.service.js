const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { reservaDto } = require('../utils/dto');
const datas = require('../utils/datas');
const { paraSkipTake, resposta } = require('../utils/paginacao');

const incluir = {
  area: { select: { id: true, nome: true } },
  morador: { include: { usuario: { select: { id: true, nome: true } }, unidade: true } },
};
const ATIVAS = ['pendente', 'confirmada']; // seguram o horario

const hhmm = (d) => datas.partesLocais(d).hora;

// Reserva que o usuario pode ver completa: as que ele mesmo criou (ou feitas para ele)
const ehPropria = (r, usuario) => r.criadoPorId === usuario.id || (r.morador && r.morador.usuario.id === usuario.id);

function paraDto(r, usuario) {
  const privado = usuario.perfil === 'MORADOR' && !ehPropria(r, usuario); // LGPD: morador nao ve dados dos outros
  return reservaDto(r, { privado });
}

// Regras da area (ordem 6 da especificacao). Junta todos os problemas em um unico 400.
function regrasDaArea(area, inicio, fim) {
  const erros = [];
  const agora = new Date();
  const li = datas.partesLocais(inicio);
  const lf = datas.partesLocais(fim);

  if (fim <= inicio) erros.push({ campo: 'fim', mensagem: 'O fim precisa ser depois do início.' });
  if (inicio <= agora) erros.push({ campo: 'inicio', mensagem: 'A reserva precisa começar no futuro.' });
  if (li.data !== lf.data) erros.push({ campo: 'fim', mensagem: 'A reserva precisa começar e terminar no mesmo dia.' });

  if (li.minutos < datas.hhmmParaMinutos(area.horarioAbertura)) {
    erros.push({ campo: 'inicio', mensagem: `A área abre às ${area.horarioAbertura}.` });
  }
  if (li.data === lf.data && lf.minutos > datas.hhmmParaMinutos(area.horarioFechamento)) {
    erros.push({ campo: 'fim', mensagem: `A área fecha às ${area.horarioFechamento}.` });
  }

  const janelaMin = datas.hhmmParaMinutos(area.horarioFechamento) - datas.hhmmParaMinutos(area.horarioAbertura);
  const maxHoras = area.duracaoMaximaHoras ?? Math.max(1, Math.floor(janelaMin / 60));
  if ((fim - inicio) / 3600000 > maxHoras) {
    erros.push({ campo: 'fim', mensagem: `A reserva pode durar no máximo ${maxHoras} horas.` });
  }

  const limite = datas.instanteLocal(datas.somarDias(datas.hoje(), area.antecedenciaMaximaDias + 1)); // fim do ultimo dia permitido
  if (inicio >= limite) {
    erros.push({ campo: 'inicio', mensagem: `Só é possível reservar até ${area.antecedenciaMaximaDias} dias à frente.` });
  }
  if (erros.length) throw AppError.validacao(erros, 'Um ou mais campos estão inválidos.');
}

function ehViolacaoDeExclusao(e) {
  return e && /reserva_sem_sobreposicao|exclusion constraint|23P01/i.test(`${e.message} ${JSON.stringify(e.meta || {})}`);
}

async function criar(usuario, dados) {
  // 1-2: autenticacao e perfil ja foram checados nas rotas. 3: formato ja validado pelo zod.
  if (usuario.perfil === 'MORADOR' && dados.moradorId !== undefined) {
    throw AppError.validacao([{ campo: 'moradorId', mensagem: 'Só o síndico pode reservar em nome de outro morador.' }]);
  }

  // 4-5: area existe neste condominio e esta ativa
  const area = await prisma.areaComum.findFirst({ where: { id: dados.areaId, condominioId: usuario.condominioId } });
  if (!area || !area.ativa) throw AppError.naoEncontrado('Área comum não encontrada.');

  // Quem sera o morador da reserva
  let moradorId = null;
  if (usuario.perfil === 'MORADOR') {
    const m = await prisma.morador.findFirst({
      where: { usuarioId: usuario.id, unidade: { condominioId: usuario.condominioId } },
      orderBy: [{ principal: 'desc' }, { id: 'asc' }],
    });
    if (!m) throw AppError.semPermissao('Seu cadastro de morador não está vinculado a uma unidade.');
    moradorId = m.id;
  } else if (dados.moradorId !== undefined) {
    const m = await prisma.morador.findFirst({
      where: { usuarioId: dados.moradorId, principal: true, unidade: { condominioId: usuario.condominioId }, usuario: { ativo: true } },
    });
    if (!m) throw AppError.naoEncontrado('Morador não encontrado.');
    moradorId = m.id;
  }

  const inicio = new Date(dados.inicio);
  const fim = new Date(dados.fim);
  // 6: regras da area
  regrasDaArea(area, inicio, fim);

  // 7: sobreposicao (encostar nao e sobrepor)
  const conflito = await prisma.reserva.findFirst({
    where: { areaId: area.id, status: { in: ATIVAS }, inicio: { lt: fim }, fim: { gt: inicio } },
    orderBy: { inicio: 'asc' },
  });
  if (conflito) throw erroDeConflito(area, conflito);

  // 8: grava. Sindico reservando para o condominio ou para um morador ja nasce confirmada.
  const status = area.exigeAprovacao && usuario.perfil === 'MORADOR' ? 'pendente' : 'confirmada';
  try {
    const r = await prisma.reserva.create({
      data: {
        areaId: area.id,
        moradorId,
        criadoPorId: usuario.id,
        inicio,
        fim,
        status,
        observacao: dados.observacao ?? null,
        ...(status === 'confirmada' && usuario.perfil !== 'MORADOR' ? { decididoPorId: usuario.id, decididoEm: new Date() } : {}),
      },
      include: incluir,
    });
    return paraDto(r, usuario);
  } catch (e) {
    // Dois pedidos ao mesmo tempo passaram na checagem: o banco barra o segundo (EXCLUDE)
    if (ehViolacaoDeExclusao(e)) {
      const outra = await prisma.reserva.findFirst({
        where: { areaId: area.id, status: { in: ATIVAS }, inicio: { lt: fim }, fim: { gt: inicio } },
        orderBy: { inicio: 'asc' },
      });
      throw erroDeConflito(area, outra || { inicio, fim });
    }
    throw e;
  }
}

// LGPD: o erro mostra so o periodo ocupado, nunca quem reservou
function erroDeConflito(area, ocupada) {
  const dia = datas.dataBr(datas.partesLocais(ocupada.inicio).data);
  return AppError.conflito(`Horário já reservado: ${area.nome}, ${dia}, das ${hhmm(ocupada.inicio)} às ${hhmm(ocupada.fim)}.`);
}

async function listar(usuario, filtros) {
  const where = { area: { condominioId: usuario.condominioId } };
  if (filtros.areaId) where.areaId = filtros.areaId;
  if (filtros.status) where.status = filtros.status;
  if (filtros.de || filtros.ate) {
    where.inicio = {};
    if (filtros.de) where.inicio.gte = datas.instanteLocal(filtros.de);
    if (filtros.ate) where.inicio.lt = datas.instanteLocal(datas.somarDias(filtros.ate, 1));
  }
  const [dados, total] = await prisma.$transaction([
    prisma.reserva.findMany({ where, include: incluir, orderBy: { inicio: 'asc' }, ...paraSkipTake(filtros) }),
    prisma.reserva.count({ where }),
  ]);
  return resposta(dados.map((r) => paraDto(r, usuario)), total, filtros);
}

async function buscarOuFalhar(usuario, id) {
  const r = await prisma.reserva.findFirst({ where: { id, area: { condominioId: usuario.condominioId } }, include: incluir });
  if (!r) throw AppError.naoEncontrado('Reserva não encontrada.');
  return r;
}

async function buscar(usuario, id) {
  return paraDto(await buscarOuFalhar(usuario, id), usuario);
}

async function cancelar(usuario, id) {
  const r = await buscarOuFalhar(usuario, id);
  if (usuario.perfil === 'MORADOR' && !ehPropria(r, usuario)) {
    throw AppError.semPermissao('Você só pode cancelar as suas reservas.');
  }
  if (r.status === 'cancelada' || r.status === 'recusada') throw AppError.conflito('Esta reserva já foi cancelada.');

  const agora = new Date();
  // Morador cancela ate o inicio; sindico ate o fim
  if (usuario.perfil === 'MORADOR' && agora >= r.inicio) throw AppError.conflito('Não é possível cancelar uma reserva que já começou.');
  if (usuario.perfil === 'SINDICO' && agora >= r.fim) throw AppError.conflito('Não é possível cancelar uma reserva que já terminou.');

  await prisma.reserva.update({ where: { id }, data: { status: 'cancelada', canceladaEm: agora } });
}

// Sindico aprova ou recusa reserva pendente (historia 3.3)
async function decidir(usuario, id, { status }) {
  const r = await buscarOuFalhar(usuario, id);
  if (r.status !== 'pendente') throw AppError.conflito('Só reservas pendentes podem ser aprovadas ou recusadas.');
  if (new Date() >= r.fim) throw AppError.conflito('Esta reserva já terminou.');
  const atualizada = await prisma.reserva.update({
    where: { id },
    data: { status, decididoPorId: usuario.id, decididoEm: new Date() },
    include: incluir,
  });
  return paraDto(atualizada, usuario);
}

module.exports = { criar, listar, buscar, cancelar, decidir };
