const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const autenticar = require('../middlewares/autenticar');
const validar = require('../middlewares/validar');
const capturar = require('../utils/capturar');
const { loginSchema } = require('../validators/auth.schema');

const router = Router();

// POST /api/v1/auth/login  (publica)
router.post('/login', validar(loginSchema), capturar(authController.login));

// GET /api/v1/auth/me  (qualquer usuario logado)
router.get('/me', autenticar, capturar(authController.me));

module.exports = router;
