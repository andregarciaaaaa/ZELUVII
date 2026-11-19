-- ZELUVI - Banco de dados (PostgreSQL) - versao 5
-- Versao 5 (19/11/2026): alinha o banco com as especificacoes de API. Espelha a migracao
-- backend/prisma/migrations/20261119230000_alinha_banco_com_api. Veja docs/08-desenvolvimento/analise-de-coerencia.md.
-- A fonte da verdade para criar o banco e o Prisma (npx prisma migrate deploy); este arquivo e a referencia legivel.
--
-- Historico da versao 4 (final):
-- Segue o DER novo do grupo. Mudancas em relacao a versao anterior:
--   * tabela nova: visitante
--   * tabela nova: token_redefinicao_senha (dicionario v2)
--   * usuario: colunas telefone e criado_em (dicionario v2)
--   * morador.tipo_vinculo: so proprietario ou inquilino (dicionario v2)
--   * encomenda: colunas transportadora e codigo_rastreio (vem do prototipo)
--   * reserva: aprovacao do sindico (RN06 da Fase 2 atualizada), regra de horarios fixos + indice unico (RN05)
--   * historico_ocorrencia: status validados com CHECK (RN08)
--   * versao 4: lancamento (taxas) com status pendente/pago e tipos validados;
--               tabela nova despesa (gastos do condominio, vem do painel financeiro do prototipo)
-- Padrao de nomes: minusculo, snake_case, tabela no singular, chave primaria id_<tabela>.

-- ---------------------------------------------------------------
-- Acesso e estrutura do condominio
-- ---------------------------------------------------------------
CREATE TABLE perfil (
    id_perfil  SERIAL PRIMARY KEY,
    nome       VARCHAR(30) NOT NULL UNIQUE,
    descricao  VARCHAR(255)
);

CREATE TABLE condominio (
    id_condominio  SERIAL PRIMARY KEY,
    nome           VARCHAR(120) NOT NULL,
    endereco       VARCHAR(255) NOT NULL
);

