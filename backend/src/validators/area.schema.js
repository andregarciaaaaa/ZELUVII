const { z, instante, id, dataAAAAMMDD, enumCI, PELO_MENOS_UM, ao_menos_um } = require('./comum');
const { paginacaoSchema } = require('../utils/paginacao');

const hhmm = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Use o formato HH:mm (ex.: 08:00).');
const base = {
  nome: z.string().trim().min(3).max(100),
  regras: z.string().trim().max(2000).nullable().optional(),
  capacidade: z.number().int().min(1).max(1000).nullable().optional(),
  horarioAbertura: hhmm,
  horarioFechamento: hhmm,
  duracaoMaximaHoras: z.number().int().min(1).max(24).nullable().optional(),
  antecedenciaMaximaDias: z.number().int().min(1).max(180).optional(),
  exigeAprovacao: z.boolean().optional(),
};

const horarioCoerente = (d) => d.horarioAbertura === undefined || d.horarioFechamento === undefined || d.horarioFechamento > d.horarioAbertura;
const MSG_HORARIO = { message: 'O horário de fechamento precisa ser depois do de abertura.', path: ['horarioFechamento'] };

const criar = z.object(base).strict().refine(horarioCoerente, MSG_HORARIO);
const atualizar = z.object({ ...base, ativa: z.boolean().optional() })
  .partial().strict().refine(ao_menos_um, PELO_MENOS_UM).refine(horarioCoerente, MSG_HORARIO);

const listar = z.object({ ativa: z.enum(['true', 'false']).transform((v) => v === 'true').optional() });
const disponibilidade = z.object({ data: dataAAAAMMDD });

// ---- reservas ----
const criarReserva = z.object({
  areaId: id,
  inicio: instante,
  fim: instante,
  observacao: z.string().trim().max(500).optional(),
  moradorId: id.optional(), // so o sindico envia (reserva em nome de um morador)
}).strict();

const listarReservas = z.object({
  areaId: id.optional(),
  de: dataAAAAMMDD.optional(),
  ate: dataAAAAMMDD.optional(),
  status: enumCI(['pendente', 'confirmada', 'recusada', 'cancelada']).optional(),
  ...paginacaoSchema,
}).refine((q) => !q.de || !q.ate || q.de <= q.ate, { message: '"de" não pode ser depois de "ate".', path: ['de'] });

// Decisao do sindico sobre reserva pendente
const decidirReserva = z.object({ status: enumCI(['confirmada', 'recusada']) }).strict();

module.exports = { criar, atualizar, listar, disponibilidade, criarReserva, listarReservas, decidirReserva };
