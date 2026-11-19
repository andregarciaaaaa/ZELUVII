const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

let t;
test.before(async () => { await h.preparar(); t = await h.tokens(); });
test.after(h.encerrar);

const SALAO = 1;
const reservar = (token, areaId, dia, de, ate, extra = {}) =>
  h.api('POST', '/reservas', { token, corpo: { areaId, inicio: h.amanha(dia, de), fim: h.amanha(dia, ate), ...extra } });
const dataDoDia = (dia) => h.datas.somarDias(h.datas.hoje(), dia);

test('CT40-CT43 areas: sindico cadastra; morador nao; nome repetido e horario invertido', async () => {
  const nova = { nome: 'Quadra poliesportiva', capacidade: 30, horarioAbertura: '07:00', horarioFechamento: '22:00', duracaoMaximaHoras: 2 };
  const r = await h.api('POST', '/areas', { token: t.sindico, corpo: nova });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.ativa, true);
  assert.equal(r.corpo.antecedenciaMaximaDias, 60);
  assert.equal((await h.api('POST', '/areas', { token: t.ana, corpo: nova })).status, 403);
  assert.equal((await h.api('POST', '/areas', { token: t.sindico, corpo: nova })).status, 409);
  const inv = await h.api('POST', '/areas', { token: t.sindico, corpo: { ...nova, nome: 'Outra area', horarioAbertura: '22:00', horarioFechamento: '08:00' } });
  assert.equal(inv.status, 400);
  assert.equal(inv.corpo.erro.detalhes[0].campo, 'horarioFechamento');
  const longa = await h.api('POST', '/areas', { token: t.sindico, corpo: { ...nova, nome: 'Mais outra', duracaoMaximaHoras: 20 } });
  assert.equal(longa.status, 400);
});

test('CT44 morador so ve areas ativas; sindico ve todas e PATCH informa reservas futuras', async () => {
  await reservar(t.ana, 2, 5, '10:00', '12:00'); // churrasqueira
  const patch = await h.api('PATCH', '/areas/2', { token: t.sindico, corpo: { ativa: false } });
  assert.equal(patch.status, 200);
  assert.equal(patch.corpo.reservasFuturas, 1);
  const morador = await h.api('GET', '/areas', { token: t.ana });
  assert.ok(!morador.corpo.dados.some((a) => a.id === 2));
  assert.equal((await h.api('GET', '/areas/2', { token: t.ana })).status, 404);
  const sindico = await h.api('GET', '/areas', { token: t.sindico });
  assert.ok(sindico.corpo.dados.some((a) => a.id === 2));
  // CT55: reservar area inativa
  assert.equal((await reservar(t.bruno, 2, 6, '10:00', '12:00')).status, 404);
  await h.api('PATCH', '/areas/2', { token: t.sindico, corpo: { ativa: true } });
});

test('CT45-CT49 disponibilidade, conflito e "encostar nao e sobrepor"', async () => {
  const base = await reservar(t.bruno, SALAO, 10, '14:00', '18:00');
  assert.equal(base.status, 201);
  assert.equal(base.corpo.status, 'CONFIRMADA'); // RN06: confirmacao automatica

  const disp = await h.api('GET', `/areas/${SALAO}/disponibilidade?data=${dataDoDia(10)}`, { token: t.ana });
  assert.equal(disp.status, 200);
  assert.equal(disp.corpo.ocupado.length, 1);
  assert.equal(disp.corpo.ocupado[0].propria, false);
  assert.equal(disp.corpo.ocupado[0].morador, undefined); // nunca revela quem reservou
  assert.equal(disp.corpo.horarioAbertura, '08:00');

  // CT47: mesmo horario -> 409 com o periodo e sem dados de quem reservou
  const igual = await reservar(t.ana, SALAO, 10, '14:00', '18:00');
  assert.equal(igual.status, 409);
  assert.equal(igual.corpo.erro.codigo, 'CONFLITO');
  const [a, m, d] = dataDoDia(10).split('-');
  assert.equal(igual.corpo.erro.mensagem, `Horário já reservado: Salão de festas, ${d}/${m}/${a}, das 14:00 às 18:00.`);
  assert.equal(/Bruno|101|102/.test(JSON.stringify(igual.corpo)), false);

  for (const [de, ate] of [['15:00', '17:00'], ['17:00', '20:00'], ['12:00', '15:00'], ['12:00', '18:00']]) {
    assert.equal((await reservar(t.ana, SALAO, 10, de, ate)).status, 409, `${de}-${ate} deveria conflitar`); // CT48
  }
  assert.equal((await reservar(t.ana, SALAO, 10, '10:00', '14:00')).status, 201); // CT49 termina quando a outra comeca
  assert.equal((await reservar(t.ana, SALAO, 10, '18:00', '22:00')).status, 201); // CT46 comeca quando a outra termina
  assert.equal((await reservar(t.ana, 3, 10, '14:00', '16:00')).status, 201); // outra area nao conflita
});

