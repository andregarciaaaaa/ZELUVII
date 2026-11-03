# Especificação da API de Recuperação de Senha e Moradores

Nov 2, 2026 · @André

## 1. Objetivo e escopo

Este documento define como um usuário recupera a senha esquecida e como o síndico cadastra, edita e lista moradores. Ele complementa a *Especificação da API de Autenticação* e usa as mesmas convenções.

**Cobre:**

- Recuperação de senha: `POST /auth/esqueci-senha` e `POST /auth/redefinir-senha`, com token de validade
- Moradores: `GET /moradores`, `GET /moradores/:id`, `POST /moradores` e `PATCH /moradores/:id`, todos só para o síndico

**Critério de aceitação** (verificado na seção 10):

- [ ] As regras de quem pode acessar cada rota estão descritas

## 2. Convenções

Valem as mesmas regras da especificação de autenticação: URL base `/api/v1`, JSON, token no cabeçalho `Authorization: Bearer <token>` e o formato padrão de erro `{ "erro": { codigo, mensagem, detalhes } }`.

Códigos de erro usados neste documento:

| Status | Código | Quando | Novo? |
| --- | --- | --- | --- |
| 400 | `VALIDACAO` | Dados ausentes ou mal formatados | Não |
| 400 | `TOKEN_REDEFINICAO_INVALIDO` | Token de redefinição inexistente, vencido ou já usado | **Sim** |
| 401 | `NAO_AUTENTICADO` | Sem token de login, ou token de login inválido/vencido | Não |
| 403 | `SEM_PERMISSAO` | Usuário logado, mas não é síndico | Não |
| 404 | `NAO_ENCONTRADO` | Morador ou unidade não existe | Não |
| 409 | `CONFLITO` | E-mail já cadastrado para outro usuário | Não |
| 429 | `MUITAS_TENTATIVAS` | Pedidos de recuperação demais em pouco tempo | **Sim** |

**Dois tokens diferentes, não confundir:**

- **Token de login (JWT):** prova quem está logado, vale 8 horas, vai no cabeçalho `Authorization`.
- **Token de redefinição:** código aleatório enviado por e-mail, vale 30 minutos e serve só para trocar a senha uma vez. Vai no corpo da requisição.

## 3. Fluxo de recuperação de senha

A recuperação acontece em duas etapas: o usuário pede o link e, depois, usa o link para criar a senha nova.

&#91;embedded content: recuperação de senha · 2 etapas\]

Na etapa 1, a resposta é igual exista o e-mail ou não; só a etapa 2 confere o token e troca a senha.

## 4. POST /auth/esqueci-senha

Recebe um e-mail e, se ele estiver cadastrado, envia um link com o token de redefinição. A resposta é sempre a mesma, exista o e-mail ou não.

| Item | Valor |
| --- | --- |
| Método | `POST` |
| Rota | `/api/v1/auth/esqueci-senha` |
| Acesso | Público (quem esqueceu a senha não está logado) |
| Cabeçalhos | `Content-Type: application/json` |

### Dados de entrada

```json
{
  "email": "ana@condominio.com"
}
```

| Campo | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- |
| `email` | texto | Sim | Formato de e-mail válido |

### Resposta de sucesso — 200 OK

```json
{
  "mensagem": "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha."
}
```

O e-mail enviado contém um link no formato `<endereço do sistema>/redefinir-senha?token=<token>`, válido por 30 minutos.

### Erros

| Status | Código | Quando | Mensagem |
| --- | --- | --- | --- |
| 400 | `VALIDACAO` | E-mail ausente ou mal formatado | "Dados inválidos." + `detalhes` |
| 429 | `MUITAS_TENTATIVAS` | Mais de 3 pedidos para o mesmo e-mail em 1 hora | "Muitas tentativas. Tente novamente mais tarde." |
| 500 | `ERRO_INTERNO` | Falha inesperada no servidor | "Erro interno no servidor." |

**Por que a mesma resposta?** Se a API dissesse "e-mail não encontrado", qualquer pessoa conseguiria descobrir quais e-mails têm conta no sistema. Uma falha no envio do e-mail fica só no log e não muda a resposta.

## 5. POST /auth/redefinir-senha

Recebe o token do e-mail e a senha nova. Se o token for válido, troca a senha e inutiliza o token.

