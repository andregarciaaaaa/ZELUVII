// Sobe um PostgreSQL local de desenvolvimento SEM precisar instalar nada nem usar Docker.
// Uso: npm run db:dev   (deixe esta janela aberta; Ctrl+C para parar)
// Dados ficam em backend/.pgdata (ignorado pelo Git). Porta 5433 para nao colidir com um Postgres instalado.
const path = require('path');
const fs = require('fs');
const EmbeddedPostgres = require('embedded-postgres').default;

const PORT = Number(process.env.PGPORT || 5433);
const DIR = path.join(__dirname, '..', '.pgdata');
const BANCOS = ['zeluvi', 'zeluvi_test'];

async function main() {
  const jaExiste = fs.existsSync(path.join(DIR, 'PG_VERSION'));
  const pg = new EmbeddedPostgres({
    databaseDir: DIR,
    user: 'postgres',
    password: 'postgres',
    port: PORT,
    persistent: true,
    onLog: () => {},
    onError: (e) => console.error(String(e)),
  });
  if (!jaExiste) await pg.initialise();
  await pg.start();
  for (const nome of BANCOS) {
    try { await pg.createDatabase(nome); } catch (e) { /* ja existe */ }
  }
  console.log(`PostgreSQL pronto em localhost:${PORT} (bancos: ${BANCOS.join(', ')}). Ctrl+C para parar.`);
  console.log(`DATABASE_URL="postgresql://postgres:postgres@localhost:${PORT}/zeluvi?schema=public"`);

  const parar = async () => { await pg.stop(); process.exit(0); };
  process.on('SIGINT', parar);
  process.on('SIGTERM', parar);
  setInterval(() => {}, 1 << 30);
}

main().catch((e) => { console.error(e); process.exit(1); });
