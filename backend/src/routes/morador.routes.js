const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const validar = require('../middlewares/validar');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');
const schema = require('../validators/morador.schema');
const { idParams } = require('../validators/comum');
const controller = require('../controllers/morador.controller');

// Todas as rotas de moradores sao so do sindico (matriz de permissoes)
router.use(autenticar, autorizar('SINDICO'));

router.get('/', validar(schema.listar, 'query'), asyncHandler(controller.listar));
router.get('/:id', validar(idParams, 'params'), asyncHandler(controller.buscar));
router.post('/', validar(schema.criar), asyncHandler(controller.criar));
router.patch('/:id', validar(idParams, 'params'), validar(schema.atualizar), asyncHandler(controller.atualizar));

module.exports = router;
