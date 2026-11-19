const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const validar = require('../middlewares/validar');
const autenticar = require('../middlewares/autenticar');
const schema = require('../validators/auth.schema');
const controller = require('../controllers/auth.controller');

router.post('/login', validar(schema.login), asyncHandler(controller.login));
router.get('/me', autenticar, asyncHandler(controller.me));
router.post('/esqueci-senha', validar(schema.esqueciSenha), asyncHandler(controller.esqueciSenha));
router.post('/redefinir-senha', validar(schema.redefinirSenha), asyncHandler(controller.redefinirSenha));

module.exports = router;
