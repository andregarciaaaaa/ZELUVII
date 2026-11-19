require('dotenv').config();

const producao = process.env.NODE_ENV === 'production';

function obrigatoria(nome, padraoDev) {
  const valor = process.env[nome];
  if (valor) return valor;
  if (!producao && padraoDev !== undefined) return padraoDev;
  throw new Error(`Variavel de ambiente ${nome} nao definida (veja .env.example).`);
}

module.exports = {
  producao,
  porta: Number(process.env.PORT || 3000),
  databaseUrl: obrigatoria('DATABASE_URL'),
  jwtSecret: obrigatoria('JWT_SECRET', 'dev-segredo-local-nao-usar-em-producao'),
  jwtExpiraEm: process.env.JWT_EXPIRES_IN || '8h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5500',
  // CORS: lista separada por virgula. Em dev aceita qualquer origem localhost.
  corsOrigens: (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5500')
    .split(',').map((s) => s.trim()).filter(Boolean),
  recuperacaoMinutos: 30, // validade do token de recuperacao (especificacao: 30 min)
  conviteHoras: 48, // validade do convite de cadastro (especificacao: 48 h)
};
