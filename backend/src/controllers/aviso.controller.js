// Le a requisicao, chama o service e devolve a resposta com o status certo
const avisoService = require('../services/aviso.service');

module.exports = {
  async listar(req, res) {
    res.status(200).json(await avisoService.listar(req.validado.query, req.usuario));
  },

  async buscar(req, res) {
    res.status(200).json(await avisoService.buscar(req.validado.params.id, req.usuario));
  },

  async criar(req, res) {
    const aviso = await avisoService.criar(req.validado.body, req.usuario);
    res.status(201).location(`/api/v1/avisos/${aviso.id}`).json(aviso);
  },

  async atualizar(req, res) {
    res.status(200).json(await avisoService.atualizar(req.validado.params.id, req.validado.body, req.usuario));
  },

  async remover(req, res) {
    await avisoService.remover(req.validado.params.id, req.usuario);
    res.status(204).end();
  },
};
