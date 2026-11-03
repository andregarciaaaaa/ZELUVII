# Especificação da API de Autenticação

Nov 2, 2026 · @André

## 1. Objetivo e escopo

Este documento define como o usuário entra no sistema, como a API reconhece quem ele é em cada requisição e o que cada perfil pode acessar. É o contrato entre back-end, front-end e QA para a implementação do login.

**Cobre:** o endpoint `POST /auth/login`, o endpoint `GET /auth/me`, a regra de autenticação com JWT e a matriz de permissões por perfil.

**Critérios de aceitação da tarefa** (verificados na seção 8):

- [ ] Login válido devolve o token e os dados do usuário (200)
- [ ] Senha errada devolve 401
- [ ] Acesso sem permissão devolve 403

## 2. Convenções gerais

Todas as rotas seguem as mesmas regras, então elas não são repetidas em cada endpoint.

| Item | Regra |
| --- | --- |
| URL base | `/api/v1` (ex.: `/api/v1/auth/login`) |
| Formato | Corpo da requisição e da resposta em JSON (`Content-Type: application/json`) |
| Envio do token | Cabeçalho `Authorization: Bearer <token>` em toda rota protegida |
| Validade do token | 8 horas a partir do login |
| Conteúdo do token | `sub` (id do usuário), `perfil`, `iat` (criado em), `exp` (vence em) |
| Senhas | Guardadas apenas como hash bcrypt; nunca aparecem em respostas |

**Formato padrão de erro** — toda resposta de erro da API tem esta forma:

```json
{
  "erro": {
    "codigo": "NAO_AUTENTICADO",
    "mensagem": "E-mail ou senha inválidos.",
    "detalhes": []
  }
}
```

- `codigo`: valor fixo, usado pelo front para decidir o que fazer
- `mensagem`: texto para mostrar ao usuário
- `detalhes`: opcional; lista `{ campo, mensagem }` usada em erros de validação (400)

| Status | Código | Quando |
| --- | --- | --- |
| 400 | `VALIDACAO` | Dados ausentes ou mal formatados |
| 401 | `NAO_AUTENTICADO` | Login incorreto, ou token ausente, inválido ou vencido |
| 403 | `SEM_PERMISSAO` | Usuário logado, mas o perfil não tem acesso à ação |
| 404 | `NAO_ENCONTRADO` | Recurso não existe |
| 500 | `ERRO_INTERNO` | Falha inesperada; o detalhe técnico fica só no log do servidor |

## 3. Perfis de usuário

Cada usuário tem exatamente um perfil, gravado no cadastro e copiado para o token no login.

| Perfil | Quem é | Resumo do acesso |
| --- | --- | --- |
| `SINDICO` | Administrador do condomínio | Acesso total: cadastra, publica, aprova e consulta tudo |
| `MORADOR` | Residente de uma unidade | Consulta o que é do condomínio e gerencia apenas o que é seu (reservas, ocorrências) |
| `PORTEIRO` | Funcionário da portaria | Consulta avisos e reservas; registra visitantes e encomendas |

O perfil não pode ser alterado pelo próprio usuário. Se o token for adulterado para trocar o perfil, a assinatura deixa de bater e a requisição recebe 401.

## 4. POST /auth/login

Troca e-mail e senha por um token JWT válido por 8 horas. É a única rota de autenticação pública (não exige token).

| Item | Valor |
| --- | --- |
| Método | `POST` |
| Rota | `/api/v1/auth/login` |
| Acesso | Público |
| Cabeçalhos | `Content-Type: application/json` |

### Dados de entrada

```json
{
  "email": "ana@condominio.com",
  "senha": "123456"
}
```

| Campo | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- |
| `email` | texto | Sim | Formato de e-mail válido |
| `senha` | texto | Sim | Não pode ser vazia |

