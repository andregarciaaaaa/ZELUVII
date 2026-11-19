const { z, id, enumCI, dataAAAAMMDD } = require('./comum');
const { paginacaoSchema } = require('../utils/paginacao');

const primeiroDia = dataAAAAMMDD.refine((d) => d.endsWith('-01'), 'A competência é o mês de referência: use sempre o dia 1 (AAAA-MM-01).');
const valor = z.number().positive('O valor precisa ser maior que zero.').max(99999999.99);

const criarCobranca = z.object({
  unidadeId: id,
  tipo: enumCI(['cota_condominial', 'taxa_extra', 'multa']),
  descricao: z.string().trim().max(150).optional(),
  competencia: primeiroDia,
  valor,
  vencimento: dataAAAAMMDD,
  boletoUrl: z.string().trim().url().max(500).optional(),
}).strict();

const listarCobrancas = z.object({
  unidadeId: id.optional(),
  status: enumCI(['pendente', 'pago']).optional(),
  ...paginacaoSchema,
});

const pagamento = z.object({ dataPagamento: dataAAAAMMDD.optional() }).strict();

const criarDespesa = z.object({
  categoria: enumCI(['folha', 'manutencao', 'agua_energia', 'limpeza', 'seguranca', 'administrativo']),
  descricao: z.string().trim().min(3).max(150),
  fornecedor: z.string().trim().max(120).optional(),
  valor,
  competencia: primeiroDia,
  vencimento: dataAAAAMMDD,
}).strict();

const listarDespesas = z.object({
  status: enumCI(['pendente', 'pago']).optional(),
  competencia: primeiroDia.optional(),
  ...paginacaoSchema,
});

const resumo = z.object({ competencia: primeiroDia.optional() });

module.exports = { criarCobranca, listarCobrancas, pagamento, criarDespesa, listarDespesas, resumo };
