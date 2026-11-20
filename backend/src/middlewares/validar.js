// Valida body, query ou params com um schema zod. Se falhar, responde 400 VALIDACAO
// com a lista { campo, mensagem }. Se passar, troca o valor pelo dado ja convertido.
const AppError = require('../utils/AppError');

module.exports = (schema, origem = 'body') => (req, res, next) => {
  const resultado = schema.safeParse(req[origem] ?? {});

  if (!resultado.success) {
    const detalhes = resultado.error.issues.map((issue) => ({
      // unrecognized_keys (campo nao permitido) nao tem path: usa o nome dos campos enviados
      campo: issue.path.join('.') || (issue.keys && issue.keys.join(', ')) || origem,
      mensagem: issue.message,
    }));
    return next(new AppError(400, 'VALIDACAO', 'Dados invalidos.', detalhes));
  }

  // Express 4: req.query e um getter; guardamos o resultado validado em req.validado
  req.validado = { ...(req.validado || {}), [origem]: resultado.data };
  return next();
};