### Resposta de sucesso — 200 OK

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 2,
    "nome": "Moradora Ana",
    "email": "ana@condominio.com",
    "perfil": "MORADOR",
    "unidade": "101-A"
  }
}
```

- `token`: enviado pelo front no cabeçalho `Authorization` das próximas requisições
- `usuario`: dados para montar a tela; **nunca** inclui a senha nem o hash
- `unidade`: presente apenas para o perfil `MORADOR`

### Erros

| Status | Código | Quando | Mensagem |
| --- | --- | --- | --- |
| 400 | `VALIDACAO` | E-mail ausente ou inválido, senha vazia, ou JSON mal formatado | "Dados inválidos." + `detalhes` por campo |
| 401 | `NAO_AUTENTICADO` | E-mail não cadastrado **ou** senha errada | "E-mail ou senha inválidos." |
| 500 | `ERRO_INTERNO` | Falha inesperada no servidor | "Erro interno no servidor." |

Exemplo de 400:

```json
{
  "erro": {
    "codigo": "VALIDACAO",
    "mensagem": "Dados inválidos.",
    "detalhes": [
      { "campo": "email", "mensagem": "E-mail inválido." },
      { "campo": "senha", "mensagem": "Senha é obrigatória." }
    ]
  }
}
```

Exemplo de 401:

```json
{
  "erro": {
    "codigo": "NAO_AUTENTICADO",
    "mensagem": "E-mail ou senha inválidos."
  }
}
```

**Regra de segurança:** e-mail inexistente e senha errada devolvem a mesma mensagem. Assim ninguém descobre quais e-mails estão cadastrados.

## 5. GET /auth/me

Devolve os dados do usuário dono do token. O front usa ao abrir a página para saber se o token guardado ainda vale e quem está logado.

| Item | Valor |
| --- | --- |
| Método | `GET` |
| Rota | `/api/v1/auth/me` |
| Acesso | Qualquer usuário logado (os 3 perfis) |
| Cabeçalhos | `Authorization: Bearer <token>` |
| Dados de entrada | Nenhum corpo; o usuário vem do token |

### Resposta de sucesso — 200 OK

```json
{
  "id": 2,
  "nome": "Moradora Ana",
  "email": "ana@condominio.com",
  "perfil": "MORADOR",
  "unidade": "101-A"
}
```

### Erros

| Status | Código | Quando | Mensagem |
| --- | --- | --- | --- |
| 401 | `NAO_AUTENTICADO` | Cabeçalho `Authorization` ausente | "Token não enviado." |
| 401 | `NAO_AUTENTICADO` | Token com assinatura inválida, adulterado ou vencido | "Token inválido ou expirado." |
| 404 | `NAO_ENCONTRADO` | Token válido, mas o usuário foi removido do sistema | "Usuário não encontrado." |

Quando receber 401, o front apaga o token guardado e volta para a tela de login.

## 6. Como as rotas protegidas são verificadas

Toda rota, exceto o login, exige token. A API faz as checagens sempre nesta ordem e para na primeira que falhar.

&#91;embedded content: verificação de uma rota protegida · 4 checagens\]

A primeira falha decide a resposta: problema com o token dá 401; token certo, mas sem direito à ação, dá 403.

|  | 401 NAO\_AUTENTICADO | 403 SEM\_PERMISSAO |
| --- | --- | --- |
| O que significa | "Não sei quem você é" | "Sei quem você é, mas você não pode fazer isso" |
| Causa | Sem token, token adulterado ou vencido, login incorreto | Perfil não autorizado ou registro de outro usuário |
| O que o front faz | Apaga o token e leva para o login | Mantém o login e mostra a mensagem |

## 7. Matriz de permissões por perfil

O síndico acessa tudo; o morador só altera o que é dele; o porteiro só consulta e registra a portaria. "Próprios" significa registros ligados ao `id` do token, que a API confere no service. Qualquer "Não" devolve **403 SEM\_PERMISSAO**.

| Módulo | Ação | Rota | SINDICO | MORADOR | PORTEIRO |
| --- | --- | --- | --- | --- | --- |
| Autenticação | Fazer login | `POST /auth/login` | Sim (pública) | Sim (pública) | Sim (pública) |
| Autenticação | Ver o próprio usuário | `GET /auth/me` | Sim | Sim | Sim |
| Avisos | Listar avisos | `GET /avisos` | Sim | Sim | Sim |
| Avisos | Publicar, editar, remover | `POST/PUT/DELETE /avisos` | Sim | Não | Não |
| Reservas | Listar reservas | `GET /reservas` | Sim | Sim | Sim |
| Reservas | Criar reserva | `POST /reservas` | Sim | Sim | Não |
| Reservas | Cancelar reserva | `DELETE /reservas/:id` | Sim (qualquer) | Só as próprias | Não |
| Unidades e moradores | Consultar | `GET /unidades`, `GET /moradores` | Sim | Só a própria unidade | Sim (nome e unidade) |
| Unidades e moradores | Cadastrar, editar, remover | `POST/PUT/DELETE /unidades`, `/moradores` | Sim | Não | Não |
| Ocorrências | Abrir ocorrência | `POST /ocorrencias` | Sim | Sim | Sim |
| Ocorrências | Listar | `GET /ocorrencias` | Sim (todas) | Só as próprias | Só as próprias |
| Ocorrências | Mudar status | `PATCH /ocorrencias/:id` | Sim | Não | Não |
| Usuários | Criar usuário e definir perfil | `POST /usuarios` | Sim | Não | Não |

Módulos depois do MVP, já com a regra definida para quando entrarem:

| Módulo | SINDICO | MORADOR | PORTEIRO |
| --- | --- | --- | --- |
| Cobranças | Lança e consulta todas | Consulta só as próprias | Não |
| Portaria (visitantes, encomendas) | Consulta todos | Consulta só os da própria unidade | Registra e consulta |

**Duas camadas de checagem:**

1. **Por perfil** (middleware `autorizar`): bloqueia a rota inteira. Ex.: morador em `POST /avisos` → 403.
2. **Por dono** (no service): o perfil pode usar a rota, mas só nos seus registros. Ex.: morador cancelando a reserva de outra pessoa → 403.

## 8. Cenários de teste

Os três primeiros cenários são os critérios de aceitação da tarefa; os outros cobrem os demais caminhos de erro. Usuários de teste com senha `123456`: `sindico@condominio.com`, `ana@condominio.com` (morador), `portaria@condominio.com`.

| # | Cenário | Requisição | Resultado esperado | Critério |
| --- | --- | --- | --- | --- |
| CT01 | Login válido | `POST /auth/login` com `ana@condominio.com` / `123456` | 200 + `token` + `usuario` com perfil `MORADOR` e sem senha | Login válido |
| CT02 | Senha errada | `POST /auth/login` com `ana@condominio.com` / `errada` | 401 `NAO_AUTENTICADO`, "E-mail ou senha inválidos." | Senha errada (401) |
| CT03 | Acesso sem permissão | Logado como morador, `POST /avisos` | 403 `SEM_PERMISSAO` | Sem permissão (403) |
| CT04 | E-mail não cadastrado | `POST /auth/login` com `naoexiste@condominio.com` | 401 com a **mesma** mensagem do CT02 | — |
| CT05 | Campos vazios | `POST /auth/login` com corpo `{}` | 400 `VALIDACAO` com `detalhes` de `email` e `senha` | — |
| CT06 | Sem token | `GET /auth/me` sem `Authorization` | 401, "Token não enviado." | — |
| CT07 | Token adulterado | `GET /auth/me` com o perfil trocado dentro do token | 401, "Token inválido ou expirado." | — |
| CT08 | Token vencido | `GET /auth/me` com token de mais de 8 horas | 401, "Token inválido ou expirado." | — |
| CT09 | Perfil permitido | Logado como síndico, `POST /avisos` | 201 + aviso criado | — |
| CT10 | Registro de outra pessoa | Morador cancela reserva criada por outro morador | 403 `SEM_PERMISSAO` | — |

## 9. Fora do escopo e decisões pendentes

**Fora do escopo desta versão** (ficam para sprints futuras):

- Refresh token: ao vencer, o usuário faz login de novo
- Recuperação de senha por e-mail
- Logout no servidor: o "Sair" apenas apaga o token no navegador
- Bloqueio após várias tentativas de login erradas
- Cadastro público: usuários são criados pelo síndico

**Decisões pendentes:**

- [ ] Pedro (PO): confirmar a validade do token (proposta: 8 horas)
- [ ] Pedro (PO): validar a matriz de permissões da seção 7
- [ ] Vinicius (front): confirmar o tratamento de 401 e 403 nas telas
- [ ] Danilo (QA): transformar a seção 8 em casos de teste no Jira
