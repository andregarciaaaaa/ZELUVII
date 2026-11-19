# Análise de coerência: banco × especificações × protótipo

Data: 19/11/2026 · Base: branch `banco-de-dados` (Cauã, 41 commits) cruzada com `docs/` da `main`, o Jira (SCRUM-1 a SCRUM-73) e o protótipo `src/`.

Este documento explica **por que** o banco foi ajustado (migração `20261119230000_alinha_banco_com_api`), o que foi decidido sozinho e o que **precisa da decisão do Pedro (PO)**.

---

## 1. Problemas encontrados na entrega do banco

| # | Problema | Gravidade | O que foi feito |
|---|---|---|---|
| 1 | `env.example` e `gitignore` sem o ponto. O README manda copiar `.env.example`, e sem `.gitignore` o `.env` com a senha do banco pode ir para o GitHub. | Alta | Renomeados para `backend/.env.example` e `backend/.gitignore` (inclui `.env`, `node_modules/`, `.pgdata/`). |
| 2 | Migrações entregues em `migrations.zip`. O `prisma migrate deploy` do próprio README exige a **pasta** `prisma/migrations/`. O passo a passo falhava. | Alta | Descompactada em `backend/prisma/migrations/`. |
| 3 | `reserva` só aceitava blocos de **3 h começando às 9h/12h/15h/18h** (CHECK). O exemplo da própria especificação da API (18:00–22:00, 4 h) seria **rejeitado pelo banco**. Os horários também não batem com o protótipo (Manhã 8–13, Tarde 14–18, Noite 18–23). | Alta | Período livre dentro do funcionamento da área + restrição `EXCLUDE` contra sobreposição (veja seção 2). |
| 4 | `ocorrencia` exigia `id_morador`, mas a API diz que **porteiro e síndico também abrem ocorrência**. Faltavam `protocolo`, `categoria`, `local` (história 4.1) e `id_condominio` (isolamento por condomínio). | Alta | `id_autor` (usuário), `id_condominio`, `protocolo` gerado pelo banco (`OC-2026-000001`), `categoria`, `local`; `id_morador` passou a opcional. |
| 5 | `lancamento` tinha `UNIQUE(unidade, tipo, competencia)`: uma unidade **não podia ter duas multas ou taxas extras no mesmo mês**. | Média | A unicidade passou a valer só para `cota_condominial` (índice parcial). Criado campo `descricao`. |
| 6 | `comunicado` sem `expira_em`, `atualizado_em`, `removido_em` (a API de avisos usa os três). | Média | Colunas criadas; remoção é lógica (auditoria). |
| 7 | `encomenda.status = 'retirada'`, mas a história 8.1 e a API dizem **"Entregue"**. | Baixa | Passou a `entregue`. |
| 8 | `visitante` sem `tipo` (visitante/prestador) e sem `observacao`; tinha `documento` e `motivo`, e a API **proíbe coletar documento** (LGPD). | Média | `tipo` e `observacao` criados; `documento` e `motivo` mantidos, mas **não usados**. |
| 9 | Seed não era repetível (criava o condomínio e as unidades de novo a cada execução), não tinha porteiro e usava e-mails/senha diferentes dos cenários de teste da spec (`ana@condominio.com`/`123456`). | Média | Seed idempotente e alinhado aos cenários CT01–CT97. **Recusa rodar em produção.** |
| 10 | Sem índices em chaves estrangeiras (o PostgreSQL não cria sozinho). | Baixa | 15 índices adicionados. |
| 11 | Perfis no banco em minúsculo (`sindico`), na API em MAIÚSCULO (`SINDICO`); `administrador` existe no banco mas não na API. | Baixa | A API converte; `administrador` tem os mesmos direitos de `SINDICO`. |
| 12 | Nenhuma tabela para **avaliação de prestadores com estrelas** (histórias 1.2 e 1.3) nem para aviso de mudança (5.2), mensagens (2.3) e assembleias (7.1). | Informativo | Fora do MVP do banco; registrado como pendência (seção 4). |

Pontos que **estão corretos** e foram mantidos: as 18 tabelas, a nomenclatura (`snake_case`, singular, `id_<tabela>`), o modelo N:N usuário×condomínio (perfil por condomínio, RN01), os CHECKs de status (RN08, finanças), o formato "atrasado = pendente com vencimento passado" e o token de redefinição só com hash.

> Correção de um alarme anterior: os PDFs `SCRUM-50…pdf` e `Dicionario-de-Dados-v2.pdf` **são PDFs válidos** (gerados por ReportLab); o git só os trata como texto.

---

## 2. Contradições entre os documentos

