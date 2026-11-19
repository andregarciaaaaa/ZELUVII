const { z, id, enumCI, dataAAAAMMDD } = require('./comum');
const { paginacaoSchema } = require('../utils/paginacao');

// ---- encomendas ----
const criarEncomenda = z.object({
  unidadeId: id,
  descricao: z.string().trim().min(1).max(255),
  transportadora: z.string().trim().max(60).optional(),
  codigoRastreio: z.string().trim().max(40).optional(),
}).strict();

const listarEncomendas = z.object({
  status: enumCI(['aguardando_retirada', 'entregue']).optional(),
  unidadeId: id.optional(),
  ...paginacaoSchema,
});

const retirarEncomenda = z.object({
  status: enumCI(['entregue']),
  retiradaPorId: id.optional(),
}).strict();

// ---- visitantes ----
const criarVisitante = z.object({
  nome: z.string().trim().min(3).max(100),
  tipo: enumCI(['visitante', 'prestador']),
  unidadeId: id,
  observacao: z.string().trim().max(255).optional(),
}).strict();

const listarVisitantes = z.object({
  status: enumCI(['no_condominio', 'saiu']).optional(),
  unidadeId: id.optional(),
  de: dataAAAAMMDD.optional(),
  ate: dataAAAAMMDD.optional(),
  ...paginacaoSchema,
}).refine((q) => !q.de || !q.ate || q.de <= q.ate, { message: '"de" não pode ser depois de "ate".', path: ['de'] });

const registrarSaida = z.object({ status: enumCI(['saiu']) }).strict();

module.exports = { criarEncomenda, listarEncomendas, retirarEncomenda, criarVisitante, listarVisitantes, registrarSaida };
