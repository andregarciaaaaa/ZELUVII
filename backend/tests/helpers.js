// Ajudantes dos testes de integracao: sobem a API de verdade contra o banco "zeluvi_test".
// Antes: npm run db:dev (em outra janela). Cada arquivo de teste recomeca do zero (truncate + seed).
const { execSync } = require('child_process');
const path = require('path');

const URL_TESTE = process.env.TEST_DATABASE_URL
  || 'postgresql://postgres:postgres@localhost:5433/zeluvi_test?schema=public';
process.env.DATABASE_URL = URL_TESTE;
process.env.JWT_SECRET = 'segredo-de-teste';
process.env.NODE_ENV = 'test';

const raiz = path.join(__dirname, '..');
const prisma = require('../src/config/prisma');
const app = require('../src/app');
const mailer = require('../src/utils/mailer');
const authService = require('../src/services/auth.service');
const datas = require('../src/utils/datas');

let servidor;
let base;

async function preparar() {
  const env = { ...process.env, DATABASE_URL: URL_TESTE };
  execSync('npx prisma migrate deploy', { cwd: raiz, env, stdio: 'ignore' });
  const tabelas = await prisma.$queryRawUnsafe(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'",
  );
  await prisma.$executeRawUnsafe(`TRUNCATE ${tabelas.map((t) => `"${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`);
  await prisma.$executeRawUnsafe('ALTER SEQUENCE ocorrencia_protocolo_seq RESTART WITH 1');
  execSync('node prisma/seed.js', { cwd: raiz, env, stdio: 'ignore' });
  authService._limparPedidos();
  mailer.enviados.length = 0;
  await new Promise((ok) => { servidor = app.listen(0, () => ok()); });
  base = `http://127.0.0.1:${servidor.address().port}/api/v1`;
}

async function encerrar() {
  await new Promise((ok) => servidor.close(ok));
  await prisma.$disconnect();
}

async function api(metodo, rota, { token, corpo, bruto } = {}) {
  const res = await fetch(base + rota, {
    method: metodo,
    headers: { ...(corpo || bruto ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: bruto ?? (corpo ? JSON.stringify(corpo) : undefined),
  });
  const texto = await res.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch { /* sem corpo JSON */ }
  return { status: res.status, corpo: json };
}

async function login(email, senha = '123456') {
  const r = await api('POST', '/auth/login', { corpo: { email, senha } });
  if (r.status !== 200) throw new Error(`login falhou para ${email}: ${JSON.stringify(r.corpo)}`);
  return r.corpo.token;
}

async function tokens() {
  return {
    sindico: await login('sindico@condominio.com'),
    ana: await login('ana@condominio.com'),
    bruno: await login('bruno@condominio.com'),
    porteiro: await login('portaria@condominio.com'),
  };
}

// Instante no fuso do condominio: daqui a `dias` dias, as HH:mm
function amanha(dias, hhmm) {
  return datas.instanteLocal(datas.somarDias(datas.hoje(), dias), hhmm).toISOString();
}

module.exports = { preparar, encerrar, api, login, tokens, amanha, prisma, mailer, authService, datas };
