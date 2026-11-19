const { z, enumCI } = require('./comum');
const { paginacaoSchema } = require('../utils/paginacao');

const CATEGORIAS = ['manutencao', 'limpeza', 'elevador', 'iluminacao', 'outros'];
// RN08 (Fase 2). "ABERTA" da especificacao de API e aceita como apelido de "solicitada".
const STATUS = ['solicitada', 'em_andamento', 'aguardando_terceiro', 'resolvida', 'cancelada'];
const status = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  const s = v.trim().toLowerCase();
  return s === 'aberta' ? 'solicitada' : s;
}, z.enum(STATUS));

// Autor e unidade vem do token: enviar status ou autor da 400 (strict)
const criar = z.object({
  assunto: z.string().trim().min(3).max(150),
  descricao: z.string().trim().min(1).max(2000),
  categoria: enumCI(CATEGORIAS),
  local: z.string().trim().max(100).optional(),
}).strict();

const mudarStatus = z.object({
  status,
  observacao: z.string().trim().max(500).optional(),
}).strict();

const listar = z.object({
  status: status.optional(),
  categoria: enumCI(CATEGORIAS).optional(),
  ...paginacaoSchema,
});

module.exports = { criar, mudarStatus, listar };
