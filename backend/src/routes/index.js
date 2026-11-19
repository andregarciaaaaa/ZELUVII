const router = require('express').Router();
const portaria = require('./portaria.routes');
const financeiro = require('./financeiro.routes');

router.get('/saude', (req, res) => res.json({ status: 'ok', hora: new Date().toISOString() }));

router.use('/auth', require('./auth.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/usuarios', require('./usuario.routes'));
router.use('/moradores', require('./morador.routes'));
router.use('/unidades', require('./unidade.routes'));
router.use('/avisos', require('./aviso.routes'));
router.use('/areas', require('./area.routes'));
router.use('/reservas', require('./reserva.routes'));
router.use('/ocorrencias', require('./ocorrencia.routes'));
router.use('/encomendas', portaria.encomendas);
router.use('/visitantes', portaria.visitantes);
router.use('/cobrancas', financeiro.cobrancas);
router.use('/despesas', financeiro.despesas);
router.use('/financeiro', financeiro.resumo);
router.use('/', require('./informacoes.routes')); // /prestadores e /faq

module.exports = router;
