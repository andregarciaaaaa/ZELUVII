const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const validar = require('../middlewares/validar');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');
const schema = require('../validators/unidade.schema');
const { idParams } = require('../validators/comum');
const controller = require('../controllers/unidade.controller');

router.use(autenticar);

// O porteiro tambem consulta a lista (precisa escolher a unidade ao registrar encomendas e visitantes).
// A matriz da especificacao so cita o sindico: decisao registrada em docs/08-desenvolvimento.
router.get('/', autorizar('SINDICO', 'PORTEIRO'), asyncHandler(controller.listar));
router.post('/', autorizar('SINDICO'), validar(schema.criar), asyncHandler(controller.criar));
router.patch('/:id', autorizar('SINDICO'), validar(idParams, 'params'), validar(schema.atualizar), asyncHandler(controller.atualizar));

module.exports = router;