| Item | Valor |
| --- | --- |
| Método | `POST` |
| Rota | `/api/v1/auth/redefinir-senha` |
| Acesso | Público, mas exige um token de redefinição válido no corpo |
| Cabeçalhos | `Content-Type: application/json` |

### Dados de entrada

```json
{
  "token": "9f2c4e7a1b...",
  "novaSenha": "MinhaSenha2026",
  "confirmacaoSenha": "MinhaSenha2026"
}
```

| Campo | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- |
| `token` | texto | Sim | O código recebido no link do e-mail |
| `novaSenha` | texto | Sim | Mínimo de 8 caracteres, com pelo menos 1 letra e 1 número |
| `confirmacaoSenha` | texto | Sim | Igual a `novaSenha` |

### Resposta de sucesso — 200 OK

```json
{
  "mensagem": "Senha alterada com sucesso. Faça login com a nova senha."
}
```

A API não faz login automático: o front leva o usuário para a tela de login.

### Erros

| Status | Código | Quando | Mensagem |
| --- | --- | --- | --- |
| 400 | `VALIDACAO` | Campo ausente, senha fraca ou confirmação diferente | "Dados inválidos." + `detalhes` por campo |
| 400 | `TOKEN_REDEFINICAO_INVALIDO` | Token inexistente, vencido ou já usado | "Link inválido ou expirado. Solicite uma nova recuperação de senha." |
| 500 | `ERRO_INTERNO` | Falha inesperada no servidor | "Erro interno no servidor." |

Exemplo de 400 por senha fraca:

```json
{
  "erro": {
    "codigo": "VALIDACAO",
    "mensagem": "Dados inválidos.",
    "detalhes": [
      { "campo": "novaSenha", "mensagem": "A senha precisa ter 8 caracteres, com letra e número." }
    ]
  }
}
```

Os três casos de token ruim (inexistente, vencido, já usado) dão a mesma mensagem, para não ajudar quem tenta adivinhar tokens.

## 6. Regras do token de redefinição

O token de redefinição vale 30 minutos (48 horas quando vem do convite de cadastro, seção 8), funciona uma única vez e nunca é guardado em texto puro.

| Regra | Como funciona | Por quê |
| --- | --- | --- |
| Aleatório e longo | Gerado com 32 bytes aleatórios | Impossível de adivinhar |
| Guardado como hash | O banco salva só o hash do token, como faz com senhas | Quem ler o banco não consegue usar o token |
| Validade de 30 minutos | Guarda a data `expiraEm`; depois dela, o token é recusado | Um e-mail antigo esquecido na caixa não vira risco |
| Uso único | Depois de trocar a senha, o token é marcado como usado | O mesmo link não troca a senha duas vezes |
| Só o último vale | Um pedido novo invalida os tokens anteriores do mesmo usuário | Evita vários links ativos ao mesmo tempo |
| Limite de pedidos | No máximo 3 pedidos por e-mail por hora | Impede encher a caixa de alguém de e-mails |
| Diferente do JWT | Não é aceito no cabeçalho `Authorization` e não dá acesso a nenhuma outra rota | Serve apenas para trocar a senha |

**Dados guardados por pedido** (para alinhar com o Cauã): `usuarioId`, `tokenHash`, `expiraEm`, `usadoEm` (vazio até ser usado) e `criadoEm`.

## 7. Listagem e consulta de moradores

Duas rotas de leitura, ambas só para o síndico. Todo morador é devolvido no mesmo formato:

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | número | Identificador do morador |
| `nome` | texto | Nome completo |
| `email` | texto | E-mail de login, único no sistema |
| `telefone` | texto | Opcional, só números com DDD (ex.: `44999998888`) |
| `unidade` | objeto | `{ id, numero, bloco }` da unidade em que mora |
| `tipo` | texto | `PROPRIETARIO` ou `INQUILINO` |
| `ativo` | sim/não | `false` = não consegue mais fazer login |
| `criadoEm` | data | Quando foi cadastrado |

A senha e o hash **nunca** aparecem nas respostas.

### GET /moradores

Lista os moradores, com filtros e paginação.

| Item | Valor |
| --- | --- |
| Método | `GET` |
| Rota | `/api/v1/moradores` |
| Acesso | Logado + perfil `SINDICO` |
| Cabeçalhos | `Authorization: Bearer <token>` |

**Filtros (na URL, todos opcionais):**

