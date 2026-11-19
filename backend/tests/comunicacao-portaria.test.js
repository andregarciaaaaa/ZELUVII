const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

let t;
test.before(async () => { await h.preparar(); t = await h.tokens(); });
test.after(h.encerrar);

const emBreve = (dias) => new Date(Date.now() + dias * 86400e3).toISOString();

// ---------------------------------------------------------------- avisos (CT70-CT75, CT96)
test('CT70/CT72/CT96 so o sindico publica aviso; sem login 401', async () => {
  const r = await h.api('POST', '/avisos', { token: t.sindico, corpo: { titulo: 'Limpeza da caixa', conteudo: 'Terça, das 8h às 12h.', expiraEm: emBreve(3) } });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.autor.nome, 'Síndico Carlos');
  assert.equal(r.corpo.atualizadoEm, null);
  assert.equal((await h.api('POST', '/avisos', { token: t.ana, corpo: { titulo: 'Oi gente', conteudo: 'x' } })).status, 403);
  assert.equal((await h.api('POST', '/avisos', { token: t.porteiro, corpo: { titulo: 'Oi gente', conteudo: 'x' } })).status, 403);
  assert.equal((await h.api('GET', '/avisos')).status, 401);
  const passado = await h.api('POST', '/avisos', { token: t.sindico, corpo: { titulo: 'Velho', conteudo: 'x', expiraEm: '2020-01-01T00:00:00-03:00' } });
  assert.equal(passado.status, 400);
});

test('CT71/CT73/CT74/CT75 vigentes, expirado, editar e remover', async () => {
  const venc = await h.prisma.comunicado.create({ data: { condominioId: 1, autorId: 1, titulo: 'Aviso vencido', conteudo: 'x', expiraEm: new Date(Date.now() - 1000) } });

  const morador = await h.api('GET', '/avisos', { token: t.ana });
  assert.equal(morador.status, 200);
  assert.ok(!morador.corpo.dados.some((a) => a.id === venc.id)); // so vigentes
  const sindico = await h.api('GET', '/avisos?incluirExpirados=true', { token: t.sindico });
  assert.ok(sindico.corpo.dados.some((a) => a.id === venc.id));
  assert.equal((await h.api('GET', `/avisos/${venc.id}`, { token: t.ana })).status, 404); // CT73
  assert.equal((await h.api('GET', `/avisos/${venc.id}`, { token: t.sindico })).status, 200);

  const alvo = morador.corpo.dados[0];
  const edit = await h.api('PATCH', `/avisos/${alvo.id}`, { token: t.sindico, corpo: { titulo: 'Titulo corrigido' } });
  assert.equal(edit.status, 200);
  assert.ok(edit.corpo.atualizadoEm);
  assert.equal((await h.api('PATCH', `/avisos/${alvo.id}`, { token: t.ana, corpo: { titulo: 'Hack hack' } })).status, 403);
  assert.equal((await h.api('PATCH', `/avisos/${alvo.id}`, { token: t.sindico, corpo: {} })).status, 400);

  assert.equal((await h.api('DELETE', `/avisos/${alvo.id}`, { token: t.ana })).status, 403);
  assert.equal((await h.api('DELETE', `/avisos/${alvo.id}`, { token: t.sindico })).status, 204);
  assert.ok(!(await h.api('GET', '/avisos', { token: t.ana })).corpo.dados.some((a) => a.id === alvo.id));
  assert.equal((await h.api('DELETE', `/avisos/${alvo.id}`, { token: t.sindico })).status, 404); // ja removido
  const guardado = await h.prisma.comunicado.findUnique({ where: { id: alvo.id } });
  assert.ok(guardado.removidoEm); // fica guardado para auditoria
});

