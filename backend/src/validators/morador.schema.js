const { z, telefone, email, enumCI, id, PELO_MENOS_UM, ao_menos_um } = require('./comum');
const { paginacaoSchema } = require('../utils/paginacao');

const nome = z.string().trim().min(3).max(100);
const tipo = enumCI(['proprietario', 'inquilino']);

const criar = z.object({
  nome,
  email,
  telefone: telefone.optional(),
  unidadeId: id,
  tipo,
}).strict();

// PATCH: todos opcionais, mas ao menos um. id, perfil, senha e criadoEm nao sao aceitos (strict -> 400)
const atualizar = z.object({
  nome: nome.optional(),
  email: email.optional(),
  telefone: telefone.nullable().optional(),
  unidadeId: id.optional(),
  tipo: tipo.optional(),
  ativo: z.boolean().optional(),
}).strict().refine(ao_menos_um, PELO_MENOS_UM);

const listar = z.object({
  busca: z.string().trim().min(1).optional(),
  unidadeId: id.optional(),
  ativo: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  ...paginacaoSchema,
});

module.exports = { criar, atualizar, listar };