| Parâmetro | Exemplo | Efeito |
| --- | --- | --- |
| `busca` | `?busca=ana` | Nome ou e-mail contém o texto |
| `unidadeId` | `?unidadeId=3` | Só moradores dessa unidade |
| `ativo` | `?ativo=false` | Só ativos ou só inativos; sem o filtro, vem todos |
| `pagina` | `?pagina=2` | Página da lista; começa em 1 |
| `limite` | `?limite=20` | Itens por página; padrão 20, máximo 100 |

**Resposta de sucesso — 200 OK** (lista ordenada por nome):

```json
{
  "dados": [
    {
      "id": 2,
      "nome": "Moradora Ana",
      "email": "ana@condominio.com",
      "telefone": "44999998888",
      "unidade": { "id": 1, "numero": "101", "bloco": "A" },
      "tipo": "PROPRIETARIO",
      "ativo": true,
      "criadoEm": "2026-11-02T20:00:00.000Z"
    }
  ],
  "pagina": 1,
  "limite": 20,
  "total": 1
}
```

Nenhum resultado devolve 200 com `"dados": []`, não 404.

**Erros:**

| Status | Código | Quando |
| --- | --- | --- |
| 400 | `VALIDACAO` | Filtro inválido (ex.: `pagina=0`, `limite=500`) |
| 401 | `NAO_AUTENTICADO` | Sem token ou token inválido/vencido |
| 403 | `SEM_PERMISSAO` | Usuário não é síndico |

### GET /moradores/:id

Devolve um morador pelo `id`.

| Item | Valor |
| --- | --- |
| Método | `GET` |
| Rota | `/api/v1/moradores/:id` (ex.: `/api/v1/moradores/2`) |
| Acesso | Logado + perfil `SINDICO` |
| Cabeçalhos | `Authorization: Bearer <token>` |

**Resposta de sucesso — 200 OK:** o objeto do morador, no formato da tabela do início desta seção.

**Erros:**

| Status | Código | Quando |
| --- | --- | --- |
| 400 | `VALIDACAO` | `id` não é um número |
| 401 | `NAO_AUTENTICADO` | Sem token ou token inválido/vencido |
| 403 | `SEM_PERMISSAO` | Usuário não é síndico |
| 404 | `NAO_ENCONTRADO` | Não existe morador com esse `id` |

## 8. POST /moradores

O síndico cadastra um morador sem definir senha. A API cria o usuário com perfil `MORADOR` e envia um e-mail de convite. O link do convite usa o mesmo `POST /auth/redefinir-senha` para o morador criar a própria senha.

| Item | Valor |
| --- | --- |
| Método | `POST` |
| Rota | `/api/v1/moradores` |
| Acesso | Logado + perfil `SINDICO` |
| Cabeçalhos | `Authorization: Bearer <token>`, `Content-Type: application/json` |

### Dados de entrada

```json
{
  "nome": "Moradora Ana",
  "email": "ana@condominio.com",
  "telefone": "44999998888",
  "unidadeId": 1,
  "tipo": "PROPRIETARIO"
}
```

| Campo | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- |
| `nome` | texto | Sim | De 3 a 100 caracteres |
| `email` | texto | Sim | Formato válido; não pode estar em uso por outro usuário |
| `telefone` | texto | Não | 10 ou 11 dígitos, só números |
| `unidadeId` | número | Sim | Unidade já cadastrada |
| `tipo` | texto | Sim | `PROPRIETARIO` ou `INQUILINO` |

Campos que o síndico **não** envia: `perfil` (sempre `MORADOR`), `ativo` (começa `true`) e `senha` (o morador cria pelo convite).

### Resposta de sucesso — 201 Created

O morador criado, no formato da seção 7, mais o aviso do convite:

```json
{
  "id": 7,
  "nome": "Moradora Ana",
  "email": "ana@condominio.com",
  "telefone": "44999998888",
  "unidade": { "id": 1, "numero": "101", "bloco": "A" },
  "tipo": "PROPRIETARIO",
  "ativo": true,
  "criadoEm": "2026-11-02T20:00:00.000Z",
  "conviteEnviado": true
}
```

O link do convite vale **48 horas** (mais que os 30 minutos da recuperação, porque o morador pode demorar a ver o e-mail). Se vencer, o morador usa o "Esqueci minha senha" normalmente.

### Erros

