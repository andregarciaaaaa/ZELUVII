const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { areaDto } = require('../utils/dto');
const datas = require('../utils/datas');

const MSG_NOME = 'Já existe uma área com este nome.';

async function listar(usuario, { ativa }) {
  const where = { condominioId: usuario.condominioId };
  if (usuario.perfil === 'SINDICO') {
    if (ativa !== undefined) where.ativa = ativa;
  } else {
    where.ativa = true; // morador e porteiro so veem areas ativas
  }
  const areas = await prisma.areaComum.findMany({ where, orderBy: { nome: 'asc' } });
  return { dados: areas.map(areaDto) };
}

async function buscarOuFalhar(usuario, id) {
  const area = await prisma.areaComum.findFirst({ where: { id, condominioId: usuario.condominioId } });
  if (!area || (!area.ativa && usuario.perfil !== 'SINDICO')) throw AppError.naoEncontrado('Área comum não encontrada.');
  return area;
}

async function buscar(usuario, id) {
  return areaDto(await buscarOuFalhar(usuario, id));
}

function validarDuracao(abertura, fechamento, duracao) {
  if (duracao == null) return;
  const janela = datas.hhmmParaMinutos(fechamento) - datas.hhmmParaMinutos(abertura);
  if (duracao * 60 > janela) {
    throw AppError.validacao([{ campo: 'duracaoMaximaHoras', mensagem: 'A duração máxima não pode passar do horário de funcionamento.' }]);
  }
}

async function criar(usuario, dados) {
  validarDuracao(dados.horarioAbertura, dados.horarioFechamento, dados.duracaoMaximaHoras);
  const dup = await prisma.areaComum.findFirst({ where: { condominioId: usuario.condominioId, nome: dados.nome } });
  if (dup) throw AppError.conflito(MSG_NOME);
  const area = await prisma.areaComum.create({ data: { ...dados, condominioId: usuario.condominioId } });
  return areaDto(area);
}

async function atualizar(usuario, id, dados) {
  const atual = await prisma.areaComum.findFirst({ where: { id, condominioId: usuario.condominioId } });
  if (!atual) throw AppError.naoEncontrado('Área comum não encontrada.');

  const abertura = dados.horarioAbertura ?? atual.horarioAbertura;
  const fechamento = dados.horarioFechamento ?? atual.horarioFechamento;
  if (fechamento <= abertura) {
    throw AppError.validacao([{ campo: 'horarioFechamento', mensagem: 'O horário de fechamento precisa ser depois do de abertura.' }]);
  }
  validarDuracao(abertura, fechamento, dados.duracaoMaximaHoras !== undefined ? dados.duracaoMaximaHoras : atual.duracaoMaximaHoras);

  if (dados.nome && dados.nome !== atual.nome) {
    const dup = await prisma.areaComum.findFirst({ where: { condominioId: usuario.condominioId, nome: dados.nome, NOT: { id } } });
    if (dup) throw AppError.conflito(MSG_NOME);
  }
  const area = await prisma.areaComum.update({ where: { id }, data: dados });
  // Reservas ja feitas continuam valendo; as regras novas valem so para reservas novas
  const reservasFuturas = await prisma.reserva.count({
    where: { areaId: id, status: { in: ['pendente', 'confirmada'] }, fim: { gt: new Date() } },
  });
  return { ...areaDto(area), reservasFuturas };
}

// Horarios ocupados em um dia (pendente tambem segura o horario). Nao revela quem reservou.
async function disponibilidade(usuario, id, { data }) {
  const area = await buscarOuFalhar(usuario, id);
  if (!area.ativa) throw AppError.naoEncontrado('Área comum não encontrada.');

  const hoje = datas.hoje();
  const limite = datas.somarDias(hoje, area.antecedenciaMaximaDias);
  if (data < hoje) throw AppError.validacao([{ campo: 'data', mensagem: 'A data não pode estar no passado.' }]);
  if (data > limite) {
    throw AppError.validacao([{ campo: 'data', mensagem: `Só é possível reservar até ${area.antecedenciaMaximaDias} dias à frente.` }]);
  }

  const reservas = await prisma.reserva.findMany({
    where: {
      areaId: id,
      status: { in: ['pendente', 'confirmada'] },
      inicio: { lt: datas.instanteLocal(datas.somarDias(data, 1)) },
      fim: { gt: datas.instanteLocal(data) },
    },
    orderBy: { inicio: 'asc' },
  });
  const dto = areaDto(area);
  return {
    areaId: id,
    data,
    horarioAbertura: dto.horarioAbertura,
    horarioFechamento: dto.horarioFechamento,
    duracaoMaximaHoras: dto.duracaoMaximaHoras,
    ocupado: reservas.map((r) => ({
      inicio: r.inicio.toISOString(),
      fim: r.fim.toISOString(),
      status: r.status.toUpperCase(),
      propria: r.criadoPorId === usuario.id,
    })),
  };
}

module.exports = { listar, buscar, criar, atualizar, disponibilidade };