// ---------------------------------------------------------------- ocorrencias (CT76-CT84)
test('CT76/CT77/CT78 abrir ocorrencia: protocolo, historico, qualquer perfil, categoria invalida', async () => {
  const corpo = { assunto: 'Vazamento na garagem', descricao: 'Pinga água do teto da vaga 12.', categoria: 'MANUTENCAO', local: 'Garagem' };
  const r = await h.api('POST', '/ocorrencias', { token: t.bruno, corpo });
  assert.equal(r.status, 201);
  assert.match(r.corpo.protocolo, /^OC-\d{4}-\d{6}$/);
  assert.equal(r.corpo.status, 'SOLICITADA'); // RN08: status inicial
  assert.equal(r.corpo.historico.length, 1);
  assert.equal(r.corpo.historico[0].statusAnterior, null);
  assert.equal(r.corpo.unidade.numero, '102');

  const p = await h.api('POST', '/ocorrencias', { token: t.porteiro, corpo: { ...corpo, assunto: 'Portao travado' } });
  assert.equal(p.status, 201);
  assert.equal(p.corpo.unidade, null); // porteiro nao mora em unidade
  assert.equal(p.corpo.autor.perfil, 'PORTEIRO');
  assert.notEqual(p.corpo.protocolo, r.corpo.protocolo);

  assert.equal((await h.api('POST', '/ocorrencias', { token: t.ana, corpo: { ...corpo, categoria: 'BARULHO' } })).status, 400);
  assert.equal((await h.api('POST', '/ocorrencias', { token: t.ana, corpo: { ...corpo, status: 'RESOLVIDA' } })).status, 400); // status vem do sistema
  assert.equal((await h.api('POST', '/ocorrencias', { token: t.ana, corpo: { ...corpo, autor: { id: 1 } } })).status, 400);
});

test('CT79/CT80 ocorrencias: morador ve so as proprias; sindico ve todas', async () => {
  const doBruno = (await h.api('GET', '/ocorrencias', { token: t.bruno })).corpo.dados;
  assert.equal(doBruno.length, 1);
  assert.equal(doBruno[0].historico, undefined); // lista vem sem historico
  const ana = (await h.api('GET', '/ocorrencias', { token: t.ana })).corpo; // a do seed
  assert.equal(ana.total, 1);
  assert.equal((await h.api('GET', '/ocorrencias', { token: t.sindico })).corpo.total, 3);

  const outra = await h.api('GET', `/ocorrencias/${doBruno[0].id}`, { token: t.ana });
  assert.equal(outra.status, 403); // CT80
  const propria = await h.api('GET', `/ocorrencias/${doBruno[0].id}`, { token: t.bruno });
  assert.equal(propria.status, 200);
  assert.equal(propria.corpo.historico.length, 1);
  assert.equal((await h.api('GET', '/ocorrencias/9999', { token: t.sindico })).status, 404);
  assert.equal((await h.api('GET', '/ocorrencias?status=INVALIDO', { token: t.sindico })).status, 400);
  assert.equal((await h.api('GET', '/ocorrencias?categoria=MANUTENCAO', { token: t.sindico })).corpo.total, 2);
});

test('CT81-CT84 mudar status: historico com responsavel, mesmo status 409, reabrir, so o sindico', async () => {
  const id = (await h.api('GET', '/ocorrencias', { token: t.bruno })).corpo.dados[0].id;
  const r = await h.api('PATCH', `/ocorrencias/${id}`, { token: t.sindico, corpo: { status: 'EM_ANDAMENTO', observacao: 'Encanador agendado.' } });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.status, 'EM_ANDAMENTO');
  assert.equal(r.corpo.historico.length, 2);
  assert.deepEqual(
    [r.corpo.historico[1].statusAnterior, r.corpo.historico[1].statusNovo, r.corpo.historico[1].responsavel.nome, r.corpo.historico[1].observacao],
    ['SOLICITADA', 'EM_ANDAMENTO', 'Síndico Carlos', 'Encanador agendado.'],
  );
  assert.equal((await h.api('PATCH', `/ocorrencias/${id}`, { token: t.sindico, corpo: { status: 'EM_ANDAMENTO' } })).status, 409); // CT82

  assert.equal((await h.api('PATCH', `/ocorrencias/${id}`, { token: t.sindico, corpo: { status: 'AGUARDANDO_TERCEIRO' } })).status, 200); // RN08
  assert.equal((await h.api('PATCH', `/ocorrencias/${id}`, { token: t.sindico, corpo: { status: 'RESOLVIDA' } })).status, 200);
  const reaberta = await h.api('PATCH', `/ocorrencias/${id}`, { token: t.sindico, corpo: { status: 'EM_ANDAMENTO' } }); // CT83
  assert.equal(reaberta.status, 200);
  assert.equal(reaberta.corpo.historico.length, 5);
  assert.equal((await h.api('PATCH', `/ocorrencias/${id}`, { token: t.sindico, corpo: { status: 'ABERTA' } })).corpo.status, 'SOLICITADA'); // apelido da spec

  assert.equal((await h.api('PATCH', `/ocorrencias/${id}`, { token: t.porteiro, corpo: { status: 'RESOLVIDA' } })).status, 403); // CT84
  assert.equal((await h.api('PATCH', `/ocorrencias/${id}`, { token: t.bruno, corpo: { status: 'RESOLVIDA' } })).status, 403);
  assert.equal((await h.api('PATCH', `/ocorrencias/${id}`, { token: t.sindico, corpo: { status: 'FECHADA' } })).status, 400);
});

