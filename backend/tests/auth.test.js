const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const h = require('./helpers');

test.before(h.preparar);
test.after(h.encerrar);

test('CT01 login valido devolve token e usuario sem senha', async () => {
  const r = await h.api('POST', '/auth/login', { corpo: { email: 'ana@condominio.com', senha: '123456' } });
  assert.equal(r.status, 200);
  assert.ok(r.corpo.token);
  assert.deepEqual(r.corpo.usuario, {
    id: 2, nome: 'Moradora Ana', email: 'ana@condominio.com', perfil: 'MORADOR', unidade: { id: 1, numero: '101', bloco: 'A' },
  });
  assert.equal(JSON.stringify(r.corpo).includes('senha'), false);
  const payload = jwt.decode(r.corpo.token);
  assert.equal(payload.perfil, 'MORADOR');
  assert.equal(payload.exp - payload.iat, 8 * 3600); // 8 horas
});

test('login do sindico e do porteiro: unidade null', async () => {
  const s = await h.api('POST', '/auth/login', { corpo: { email: 'sindico@condominio.com', senha: '123456' } });
  assert.equal(s.corpo.usuario.perfil, 'SINDICO');
  assert.equal(s.corpo.usuario.unidade, null);
  const p = await h.api('POST', '/auth/login', { corpo: { email: 'portaria@condominio.com', senha: '123456' } });
  assert.equal(p.corpo.usuario.perfil, 'PORTEIRO');
});

test('CT02/CT04 senha errada e e-mail inexistente dao a mesma mensagem 401', async () => {
  const a = await h.api('POST', '/auth/login', { corpo: { email: 'ana@condominio.com', senha: 'errada' } });
  const b = await h.api('POST', '/auth/login', { corpo: { email: 'naoexiste@condominio.com', senha: '123456' } });
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
  assert.deepEqual(a.corpo, b.corpo);
  assert.equal(a.corpo.erro.codigo, 'NAO_AUTENTICADO');
  assert.equal(a.corpo.erro.mensagem, 'E-mail ou senha inválidos.');
});

test('CT05 campos vazios -> 400 VALIDACAO com detalhes de email e senha', async () => {
  const r = await h.api('POST', '/auth/login', { corpo: {} });
  assert.equal(r.status, 400);
  assert.equal(r.corpo.erro.codigo, 'VALIDACAO');
  assert.deepEqual(r.corpo.erro.detalhes.map((d) => d.campo).sort(), ['email', 'senha']);
});

test('JSON mal formatado -> 400 VALIDACAO', async () => {
  const r = await h.api('POST', '/auth/login', { bruto: '{nao e json' });
  assert.equal(r.status, 400);
  assert.equal(r.corpo.erro.codigo, 'VALIDACAO');
});

test('CT06/CT07/CT08 /auth/me: sem token, adulterado e vencido', async () => {
  const sem = await h.api('GET', '/auth/me');
  assert.equal(sem.status, 401);
  assert.equal(sem.corpo.erro.mensagem, 'Token não enviado.');

  const token = await h.login('ana@condominio.com');
  const [cab, corpo, ass] = token.split('.');
  const adulterado = JSON.parse(Buffer.from(corpo, 'base64url').toString());
  adulterado.perfil = 'SINDICO';
  const falso = `${cab}.${Buffer.from(JSON.stringify(adulterado)).toString('base64url')}.${ass}`;
  const r7 = await h.api('GET', '/auth/me', { token: falso });
  assert.equal(r7.status, 401);
  assert.equal(r7.corpo.erro.mensagem, 'Token inválido ou expirado.');

  const vencido = jwt.sign({ sub: 2, perfil: 'MORADOR', condominioId: 1 }, 'segredo-de-teste', { expiresIn: -10 });
  const r8 = await h.api('GET', '/auth/me', { token: vencido });
  assert.equal(r8.status, 401);

  const ok = await h.api('GET', '/auth/me', { token });
  assert.equal(ok.status, 200);
  assert.equal(ok.corpo.email, 'ana@condominio.com');
});

test('usuario desativado nao entra e o token antigo deixa de valer', async () => {
  const t = await h.tokens();
  const desativar = await h.api('PATCH', '/moradores/3', { token: t.sindico, corpo: { ativo: false } }); // Bruno
  assert.equal(desativar.status, 200);
  const login = await h.api('POST', '/auth/login', { corpo: { email: 'bruno@condominio.com', senha: '123456' } });
  assert.equal(login.status, 401);
  const antigo = await h.api('GET', '/auth/me', { token: t.bruno });
  assert.equal(antigo.status, 401);
  await h.api('PATCH', '/moradores/3', { token: t.sindico, corpo: { ativo: true } });
});

