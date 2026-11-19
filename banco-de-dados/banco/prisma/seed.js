// ZELUVI - dados de teste (REFERENCIA). Rode com: npx prisma db seed
// Cria o minimo para a demonstracao: perfis, um condominio, unidades, usuarios e areas comuns.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // npm i bcryptjs  (a senha nunca vai em texto puro)

const prisma = new PrismaClient();

async function main() {
  // 1) Perfis (RN01)
  const nomes = ['morador', 'sindico', 'porteiro', 'administrador'];
  for (const nome of nomes) {
    await prisma.perfil.upsert({ where: { nome }, update: {}, create: { nome } });
  }
  const perfil = (nome) => prisma.perfil.findUnique({ where: { nome } });

  // 2) Condominio e unidades
  const condominio = await prisma.condominio.create({
    data: { nome: 'Residencial Aurora', endereco: 'Rua das Flores, 100 - Sao Paulo/SP' },
  });
  const un101 = await prisma.unidade.create({
    data: { condominioId: condominio.id, identificacao: '101', bloco: 'A', numero: '101' },
  });

  // 3) Usuarios (um morador e um sindico) e seus vinculos
  const senhaHash = await bcrypt.hash('Senha@123', 10);
  const sindico = await prisma.usuario.create({
    data: { nome: 'Carlos Sindico', email: 'sindico@aurora.com', senhaHash },
  });
  const moradora = await prisma.usuario.create({
    data: { nome: 'Ana Moradora', email: 'ana@aurora.com', senhaHash, telefone: '11999998888' },
  });
  await prisma.usuarioCondominio.createMany({
    data: [
      { usuarioId: sindico.id, condominioId: condominio.id, perfilId: (await perfil('sindico')).id },
      { usuarioId: moradora.id, condominioId: condominio.id, perfilId: (await perfil('morador')).id },
    ],
  });
  await prisma.morador.create({
    data: { usuarioId: moradora.id, unidadeId: un101.id, tipoVinculo: 'proprietario', principal: true },
  });

  // 4) Areas comuns
  await prisma.areaComum.createMany({
    data: [
      { condominioId: condominio.id, nome: 'Salao de festas', capacidade: 60, regras: 'Silencio apos as 22h' },
      { condominioId: condominio.id, nome: 'Churrasqueira', capacidade: 20 },
    ],
  });

  console.log('Seed concluido.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
