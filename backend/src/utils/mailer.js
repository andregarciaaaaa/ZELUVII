// Envio de e-mail. No MVP o servico de e-mail real nao existe (especificacao, "fora do escopo"):
// em desenvolvimento o link aparece no log do servidor e fica guardado em memoria para os testes.
const env = require('../config/env');

const enviados = []; // so para testes e desenvolvimento

async function enviar({ para, assunto, texto }) {
  enviados.push({ para, assunto, texto, em: new Date() });
  if (enviados.length > 200) enviados.shift();
  if (!env.producao) {
    console.log(`[e-mail simulado] para=${para} | ${assunto}\n${texto}\n`);
  }
  // TODO (fase de integracao): trocar por SMTP / servico de e-mail de producao.
}

function linkRedefinicao(token) {
  return `${env.frontendUrl}/redefinir-senha?token=${token}`;
}

module.exports = { enviar, linkRedefinicao, enviados };