// ---------------------------------------------------------------- portaria (CT85-CT97)
test('CT85/CT86/CT88/CT91 encomendas: porteiro registra, morador ve so a propria unidade', async () => {
  const r = await h.api('POST', '/encomendas', { token: t.porteiro, corpo: { unidadeId: 1, descricao: 'Caixa média, Correios', transportadora: 'Correios' } });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.status, 'AGUARDANDO_RETIRADA');
  assert.ok(r.corpo.recebidaEm);
  assert.equal(r.corpo.registradaPor.nome, 'Porteiro Marcos');
  const bruno = await h.api('POST', '/encomendas', { token: t.porteiro, corpo: { unidadeId: 2, descricao: 'Envelope' } });

  assert.equal((await h.api('POST', '/encomendas', { token: t.sindico, corpo: { unidadeId: 1, descricao: 'x' } })).status, 403); // CT88
  assert.equal((await h.api('POST', '/encomendas', { token: t.ana, corpo: { unidadeId: 1, descricao: 'x' } })).status, 403);
  assert.equal((await h.api('POST', '/encomendas', { token: t.porteiro, corpo: { unidadeId: 999, descricao: 'x' } })).status, 404);

  const lista = await h.api('GET', '/encomendas', { token: t.ana });
  assert.equal(lista.corpo.total, 1); // CT86
  assert.equal(lista.corpo.dados[0].unidade.numero, '101');
  assert.equal((await h.api('GET', '/encomendas', { token: t.porteiro })).corpo.total, 2);
  assert.equal((await h.api('GET', '/encomendas', { token: t.sindico })).corpo.total, 2);
  assert.equal((await h.api('GET', `/encomendas/${bruno.corpo.id}`, { token: t.ana })).status, 403); // CT91
  assert.equal((await h.api('GET', '/encomendas?unidadeId=2', { token: t.ana })).corpo.total, 0); // nao burla o filtro
});

test('CT87/CT89 retirada: data e hora exatas, so uma vez, so morador da unidade', async () => {
  const id = (await h.api('GET', '/encomendas?status=AGUARDANDO_RETIRADA', { token: t.ana })).corpo.dados[0].id;
  assert.equal((await h.api('PATCH', `/encomendas/${id}`, { token: t.ana, corpo: { status: 'ENTREGUE' } })).status, 403);
  assert.equal((await h.api('PATCH', `/encomendas/${id}`, { token: t.sindico, corpo: { status: 'ENTREGUE' } })).status, 403);
  assert.equal((await h.api('PATCH', `/encomendas/${id}`, { token: t.porteiro, corpo: { status: 'PENDENTE' } })).status, 400);
  assert.equal((await h.api('PATCH', `/encomendas/${id}`, { token: t.porteiro, corpo: { status: 'ENTREGUE', retiradaPorId: 3 } })).status, 400); // Bruno nao mora na unidade 101

  const antes = Date.now();
  const r = await h.api('PATCH', `/encomendas/${id}`, { token: t.porteiro, corpo: { status: 'ENTREGUE', retiradaPorId: 2 } });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.status, 'ENTREGUE');
  assert.equal(r.corpo.retiradaPor.nome, 'Moradora Ana');
  assert.ok(new Date(r.corpo.retiradaEm).getTime() >= antes - 1000);
  const repetida = await h.api('PATCH', `/encomendas/${id}`, { token: t.porteiro, corpo: { status: 'ENTREGUE' } });
  assert.equal(repetida.status, 409);
  assert.equal(repetida.corpo.erro.mensagem, 'Esta encomenda já foi retirada.');
});