test('CT11/CT14/CT15 recuperar senha: e-mail com link, redefine, token de uso unico', async () => {
  const pedido = await h.api('POST', '/auth/esqueci-senha', { corpo: { email: 'bruno@condominio.com' } });
  assert.equal(pedido.status, 200);
  const email = h.mailer.enviados.at(-1);
  assert.equal(email.para, 'bruno@condominio.com');
  const token = /token=([a-f0-9]{64})/.exec(email.texto)[1];

  // o banco guarda so o hash do token
  const guardado = await h.prisma.tokenRedefinicaoSenha.findMany();
  assert.ok(guardado.length >= 1);
  assert.ok(guardado.every((g) => g.tokenHash !== token));

  const fraca = await h.api('POST', '/auth/redefinir-senha', { corpo: { token, novaSenha: '123', confirmacaoSenha: '123' } });
  assert.equal(fraca.status, 400); // CT17
  assert.equal(fraca.corpo.erro.codigo, 'VALIDACAO');

  const ok = await h.api('POST', '/auth/redefinir-senha', { corpo: { token, novaSenha: 'MinhaSenha2026', confirmacaoSenha: 'MinhaSenha2026' } });
  assert.equal(ok.status, 200);
  assert.equal((await h.api('POST', '/auth/login', { corpo: { email: 'bruno@condominio.com', senha: 'MinhaSenha2026' } })).status, 200);
  assert.equal((await h.api('POST', '/auth/login', { corpo: { email: 'bruno@condominio.com', senha: '123456' } })).status, 401);

  const reuso = await h.api('POST', '/auth/redefinir-senha', { corpo: { token, novaSenha: 'OutraSenha2026', confirmacaoSenha: 'OutraSenha2026' } });
  assert.equal(reuso.status, 400);
  assert.equal(reuso.corpo.erro.codigo, 'TOKEN_REDEFINICAO_INVALIDO');
});

test('CT12 e-mail inexistente: mesma resposta e nenhum e-mail enviado', async () => {
  const antes = h.mailer.enviados.length;
  const a = await h.api('POST', '/auth/esqueci-senha', { corpo: { email: 'fantasma@condominio.com' } });
  assert.equal(a.status, 200);
  assert.equal(h.mailer.enviados.length, antes);
  const b = await h.api('POST', '/auth/esqueci-senha', { corpo: { email: 'ana@condominio.com' } });
  assert.deepEqual(a.corpo, b.corpo);
});

test('CT16 token vencido e pedido novo invalida o anterior', async () => {
  await h.api('POST', '/auth/esqueci-senha', { corpo: { email: 'portaria@condominio.com' } });
  const primeiro = /token=([a-f0-9]{64})/.exec(h.mailer.enviados.at(-1).texto)[1];
  await h.api('POST', '/auth/esqueci-senha', { corpo: { email: 'portaria@condominio.com' } });
  const segundo = /token=([a-f0-9]{64})/.exec(h.mailer.enviados.at(-1).texto)[1];
  const corpo = (token) => ({ corpo: { token, novaSenha: 'Senha12345', confirmacaoSenha: 'Senha12345' } });
  assert.equal((await h.api('POST', '/auth/redefinir-senha', corpo(primeiro))).status, 400); // so o ultimo vale

  await h.prisma.tokenRedefinicaoSenha.updateMany({ where: { usadoEm: null }, data: { expiraEm: new Date(Date.now() - 1000) } });
  assert.equal((await h.api('POST', '/auth/redefinir-senha', corpo(segundo))).status, 400); // vencido
});

test('CT13 o 4o pedido do mesmo e-mail em 1 hora da 429', async () => {
  const corpo = { email: 'limite@condominio.com' };
  for (let i = 0; i < 3; i++) assert.equal((await h.api('POST', '/auth/esqueci-senha', { corpo })).status, 200);
  const r = await h.api('POST', '/auth/esqueci-senha', { corpo });
  assert.equal(r.status, 429);
  assert.equal(r.corpo.erro.codigo, 'MUITAS_TENTATIVAS');
});

test('rota inexistente -> 404 no formato padrao', async () => {
  const r = await h.api('GET', '/nao-existe');
  assert.equal(r.status, 404);
  assert.equal(r.corpo.erro.codigo, 'NAO_ENCONTRADO');
});
