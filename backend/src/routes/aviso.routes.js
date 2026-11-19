const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const validar = require('../middlewares/validar');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');
const schema = require('../validators/aviso.schema');
const { idParams } = require('../validators/comum');
const service = require('../services/aviso.service');

router.use(autenticar);

router.get('/', validar(schema.listar, 'query'), asyncHandler(async (req, res) => res.json(await service.listar(req.usuario, req.query))));
router.get('/:id', validar(idParams, 'params'), asyncHandler(async (req, res) => res.json(await service.buscar(req.usuario, req.params.id))));
router.post('/', autorizar('SINDICO'), validar(schema.criar), asyncHandler(async (req, res) => res.status(201).json(await service.criar(req.usuario, req.body))));
router.patch('/:id', autorizar('SINDICO'), validar(idParams, 'params'), validar(schema.atualizar), asyncHandler(async (req, res) => res.json(await service.atualizar(req.usuario, req.params.id, req.body))));
router.delete('/:id', autorizar('SINDICO'), validar(idParams, 'params'), asyncHandler(async (req, res) => { await service.remover(req.usuario, req.params.id); res.status(204).end(); }));

module.exports = router;
