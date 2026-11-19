const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

let t;
test.before(async () => { await h.preparar(); t = await h.tokens(); });
test.after(h.encerrar);

test('RN10: morador so ve as cobrancas da propria unidade; porteiro nao acessa', async () => {
  const ana = await h.api('GET', '/cobrancas', { token: t.ana });
  assert.equal(ana.status, 200);
  assert.ok(ana.corpo.dados.length >= 2);
  assert.ok(ana.corpo.dados.every((c) => c.unidade.numero === '101'));

  const bruno = await h.api('GET', '/cobrancas', { token: t.bruno });
  assert.ok(bruno.corpo.dados.every((c) => c.unidade.numero === '102'));
  assert.equal((await h.api('GET', '/cobrancas?unidadeId=2', { token: t.ana })).corpo.total, 0); // nao burla pelo filtro

  const outra = bruno.corpo.dados[0];
  assert.equal((await h.api('GET', `/cobrancas/${outra.id}`, { token: t.ana })).status, 403);
  assert.equal((await h.api('GET', `/cobrancas/${outra.id}`, { token: t.sindico })).status, 200);
  assert.equal((await h.api('GET', '/cobrancas', { token: t.porteiro })).status, 403);
  assert.equal((await h.api('GET', '/cobrancas')).status, 401);
});

test('cobranca vencida e pendente aparece como atrasada (nao e um status)', async () => {
  const lista = (await h.api('GET', '/cobrancas?status=PENDENTE', { token: t.bruno })).corpo.dados;
  const vencida = lista.find((c) => c.vencimento < h.datas.hoje());
  assert.ok(vencida);
  assert.equal(vencida.status, 'PENDENTE');
  assert.equal(vencida.atrasada, true);
  assert.ok(vencida.competencia.endsWith('-01'));
});

test('sindico lanca cobranca e marca pagamento; regras de valor, competencia e duplicidade', async () => {
  const corpo = { unidadeId: 3, tipo: 'COTA_CONDOMINIAL', competencia: '2027-03-01', valor: 700.5, vencimento: '2027-03-10' };
  const r = await h.api('POST', '/cobrancas', { token: t.sindico, corpo });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.valor, 700.5);
  assert.equal(r.corpo.status, 'PENDENTE');

  assert.equal((await h.api('POST', '/cobrancas', { token: t.sindico, corpo })).status, 409); // 2 cotas no mesmo mes
  // multas e taxas extras podem repetir no mesmo mes (correcao em relacao ao banco original)
  const multa = { ...corpo, tipo: 'MULTA', descricao: 'Barulho após as 22h' };
  assert.equal((await h.api('POST', '/cobrancas', { token: t.sindico, corpo: multa })).status, 201);
  assert.equal((await h.api('POST', '/cobrancas', { token: t.sindico, corpo: multa })).status, 201);

  assert.equal((await h.api('POST', '/cobrancas', { token: t.ana, corpo })).status, 403);
  assert.equal((await h.api('POST', '/cobrancas', { token: t.sindico, corpo: { ...corpo, valor: 0 } })).status, 400);
  assert.equal((await h.api('POST', '/cobrancas', { token: t.sindico, corpo: { ...corpo, valor: -5 } })).status, 400);
  assert.equal((await h.api('POST', '/cobrancas', { token: t.sindico, corpo: { ...corpo, competencia: '2027-03-15' } })).status, 400);
  assert.equal((await h.api('POST', '/cobrancas', { token: t.sindico, corpo: { ...corpo, unidadeId: 999 } })).status, 404);

  const pago = await h.api('PATCH', `/cobrancas/${r.corpo.id}/pagamento`, { token: t.sindico, corpo: { dataPagamento: '2027-03-08' } });
  assert.equal(pago.status, 200);
  assert.equal(pago.corpo.status, 'PAGO');
  assert.equal(pago.corpo.dataPagamento, '2027-03-08');
  assert.equal((await h.api('PATCH', `/cobrancas/${r.corpo.id}/pagamento`, { token: t.sindico, corpo: {} })).status, 409);
  assert.equal((await h.api('PATCH', `/cobrancas/${r.corpo.id}/pagamento`, { token: t.ana, corpo: {} })).status, 403);
});

test('despesas e resumo: so o sindico', async () => {
  assert.equal((await h.api('GET', '/despesas', { token: t.ana })).status, 403);
  assert.equal((await h.api('GET', '/financeiro/resumo', { token: t.porteiro })).status, 403);
  const lista = await h.api('GET', '/despesas', { token: t.sindico });
  assert.equal(lista.status, 200);
  assert.ok(lista.corpo.total >= 3);

  const mes = `${h.datas.hoje().slice(0, 7)}-01`;
  const d = await h.api('POST', '/despesas', { token: t.sindico, corpo: { categoria: 'MANUTENCAO', descricao: 'Troca do portão', valor: 1200, competencia: mes, vencimento: mes } });
  assert.equal(d.status, 201);
  assert.equal((await h.api('POST', '/despesas', { token: t.sindico, corpo: { categoria: 'LAZER', descricao: 'Inválida', valor: 10, competencia: mes, vencimento: mes } })).status, 400);
  assert.equal((await h.api('PATCH', `/despesas/${d.corpo.id}/pagamento`, { token: t.sindico, corpo: {} })).corpo.status, 'PAGO');

  const resumo = await h.api('GET', '/financeiro/resumo', { token: t.sindico });
  assert.equal(resumo.status, 200);
  assert.equal(resumo.corpo.competencia, mes);
  assert.ok(resumo.corpo.despesas.pago >= 1200);
  assert.ok(resumo.corpo.receitas.previsto > 0);
});

test('o banco recusa valores invalidos mesmo fora da API (CHECKs do Caua)', async () => {
  await assert.rejects(h.prisma.lancamento.create({ data: { unidadeId: 1, tipo: 'cota_condominial', competencia: new Date('2027-05-01'), valor: '10', vencimento: new Date('2027-05-10'), status: 'pago' } }), /ck_lancamento_pagamento|check/i);
  await assert.rejects(h.prisma.lancamento.create({ data: { unidadeId: 1, tipo: 'cota_condominial', competencia: new Date('2027-05-15'), valor: '10', vencimento: new Date('2027-05-20') } }), /ck_lancamento_competencia|check/i);
  await assert.rejects(h.prisma.morador.create({ data: { usuarioId: 1, unidadeId: 4, tipoVinculo: 'visitante' } }), /ck_morador_tipo_vinculo|check/i);
  await assert.rejects(h.prisma.usuario.create({ data: { nome: 'Tel Ruim', email: 'tel@x.com', senhaHash: 'x', telefone: '12345' } }), /ck_usuario_telefone|check/i);
});