| Status | Código | Quando | Mensagem |
| --- | --- | --- | --- |
| 400 | `VALIDACAO` | Campo ausente ou fora da regra | "Dados inválidos." + `detalhes` por campo |
| 401 | `NAO_AUTENTICADO` | Sem token ou token inválido/vencido | "Token não enviado." ou "Token inválido ou expirado." |
| 403 | `SEM_PERMISSAO` | Usuário não é síndico | "Seu perfil não tem acesso a esta ação." |
| 404 | `NAO_ENCONTRADO` | `unidadeId` não existe | "Unidade não encontrada." |
| 409 | `CONFLITO` | E-mail já cadastrado | "Já existe um usuário com este e-mail." |

## 9. PATCH /moradores/:id

Altera só os campos enviados; o que não vier no corpo continua igual. Também é usado para desativar um morador que se mudou, em vez de apagá-lo.

| Item | Valor |
| --- | --- |
| Método | `PATCH` |
| Rota | `/api/v1/moradores/:id` |
| Acesso | Logado + perfil `SINDICO` |
| Cabeçalhos | `Authorization: Bearer <token>`, `Content-Type: application/json` |

### Dados de entrada

Todos os campos são opcionais, mas pelo menos um precisa vir. Exemplo de mudança de unidade:

```json
{
  "unidadeId": 4,
  "tipo": "INQUILINO"
}
```

| Campo | Regra |
| --- | --- |
| `nome` | De 3 a 100 caracteres |
| `email` | Formato válido; não pode estar em uso por outro usuário |
| `telefone` | 10 ou 11 dígitos, ou `null` para apagar |
| `unidadeId` | Unidade já cadastrada |
| `tipo` | `PROPRIETARIO` ou `INQUILINO` |
| `ativo` | `false` desativa, `true` reativa |

Campos que **não** podem ser editados por esta rota: `id`, `perfil`, `senha` e `criadoEm`. Se vierem no corpo, a API responde 400.

**Efeitos de algumas mudanças:**

- `ativo: false`: o morador não consegue mais fazer login (401 "E-mail ou senha inválidos."), mas o histórico de reservas e ocorrências continua guardado.
- Troca de `email`: o login passa a ser pelo e-mail novo; a senha continua a mesma.

### Resposta de sucesso — 200 OK

O morador completo, já atualizado, no formato da seção 7.

### Erros

| Status | Código | Quando | Mensagem |
| --- | --- | --- | --- |
| 400 | `VALIDACAO` | Corpo vazio, campo fora da regra ou campo não editável | "Dados inválidos." + `detalhes` por campo |
| 401 | `NAO_AUTENTICADO` | Sem token ou token inválido/vencido | "Token não enviado." ou "Token inválido ou expirado." |
| 403 | `SEM_PERMISSAO` | Usuário não é síndico | "Seu perfil não tem acesso a esta ação." |
| 404 | `NAO_ENCONTRADO` | Morador ou `unidadeId` não existe | "Morador não encontrado." ou "Unidade não encontrada." |
| 409 | `CONFLITO` | E-mail novo já é de outro usuário | "Já existe um usuário com este e-mail." |

## 10. Quem pode acessar cada rota

As duas rotas de senha são públicas; as quatro de moradores são exclusivas do síndico. Qualquer "Não" devolve **403 SEM\_PERMISSAO** para quem está logado, ou **401 NAO\_AUTENTICADO** para quem não enviou token.

| Rota | O que faz | Sem login | SINDICO | MORADOR | PORTEIRO |
| --- | --- | --- | --- | --- | --- |
| `POST /auth/esqueci-senha` | Pede o link de recuperação | Sim | Sim | Sim | Sim |
| `POST /auth/redefinir-senha` | Troca a senha com o token do e-mail | Sim (com token de redefinição válido) | Sim | Sim | Sim |
| `GET /moradores` | Lista moradores | Não (401) | Sim | Não (403) | Não (403) |
| `GET /moradores/:id` | Consulta um morador | Não (401) | Sim | Não (403) | Não (403) |
| `POST /moradores` | Cadastra morador | Não (401) | Sim | Não (403) | Não (403) |
| `PATCH /moradores/:id` | Edita ou desativa morador | Não (401) | Sim | Não (403) | Não (403) |

**Como cada regra é aplicada:**

