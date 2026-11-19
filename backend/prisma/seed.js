// ZELUVI - dados de teste (SO PARA DESENVOLVIMENTO). Rode com: npm run db:seed
// Pode rodar varias vezes: nao duplica nada (usa "buscar ou criar").
// Usuarios e senha seguem as especificacoes de API (cenarios CT01..CT10): senha 123456.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const SENHA_DEV = '123456';

const dia = (s) => new Date(`${s}T00:00:00.000Z`);
const emDias = (n) => new Date(Date.now() + n * 86400000);

async function acharOuCriar(modelo, where, data) {
  return (await prisma[modelo].findFirst({ where })) ?? prisma[modelo].create({ data: { ...where, ...data } });
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed de teste nao roda em producao (cria usuarios com senha conhecida).');
  }

  // 1) Perfis (RN01)
  const perfis = {};
  for (const [nome, descricao] of [
    ['morador', 'Residente de uma unidade'],
    ['sindico', 'Administrador do condominio'],
    ['porteiro', 'Funcionario da portaria'],
    ['administrador', 'Administracao do condominio (mesmos direitos do sindico)'],
  ]) {
    perfis[nome] = await prisma.perfil.upsert({ where: { nome }, update: {}, create: { nome, descricao } });
  }

  // 2) Condominio e unidades
  const condominio = await acharOuCriar('condominio', { nome: 'Residencial Aurora' }, { endereco: 'Rua das Flores, 100 - Sao Paulo/SP' });
  const unidades = {};
  for (const [bloco, numero] of [['A', '101'], ['A', '102'], ['B', '201'], ['B', '302']]) {
    unidades[`${bloco}${numero}`] = await acharOuCriar(
      'unidade', { condominioId: condominio.id, identificacao: `${bloco}-${numero}` }, { bloco, numero },
    );
  }

  // 3) Usuarios e vinculos
  const senhaHash = await bcrypt.hash(SENHA_DEV, 10);
  async function usuario(nome, email, perfil, telefone, unidade, tipo) {
    const u = (await prisma.usuario.findUnique({ where: { email } }))
      ?? (await prisma.usuario.create({ data: { nome, email, senhaHash, telefone } }));
    await prisma.usuarioCondominio.upsert({
      where: { usuarioId_condominioId: { usuarioId: u.id, condominioId: condominio.id } },
      update: {},
      create: { usuarioId: u.id, condominioId: condominio.id, perfilId: perfis[perfil].id },
    });
    if (unidade) {
      await prisma.morador.upsert({
        where: { usuarioId_unidadeId: { usuarioId: u.id, unidadeId: unidade.id } },
        update: {},
        create: { usuarioId: u.id, unidadeId: unidade.id, tipoVinculo: tipo, principal: true },
      });
    }
    return u;
  }
  const sindico = await usuario('Síndico Carlos', 'sindico@condominio.com', 'sindico', null);
  const ana = await usuario('Moradora Ana', 'ana@condominio.com', 'morador', '44999998888', unidades.A101, 'proprietario');
  await usuario('Morador Bruno', 'bruno@condominio.com', 'morador', '44988887777', unidades.A102, 'inquilino');
  await usuario('Porteiro Marcos', 'portaria@condominio.com', 'porteiro', null);

  // 4) Areas comuns
  for (const a of [
    { nome: 'Salão de festas', capacidade: 80, regras: 'Som até 22h. Limpeza por conta de quem reservou.', horarioAbertura: '08:00', horarioFechamento: '23:00', duracaoMaximaHoras: 6 },
    { nome: 'Churrasqueira', capacidade: 20, regras: 'Apagar as brasas ao final. Silêncio após as 22h.', horarioAbertura: '10:00', horarioFechamento: '22:00', duracaoMaximaHoras: 5 },
    { nome: 'Elevador de serviço', capacidade: null, regras: 'Reserva para mudanças. Proteger as paredes.', horarioAbertura: '08:00', horarioFechamento: '17:00', duracaoMaximaHoras: 4, exigeAprovacao: true },
  ]) {
    await acharOuCriar('areaComum', { condominioId: condominio.id, nome: a.nome }, a);
  }

  // 5) Conteudo de demonstracao (so se o condominio ainda nao tem avisos)
  if ((await prisma.comunicado.count({ where: { condominioId: condominio.id } })) === 0) {
    await prisma.comunicado.createMany({
      data: [
        { condominioId: condominio.id, autorId: sindico.id, titulo: 'Limpeza da caixa d\'água', conteudo: 'Na próxima terça, das 8h às 12h, a água ficará suspensa para a limpeza semestral da caixa d\'água.', expiraEm: emDias(10) },
        { condominioId: condominio.id, autorId: sindico.id, titulo: 'Assembleia ordinária', conteudo: 'A assembleia ordinária será realizada no salão de festas, às 19h. Pauta: prestação de contas e obras da fachada.' },
      ],
    });
    await prisma.faq.createMany({
      data: [
        { condominioId: condominio.id, pergunta: 'Qual o horário de silêncio?', resposta: 'Das 22h às 8h, conforme o regimento interno.' },
        { condominioId: condominio.id, pergunta: 'Como reservar o salão de festas?', resposta: 'Pela área "Reservas": escolha o dia, o horário e confirme.' },
        { condominioId: condominio.id, pergunta: 'Onde retiro minhas encomendas?', resposta: 'Na portaria, com documento. Você é avisado quando a encomenda chega.' },
      ],
    });
    await prisma.prestador.createMany({
      data: [
        { condominioId: condominio.id, nome: 'Eletricista Roberto', servico: 'Elétrica', telefone: '44999990001', observacoes: 'Atende em horário comercial.' },
        { condominioId: condominio.id, nome: 'Hidráulica Silva', servico: 'Encanamento', telefone: '44999990002' },
      ],
    });
    const hoje = new Date();
    const mes = (delta) => new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + delta, 1));
    const venc = (delta) => new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + delta, 10));
    await prisma.lancamento.createMany({
      data: [
        { unidadeId: unidades.A101.id, tipo: 'cota_condominial', competencia: mes(-1), valor: '650.00', vencimento: venc(-1), status: 'pago', dataPagamento: venc(-1) },
        { unidadeId: unidades.A101.id, tipo: 'cota_condominial', competencia: mes(0), valor: '650.00', vencimento: venc(0) },
        { unidadeId: unidades.A102.id, tipo: 'cota_condominial', competencia: mes(-1), valor: '650.00', vencimento: venc(-1) },
      ],
    });
    await prisma.despesa.createMany({
      data: [
        { condominioId: condominio.id, categoria: 'folha', descricao: 'Folha de pagamento', valor: '8200.00', competencia: mes(0), vencimento: venc(0) },
        { condominioId: condominio.id, categoria: 'agua_energia', descricao: 'Conta de energia das áreas comuns', fornecedor: 'Companhia de Energia', valor: '1450.90', competencia: mes(0), vencimento: venc(0) },
        { condominioId: condominio.id, categoria: 'limpeza', descricao: 'Serviço de limpeza', fornecedor: 'Limpa Mais', valor: '2100.00', competencia: mes(-1), vencimento: venc(-1), status: 'pago', dataPagamento: venc(-1) },
      ],
    });
    // uma ocorrencia de exemplo da Ana, ja com historico
    const oc = await prisma.ocorrencia.create({
      data: {
        condominioId: condominio.id, autorId: ana.id,
        moradorId: (await prisma.morador.findFirst({ where: { usuarioId: ana.id } })).id,
        assunto: 'Lâmpada queimada', descricao: 'A lâmpada do corredor do 2º andar está apagada desde ontem.',
        categoria: 'iluminacao', local: 'Bloco A, 2º andar',
      },
    });
    await prisma.historicoOcorrencia.create({ data: { ocorrenciaId: oc.id, usuarioId: ana.id, statusAnterior: null, statusNovo: 'solicitada' } });
  }

  console.log('Seed concluido. Usuarios (senha ' + SENHA_DEV + '): sindico@, ana@ (morador), bruno@ (morador), portaria@ — todos @condominio.com');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
