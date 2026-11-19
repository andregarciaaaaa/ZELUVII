const env = require('./config/env');
const prisma = require('./config/prisma');
const app = require('./app');

const servidor = app.listen(env.porta, () => {
  console.log(`ZELUVI API em http://localhost:${env.porta}/api/v1  (saude: /api/v1/saude)`);
  console.log(`Front servido em http://localhost:${env.porta}/`);
});

async function encerrar() {
  servidor.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