test('CT90/CT92/CT93/CT94/CT95 visitantes: entrada, saida, dono e permissoes', async () => {
  const r = await h.api('POST', '/visitantes', { token: t.porteiro, corpo: { nome: 'João Pereira', tipo: 'PRESTADOR', unidadeId: 1, observacao: 'Técnico da internet' } });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.status, 'NO_CONDOMINIO');
  assert.equal(r.corpo.tipo, 'PRESTADOR');
  assert.equal(r.corpo.saidaEm, null);
  assert.equal(JSON.stringify(r.corpo).includes('documento'), false); // LGPD: sem documento no MVP
  await h.api('POST', '/visitantes', { token: t.porteiro, corpo: { nome: 'Maria Souza', tipo: 'VISITANTE', unidadeId: 2 } });

  assert.equal((await h.api('POST', '/visitantes', { token: t.ana, corpo: { nome: 'Fulano Tal', tipo: 'VISITANTE', unidadeId: 1 } })).status, 403); // CT95
  assert.equal((await h.api('POST', '/visitantes', { token: t.sindico, corpo: { nome: 'Fulano Tal', tipo: 'VISITANTE', unidadeId: 1 } })).status, 403);
  assert.equal((await h.api('POST', '/visitantes', { token: t.porteiro, corpo: { nome: 'Fulano Tal', tipo: 'ALIEN', unidadeId: 1 } })).status, 400);

  assert.equal((await h.api('GET', '/visitantes', { token: t.ana })).corpo.total, 1); // CT94
  assert.equal((await h.api('GET', '/visitantes', { token: t.sindico })).corpo.total, 2);
  assert.equal((await h.api('GET', '/visitantes?status=NO_CONDOMINIO', { token: t.porteiro })).corpo.total, 2);
  assert.equal((await h.api('GET', `/visitantes/${r.corpo.id + 1}`, { token: t.ana })).status, 403);

  const saida = await h.api('PATCH', `/visitantes/${r.corpo.id}`, { token: t.porteiro, corpo: { status: 'SAIU' } });
  assert.equal(saida.status, 200); // CT92
  assert.equal(saida.corpo.status, 'SAIU');
  assert.ok(saida.corpo.saidaEm);
  assert.equal((await h.api('PATCH', `/visitantes/${r.corpo.id}`, { token: t.porteiro, corpo: { status: 'SAIU' } })).status, 409); // CT93
  assert.equal((await h.api('PATCH', `/visitantes/${r.corpo.id}`, { token: t.ana, corpo: { status: 'SAIU' } })).status, 403);
  assert.equal((await h.api('GET', '/visitantes?status=SAIU', { token: t.sindico })).corpo.total, 1);
});

test('CT97 portaria de outro condominio: unidade de outro condominio -> 404', async () => {
  const outro = await h.prisma.condominio.create({ data: { nome: 'Outro', endereco: 'Rua C' } });
  const un = await h.prisma.unidade.create({ data: { condominioId: outro.id, identificacao: 'Z-1', numero: '1' } });
  assert.equal((await h.api('POST', '/encomendas', { token: t.porteiro, corpo: { unidadeId: un.id, descricao: 'x' } })).status, 404);
  assert.equal((await h.api('POST', '/visitantes', { token: t.porteiro, corpo: { nome: 'Alguém', tipo: 'VISITANTE', unidadeId: un.id } })).status, 404);
});

// ---------------------------------------------------------------- dashboard, prestadores e FAQ
test('dashboard por perfil e conteudo informativo', async () => {
  const s = await h.api('GET', '/dashboard', { token: t.sindico });
  assert.equal(s.status, 200);
  assert.equal(s.corpo.perfil, 'SINDICO');
  assert.ok('cobrancasEmAtraso' in s.corpo);
  const m = await h.api('GET', '/dashboard', { token: t.ana });
  assert.ok('cobrancasPendentes' in m.corpo);
  assert.equal('visitantesNoCondominio' in m.corpo, false);

  assert.ok((await h.api('GET', '/faq', { token: t.ana })).corpo.dados.length >= 3);
  assert.ok((await h.api('GET', '/prestadores', { token: t.ana })).corpo.dados.length >= 2);
  assert.equal((await h.api('POST', '/prestadores', { token: t.ana, corpo: { nome: 'Fulano Pintor', servico: 'Pintura' } })).status, 403);
  const novo = await h.api('POST', '/prestadores', { token: t.sindico, corpo: { nome: 'Fulano Pintor', servico: 'Pintura' } });
  assert.equal(novo.status, 201);
  assert.equal((await h.api('DELETE', `/prestadores/${novo.corpo.id}`, { token: t.sindico })).status, 204);
});
