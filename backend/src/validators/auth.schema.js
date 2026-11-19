const { z, email, senhaForte } = require('./comum');

const login = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  senha: z.string({ required_error: 'Senha é obrigatória.' }).min(1, 'Senha é obrigatória.'),
});

const esqueciSenha = z.object({ email });

const redefinirSenha = z
  .object({
    token: z.string().min(1, 'Campo obrigatório.'),
    novaSenha: senhaForte,
    confirmacaoSenha: z.string().min(1, 'Campo obrigatório.'),
  })
  .refine((d) => d.novaSenha === d.confirmacaoSenha, {
    message: 'A confirmação precisa ser igual à nova senha.',
    path: ['confirmacaoSenha'],
  });

module.exports = { login, esqueciSenha, redefinirSenha };
