const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const validar = require('../middlewares/validar');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');
const schema = require('../validators/area.schema');
const { idParams } = require('../validators/comum');
const service = require('../services/area.service');

router.use(autenticar);

router.get('/', validar(schema.listar, 'query'), asyncHandler(async (req, res) => res.json(await service.listar(req.usuario, req.query))));
router.get('/:id', validar(idParams, 'params'), asyncHandler(async (req, res) => res.json(await service.buscar(req.usuario, req.params.id))));
router.get('/:id/disponibilidade', validar(idParams, 'params'), validar(schema.disponibilidade, 'query'),
  asyncHandler(async (req, res) => res.json(await service.disponibilidade(req.usuario, req.params.id, req.query))));
router.post('/', autorizar('SINDICO'), validar(schema.criar), asyncHandler(async (req, res) => res.status(201).json(await service.criar(req.usuario, req.body))));
router.patch('/:id', autorizar('SINDICO'), validar(idParams, 'params'), validar(schema.atualizar),
  asyncHandler(async (req, res) => res.json(await service.atualizar(req.usuario, req.params.id, req.body))));

module.exports = router;
