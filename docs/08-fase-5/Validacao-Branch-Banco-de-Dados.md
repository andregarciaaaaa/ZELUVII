# Validação da branch `banco-de-dados`

Data: 19/11/2026 · Fase 5 (Protótipo e CRUD inicial) · Revisado por: André Lucas Salvalagio Garcia (back-end)

## Resumo

A **modelagem** está boa: as 18 tabelas, as chaves, os CHECKs e o índice que impede reserva duplicada batem com o DER e o dicionário de dados. Os problemas estão na **forma como a branch foi entregue** (organização, arquivos que não funcionam, padrão de Git) e em **diferenças entre o banco e as especificações da API**.

Com o banco do jeito que está na branch, o passo a passo do próprio README falha no passo 3 (`npx prisma migrate deploy`), porque a migração está dentro de um `.zip`.

## 1. Conformidade de repositório (critério da Fase 5)

| # | Problema | Onde | Gravidade |
|---|---|---|---|
| 1.1 | Nome da branch fora do padrão `#ID - funcionalidade` (o mesmo vale para `back-end` e `documentação-OP`, que ainda tem acento) | branches | Alta |
| 1.2 | Commits sem descrição ("Add files via upload", "Update ...") feitos pelo upload do GitHub, não micro-commits | histórico | Alta |
| 1.3 | Branch desatualizada: está 7 commits atrás do `main` e ainda mostra a estrutura antiga (`zeluvi/`, `sprint  4/`, `Atividade Cassiano/`). O merge com o `main` não tem conflito e só acrescenta a pasta `banco-de-dados/`, mas a branch precisa ser atualizada antes | raiz da branch | Média |
| 1.4 | Nenhum merge `--no-ff` da branch no `main` | histórico | Média |
| 1.5 | A branch `back-end` é idêntica ao `main` (commit 5f1bc6c): não existe nenhum código de back-end no repositório | branch `back-end` | Alta |

## 2. Arquivos que não funcionam

| # | Problema | Efeito |
|---|---|---|
| 2.1 | `prisma/migrations.zip`: migração compactada | `prisma migrate deploy` não encontra migração nenhuma; o banco não é criado |
| 2.2 | `gitignore` e `env.example` sem o ponto inicial | o `.gitignore` não é aplicado (risco de enviar `node_modules` e `.env`); o README manda copiar `.env.example`, que não existe |
| 2.3 | `package.json` do back-end dentro de `banco-de-dados/banco/` | contraria a Arquitetura do Back-end (prisma fica em `backend/prisma/`) |
| 2.4 | O SQL da migração cita um `PASSO_A_PASSO.md` que não existe | instrução quebrada |
| 2.5 | `readme.md` lista `DER/SCRUM-46-DER.png` (não existe) e nomes de PDF diferentes dos arquivos reais | documentação desatualizada |
| 2.6 | `DER/leiame.md` contém só "todos os ders" | sem conteúdo |
| 2.7 | Duas fontes da verdade: `schema.sql` e a migração do Prisma | risco de as duas divergirem com o tempo |
| 2.8 | `seed.js` usa `create` para condomínio e usuários | rodar o seed duas vezes dá erro (e-mail único); não cria porteiro |
| 2.9 | CHECKs e o índice parcial `reserva_sem_duplicidade` existem só no SQL, não no `schema.prisma` | um `prisma migrate dev` futuro pode gerar SQL que remove o índice; conferir sempre o SQL gerado |

## 3. Banco x especificações da API

| # | Especificação | Banco na branch | Situação |
|---|---|---|---|
| 3.1 | Avisos têm `expiraEm`, `atualizadoEm` e remoção guardada para auditoria | `comunicado` não tem essas colunas | **Corrigido** na migração `20261119230000_avisos_expiracao_edicao_remocao` |
| 3.2 | Ocorrência: status `ABERTA`, `EM_ANDAMENTO`, `RESOLVIDA` | `solicitada`, `em_andamento`, `aguardando_terceiro`, `resolvida`, `cancelada` | Pendente: o grupo precisa decidir qual documento vale |
| 3.3 | Ocorrência tem `protocolo`, `categoria` e `local` | colunas não existem | Pendente |
| 3.4 | Síndico e porteiro também abrem ocorrência | `ocorrencia.id_morador` é obrigatório: só morador consegue abrir | Pendente (trocar por `id_usuario` + `id_unidade` opcional) |
| 3.5 | Encomenda: status `ENTREGUE` | `retirada` | Pendente (ajuste de nome na API ou no banco) |
| 3.6 | Perfis `SINDICO`, `MORADOR`, `PORTEIRO` | `sindico`, `morador`, `porteiro`, `administrador` | Resolvido no back-end (conversão; administrador = síndico) |

Também há divergência entre documentos: a spec de Avisos usa URL `/v1` e erro RFC 9457, enquanto a Arquitetura e a spec de Autenticação usam `/api/v1` e `{ "erro": { ... } }`. O back-end seguiu `/api/v1` e `{ "erro" }`, que aparecem em dois documentos.

## 4. O que foi feito para a entrega

- Pasta `backend/` criada conforme a Arquitetura do Back-end, reaproveitando o `schema.prisma` e a migração do Cauã (descompactada, sem alterações).
- Migração nova para os campos de aviso (item 3.1). A migração antiga não foi editada.
- Seed reescrito para poder rodar várias vezes e incluir porteiro e avisos.
- CRUD de Avisos + login JWT, integrados à tela Comunicados do front (`src/js/app.js`).

## 5. Recomendações ao grupo

1. Recriar a branch de banco a partir do `main` atual, com nome no padrão (ex.: `SCRUM-67-banco-de-dados`) e commits pequenos pela linha de comando ou GitHub Desktop.
2. Manter só uma fonte da verdade do banco: a pasta `backend/prisma/` (o `schema.sql` vira referência ou é removido).
3. Resolver os itens 3.2 a 3.5 antes de implementar os módulos de Ocorrências e Portaria.
