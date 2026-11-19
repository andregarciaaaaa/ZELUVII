const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const validar = require('../middlewares/validar');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');
const schema = require('../validators/ocorrencia.schema');
const { idParams } = require('../validators/comum');
const service = require('../services/ocorrencia.service');

router.use(autenticar);

router.post('/', validar(schema.criar), asyncHandler(async (req, res) => res.status(201).json(await service.criar(req.usuario, req.body))));
router.get('/', validar(schema.listar, 'query'), asyncHandler(async (req, res) => res.json(await service.listar(req.usuario, req.query))));
router.get('/:id', validar(idParams, 'params'), asyncHandler(async (req, res) => res.json(await service.buscar(req.usuario, req.params.id))));
router.patch('/:id', autorizar('SINDICO'), validar(idParams, 'params'), validar(schema.mudarStatus),
  asyncHandler(async (req, res) => res.json(await service.mudarStatus(req.usuario, req.params.id, req.body))));

module.exports = router;