test('CT50 dois pedidos ao mesmo tempo: um 201 e um 409, so uma reserva no banco', async () => {
  const [x, y] = await Promise.all([
    reservar(t.ana, SALAO, 11, '10:00', '12:00'),
    reservar(t.bruno, SALAO, 11, '10:00', '12:00'),
  ]);
  assert.deepEqual([x.status, y.status].sort(), [201, 409]);
  const perdedor = x.status === 409 ? x : y;
  assert.equal(perdedor.corpo.erro.codigo, 'CONFLITO');
  assert.match(perdedor.corpo.erro.mensagem, /^Horário já reservado/);
  const qtd = await h.prisma.reserva.count({ where: { areaId: SALAO, inicio: new Date(h.amanha(11, '10:00')) } });
  assert.equal(qtd, 1);
});

test('o proprio banco barra sobreposicao (restricao EXCLUDE), mesmo sem passar pela API', async () => {
  await assert.rejects(
    h.prisma.reserva.create({ data: { areaId: SALAO, criadoPorId: 2, inicio: new Date(h.amanha(10, '15:00')), fim: new Date(h.amanha(10, '16:00')), status: 'confirmada' } }),
    /reserva_sem_sobreposicao|exclusion/i,
  );
});

test('CT51-CT54 regras da area: fechamento, passado, duracao, antecedencia, dia diferente', async () => {
  const fora = await reservar(t.ana, SALAO, 12, '22:00', '23:30');
  assert.equal(fora.status, 400);
  assert.ok(fora.corpo.erro.detalhes.some((x) => x.campo === 'fim' && /fecha às 23:00/.test(x.mensagem)));

  const passado = await reservar(t.ana, SALAO, -1, '10:00', '12:00');
  assert.equal(passado.status, 400);
  assert.ok(passado.corpo.erro.detalhes.some((x) => x.campo === 'inicio'));

  const longa = await reservar(t.ana, SALAO, 12, '08:00', '15:00'); // 7 horas, maximo 6
  assert.equal(longa.status, 400);
  assert.ok(longa.corpo.erro.detalhes.some((x) => /no máximo 6 horas/.test(x.mensagem)));

  assert.equal((await reservar(t.ana, SALAO, 61, '10:00', '12:00')).status, 400);
  assert.equal((await reservar(t.ana, SALAO, 60, '10:00', '12:00')).status, 201); // limite exato

  const viraNoite = await h.api('POST', '/reservas', { token: t.ana, corpo: { areaId: SALAO, inicio: h.amanha(13, '22:00'), fim: h.amanha(14, '01:00') } });
  assert.equal(viraNoite.status, 400);

  const semFuso = await h.api('POST', '/reservas', { token: t.ana, corpo: { areaId: SALAO, inicio: '2030-01-01T10:00:00', fim: '2030-01-01T12:00:00' } });
  assert.equal(semFuso.status, 400); // data sem fuso nao e aceita
});

