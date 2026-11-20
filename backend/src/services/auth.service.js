// Regras de autenticacao (Especificacao da API de Autenticacao v2.0)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const authRepository = require('../repositories/auth.repository');
const AppError = require('../utils/AppError');

// No banco os perfis ficam em minusculo; na API e no token, em maiusculo (secao 3).
// "administrador" existe no banco mas nao na API: tem os mesmos direitos do sindico.
const PERFIL_API = {
  sindico: 'SINDICO',
  administrador: 'SINDICO',
  morador: 'MORADOR',
  porteiro: 'PORTEIRO',
};

// Mesma mensagem para e-mail inexistente e senha errada: ninguem descobre quais e-mails existem
const LOGIN_INVALIDO = () => new AppError(401, 'NAO_AUTENTICADO', 'E-mail ou senha invalidos.');

function montarUsuario(usuario, vinculo) {
  const perfil = PERFIL_API[vinculo.perfil.nome];
  const moradia = usuario.moradias.find((m) => m.unidade.condominioId === vinculo.condominioId);
  const unidade =
    perfil === 'MORADOR' && moradia
      ? { id: moradia.unidade.id, numero: moradia.unidade.numero, bloco: moradia.unidade.bloco }
      : null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil,
    condominioId: vinculo.condominioId,
    unidade,
  };
}

function vinculoValido(usuario, condominioId) {
  return usuario.vinculos.find(
    (v) => PERFIL_API[v.perfil.nome] && (condominioId === undefined || v.condominioId === condominioId),
  );
}

module.exports = {
  async login({ email, senha }) {
    const usuario = await authRepository.buscarPorEmail(email);
    if (!usuario || !usuario.ativo) throw LOGIN_INVALIDO();

    const senhaConfere = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaConfere) throw LOGIN_INVALIDO();

    // Usuario sem vinculo ativo com algum condominio nao consegue usar o sistema
    const vinculo = vinculoValido(usuario);
    if (!vinculo) throw LOGIN_INVALIDO();

    const dados = montarUsuario(usuario, vinculo);

    // O token leva so o necessario: nunca senha ou dados pessoais (Arquitetura, 2.2)
    const token = jwt.sign(
      { perfil: dados.perfil, condominioId: dados.condominioId },
      jwtSecret,
      { subject: String(usuario.id), expiresIn: jwtExpiresIn },
    );

    return { token, usuario: dados };
  },

  async me({ id, condominioId }) {
    const usuario = await authRepository.buscarPorId(id);
    const vinculo = usuario && usuario.ativo ? vinculoValido(usuario, condominioId) : null;
    if (!vinculo) throw new AppError(404, 'NAO_ENCONTRADO', 'Usuario nao encontrado.');
    return montarUsuario(usuario, vinculo);
  },
};
