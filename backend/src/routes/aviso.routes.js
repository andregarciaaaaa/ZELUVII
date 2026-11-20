// CRUD de avisos. Todos os perfis leem; so o SINDICO publica, edita e remove.
const { Router } = require('express');
const avisoController = require('../controllers/aviso.controller');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');
const validar = require('../middlewares/validar');
const capturar = require('../utils/capturar');
const {
  criarAvisoSchema,
  atualizarAvisoSchema,
  listarAvisosSchema,
  idSchema,
} = require('../validators/aviso.schema');

const router = Router();

router.use(autenticar);

router.get('/', validar(listarAvisosSchema, 'query'), capturar(avisoController.listar));
router.get('/:id', validar(idSchema, 'params'), capturar(avisoController.buscar));

router.post('/', autorizar('SINDICO'), validar(criarAvisoSchema), capturar(avisoController.criar));

router.patch(
  '/:id',
  autorizar('SINDICO'),
  validar(idSchema, 'params'),
  validar(atualizarAvisoSchema),
  capturar(avisoController.atualizar),
);

router.delete('/:id', autorizar('SINDICO'), validar(idSchema, 'params'), capturar(avisoController.remover));

module.exports = router;
