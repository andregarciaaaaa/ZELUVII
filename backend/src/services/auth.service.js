const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const repo = require('../repositories/auth.repository');
const { hashDoToken, criarTokenSenha } = require('./token.service');
const mailer = require('../utils/mailer');
const { perfilDaApi } = require('../middlewares/autenticar');
const { unidadeDto } = require('../utils/dto');

// Hash falso: compara a senha mesmo quando o e-mail nao existe, para o tempo de resposta nao revelar quem tem conta
const HASH_FALSO = bcrypt.hashSync('senha-inexistente-zeluvi', 10);
const MSG_LOGIN = 'E-mail ou senha inválidos.';

// Limite de pedidos de recuperacao: 3 por e-mail por hora (conta tambem e-mails que nao existem)
const JANELA_MS = 60 * 60 * 1000;
const LIMITE_PEDIDOS = 3;
const pedidos = new Map();

function registrarPedido(email) {
  const agora = Date.now();
  const recentes = (pedidos.get(email) || []).filter((t) => agora - t < JANELA_MS);
  if (recentes.length >= LIMITE_PEDIDOS) {
    pedidos.set(email, recentes);
    throw new AppError(429, 'MUITAS_TENTATIVAS', 'Muitas tentativas. Tente novamente mais tarde.');
  }
  recentes.push(agora);
  pedidos.set(email, recentes);
}

async function montarUsuarioDaApi(usuario, vinculo) {
  const perfil = perfilDaApi(vinculo.perfil.nome);
  let unidade = null;
  if (perfil === 'MORADOR') {
    const m = await repo.buscarUnidadePrincipal(usuario.id, vinculo.condominioId);
    unidade = m ? unidadeDto(m.unidade) : null;
  }
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil, unidade };
}

async function login({ email, senha }) {
  const usuario = await repo.buscarUsuarioPorEmail(email);
  const confere = await bcrypt.compare(senha, usuario ? usuario.senhaHash : HASH_FALSO);
  if (!usuario || !confere || !usuario.ativo) throw AppError.naoAutenticado(MSG_LOGIN);

  const vinculo = await repo.buscarVinculoAtivo(usuario.id);
  if (!vinculo) throw AppError.naoAutenticado(MSG_LOGIN);

  const dados = await montarUsuarioDaApi(usuario, vinculo);
  const token = jwt.sign(
    { sub: usuario.id, perfil: dados.perfil, condominioId: vinculo.condominioId },
    env.jwtSecret,
    { algorithm: 'HS256', expiresIn: env.jwtExpiraEm },
  );
  return { token, usuario: dados };
}

async function me(usuarioLogado) {
  const usuario = await repo.buscarUsuarioPorId(usuarioLogado.id);
  if (!usuario) throw AppError.naoEncontrado('Usuário não encontrado.');
  const vinculo = await repo.buscarVinculoAtivo(usuario.id);
  if (!vinculo) throw AppError.naoEncontrado('Usuário não encontrado.');
  return montarUsuarioDaApi(usuario, vinculo);
}

async function esqueciSenha({ email }) {
  registrarPedido(email);
  const usuario = await repo.buscarUsuarioPorEmail(email);
  if (usuario && usuario.ativo) {
    try {
      const token = await criarTokenSenha(usuario.id, env.recuperacaoMinutos * 60 * 1000);
      await mailer.enviar({
        para: usuario.email,
        assunto: 'ZELUVI - redefinição de senha',
        texto: `Olá, ${usuario.nome}. Use o link para criar uma nova senha (vale ${env.recuperacaoMinutos} minutos):\n${mailer.linkRedefinicao(token)}`,
      });
    } catch (e) {
      console.error('Falha ao gerar/enviar token de recuperação:', e.message); // so no log: a resposta nao muda
    }
  }
  return { mensagem: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.' };
}

async function redefinirSenha({ token, novaSenha }) {
  const registro = await repo.buscarTokenValido(hashDoToken(token));
  if (!registro) {
    throw new AppError(400, 'TOKEN_REDEFINICAO_INVALIDO', 'Link inválido ou expirado. Solicite uma nova recuperação de senha.');
  }
  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await repo.redefinirSenha(registro.id, registro.usuarioId, senhaHash);
  return { mensagem: 'Senha alterada com sucesso. Faça login com a nova senha.' };
}

module.exports = {
  login, me, esqueciSenha, redefinirSenha,
  _limparPedidos: () => pedidos.clear(), // so para testes
};
