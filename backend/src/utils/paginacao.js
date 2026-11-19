const { z } = require('zod');

// Parametros ?pagina=1&limite=20 (limite padrao 20, maximo 100)
const paginacaoSchema = {
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
};

function paraSkipTake({ pagina, limite }) {
  return { skip: (pagina - 1) * limite, take: limite };
}

function resposta(dados, total, { pagina, limite }) {
  return { dados, pagina, limite, total };
}

module.exports = { paginacaoSchema, paraSkipTake, resposta };
