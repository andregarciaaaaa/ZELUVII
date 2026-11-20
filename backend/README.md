# Back-end ZELUVI

API do sistema de gestão condominial. Segue o documento **Arquitetura do Back-end** (`docs/05-arquitetura/Arquitetura-Backend.docx`):

```
Rota → Middlewares → Controller → Service → Repository → Prisma → PostgreSQL
```

- **Stack:** Node.js 18+, Express 4, Prisma 5.22.0, PostgreSQL 16, zod, JWT, bcrypt
- **Responsável:** André Lucas Salvalagio Garcia (back-end)
- **Banco:** schema e migração inicial da branch `banco-de-dados` (Cauã Henrique)

## CRUD entregue na Fase 5: Avisos

Integração completa banco → back-end → front-end (tela **Comunicados/Avisos**).

| Método | Rota | Acesso | Resposta |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Pública | 200 `{ token, usuario }` |
| GET | `/api/v1/auth/me` | Logado | 200 usuário do token |
| GET | `/api/v1/avisos` | Logado (síndico vê expirados com `?incluirExpirados=true`) | 200 `{ dados, proximoCursor }` |
| GET | `/api/v1/avisos/:id` | Logado | 200 aviso |
| POST | `/api/v1/avisos` | SINDICO | 201 aviso |
| PATCH | `/api/v1/avisos/:id` | SINDICO | 200 aviso |
| DELETE | `/api/v1/avisos/:id` | SINDICO | 204 (exclusão lógica) |

Regras implementadas (spec *API de Avisos, Ocorrências e Portaria v1.0*, seção 3):

- autor e condomínio vêm do token, nunca do corpo; campos extras no corpo dão 400;
- tudo é restrito ao condomínio do usuário (aviso de outro condomínio responde 404);
- morador e porteiro só veem avisos vigentes (`expiraEm` vazio ou no futuro);
- editar preenche `atualizadoEm`; remover grava `removido_em` e o aviso some da lista;
- erros no formato único `{ "erro": { "codigo", "mensagem", "detalhes" } }`.

## Como rodar

Pré-requisitos: **Node.js LTS** e **PostgreSQL 16**.

1. Crie um banco vazio chamado `zeluvi` (pgAdmin, DBeaver ou `createdb zeluvi`).
2. Na pasta `backend`, copie o `.env.example` para `.env` e coloque a senha do seu PostgreSQL.
3. Instale e prepare o banco:
   ```
   npm install
   npm run db:setup
   ```
   (`db:setup` = `prisma migrate deploy` + `prisma db seed`)
4. Suba a API:
   ```
   npm run dev
   ```
5. Abra **http://localhost:3333**: o próprio back-end serve o front (`src/`).

Usuários de teste (senha `Senha@123`):

| E-mail | Perfil |
|---|---|
| sindico@aurora.com | SINDICO (pode criar, editar e remover avisos) |
| ana@aurora.com | MORADOR (só lê) |
| portaria@aurora.com | PORTEIRO (só lê) |

Para testar as rotas sem o front, use o arquivo `requests.http` (extensão *REST Client* do VS Code) ou o Postman/Insomnia.

## Estrutura

```
backend/
├── prisma/
│   ├── schema.prisma          # modelo das 18 tabelas (branch banco-de-dados) + campos de aviso
│   ├── migrations/            # init (Cauã) + avisos_expiracao_edicao_remocao
│   └── seed.js                # dados de teste (pode rodar mais de uma vez)
├── src/
│   ├── config/                # env.js, prisma.js
│   ├── routes/                # index.js, auth.routes.js, aviso.routes.js
│   ├── controllers/           # auth.controller.js, aviso.controller.js
│   ├── services/              # auth.service.js, aviso.service.js
│   ├── repositories/          # auth.repository.js, aviso.repository.js
│   ├── middlewares/           # autenticar, autorizar, validar, tratarErros
│   ├── validators/            # auth.schema.js, aviso.schema.js (zod)
│   ├── utils/                 # AppError.js, capturar.js
│   ├── app.js
│   └── server.js
├── .env.example
├── requests.http
└── package.json
```

## Regras do banco

- Use `npm run db:migrate` (`prisma migrate deploy`). Não edite uma migração já enviada: crie uma nova.
- As regras CHECK e o índice parcial `reserva_sem_duplicidade` ficam só no SQL da migração (o Prisma não descreve isso no `schema.prisma`). Antes de rodar `prisma migrate dev`, confira o SQL gerado para ele não remover essas regras.
- Nunca envie o `.env` para o GitHub.
