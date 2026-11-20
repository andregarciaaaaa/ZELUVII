const authService = require('../services/auth.service');

module.exports = {
  async login(req, res) {
    const resultado = await authService.login(req.validado.body);
    res.status(200).json(resultado);
  },

  async me(req, res) {
    const usuario = await authService.me(req.usuario);
    res.status(200).json(usuario);
  },
};
