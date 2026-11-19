const { z, PELO_MENOS_UM, ao_menos_um } = require('./comum');

const texto = (max) => z.string().trim().min(1).max(max);

const criar = z.object({
  numero: texto(20),
  bloco: texto(30).optional(),
  identificacao: texto(30).optional(), // padrao: "bloco-numero" ou so o numero
}).strict();

const atualizar = z.object({
  numero: texto(20).optional(),
  bloco: texto(30).nullable().optional(),
  identificacao: texto(30).optional(),
}).strict().refine(ao_menos_um, PELO_MENOS_UM);

module.exports = { criar, atualizar };
