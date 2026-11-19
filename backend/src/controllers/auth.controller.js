const service = require('../services/auth.service');

module.exports = {
  async login(req, res) {
    res.status(200).json(await service.login(req.body));
  },
  async me(req, res) {
    res.status(200).json(await service.me(req.usuario));
  },
  async esqueciSenha(req, res) {
    res.status(200).json(await service.esqueciSenha(req.body));
  },
  async redefinirSenha(req, res) {
    res.status(200).json(await service.redefinirSenha(req.body));
  },
};
