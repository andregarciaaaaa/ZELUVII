require('dotenv').config();

function obrigatoria(nome) {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Variavel de ambiente ${nome} nao definida. Copie .env.example para .env e preencha.`);
  }
  return valor;
}

module.exports = {
  port: Number(process.env.PORT) || 3333,
  databaseUrl: obrigatoria('DATABASE_URL'),
  jwtSecret: obrigatoria('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};
