const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

let t;
test.before(async () => { await h.preparar(); t = await h.tokens(); });
test.after(h.encerrar);

test('CT20/CT21/CT22 so o sindico acessa /moradores', async () => {
  assert.equal((await h.api('GET', '/moradores', { token: t.ana })).status, 403);
  assert.equal((await h.api('POST', '/moradores', { token: t.porteiro, corpo: {} })).status, 403);
  assert.equal((await h.api('PATCH', '/moradores/2', { corpo: { nome: 'X Y Z' } })).status, 401);
});

test('CT23 sindico lista com filtros e paginacao', async () => {
  const r = await h.api('GET', '/moradores', { token: t.sindico });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.total, 2);
  assert.deepEqual(r.corpo.dados.map((m) => m.nome), ['Morador Bruno', 'Moradora Ana']);
  assert.equal(r.corpo.dados[1].tipo, 'PROPRIETARIO');
  assert.equal(r.corpo.pagina, 1);
  assert.equal(r.corpo.limite, 20);
  assert.equal((await h.api('GET', '/moradores?busca=ana', { token: t.sindico })).corpo.dados.length, 1);
  assert.equal((await h.api('GET', '/moradores?busca=zzz', { token: t.sindico })).corpo.dados.length, 0); // 200 com lista vazia
  assert.equal((await h.api('GET', '/moradores?pagina=0', { token: t.sindico })).status, 400);
  assert.equal((await h.api('GET', '/moradores?limite=500', { token: t.sindico })).status, 400);
});

test('CT25 morador inexistente -> 404 e id nao numerico -> 400', async () => {
  assert.equal((await h.api('GET', '/moradores/999', { token: t.sindico })).status, 404);
  assert.equal((await h.api('GET', '/moradores/abc', { token: t.sindico })).status, 400);
});

test('CT18/CT19 cadastrar morador envia convite; e-mail repetido da 409', async () => {
  const corpo = { nome: 'Carla Nova', email: 'carla@condominio.com', telefone: '44977776666', unidadeId: 3, tipo: 'INQUILINO' };
  const r = await h.api('POST', '/moradores', { token: t.sindico, corpo });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.conviteEnviado, true);
  assert.equal(r.corpo.ativo, true);
  assert.equal(r.corpo.unidade.numero, '201');
  assert.equal(JSON.stringify(r.corpo).includes('senha'), false);

  // o convite vale 48 horas e permite criar a senha pelo mesmo endpoint de redefinicao
  const email = h.mailer.enviados.at(-1);
  assert.equal(email.para, 'carla@condominio.com');
  const token = /token=([a-f0-9]{64})/.exec(email.texto)[1];
  const reg = await h.prisma.tokenRedefinicaoSenha.findFirst({ where: { usuarioId: r.corpo.id } });
  const horas = (reg.expiraEm - reg.criadoEm) / 3600000;
  assert.ok(horas > 47.9 && horas < 48.1);
  assert.equal((await h.api('POST', '/auth/redefinir-senha', { corpo: { token, novaSenha: 'Carla12345', confirmacaoSenha: 'Carla12345' } })).status, 200);
  assert.equal((await h.api('POST', '/auth/login', { corpo: { email: 'carla@condominio.com', senha: 'Carla12345' } })).status, 200);

  const dup = await h.api('POST', '/moradores', { token: t.sindico, corpo });
  assert.equal(dup.status, 409);
  assert.equal(dup.corpo.erro.mensagem, 'Já existe um usuário com este e-mail.');
});

test('cadastro: validacoes e unidade inexistente', async () => {
  const ruim = await h.api('POST', '/moradores', { token: t.sindico, corpo: { nome: 'Al', email: 'x', telefone: '123', unidadeId: 1, tipo: 'DONO' } });
  assert.equal(ruim.status, 400);
  assert.deepEqual(ruim.corpo.erro.detalhes.map((d) => d.campo).sort(), ['email', 'nome', 'telefone', 'tipo']);
  const sem = await h.api('POST', '/moradores', { token: t.sindico, corpo: { nome: 'Dani Silva', email: 'dani@condominio.com', unidadeId: 999, tipo: 'PROPRIETARIO' } });
  assert.equal(sem.status, 404);
  assert.equal(sem.corpo.erro.mensagem, 'Unidade não encontrada.');
});

test('PATCH: muda unidade e tipo, nao aceita campos protegidos, 409 em e-mail de outro', async () => {
  const r = await h.api('PATCH', '/moradores/2', { token: t.sindico, corpo: { unidadeId: 4, tipo: 'INQUILINO' } });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.unidade.numero, '302');
  assert.equal(r.corpo.tipo, 'INQUILINO');
  assert.equal((await h.api('PATCH', '/moradores/2', { token: t.sindico, corpo: { perfil: 'SINDICO' } })).status, 400);
  assert.equal((await h.api('PATCH', '/moradores/2', { token: t.sindico, corpo: { senha: 'x' } })).status, 400);
  assert.equal((await h.api('PATCH', '/moradores/2', { token: t.sindico, corpo: {} })).status, 400);
  assert.equal((await h.api('PATCH', '/moradores/2', { token: t.sindico, corpo: { email: 'bruno@condominio.com' } })).status, 409);
  assert.equal((await h.api('PATCH', '/moradores/2', { token: t.sindico, corpo: { telefone: null } })).corpo.telefone, null);
});

test('CT24 desativar morador: login seguinte da 401 e o historico fica', async () => {
  assert.equal((await h.api('PATCH', '/moradores/2', { token: t.sindico, corpo: { ativo: false } })).status, 200);
  assert.equal((await h.api('POST', '/auth/login', { corpo: { email: 'ana@condominio.com', senha: '123456' } })).status, 401);
  assert.equal((await h.api('GET', '/moradores?ativo=false', { token: t.sindico })).corpo.dados.length, 1);
  assert.ok(await h.prisma.usuario.findUnique({ where: { id: 2 } })); // nada foi apagado
});

test('sindico cria porteiro e unidade; usuario repetido da 409', async () => {
  const p = await h.api('POST', '/usuarios', { token: t.sindico, corpo: { nome: 'Porteiro Noite', email: 'noite@condominio.com', perfil: 'PORTEIRO' } });
  assert.equal(p.status, 201);
  assert.equal(p.corpo.perfil, 'PORTEIRO');
  assert.equal((await h.api('POST', '/usuarios', { token: t.sindico, corpo: { nome: 'Porteiro Noite', email: 'noite@condominio.com', perfil: 'PORTEIRO' } })).status, 409);
  assert.equal((await h.api('POST', '/usuarios', { token: t.bruno, corpo: { nome: 'Teste Teste', email: 'z@z.com', perfil: 'SINDICO' } })).status, 403);

  const u = await h.api('POST', '/unidades', { token: t.sindico, corpo: { numero: '401', bloco: 'C' } });
  assert.equal(u.status, 201);
  assert.deepEqual(u.corpo, { id: u.corpo.id, numero: '401', bloco: 'C' });
  assert.equal((await h.api('POST', '/unidades', { token: t.sindico, corpo: { numero: '401', bloco: 'C' } })).status, 409);
  assert.equal((await h.api('GET', '/unidades', { token: t.porteiro })).status, 200);
  assert.equal((await h.api('GET', '/unidades', { token: t.bruno })).status, 403);
});
