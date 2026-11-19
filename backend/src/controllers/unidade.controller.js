const service = require('../services/unidade.service');

module.exports = {
  async listar(req, res) {
    res.json(await service.listar(req.usuario));
  },
  async criar(req, res) {
    res.status(201).json(await service.criar(req.usuario, req.body));
  },
  async atualizar(req, res) {
    res.json(await service.atualizar(req.usuario, req.params.id, req.body));
  },
};
