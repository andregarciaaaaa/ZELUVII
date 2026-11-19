# ZELUVI — backend (API + banco)

Express + Prisma + PostgreSQL. Arquitetura em camadas (`docs/05-arquitetura/Arquitetura-Backend.docx`):

```
src/
  config/        env.js, prisma.js (cliente único)
  routes/        uma rota por módulo (+ index.js)
  controllers/   (auth, moradores, unidades)
  services/      regras de negócio  — módulos pequenos ligam o service direto na rota
  repositories/  (auth, moradores)  — só acesso ao banco
  middlewares/   autenticar (JWT + confere o usuário no banco), autorizar(perfil), validar (zod), tratarErros
  validators/    schemas zod
  utils/         AppError, datas (fuso America/Sao_Paulo), dto (banco → JSON), mailer, paginação
prisma/          schema.prisma, migrations/, seed.js
tests/           testes de integração (node:test) contra um PostgreSQL real
scripts/dev-db.js  PostgreSQL local sem instalar nada
```

## Rodar pela primeira vez

Precisa de Node 20+. Nenhum PostgreSQL instalado? Use o embutido (porta 5433):

```bash
cd backend
npm install
cp .env.example .env            # no Windows: copy .env.example .env

# no .env, para usar o banco embutido, deixe assim (porta 5433, senha postgres):
#   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/zeluvi?schema=public"

# janela 1: banco local (deixe aberta)
npm run db:dev

# janela 2:
npx prisma migrate deploy       # cria as 18 tabelas + ajustes v5
npm run db:seed                 # dados de teste (pode repetir)
npm run dev                     # API + front em http://localhost:3000
```

Com um PostgreSQL 16 próprio, crie o banco `zeluvi`, ponha o `DATABASE_URL` no `.env` e pule o `db:dev`
(o `.env` do exemplo usa a porta 5432).

Abra **http://localhost:3000** (o mesmo servidor serve o front da pasta `src/`).

### Contas de teste (senha `123456`, só em desenvolvimento)

| Perfil | E-mail |
|---|---|
| Síndico | `sindico@condominio.com` |
| Morador (Un. 101) | `ana@condominio.com` |
| Morador (Un. 102) | `bruno@condominio.com` |
| Porteiro | `portaria@condominio.com` |

### Recuperar senha / convites

Não há servidor de e-mail no MVP: o link aparece **no terminal da API** (`[e-mail simulado]`).

## Testes

```bash
npm run db:dev      # numa janela (cria também o banco zeluvi_test)
npm test            # 48 testes; cada arquivo recomeça do zero (truncate + seed)
```

## Banco: regras de ouro (do Cauã, mantidas)

- Crie o banco com `npx prisma migrate deploy` (não use `migrate dev` para criar).
- **Nunca edite uma migração já enviada**: altere o `schema.prisma` e crie uma nova (`npx prisma migrate dev --name descricao`).
- Prisma na versão 5.22.0. Nunca envie o `.env` para o GitHub.
- O que o Prisma não descreve (CHECKs, índice parcial, `EXCLUDE` de reservas) vive em SQL dentro das migrações.
- Ver divergências banco × API: `npm run db:diff` (precisa de `DATABASE_URL` no ambiente).

## Rotas (`/api/v1`)

`/auth` (login, me, esqueci-senha, redefinir-senha) · `/dashboard` · `/usuarios` · `/moradores` · `/unidades` ·
`/avisos` · `/areas` (+ `/:id/disponibilidade`) · `/reservas` · `/ocorrencias` · `/encomendas` · `/visitantes` ·
`/cobrancas` · `/despesas` · `/financeiro/resumo` · `/prestadores` · `/faq` · `/saude`.

Erros sempre no formato `{ "erro": { "codigo", "mensagem", "detalhes" } }`. Permissões por perfil:
matriz da especificação de autenticação (cada rota reforça no middleware `autorizar` e, quando é "só os próprios", no service).

Decisões e contradições dos documentos: `docs/08-desenvolvimento/analise-de-coerencia.md`.
