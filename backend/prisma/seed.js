// ZELUVI - dados de teste. Rode com: npx prisma db seed
// Baseado no seed da branch banco-de-dados (Caua), com duas mudancas:
//   1) pode rodar mais de uma vez sem duplicar nada (upsert / busca antes de criar);
//   2) inclui um porteiro e avisos de exemplo, para demonstrar o CRUD de avisos.
// Senha de todos os usuarios: Senha@123
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function usuario(nome, email, senhaHash, telefone) {
  return prisma.usuario.upsert({
    where: { email },
    update: {},
    create: { nome, email, senhaHash, telefone },
  });
}

async function vincular(usuarioId, condominioId, perfilNome) {
  const perfil = await prisma.perfil.findUnique({ where: { nome: perfilNome } });
  return prisma.usuarioCondominio.upsert({
    where: { usuarioId_condominioId: { usuarioId, condominioId } },
    update: { perfilId: perfil.id, ativo: true },
    create: { usuarioId, condominioId, perfilId: perfil.id },
  });
}

async function main() {
  // 1) Perfis (RN01)
  for (const nome of ['morador', 'sindico', 'porteiro', 'administrador']) {
    await prisma.perfil.upsert({ where: { nome }, update: {}, create: { nome } });
  }

  // 2) Condominio e unidade
  let condominio = await prisma.condominio.findFirst({ where: { nome: 'Residencial Aurora' } });
  if (!condominio) {
    condominio = await prisma.condominio.create({
      data: { nome: 'Residencial Aurora', endereco: 'Rua das Flores, 100 - Sao Paulo/SP' },
    });
  }
  const un101 = await prisma.unidade.upsert({
    where: { condominioId_identificacao: { condominioId: condominio.id, identificacao: '101' } },
    update: {},
    create: { condominioId: condominio.id, identificacao: '101', bloco: 'A', numero: '101' },
  });

  // 3) Usuarios e vinculos
  const senhaHash = await bcrypt.hash('Senha@123', 10);
  const sindico = await usuario('Carlos Sindico', 'sindico@aurora.com', senhaHash);
  const moradora = await usuario('Ana Moradora', 'ana@aurora.com', senhaHash, '11999998888');
  const porteiro = await usuario('Jose Porteiro', 'portaria@aurora.com', senhaHash);

  await vincular(sindico.id, condominio.id, 'sindico');
  await vincular(moradora.id, condominio.id, 'morador');
  await vincular(porteiro.id, condominio.id, 'porteiro');

  await prisma.morador.upsert({
    where: { usuarioId_unidadeId: { usuarioId: moradora.id, unidadeId: un101.id } },
    update: {},
    create: { usuarioId: moradora.id, unidadeId: un101.id, tipoVinculo: 'proprietario', principal: true },
  });

  // 4) Areas comuns
  await prisma.areaComum.createMany({
    data: [
      { condominioId: condominio.id, nome: 'Salao de festas', capacidade: 60, regras: 'Silencio apos as 22h' },
      { condominioId: condominio.id, nome: 'Churrasqueira', capacidade: 20 },
    ],
    skipDuplicates: true,
  });

  // 5) Avisos de exemplo (so cria se o condominio ainda nao tiver nenhum)
  const totalAvisos = await prisma.comunicado.count({ where: { condominioId: condominio.id } });
  if (totalAvisos === 0) {
    await prisma.comunicado.createMany({
      data: [
        {
          condominioId: condominio.id,
          autorId: sindico.id,
          titulo: 'Assembleia geral ordinaria',
          conteudo: 'Convocamos todos os condominos para a assembleia no dia 30/11 as 19h, no salao de festas.',
        },
        {
          condominioId: condominio.id,
          autorId: sindico.id,
          titulo: 'Manutencao dos elevadores',
          conteudo: 'Na quinta-feira, das 9h as 12h, os elevadores do Bloco A passarao por manutencao preventiva.',
        },
      ],
    });
  }

  console.log('Seed concluido. Usuarios: sindico@aurora.com, ana@aurora.com, portaria@aurora.com (senha Senha@123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
