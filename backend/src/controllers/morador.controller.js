const service = require('../services/morador.service');

module.exports = {
  async listar(req, res) {
    res.json(await service.listar(req.usuario, req.query));
  },
  async buscar(req, res) {
    res.json(await service.buscar(req.usuario, req.params.id));
  },
  async criar(req, res) {
    res.status(201).json(await service.criar(req.usuario, req.body));
  },
  async atualizar(req, res) {
    res.json(await service.atualizar(req.usuario, req.params.id, req.body));
  },
};
