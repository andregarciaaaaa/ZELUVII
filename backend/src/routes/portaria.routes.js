const asyncHandler = require('../utils/asyncHandler');
const validar = require('../middlewares/validar');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');
const schema = require('../validators/portaria.schema');
const { idParams } = require('../validators/comum');
const service = require('../services/portaria.service');

const encomendas = require('express').Router();
encomendas.use(autenticar);
encomendas.post('/', autorizar('PORTEIRO'), validar(schema.criarEncomenda), asyncHandler(async (req, res) => res.status(201).json(await service.criarEncomenda(req.usuario, req.body))));
encomendas.get('/', validar(schema.listarEncomendas, 'query'), asyncHandler(async (req, res) => res.json(await service.listarEncomendas(req.usuario, req.query))));
encomendas.get('/:id', validar(idParams, 'params'), asyncHandler(async (req, res) => res.json(await service.buscarEncomenda(req.usuario, req.params.id))));
encomendas.patch('/:id', autorizar('PORTEIRO'), validar(idParams, 'params'), validar(schema.retirarEncomenda),
  asyncHandler(async (req, res) => res.json(await service.retirarEncomenda(req.usuario, req.params.id, req.body))));

const visitantes = require('express').Router();
visitantes.use(autenticar);
visitantes.post('/', autorizar('PORTEIRO'), validar(schema.criarVisitante), asyncHandler(async (req, res) => res.status(201).json(await service.criarVisitante(req.usuario, req.body))));
visitantes.get('/', validar(schema.listarVisitantes, 'query'), asyncHandler(async (req, res) => res.json(await service.listarVisitantes(req.usuario, req.query))));
visitantes.get('/:id', validar(idParams, 'params'), asyncHandler(async (req, res) => res.json(await service.buscarVisitante(req.usuario, req.params.id))));
visitantes.patch('/:id', autorizar('PORTEIRO'), validar(idParams, 'params'), validar(schema.registrarSaida),
  asyncHandler(async (req, res) => res.json(await service.registrarSaida(req.usuario, req.params.id))));

module.exports = { encomendas, visitantes };
