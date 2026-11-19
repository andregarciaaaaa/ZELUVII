// Conversores banco -> JSON da API (camelCase, enums em MAIUSCULO, sem senha nem hash).
const { dataSql } = require('./datas');

const maiusculo = (v) => (v == null ? v : String(v).toUpperCase());
const iso = (d) => (d ? d.toISOString() : null);

function unidadeDto(u) {
  if (!u) return null;
  return { id: u.id, numero: u.numero ?? u.identificacao, bloco: u.bloco ?? null };
}

function areaDto(a) {
  const [ha, ma] = a.horarioAbertura.split(':').map(Number);
  const [hf, mf] = a.horarioFechamento.split(':').map(Number);
  const janelaHoras = Math.max(1, Math.min(24, Math.floor((hf * 60 + mf - (ha * 60 + ma)) / 60)));
  return {
    id: a.id,
    nome: a.nome,
    regras: a.regras,
    capacidade: a.capacidade,
    horarioAbertura: a.horarioAbertura,
    horarioFechamento: a.horarioFechamento,
    duracaoMaximaHoras: a.duracaoMaximaHoras ?? janelaHoras,
    antecedenciaMaximaDias: a.antecedenciaMaximaDias,
    exigeAprovacao: a.exigeAprovacao,
    ativa: a.ativa,
    criadaEm: iso(a.criadaEm),
  };
}

// morador: linha de `morador` com usuario e unidade carregados. `id` e o id do USUARIO (o mesmo do login).
function moradorDto(m) {
  return {
    id: m.usuario.id,
    nome: m.usuario.nome,
    email: m.usuario.email,
    telefone: m.usuario.telefone,
    unidade: unidadeDto(m.unidade),
    tipo: maiusculo(m.tipoVinculo),
    ativo: m.usuario.ativo,
    criadoEm: iso(m.usuario.criadoEm),
  };
}

function avisoDto(c) {
  return {
    id: c.id,
    titulo: c.titulo,
    conteudo: c.conteudo,
    autor: { id: c.autor.id, nome: c.autor.nome },
    publicadoEm: iso(c.dataPublicacao),
    expiraEm: iso(c.expiraEm),
    atualizadoEm: iso(c.atualizadoEm),
  };
}

// reserva com area, morador(+usuario,+unidade). `privado` = esconder dados pessoais (LGPD).
function reservaDto(r, { privado = false } = {}) {
  const m = r.morador;
  return {
    id: r.id,
    area: { id: r.area.id, nome: r.area.nome },
    morador: !privado && m ? { id: m.usuario.id, nome: m.usuario.nome } : null,
    unidade: !privado && m ? unidadeDto(m.unidade) : null,
    inicio: iso(r.inicio),
    fim: iso(r.fim),
    observacao: privado ? null : r.observacao,
    status: maiusculo(r.status),
    criadaEm: iso(r.criadaEm),
    canceladaEm: iso(r.canceladaEm),
  };
}

function ocorrenciaDto(o, { comHistorico = false } = {}) {
  const dto = {
    id: o.id,
    protocolo: o.protocolo,
    assunto: o.assunto,
    descricao: o.descricao,
    categoria: maiusculo(o.categoria),
    local: o.local,
    status: maiusculo(o.status),
    autor: { id: o.autor.id, nome: o.autor.nome, perfil: o.autorPerfil ?? null },
    unidade: o.morador ? unidadeDto(o.morador.unidade) : null,
    abertaEm: iso(o.dataAbertura),
  };
  if (comHistorico) {
    dto.historico = o.historicos.map((h) => ({
      statusAnterior: maiusculo(h.statusAnterior),
      statusNovo: maiusculo(h.statusNovo),
      observacao: h.observacao,
      responsavel: { id: h.usuario.id, nome: h.usuario.nome },
      alteradoEm: iso(h.dataAlteracao),
    }));
  }
  return dto;
}

function encomendaDto(e) {
  return {
    id: e.id,
    unidade: unidadeDto(e.unidade),
    descricao: e.descricao,
    transportadora: e.transportadora,
    codigoRastreio: e.codigoRastreio,
    status: maiusculo(e.status),
    registradaPor: { id: e.registradoPor.id, nome: e.registradoPor.nome },
    recebidaEm: iso(e.dataRecebimento),
    retiradaPor: e.retiradoPor ? { id: e.retiradoPor.id, nome: e.retiradoPor.nome } : null,
    retiradaEm: iso(e.dataRetirada),
  };
}

function visitanteDto(v) {
  return {
    id: v.id,
    nome: v.nome,
    tipo: maiusculo(v.tipo),
    unidade: unidadeDto(v.unidade),
    observacao: v.observacao,
    status: v.dataSaida ? 'SAIU' : 'NO_CONDOMINIO',
    registradoPor: { id: v.registradoPor.id, nome: v.registradoPor.nome },
    entradaEm: iso(v.dataEntrada),
    saidaEm: iso(v.dataSaida),
  };
}

function cobrancaDto(l, hojeStr) {
  const venc = dataSql(l.vencimento);
  return {
    id: l.id,
    unidade: unidadeDto(l.unidade),
    tipo: maiusculo(l.tipo),
    descricao: l.descricao,
    competencia: dataSql(l.competencia),
    valor: Number(l.valor),
    vencimento: venc,
    dataPagamento: dataSql(l.dataPagamento),
    status: maiusculo(l.status),
    // "Atrasado" nao e status no banco: e cobranca pendente com vencimento no passado
    atrasada: l.status === 'pendente' && venc < hojeStr,
    boletoUrl: l.boletoUrl,
  };
}

function despesaDto(d, hojeStr) {
  const venc = dataSql(d.vencimento);
  return {
    id: d.id,
    categoria: maiusculo(d.categoria),
    descricao: d.descricao,
    fornecedor: d.fornecedor,
    valor: Number(d.valor),
    competencia: dataSql(d.competencia),
    vencimento: venc,
    dataPagamento: dataSql(d.dataPagamento),
    status: maiusculo(d.status),
    atrasada: d.status === 'pendente' && venc < hojeStr,
  };
}

module.exports = {
  maiusculo, iso, unidadeDto, areaDto, moradorDto, avisoDto, reservaDto,
  ocorrenciaDto, encomendaDto, visitanteDto, cobrancaDto, despesaDto,
};
