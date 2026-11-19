const { z, instante, PELO_MENOS_UM, ao_menos_um } = require('./comum');
const { paginacaoSchema } = require('../utils/paginacao');

const titulo = z.string().trim().min(3).max(150);
const conteudo = z.string().trim().min(1).max(5000);
const noFuturo = (s) => new Date(s).getTime() > Date.now();

const criar = z.object({
  titulo,
  conteudo,
  expiraEm: instante.refine(noFuturo, 'A data de expiração precisa estar no futuro.').optional(),
}).strict();

const atualizar = z.object({
  titulo: titulo.optional(),
  conteudo: conteudo.optional(),
  expiraEm: instante.refine(noFuturo, 'A data de expiração precisa estar no futuro.').nullable().optional(),
}).strict().refine(ao_menos_um, PELO_MENOS_UM);

const listar = z.object({
  incluirExpirados: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  ...paginacaoSchema,
});

module.exports = { criar, atualizar, listar };