- **Rotas de senha:** não passam pelo middleware `autenticar`. A proteção é o próprio token de redefinição e o limite de pedidos (seção 6).
- **Rotas de moradores:** passam por `autenticar` e depois `autorizar('SINDICO')`, nesta ordem, como na especificação de autenticação.
- **Um síndico desativado** (`ativo: false`) não consegue fazer login e, portanto, perde o acesso a todas essas rotas.

O morador ver os **próprios** dados (ex.: tela "Meu perfil") já é coberto por `GET /auth/me`, sem precisar abrir as rotas de moradores para ele.

## 11. Cenários de teste

A numeração continua a da especificação de autenticação (CT01 a CT10). Os cenários CT20 a CT23 verificam o critério de aceitação (regras de acesso).

| # | Cenário | Requisição | Resultado esperado |
| --- | --- | --- | --- |
| CT11 | Pedir recuperação com e-mail cadastrado | `POST /auth/esqueci-senha` com `ana@condominio.com` | 200 + e-mail com link enviado |
| CT12 | Pedir recuperação com e-mail inexistente | `POST /auth/esqueci-senha` com `naoexiste@condominio.com` | 200 com a **mesma** mensagem do CT11; nenhum e-mail enviado |
| CT13 | Pedidos demais | 4º pedido para o mesmo e-mail em 1 hora | 429 `MUITAS_TENTATIVAS` |
| CT14 | Redefinir com token válido | `POST /auth/redefinir-senha` com token do CT11 e senha `MinhaSenha2026` | 200; login com a senha nova funciona e com a antiga dá 401 |
| CT15 | Reusar o mesmo token | Repetir o CT14 com o mesmo token | 400 `TOKEN_REDEFINICAO_INVALIDO` |
| CT16 | Token vencido | Token com mais de 30 minutos | 400 `TOKEN_REDEFINICAO_INVALIDO` |
| CT17 | Senha fraca ou confirmação diferente | `novaSenha` = `123` | 400 `VALIDACAO` com `detalhes` do campo |
| CT18 | Cadastrar morador | Síndico, `POST /moradores` com dados válidos | 201 + `conviteEnviado: true` |
| CT19 | Cadastrar com e-mail repetido | Síndico, `POST /moradores` com `ana@condominio.com` já existente | 409 `CONFLITO` |
| CT20 | Morador tenta listar moradores | Morador, `GET /moradores` | 403 `SEM_PERMISSAO` |
| CT21 | Porteiro tenta cadastrar morador | Porteiro, `POST /moradores` | 403 `SEM_PERMISSAO` |
| CT22 | Sem login | `PATCH /moradores/2` sem `Authorization` | 401 `NAO_AUTENTICADO` |
| CT23 | Síndico lista e edita | Síndico, `GET /moradores` e `PATCH /moradores/2` | 200 nos dois |
| CT24 | Desativar morador | Síndico, `PATCH /moradores/2` com `ativo: false`; depois login da Ana | 200; o login seguinte dá 401 |
| CT25 | Morador inexistente | Síndico, `GET /moradores/999` | 404 `NAO_ENCONTRADO` |

## 12. Fora do escopo e decisões pendentes

**Fora do escopo desta versão:**

- Apagar morador de vez: no MVP ele só é desativado (`ativo: false`), para manter o histórico
- Cadastro de síndicos e porteiros: segue em `POST /usuarios`, da especificação de autenticação
- Importar moradores por planilha
- Recuperação por SMS ou WhatsApp: só por e-mail
- CPF e outros documentos: não são coletados no MVP, para guardar o mínimo de dados pessoais (LGPD)
- Serviço de e-mail de produção: em desenvolvimento, o envio pode só aparecer no log do servidor

**Decisões pendentes:**

- [ ] Pedro (PO): confirmar as validades propostas (30 minutos para recuperação, 48 horas para convite)
- [ ] Pedro (PO): confirmar a regra de senha (mínimo de 8 caracteres, com letra e número)
- [ ] Cauã (banco): criar a tabela de tokens de redefinição (seção 6) e os campos `telefone`, `tipo` e `ativo` do morador
- [ ] Vinicius (front): telas "Esqueci minha senha", "Redefinir senha" e cadastro/lista de moradores
- [ ] Danilo (QA): transformar a seção 11 em casos de teste no Jira
- [ ] Atualizar a especificação de autenticação: a recuperação de senha saiu de "fora do escopo"
