const { z } = require('zod');

// POST /auth/login (Especificacao da API de Autenticacao, secao 4)
const loginSchema = z.object({
  email: z
    .string({ required_error: 'E-mail e obrigatorio.' })
    .trim()
    .toLowerCase()
    .email('E-mail invalido.'),
  senha: z.string({ required_error: 'Senha e obrigatoria.' }).min(1, 'Senha e obrigatoria.'),
});

module.exports = { loginSchema };
