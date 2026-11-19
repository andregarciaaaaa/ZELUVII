// Resumo da tela inicial de cada perfil (numeros dos cartoes do dashboard).
const router = require('express').Router();
const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const autenticar = require('../middlewares/autenticar');
const datas = require('../utils/datas');

router.get('/', autenticar, asyncHandler(async (req, res) => {
  const u = req.usuario;
  const agora = new Date();
  const hoje = datas.hoje();
  const meusUnidades = u.perfil === 'MORADOR'
    ? (await prisma.morador.findMany({ where: { usuarioId: u.id, unidade: { condominioId: u.condominioId } }, select: { unidadeId: true } })).map((m) => m.unidadeId)
    : null;
  const doCondominio = { unidade: { condominioId: u.condominioId } };
  const filtroUnidade = meusUnidades ? { unidadeId: { in: meusUnidades } } : {};

  const [avisosVigentes, ocorrenciasEmAberto, encomendasPendentes, proximasReservas, visitantesNoCondominio] = await Promise.all([
    prisma.comunicado.count({ where: { condominioId: u.condominioId, removidoEm: null, OR: [{ expiraEm: null }, { expiraEm: { gt: agora } }] } }),
    prisma.ocorrencia.count({
      where: {
        condominioId: u.condominioId,
        status: { notIn: ['resolvida', 'cancelada'] },
        ...(u.perfil === 'SINDICO' ? {} : { autorId: u.id }),
      },
    }),
    u.perfil === 'MORADOR' || u.perfil === 'PORTEIRO' || u.perfil === 'SINDICO'
      ? prisma.encomenda.count({ where: { ...doCondominio, ...filtroUnidade, status: 'aguardando_retirada' } })
      : 0,
    prisma.reserva.count({
      where: {
        area: { condominioId: u.condominioId },
        status: { in: ['pendente', 'confirmada'] },
        fim: { gt: agora },
        ...(u.perfil === 'MORADOR' ? { criadoPorId: u.id } : {}),
      },
    }),
    u.perfil === 'MORADOR' ? null : prisma.visitante.count({ where: { ...doCondominio, dataSaida: null } }),
  ]);

  const resposta = { perfil: u.perfil, avisosVigentes, ocorrenciasEmAberto, encomendasPendentes, proximasReservas };
  if (visitantesNoCondominio !== null) resposta.visitantesNoCondominio = visitantesNoCondominio;

  if (u.perfil === 'SINDICO') {
    resposta.reservasPendentesDeAprovacao = await prisma.reserva.count({
      where: { area: { condominioId: u.condominioId }, status: 'pendente', fim: { gt: agora } },
    });
    resposta.cobrancasEmAtraso = await prisma.lancamento.count({
      where: { ...doCondominio, status: 'pendente', vencimento: { lt: new Date(`${hoje}T00:00:00.000Z`) } },
    });
  }
  if (u.perfil === 'MORADOR') {
    resposta.cobrancasPendentes = await prisma.lancamento.count({ where: { ...doCondominio, ...filtroUnidade, status: 'pendente' } });
  }
  res.json(resposta);
}));

module.exports = router;
