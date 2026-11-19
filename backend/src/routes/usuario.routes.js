const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const validar = require('../middlewares/validar');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');
const schema = require('../validators/usuario.schema');
const service = require('../services/usuario.service');

router.use(autenticar, autorizar('SINDICO'));

router.get('/', asyncHandler(async (req, res) => res.json(await service.listar(req.usuario))));
router.post('/', validar(schema.criar), asyncHandler(async (req, res) => res.status(201).json(await service.criar(req.usuario, req.body))));

module.exports = router;
