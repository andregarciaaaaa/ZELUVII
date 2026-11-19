const asyncHandler = require('../utils/asyncHandler');
const validar = require('../middlewares/validar');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');
const schema = require('../validators/financeiro.schema');
const { idParams } = require('../validators/comum');
const service = require('../services/financeiro.service');

// /cobrancas: sindico lanca e consulta tudo; morador consulta so a propria unidade; porteiro nao acessa
const cobrancas = require('express').Router();
cobrancas.use(autenticar, autorizar('SINDICO', 'MORADOR'));
cobrancas.get('/', validar(schema.listarCobrancas, 'query'), asyncHandler(async (req, res) => res.json(await service.listarCobrancas(req.usuario, req.query))));
cobrancas.get('/:id', validar(idParams, 'params'), asyncHandler(async (req, res) => res.json(await service.buscarCobranca(req.usuario, req.params.id))));
cobrancas.post('/', autorizar('SINDICO'), validar(schema.criarCobranca), asyncHandler(async (req, res) => res.status(201).json(await service.criarCobranca(req.usuario, req.body))));
cobrancas.patch('/:id/pagamento', autorizar('SINDICO'), validar(idParams, 'params'), validar(schema.pagamento),
  asyncHandler(async (req, res) => res.json(await service.pagarCobranca(req.usuario, req.params.id, req.body))));

// /despesas e /financeiro/resumo: so o sindico
const despesas = require('express').Router();
despesas.use(autenticar, autorizar('SINDICO'));
despesas.get('/', validar(schema.listarDespesas, 'query'), asyncHandler(async (req, res) => res.json(await service.listarDespesas(req.usuario, req.query))));
despesas.post('/', validar(schema.criarDespesa), asyncHandler(async (req, res) => res.status(201).json(await service.criarDespesa(req.usuario, req.body))));
despesas.patch('/:id/pagamento', validar(idParams, 'params'), validar(schema.pagamento),
  asyncHandler(async (req, res) => res.json(await service.pagarDespesa(req.usuario, req.params.id, req.body))));

const resumo = require('express').Router();
resumo.use(autenticar, autorizar('SINDICO'));
resumo.get('/resumo', validar(schema.resumo, 'query'), asyncHandler(async (req, res) => res.json(await service.resumo(req.usuario, req.query))));

module.exports = { cobrancas, despesas, resumo };