CREATE TABLE usuario (
    id_usuario  SERIAL PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,
    ativo       BOOLEAN NOT NULL DEFAULT TRUE,
    telefone    VARCHAR(11) CHECK (telefone ~ '^[0-9]{10,11}$'),  -- so numeros, com DDD
    criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pedidos de redefinicao de senha (recuperacao e convite de cadastro)
CREATE TABLE token_redefinicao_senha (
    id_token    SERIAL PRIMARY KEY,
    id_usuario  INT NOT NULL REFERENCES usuario (id_usuario),
    token_hash  VARCHAR(255) NOT NULL,
    expira_em   TIMESTAMP NOT NULL,
    usado_em    TIMESTAMP,
    criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela associativa (N:N) entre usuario e condominio.
-- Aqui fica o perfil do usuario naquele condominio (RN01).
CREATE TABLE usuario_condominio (
    id_vinculo     SERIAL PRIMARY KEY,
    id_usuario     INT NOT NULL REFERENCES usuario (id_usuario),
    id_condominio  INT NOT NULL REFERENCES condominio (id_condominio),
    id_perfil      INT NOT NULL REFERENCES perfil (id_perfil),
    ativo          BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (id_usuario, id_condominio)
);

CREATE TABLE unidade (
    id_unidade     SERIAL PRIMARY KEY,
    id_condominio  INT NOT NULL REFERENCES condominio (id_condominio),
    identificacao  VARCHAR(30) NOT NULL,
    bloco          VARCHAR(30),
    numero         VARCHAR(20),
    UNIQUE (id_condominio, identificacao)
);

-- Tabela associativa (N:N) entre usuario e unidade.
CREATE TABLE morador (
    id_morador    SERIAL PRIMARY KEY,
    id_usuario    INT NOT NULL REFERENCES usuario (id_usuario),
    id_unidade    INT NOT NULL REFERENCES unidade (id_unidade),
    tipo_vinculo  VARCHAR(30) NOT NULL
                  CHECK (tipo_vinculo IN ('proprietario', 'inquilino')),
    principal     BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (id_usuario, id_unidade)
);

-- ---------------------------------------------------------------
-- Comunicacao e informacoes
-- ---------------------------------------------------------------
-- comunicado = os "avisos" do condominio
CREATE TABLE comunicado (
    id_comunicado     SERIAL PRIMARY KEY,
    id_condominio     INT NOT NULL REFERENCES condominio (id_condominio),
    id_autor          INT NOT NULL REFERENCES usuario (id_usuario),
    titulo            VARCHAR(150) NOT NULL,
    conteudo          TEXT NOT NULL,
    data_publicacao   TIMESTAMP NOT NULL DEFAULT NOW(),
    expira_em         TIMESTAMP,   -- v5: depois dessa data sai da lista de morador e porteiro
    atualizado_em     TIMESTAMP,   -- v5
    removido_em       TIMESTAMP    -- v5: remocao logica (fica guardado para auditoria)
);

CREATE TABLE prestador (
    id_prestador   SERIAL PRIMARY KEY,
    id_condominio  INT NOT NULL REFERENCES condominio (id_condominio),
    nome           VARCHAR(150) NOT NULL,
    servico        VARCHAR(100) NOT NULL,
    telefone       VARCHAR(30),
    observacoes    TEXT
);

CREATE TABLE faq (
    id_faq         SERIAL PRIMARY KEY,
    id_condominio  INT NOT NULL REFERENCES condominio (id_condominio),
    pergunta       VARCHAR(255) NOT NULL,
    resposta       TEXT NOT NULL,
    ativo          BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------
-- Reservas de areas comuns (RF05, RN04, RN05, RN06)
-- ---------------------------------------------------------------
CREATE TABLE area_comum (
    id_area        SERIAL PRIMARY KEY,
    id_condominio  INT NOT NULL REFERENCES condominio (id_condominio),
    nome           VARCHAR(100) NOT NULL,
    regras         TEXT,
    capacidade     INT CHECK (capacidade IS NULL OR capacidade BETWEEN 1 AND 1000),
    -- v5: funcionamento e limites (API de Areas Comuns, secao 3.1)
    horario_abertura         VARCHAR(5) NOT NULL DEFAULT '08:00' CHECK (horario_abertura ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    horario_fechamento       VARCHAR(5) NOT NULL DEFAULT '22:00' CHECK (horario_fechamento ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    duracao_maxima_horas     INT CHECK (duracao_maxima_horas IS NULL OR duracao_maxima_horas BETWEEN 1 AND 24),
    antecedencia_maxima_dias INT NOT NULL DEFAULT 60 CHECK (antecedencia_maxima_dias BETWEEN 1 AND 180),
    ativa                    BOOLEAN NOT NULL DEFAULT TRUE,
    exige_aprovacao          BOOLEAN NOT NULL DEFAULT FALSE,  -- FALSE = RN06 (confirmacao automatica)
    criada_em                TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (horario_fechamento > horario_abertura),
    UNIQUE (id_condominio, nome)
);

CREATE TABLE reserva (
    id_reserva       SERIAL PRIMARY KEY,
    id_area          INT NOT NULL REFERENCES area_comum (id_area),
    id_morador       INT REFERENCES morador (id_morador) ON DELETE SET NULL,  -- v5: vazio = reserva do proprio condominio (sindico)
    id_criado_por    INT NOT NULL REFERENCES usuario (id_usuario),            -- v5
    inicio           TIMESTAMPTZ NOT NULL,                                    -- v5: com fuso
    fim              TIMESTAMPTZ NOT NULL,
    -- RN06: confirmada automaticamente (area sem exige_aprovacao) ou pendente ate o sindico decidir.
    -- Pendente e confirmada seguram o horario; recusada e cancelada liberam.
    status           VARCHAR(20) NOT NULL DEFAULT 'pendente'
                     CHECK (status IN ('pendente', 'confirmada', 'recusada', 'cancelada')),
    observacao       VARCHAR(500),                                            -- v5
    criada_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),                      -- v5
    cancelada_em     TIMESTAMPTZ,                                             -- v5
    id_decidido_por  INT REFERENCES usuario (id_usuario),
    decidido_em      TIMESTAMP,
    -- v5: periodo livre dentro do funcionamento da area (antes: blocos fixos de 3 horas as 9h/12h/15h/18h,
    -- que reprovava ate o exemplo da especificacao da API)
    CHECK (fim > inicio)
);

-- RN05: duas reservas pendentes/confirmadas da mesma area nunca se sobrepoem.
-- Encostar (fim de uma = inicio da outra) nao conta como sobrepor: intervalo [inicio, fim).
-- Exige a extensao btree_gist.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE reserva ADD CONSTRAINT reserva_sem_sobreposicao
    EXCLUDE USING gist (id_area WITH =, tstzrange(inicio, fim, '[)') WITH &&)
    WHERE (status IN ('pendente', 'confirmada'));

-- A API tambem consulta antes de gravar, para avisar o morador com uma mensagem clara ("Horario ja reservado...").
-- A restricao acima e a garantia final quando dois moradores pedem o mesmo horario no mesmo instante.

-- ---------------------------------------------------------------
-- Encomendas (RF06, RN07)
-- ---------------------------------------------------------------
CREATE TABLE encomenda (
    id_encomenda       SERIAL PRIMARY KEY,
    id_unidade         INT NOT NULL REFERENCES unidade (id_unidade),
    id_registrado_por  INT NOT NULL REFERENCES usuario (id_usuario),
    id_retirado_por    INT REFERENCES usuario (id_usuario),
    descricao          VARCHAR(255) NOT NULL,
    transportadora     VARCHAR(60),
    codigo_rastreio    VARCHAR(40),
    data_recebimento   TIMESTAMP NOT NULL DEFAULT NOW(),
    data_retirada      TIMESTAMP,
    status             VARCHAR(20) NOT NULL DEFAULT 'aguardando_retirada'
                       CHECK (status IN ('aguardando_retirada', 'entregue'))  -- v5: "entregue" (historia 8.1 e API)
);

-- ---------------------------------------------------------------
-- Visitantes (controle de entrada e saida feito pela portaria)
-- ---------------------------------------------------------------
CREATE TABLE visitante (
    id_visitante       SERIAL PRIMARY KEY,
    id_unidade         INT NOT NULL REFERENCES unidade (id_unidade),
    id_registrado_por  INT NOT NULL REFERENCES usuario (id_usuario),
    nome               VARCHAR(120) NOT NULL,
    tipo               VARCHAR(20) NOT NULL DEFAULT 'visitante' CHECK (tipo IN ('visitante', 'prestador')),  -- v5
    observacao         VARCHAR(255),                                                                         -- v5
    documento          VARCHAR(20),   -- nao usado no MVP (LGPD: dados minimos)
    motivo             VARCHAR(100),  -- nao usado no MVP (substituido por observacao)
    data_entrada       TIMESTAMP NOT NULL DEFAULT NOW(),
    data_saida         TIMESTAMP,
    CHECK (data_saida IS NULL OR data_saida >= data_entrada)
);

-- ---------------------------------------------------------------
-- Ocorrencias (RF07, RF08, RN08, RN09)
-- ---------------------------------------------------------------
CREATE SEQUENCE ocorrencia_protocolo_seq;

CREATE TABLE ocorrencia (
    id_ocorrencia  SERIAL PRIMARY KEY,
    id_condominio  INT NOT NULL REFERENCES condominio (id_condominio),               -- v5
    id_autor       INT NOT NULL REFERENCES usuario (id_usuario),                     -- v5: qualquer perfil abre ocorrencia
    id_morador     INT REFERENCES morador (id_morador) ON DELETE SET NULL,           -- v5: preenchido quando o autor e morador
    protocolo      VARCHAR(20) NOT NULL UNIQUE
                   DEFAULT ('OC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('ocorrencia_protocolo_seq')::text, 6, '0')),  -- v5 (historia 4.1)
    assunto        VARCHAR(150) NOT NULL,
    descricao      TEXT NOT NULL,
    categoria      VARCHAR(20) NOT NULL DEFAULT 'outros'
                   CHECK (categoria IN ('manutencao', 'limpeza', 'elevador', 'iluminacao', 'outros')),                        -- v5
    local          VARCHAR(100),                                                                                              -- v5
    -- RN08: so pode ter um destes 5 status
    status         VARCHAR(30) NOT NULL DEFAULT 'solicitada'
                   CHECK (status IN ('solicitada', 'em_andamento', 'aguardando_terceiro', 'resolvida', 'cancelada')),
    data_abertura  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE historico_ocorrencia (
    id_historico     SERIAL PRIMARY KEY,
    id_ocorrencia    INT NOT NULL REFERENCES ocorrencia (id_ocorrencia),
    id_usuario       INT NOT NULL REFERENCES usuario (id_usuario),
    status_anterior  VARCHAR(30)
                     CHECK (status_anterior IN ('solicitada', 'em_andamento', 'aguardando_terceiro', 'resolvida', 'cancelada')),
    status_novo      VARCHAR(30) NOT NULL
                     CHECK (status_novo IN ('solicitada', 'em_andamento', 'aguardando_terceiro', 'resolvida', 'cancelada')),
    observacao       TEXT,
    data_alteracao   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- Financeiro (RF09, RN10) - o morador so consulta, o pagamento nao e feito pelo sistema (UC08)
-- ---------------------------------------------------------------
-- lancamento = as TAXAS cobradas de cada unidade (cota condominial, taxa extra, multa)
CREATE TABLE lancamento (
    id_lancamento   SERIAL PRIMARY KEY,
    id_unidade      INT NOT NULL REFERENCES unidade (id_unidade),
    tipo            VARCHAR(20) NOT NULL
                    CHECK (tipo IN ('cota_condominial', 'taxa_extra', 'multa')),
    competencia     DATE NOT NULL,           -- mes de referencia, sempre dia 1 (ex.: 2026-08-01)
    valor           DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    vencimento      DATE NOT NULL,
    data_pagamento  DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'pago')),
    boleto_url      VARCHAR(500),
    descricao       VARCHAR(150),  -- v5
    -- pago tem data de pagamento; pendente nao tem
    CHECK ((status = 'pago' AND data_pagamento IS NOT NULL)
        OR (status = 'pendente' AND data_pagamento IS NULL)),
    CHECK (EXTRACT(DAY FROM competencia) = 1)
);
-- v5: so a cota condominial e unica por unidade e mes; uma unidade pode ter mais de uma multa ou taxa extra no mes.
CREATE UNIQUE INDEX lancamento_cota_unica ON lancamento (id_unidade, competencia) WHERE tipo = 'cota_condominial';
-- "Atrasado" nao e um status: e uma taxa pendente cujo vencimento ja passou.
--   SELECT * FROM lancamento WHERE status = 'pendente' AND vencimento < CURRENT_DATE;

-- despesa = os GASTOS do condominio (folha, manutencao, agua e energia...), tela Financeiro do sindico
CREATE TABLE despesa (
    id_despesa      SERIAL PRIMARY KEY,
    id_condominio   INT NOT NULL REFERENCES condominio (id_condominio),
    categoria       VARCHAR(30) NOT NULL
                    CHECK (categoria IN ('folha', 'manutencao', 'agua_energia', 'limpeza', 'seguranca', 'administrativo')),
    descricao       VARCHAR(150) NOT NULL,
    fornecedor      VARCHAR(120),
    valor           DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    competencia     DATE NOT NULL,           -- mes de referencia, sempre dia 1
    vencimento      DATE NOT NULL,
    data_pagamento  DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'pago')),
    CHECK ((status = 'pago' AND data_pagamento IS NOT NULL)
        OR (status = 'pendente' AND data_pagamento IS NULL)),
    CHECK (EXTRACT(DAY FROM competencia) = 1)
);

-- ---------------------------------------------------------------
-- v5: indices nas chaves estrangeiras mais consultadas
-- ---------------------------------------------------------------
CREATE INDEX ON token_redefinicao_senha (id_usuario, criado_em);
CREATE INDEX ON token_redefinicao_senha (token_hash);
CREATE INDEX ON morador (id_unidade);
CREATE INDEX ON comunicado (id_condominio, data_publicacao);
CREATE INDEX ON prestador (id_condominio);
CREATE INDEX ON faq (id_condominio);
CREATE INDEX ON reserva (id_area, inicio);
CREATE INDEX ON reserva (id_morador);
CREATE INDEX ON encomenda (id_unidade, status);
CREATE INDEX ON visitante (id_unidade, data_entrada);
CREATE INDEX ON ocorrencia (id_condominio, status);
CREATE INDEX ON ocorrencia (id_autor);
CREATE INDEX ON historico_ocorrencia (id_ocorrencia, data_alteracao);
CREATE INDEX ON lancamento (id_unidade, vencimento);
CREATE INDEX ON despesa (id_condominio, competencia);