| Tema | Documento A | Documento B | Decisão tomada no código |
|---|---|---|---|
| Prefixo e formato de erro | Autenticação/Arquitetura-Backend (v1, no repo): `/api/v1`, `{ erro: { codigo, mensagem, detalhes } }` | APIs de 10/11: `/v1`, RFC 9457 (`application/problem+json`), `accessToken`/refresh; citam "Autenticação v2.0" e "Arquitetura v2.0", **que não estão no repositório nem no Confluence** | Seguiu-se o que está no repo (v1): `/api/v1` e `{ erro: … }`. **André: se as v2.0 existem, envie para o repositório.** |
| Stack | Arquitetura-Backend (SCRUM-47): Express + Prisma + zod + JS | Definição Arquitetural: NestJS + TypeScript + Redis + AWS | Express + Prisma + zod, como no documento de implementação. |
| Aprovação de reserva | Fase 2 (RN06) e história 3.2: **confirmação automática** | História 3.3 e System Design: síndico **aprova**; README do Cauã diz que a RN06 "atualizada" exige aprovação; o protótipo mostra "Aguardando aprovação" | Campo `exige_aprovacao` por área (**a própria proposta da spec de áreas**). Padrão `false` = automática. O salão e a churrasqueira são automáticos; o elevador de serviço exige aprovação. |
| Horários de reserva | API: período livre dentro do funcionamento | Banco: blocos fixos de 3 h; protótipo: 3 períodos | Período livre (API) + bloqueio de sobreposição no banco. |
| Status de ocorrência | Fase 2 (RN08), UC07 e banco: **5** (Solicitada, Em andamento, Aguardando terceiro, Resolvida, Cancelada) | API de ocorrências: **3** (ABERTA, EM_ANDAMENTO, RESOLVIDA); protótipo: 7 | Os 5 da RN08. A API aceita `ABERTA` como apelido de `SOLICITADA`. |
| Quem atualiza ocorrência | História 4.3: síndico, administração **e porteiro** | Matriz de permissões e RN09: só administrativo | Só o síndico (a spec de portaria já adota isso). |
| Porteiro lista unidades | Matriz: unidades só para o síndico | O porteiro precisa escolher a unidade ao registrar encomenda/visitante | `GET /unidades` liberado também para o porteiro (somente leitura). |
| Exemplo "10:00–19:00" na spec de reservas (seção 4.2) | Dá 409 | A própria spec limita o salão a 6 h (CT53) | Na prática a regra de duração (400) vem antes do conflito (409). Sugestão: trocar o exemplo por 12:00–18:00. |
| `/avisos` × `/comunicados` | Definição Arquitetural | APIs v2.0 | `/avisos` (tabela `comunicado`). |
| Identidade | Login devolve `usuario.id`; `/moradores` devolve "id do morador" | — | O `id` do morador na API **é o id do usuário** (um só número em login, moradores, reservas e ocorrências). |
| `usuario.perfil` único × vínculo por condomínio | API: "cada usuário tem exatamente um perfil" | Banco: perfil por (usuário, condomínio) | Compatível no MVP (um condomínio por usuário); o token carrega `condominioId`. |

---

## 3. Pendências de decisão do PO (Pedro)

1. **Aprovação de reservas:** confirmar o padrão (automática, com `exige_aprovacao` por área) — hoje já funciona dos dois jeitos.
2. **Limite de reservas por unidade** (ex.: 2 futuras por área) e **prazo mínimo para cancelar** — hoje não há limite; o morador cancela até o início.
3. **Validade dos tokens:** 8 h (login), 30 min (recuperação), 48 h (convite), senha com 8+ caracteres, letra e número — implementado como propostas.
4. **Porteiro e ocorrências** (4.3 e "relevantes pela portaria") — segue a matriz.
5. **Financeiro:** a API (SCRUM-68) ainda está em análise; as rotas `/cobrancas`, `/despesas`, `/financeiro/resumo` são **provisórias**.

## 4. Fora do escopo desta entrega (registrado para a próxima)

- Eventos em tempo real (WebSocket/push, fila SQS): os pontos de gancho estão marcados com `TODO (integracao)` nos services.
- Envio real de e-mail: em desenvolvimento o link aparece no log do servidor.
- Refresh token, bloqueio por tentativas, logout no servidor (a própria spec manda para depois).
- Avaliação de prestadores com estrelas, aviso de mudança, mensagens com a portaria, assembleia digital.
- App mobile e módulos de demonstração do protótipo (Copiloto IA, Digital Twin, Anel de Zelo): mantidos como demonstração.

## 5. O que foi construído

- **Banco:** 2 migrações Prisma (a `init` do Cauã intacta + a v5), `schema.sql` v5 atualizado, seed idempotente.
- **Backend** (`backend/`): Express + Prisma + zod, camadas rota → controller/service → banco, 14 módulos, 48 testes automatizados (cenários CT01–CT97 da QA, incluindo o pedido simultâneo de reserva).
- **Front** (`src/`): o protótipo passou a falar com a API (login real, token, todas as telas por perfil); o que não tem API segue como demonstração, com selo.
- Como rodar: `backend/README.md`.