test('instante em UTC equivale ao horario local (21:00Z = 18:00 em Sao Paulo)', async () => {
  const dia = dataDoDia(15);
  const r = await h.api('POST', '/reservas', { token: t.ana, corpo: { areaId: SALAO, inicio: `${dia}T21:00:00Z`, fim: `${dia}T23:00:00Z` } });
  assert.equal(r.status, 201); // 18:00-20:00 locais, dentro do funcionamento
  const fora = await h.api('POST', '/reservas', { token: t.ana, corpo: { areaId: SALAO, inicio: `${dia}T09:00:00Z`, fim: `${dia}T11:00:00Z` } });
  assert.equal(fora.status, 400); // 06:00 local: area ainda fechada
});

test('CT56 porteiro nao reserva; morador nao reserva em nome de outro; sindico sim', async () => {
  assert.equal((await reservar(t.porteiro, SALAO, 16, '10:00', '12:00')).status, 403);
  const outro = await reservar(t.ana, SALAO, 16, '10:00', '12:00', { moradorId: 3 });
  assert.equal(outro.status, 400);
  assert.equal(outro.corpo.erro.detalhes[0].campo, 'moradorId');

  const condominio = await reservar(t.sindico, SALAO, 16, '10:00', '12:00'); // sem moradorId: reserva do condominio
  assert.equal(condominio.status, 201);
  assert.equal(condominio.corpo.morador, null);
  const emNome = await reservar(t.sindico, SALAO, 16, '14:00', '16:00', { moradorId: 3, observacao: 'festa do Bruno' });
  assert.equal(emNome.status, 201);
  assert.equal(emNome.corpo.morador.nome, 'Morador Bruno');
  assert.equal(emNome.corpo.unidade.numero, '102');
  assert.equal((await reservar(t.sindico, SALAO, 17, '10:00', '12:00', { moradorId: 999 })).status, 404);
});

test('CT57-CT60 cancelamento: proprias, de outro, ja iniciada, e horario volta a ficar livre', async () => {
  const minha = await reservar(t.ana, SALAO, 20, '18:00', '22:00');
  assert.equal(minha.status, 201);
  const id = minha.corpo.id;

  assert.equal((await h.api('DELETE', `/reservas/${id}`, { token: t.bruno })).status, 403); // CT58
  assert.equal((await h.api('DELETE', `/reservas/${id}`, { token: t.porteiro })).status, 403);

  const cancel = await h.api('DELETE', `/reservas/${id}`, { token: t.ana });
  assert.equal(cancel.status, 204); // CT57
  const linha = await h.prisma.reserva.findUnique({ where: { id } });
  assert.equal(linha.status, 'cancelada'); // nada e apagado
  assert.ok(linha.canceladaEm);
  const disp = await h.api('GET', `/areas/${SALAO}/disponibilidade?data=${dataDoDia(20)}`, { token: t.ana });
  assert.equal(disp.corpo.ocupado.length, 0);

  assert.equal((await h.api('DELETE', `/reservas/${id}`, { token: t.ana })).status, 409); // ja cancelada
  assert.equal((await reservar(t.bruno, SALAO, 20, '18:00', '22:00')).status, 201); // CT60

  // CT59: reserva que ja comecou
  const iniciada = await h.prisma.reserva.create({
    data: { areaId: 3, criadoPorId: 2, moradorId: 1, inicio: new Date(Date.now() - 3600e3), fim: new Date(Date.now() + 3600e3), status: 'confirmada' },
  });
  const r = await h.api('DELETE', `/reservas/${iniciada.id}`, { token: t.ana });
  assert.equal(r.status, 409);
  assert.match(r.corpo.erro.mensagem, /já começou/);
  assert.equal((await h.api('DELETE', `/reservas/${iniciada.id}`, { token: t.sindico })).status, 204); // sindico cancela ate o fim
  assert.equal((await h.api('DELETE', '/reservas/99999', { token: t.sindico })).status, 404);
});

