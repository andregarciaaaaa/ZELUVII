// Prestadores e FAQ do condominio (historias 1.4 e 1.5). Todos leem; so o sindico cadastra, edita e remove.
// Nao ha especificacao de API para estes dois: formato segue as demais rotas e a tabela do DER.
const router = require('express').Router();
const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const validar = require('../middlewares/validar');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');
const AppError = require('../utils/AppError');
const { z, idParams, ao_menos_um, PELO_MENOS_UM } = require('../validators/comum');

const prestadorBase = {
  nome: z.string().trim().min(3).max(150),
  servico: z.string().trim().min(2).max(100),
  telefone: z.string().trim().max(30).nullable().optional(),
  observacoes: z.string().trim().max(2000).nullable().optional(),
};
const criarPrestador = z.object(prestadorBase).strict();
const atualizarPrestador = z.object(prestadorBase).partial().strict().refine(ao_menos_um, PELO_MENOS_UM);

const faqBase = {
  pergunta: z.string().trim().min(3).max(255),
  resposta: z.string().trim().min(1).max(5000),
  ativo: z.boolean().optional(),
};
const criarFaq = z.object(faqBase).strict();
const atualizarFaq = z.object(faqBase).partial().strict().refine(ao_menos_um, PELO_MENOS_UM);

function crud(caminho, modelo, nome, schemaCriar, schemaAtualizar, filtroLeitura = () => ({}), ordem = { id: 'asc' }) {
  const m = prisma[modelo];
  router.get(caminho, autenticar, asyncHandler(async (req, res) => {
    const dados = await m.findMany({ where: { condominioId: req.usuario.condominioId, ...filtroLeitura(req.usuario) }, orderBy: ordem });
    res.json({ dados });
  }));
  router.post(caminho, autenticar, autorizar('SINDICO'), validar(schemaCriar), asyncHandler(async (req, res) => {
    res.status(201).json(await m.create({ data: { ...req.body, condominioId: req.usuario.condominioId } }));
  }));
  router.patch(`${caminho}/:id`, autenticar, autorizar('SINDICO'), validar(idParams, 'params'), validar(schemaAtualizar), asyncHandler(async (req, res) => {
    const existe = await m.findFirst({ where: { id: req.params.id, condominioId: req.usuario.condominioId } });
    if (!existe) throw AppError.naoEncontrado(`${nome} não encontrado.`);
    res.json(await m.update({ where: { id: req.params.id }, data: req.body }));
  }));
  router.delete(`${caminho}/:id`, autenticar, autorizar('SINDICO'), validar(idParams, 'params'), asyncHandler(async (req, res) => {
    const existe = await m.findFirst({ where: { id: req.params.id, condominioId: req.usuario.condominioId } });
    if (!existe) throw AppError.naoEncontrado(`${nome} não encontrado.`);
    await m.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }));
}

crud('/prestadores', 'prestador', 'Prestador', criarPrestador, atualizarPrestador, () => ({}), { nome: 'asc' });
// Morador e porteiro so veem perguntas ativas
crud('/faq', 'faq', 'Pergunta', criarFaq, atualizarFaq, (u) => (u.perfil === 'SINDICO' ? {} : { ativo: true }));

module.exports = router;
