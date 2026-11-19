// Token de redefinicao de senha (recuperacao e convite). Aleatorio, de uso unico e guardado so como hash.
const crypto = require('crypto');
const prisma = require('../config/prisma');

const hashDoToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Cria um token novo e invalida os anteriores do mesmo usuario ("so o ultimo vale").
// `cliente` pode ser uma transacao do Prisma. Devolve o token em texto puro (so existe aqui e no e-mail).
async function criarTokenSenha(usuarioId, validadeMs, cliente = prisma) {
  const token = crypto.randomBytes(32).toString('hex');
  await cliente.tokenRedefinicaoSenha.updateMany({
    where: { usuarioId, usadoEm: null },
    data: { usadoEm: new Date() },
  });
  await cliente.tokenRedefinicaoSenha.create({
    data: { usuarioId, tokenHash: hashDoToken(token), expiraEm: new Date(Date.now() + validadeMs) },
  });
  return token;
}

module.exports = { hashDoToken, criarTokenSenha };
