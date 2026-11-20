// Sobe o servidor HTTP
const app = require('./app');
const prisma = require('./config/prisma');
const { port } = require('./config/env');

const servidor = app.listen(port, () => {
  console.log(`ZELUVI API rodando em http://localhost:${port}/api/v1`);
  console.log(`Front-end em http://localhost:${port}`);
});

async function encerrar() {
  servidor.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
