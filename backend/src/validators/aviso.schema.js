// Regras dos campos de aviso (Especificacao da API de Avisos, Ocorrencias e Portaria v1.0, secao 3)
const { z } = require('zod');

const titulo = z
  .string({ required_error: 'Titulo e obrigatorio.', invalid_type_error: 'Titulo deve ser texto.' })
  .trim()
  .min(3, 'Titulo deve ter de 3 a 150 caracteres.')
  .max(150, 'Titulo deve ter de 3 a 150 caracteres.');

const conteudo = z
  .string({ required_error: 'Conteudo e obrigatorio.', invalid_type_error: 'Conteudo deve ser texto.' })
  .trim()
  .min(1, 'Conteudo e obrigatorio.')
  .max(5000, 'Conteudo deve ter no maximo 5000 caracteres.');

// Data e hora ISO 8601 (ex.: 2026-11-20T18:00:00-03:00), sempre no futuro. null = sem expiracao.
const expiraEm = z
  .string({ invalid_type_error: 'expiraEm deve ser data e hora ISO 8601.' })
  .datetime({ offset: true, message: 'expiraEm deve ser data e hora ISO 8601 (ex.: 2026-11-20T18:00:00-03:00).' })
  .transform((valor) => new Date(valor))
  .refine((data) => data > new Date(), 'expiraEm deve estar no futuro.')
  .nullable();

// .strict(): enviar campo nao permitido (ex.: autor) da 400
const criarAvisoSchema = z
  .object({ titulo, conteudo, expiraEm: expiraEm.optional() })
  .strict('Campo nao permitido.');

const atualizarAvisoSchema = z
  .object({ titulo: titulo.optional(), conteudo: conteudo.optional(), expiraEm: expiraEm.optional() })
  .strict('Campo nao permitido.')
  .refine((dados) => Object.keys(dados).length > 0, 'Envie ao menos um campo: titulo, conteudo ou expiraEm.');

const listarAvisosSchema = z.object({
  limite: z.coerce
    .number({ invalid_type_error: 'limite deve ser numero.' })
    .int('limite deve ser inteiro.')
    .min(1, 'limite deve ser de 1 a 100.')
    .max(100, 'limite deve ser de 1 a 100.')
    .default(20),
  cursor: z.coerce.number().int().positive('cursor invalido.').optional(),
  incluirExpirados: z
    .enum(['true', 'false'], { message: 'incluirExpirados deve ser true ou false.' })
    .default('false')
    .transform((valor) => valor === 'true'),
});

const idSchema = z.object({
  id: z.coerce.number({ invalid_type_error: 'id invalido.' }).int('id invalido.').positive('id invalido.'),
});

module.exports = { criarAvisoSchema, atualizarAvisoSchema, listarAvisosSchema, idSchema };
