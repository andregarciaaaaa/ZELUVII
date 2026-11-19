const { z, telefone, email, enumCI } = require('./comum');

const criar = z.object({
  nome: z.string().trim().min(3).max(100),
  email,
  telefone: telefone.optional(),
  perfil: enumCI(['sindico', 'porteiro']),
}).strict();

module.exports = { criar };
