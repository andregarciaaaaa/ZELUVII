# Banco de dados – ZELUVI

Esta pasta reúne tudo o que foi feito na parte de **Banco de Dados** do projeto: o diagrama (DER), o script que cria as tabelas e os dicionários de dados.

- **SGBD:** PostgreSQL 16
- **Responsável:** Cauã Henrique (Banco de Dados)

## O que tem aqui

```
banco-de-dados/
├── readme.md
├── schema.sql
├── DER/
│   ├── SCRUM-67-DER_ZELUVI_final.png
│   └── SCRUM-46-DER
└── dicionario-de-dados/
    ├── SCRUM-46_Revisao_do_DER.pdf
    ├── SCRUM-50_Dicionario_de_dados_Usuarios_Perfis_Condominios_e_Unidades.pdf
    ├── SCRUM-58_Dicionario_de_dados_Areas_comuns_e_Reservas.pdf
    ├── SCRUM-59_Dicionario_de_dados_Avisos_Ocorrencias_Encomendas_e_Visitantes.pdf
    ├── SCRUM-67_Dicionario_de_dados_Financeiro.pdf
    └── SCRUM-67_Dicionario_de_dados_Completo_ZELUVI.pdf
```

| Arquivo | Para que serve |
|---|---|
| `schema.sql` | Script que cria as 18 tabelas, com chaves, tipos e regras (versão 4) |
| `DER/` | Diagrama entidade-relacionamento final, em imagem e em PDF |
| SCRUM-46 | Revisão do DER, escolha do SGBD e padrão de nomes |
| SCRUM-50 | Dicionário de usuários, perfis, condomínios e unidades |
| SCRUM-58 | Dicionário de áreas comuns e reservas |
| SCRUM-59 | Dicionário de avisos (comunicados), ocorrências, encomendas e visitantes |
| SCRUM-67 Financeiro | Dicionário de taxas (`lancamento`) e despesas (`despesa`) |
| SCRUM-67 Completo | Dicionário com **todas** as 18 tabelas, por módulo |

## As 18 tabelas

| Módulo | Tabelas |
|---|---|
| Acesso e estrutura | `perfil`, `condominio`, `usuario`, `token_redefinicao_senha`, `usuario_condominio`, `unidade`, `morador` |
| Comunicação | `comunicado`, `prestador`, `faq` |
| Áreas comuns e reservas | `area_comum`, `reserva` |
| Portaria | `encomenda`, `visitante` |
| Ocorrências | `ocorrencia`, `historico_ocorrencia` |
| Financeiro | `lancamento`, `despesa` |

## Padrão de nomes

- Tudo em minúsculo, no formato `snake_case`, sem acento.
- Nome da tabela no singular (`reserva`, e não `reservas`).
- Chave primária chamada `id_` mais o nome da tabela (`id_reserva`).
- Valores fixos (status, tipos) em minúsculo e sem acento, como `aguardando_retirada`.

## Como rodar o schema

1. Instale o PostgreSQL 16 e abra o terminal na pasta onde está o `schema.sql`.
2. Crie o banco:
   ```
   createdb zeluvi
   ```
3. Rode o script:
   ```
   psql -d zeluvi -f schema.sql
   ```
4. Confira se as 18 tabelas foram criadas:
   ```
   psql -d zeluvi -c "\dt"
   ```

Se preferir uma ferramenta visual (pgAdmin ou DBeaver), crie o banco `zeluvi`, abra o `schema.sql` no editor de consultas e execute o arquivo inteiro.

## Regras importantes que o banco garante

- **Reserva (RN05 e RN06):** a reserva nasce `pendente` e só o síndico confirma ou recusa. Os horários são fixos (blocos de 3 horas, às 9h, 12h, 15h e 18h), e um índice único impede duas reservas pendentes ou confirmadas na mesma área e no mesmo horário.
- **Ocorrência (RN08):** só aceita os status `solicitada`, `em_andamento`, `aguardando_terceiro`, `resolvida` e `cancelada`.
- **Encomenda:** status `aguardando_retirada` ou `retirada`.
- **Financeiro:** taxas e despesas têm status `pendente` ou `pago`. Pago exige data de pagamento. "Atrasado" não é status: é uma taxa pendente com vencimento já passado, descoberta por consulta.