test('CT61/CT63 privacidade: morador ve reservas dos outros sem morador, unidade e observacao', async () => {
  await reservar(t.bruno, SALAO, 25, '10:00', '12:00', { observacao: 'aniversario do Bruno' });
  const minha = await reservar(t.ana, SALAO, 25, '14:00', '16:00', { observacao: 'reuniao da Ana' });
  const lista = await h.api('GET', `/reservas?areaId=${SALAO}&de=${dataDoDia(25)}&ate=${dataDoDia(25)}`, { token: t.ana });
  assert.equal(lista.status, 200);
  assert.equal(lista.corpo.dados.length, 2);
  const [dele, dela] = lista.corpo.dados;
  assert.deepEqual([dele.morador, dele.unidade, dele.observacao], [null, null, null]);
  assert.equal(dela.morador.nome, 'Moradora Ana');
  assert.equal(dela.observacao, 'reuniao da Ana');

  const detalheOutro = await h.api('GET', `/reservas/${dele.id}`, { token: t.ana });
  assert.equal(detalheOutro.status, 200);
  assert.equal(detalheOutro.corpo.morador, null);

  // sindico e porteiro veem tudo
  for (const tk of [t.sindico, t.porteiro]) {
    const r = await h.api('GET', `/reservas/${dele.id}`, { token: tk });
    assert.equal(r.corpo.morador.nome, 'Morador Bruno');
    assert.equal(r.corpo.observacao, 'aniversario do Bruno');
  }
  assert.equal(minha.status, 201);
  assert.equal((await h.api('GET', '/reservas?de=2026-12-31&ate=2026-01-01', { token: t.ana })).status, 400);
});

test('CT62 area de outro condominio -> 404', async () => {
  const outro = await h.prisma.condominio.create({ data: { nome: 'Outro Condominio', endereco: 'Rua B, 2' } });
  const area = await h.prisma.areaComum.create({ data: { condominioId: outro.id, nome: 'Salao alheio' } });
  assert.equal((await reservar(t.ana, area.id, 30, '10:00', '12:00')).status, 404);
  assert.equal((await h.api('GET', `/areas/${area.id}`, { token: t.sindico })).status, 404);
});

test('aprovacao do sindico (area com exigeAprovacao): pendente segura o horario ate decidir', async () => {
  const elevador = 3;
  const pedido = await reservar(t.ana, elevador, 40, '08:00', '10:00');
  assert.equal(pedido.status, 201);
  assert.equal(pedido.corpo.status, 'PENDENTE');
  assert.equal((await reservar(t.bruno, elevador, 40, '09:00', '11:00')).status, 409); // pendente tambem segura o horario

  assert.equal((await h.api('PATCH', `/reservas/${pedido.corpo.id}`, { token: t.ana, corpo: { status: 'CONFIRMADA' } })).status, 403);
  const ok = await h.api('PATCH', `/reservas/${pedido.corpo.id}`, { token: t.sindico, corpo: { status: 'CONFIRMADA' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.corpo.status, 'CONFIRMADA');
  assert.equal((await h.api('PATCH', `/reservas/${pedido.corpo.id}`, { token: t.sindico, corpo: { status: 'RECUSADA' } })).status, 409); // ja decidida

  const outra = await reservar(t.ana, elevador, 41, '08:00', '10:00');
  const recusa = await h.api('PATCH', `/reservas/${outra.corpo.id}`, { token: t.sindico, corpo: { status: 'RECUSADA' } });
  assert.equal(recusa.corpo.status, 'RECUSADA');
  assert.equal((await reservar(t.bruno, elevador, 41, '08:00', '10:00')).status, 201); // recusada libera o horario
  assert.equal((await reservar(t.sindico, elevador, 42, '08:00', '10:00')).corpo.status, 'CONFIRMADA'); // sindico nao precisa de aprovacao
});

test('disponibilidade: datas invalidas', async () => {
  assert.equal((await h.api('GET', `/areas/${SALAO}/disponibilidade`, { token: t.ana })).status, 400);
  assert.equal((await h.api('GET', `/areas/${SALAO}/disponibilidade?data=ontem`, { token: t.ana })).status, 400);
  assert.equal((await h.api('GET', `/areas/${SALAO}/disponibilidade?data=${dataDoDia(-1)}`, { token: t.ana })).status, 400);
  assert.equal((await h.api('GET', `/areas/${SALAO}/disponibilidade?data=${dataDoDia(61)}`, { token: t.ana })).status, 400);
});
