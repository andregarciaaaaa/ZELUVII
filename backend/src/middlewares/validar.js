const { z } = require('zod');
const AppError = require('../utils/AppError');

// Mensagens do zod em portugues
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.received === 'undefined' || issue.received === 'null') return { message: 'Campo obrigatório.' };
      return { message: `Valor inválido (esperado: ${traduzTipo(issue.expected)}).` };
    case 'too_small':
      if (issue.type === 'string') {
        return { message: issue.minimum === 1 ? 'Campo obrigatório.' : `Mínimo de ${issue.minimum} caracteres.` };
      }
      if (issue.type === 'number') return { message: `Deve ser no mínimo ${issue.minimum}.` };
      if (issue.type === 'array') return { message: `Informe ao menos ${issue.minimum} item.` };
      break;
    case 'too_big':
      if (issue.type === 'string') return { message: `Máximo de ${issue.maximum} caracteres.` };
      if (issue.type === 'number') return { message: `Deve ser no máximo ${issue.maximum}.` };
      break;
    case 'invalid_string':
      if (issue.validation === 'email') return { message: 'E-mail inválido.' };
      if (issue.validation === 'datetime') return { message: 'Data e hora inválidas (use ISO 8601 com fuso).' };
      return { message: 'Formato inválido.' };
    case 'invalid_enum_value':
      return { message: `Valor inválido. Use um destes: ${issue.options.map((o) => String(o).toUpperCase()).join(', ')}.` };
    case 'unrecognized_keys':
      return { message: `Campo não permitido: ${issue.keys.join(', ')}.` };
    default:
      break;
  }
  return { message: ctx.defaultError };
});

function traduzTipo(t) {
  return { string: 'texto', number: 'número', boolean: 'verdadeiro/falso', object: 'objeto', array: 'lista' }[t] || t;
}

// validar(schema, 'body' | 'query' | 'params'): troca req[fonte] pelo valor ja convertido.
module.exports = (schema, fonte = 'body') => (req, res, next) => {
  const resultado = schema.safeParse(req[fonte] ?? {});
  if (!resultado.success) {
    const detalhes = resultado.error.issues.map((i) => ({
      campo: i.path.join('.') || (fonte === 'body' ? 'corpo' : fonte),
      mensagem: i.message,
    }));
    return next(AppError.validacao(detalhes));
  }
  req[fonte] = resultado.data;
  next();
};
