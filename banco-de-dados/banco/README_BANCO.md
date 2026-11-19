# Banco de dados do backend (Prisma + PostgreSQL)

Responsavel: Caua Henrique (Banco de Dados)

O banco tem 18 tabelas (veja o DER e o dicionario de dados em `banco-de-dados/`).
Cada pessoa cria o proprio banco local a partir da migracao que esta neste repositorio.

## O que voce precisa instalar

- PostgreSQL 16 (guarde a senha do usuario `postgres`)
- Node.js (versao LTS)
- Um programa para ver o banco, como o DBeaver (opcional)

## Como criar o banco na sua maquina

1. Crie um banco vazio chamado `zeluvi` (no DBeaver: botao direito em "Bancos de dados" > "Criar novo banco de dados").
2. Na pasta do backend, copie `.env.example` para `.env` e coloque a sua senha do PostgreSQL:
   ```
   DATABASE_URL="postgresql://postgres:SUASENHA@localhost:5432/zeluvi?schema=public"
   ```
   Se a senha tiver `@`, `#` ou `/`, troque por `%40`, `%23` ou `%2F`.
3. Instale as dependencias e crie as tabelas:
   ```
   npm install
   npx prisma migrate deploy
   ```
4. Crie os dados de teste:
   ```
   npx prisma db seed
   ```
5. Confira no DBeaver (F5 no banco): devem existir 18 tabelas, mais a `_prisma_migrations`.

Usuarios de teste (senha `Senha@123`): `ana@aurora.com` (moradora) e `sindico@aurora.com`.

## Regras importantes

- Nao use `migrate dev` nem `--create-only` para criar o banco: use `migrate deploy`. Assim todos recebem a mesma migracao.
- Nao edite uma migracao que ja foi enviada. Se for preciso mudar o banco, altere o `schema.prisma` e crie uma NOVA migracao:
  `npx prisma migrate dev --name descricao-da-mudanca`. Depois envie a pasta nova da migracao.
- Use o Prisma na versao 5.22.0 (as versoes mais novas configuram a conexao de outro jeito).
- Nunca envie o `.env` para o GitHub.

## Regras que o proprio banco garante

- Reserva: horarios fixos de 3 horas (9h, 12h, 15h, 18h) e nao existem duas reservas pendentes ou confirmadas na mesma area e no mesmo horario.
- Status so aceitam os valores permitidos (reserva, encomenda, ocorrencia, taxas e despesas).
- Valores financeiros maiores que zero; pago exige data de pagamento.

## Estrutura

```
prisma/
  schema.prisma        modelo das 18 tabelas
  migrations/          criacao das tabelas e das regras (nao editar as antigas)
  seed.js              dados de teste
.env.example           modelo da conexao
```
