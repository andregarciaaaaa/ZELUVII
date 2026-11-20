// Cliente unico do Prisma para toda a aplicacao (Arquitetura do Back-end, 1.1)
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
