const { Router } = require('express');
const authRoutes = require('./auth.routes');
const avisoRoutes = require('./aviso.routes');
const AppError = require('../utils/AppError');

const router = Router();

// Verificacao rapida de que a API esta no ar
router.get('/saude', (req, res) => res.json({ status: 'ok' }));

router.use('/auth', authRoutes);
router.use('/avisos', avisoRoutes);

// Rota da API que nao existe
router.use((req, res, next) => next(new AppError(404, 'NAO_ENCONTRADO', 'Rota nao encontrada.')));

module.exports = router;
