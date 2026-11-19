const { z } = require('zod');

const telefone = z.string().regex(/^[0-9]{10,11}$/, 'Informe 10 ou 11 dígitos, só números (com DDD).');
const email = z.string().trim().toLowerCase().email().max(150);
const senhaForte = z
  .string()
  .min(8, 'A senha precisa ter 8 caracteres, com letra e número.')
  .max(72, 'A senha pode ter no máximo 72 caracteres.')
  .refine((s) => /[A-Za-z]/.test(s) && /[0-9]/.test(s), 'A senha precisa ter 8 caracteres, com letra e número.');

// Aceita MAIUSCULO ou minusculo na entrada (a API devolve MAIUSCULO; o banco guarda minusculo)
const enumCI = (valores, mensagemVazia) =>
  z.preprocess((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v), z.enum(valores, mensagemVazia && { required_error: mensagemVazia }));

const id = z.coerce.number().int().positive();
const idParams = z.object({ id });

// Corpo de PATCH: ao menos um campo
const ao_menos_um = (obj) => Object.keys(obj).length > 0;
const PELO_MENOS_UM = { message: 'Envie pelo menos um campo para alterar.', path: [] };

const dataAAAAMMDD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.');
const instante = z.string().datetime({ offset: true });

module.exports = { z, telefone, email, senhaForte, enumCI, id, idParams, ao_menos_um, PELO_MENOS_UM, dataAAAAMMDD, instante };
