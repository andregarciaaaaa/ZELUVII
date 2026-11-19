// Cliente unico do Prisma (nunca crie outro `new PrismaClient()` fora daqui).
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
