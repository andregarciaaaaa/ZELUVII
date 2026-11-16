-- ZELUVI - Banco de dados (PostgreSQL) - versao 4 (final)
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
    data_publicacao   TIMESTAMP NOT NULL DEFAULT NOW()
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
    capacidade     INT,
    UNIQUE (id_condominio, nome)
);

CREATE TABLE reserva (
    id_reserva       SERIAL PRIMARY KEY,
    id_area          INT NOT NULL REFERENCES area_comum (id_area),
    id_morador       INT NOT NULL REFERENCES morador (id_morador),
    inicio           TIMESTAMP NOT NULL,
    fim              TIMESTAMP NOT NULL,
    -- RN06: toda reserva nasce pendente e so vira confirmada se o sindico aprovar.
    -- recusada = o sindico negou; cancelada = o morador desistiu. Nos dois casos o horario fica livre.
    status           VARCHAR(20) NOT NULL DEFAULT 'pendente'
                     CHECK (status IN ('pendente', 'confirmada', 'recusada', 'cancelada')),
    id_decidido_por  INT REFERENCES usuario (id_usuario),  -- sindico que aprovou ou recusou
    decidido_em      TIMESTAMP,
    -- Horarios fixos, como no prototipo: blocos de 3 horas que comecam as 09h, 12h, 15h ou 18h
    CHECK (inicio::time IN ('09:00', '12:00', '15:00', '18:00')),
    CHECK (fim = inicio + INTERVAL '3 hours')
);

-- RN05 (nao pode haver duas reservas para o mesmo espaco em periodos conflitantes):
-- como os horarios sao fixos, dois periodos so conflitam se comecam juntos.
-- Pendente tambem segura o horario (UC03: "o horario fica retido ate o sindico decidir").
-- Este indice unico impede duas reservas pendentes/confirmadas na mesma area e no mesmo inicio.
CREATE UNIQUE INDEX reserva_sem_duplicidade
    ON reserva (id_area, inicio)
    WHERE status IN ('pendente', 'confirmada');

-- O sistema tambem consulta antes de gravar, para avisar o morador com uma mensagem clara:
--   SELECT COUNT(*) FROM reserva
--   WHERE id_area = ? AND inicio = ? AND status IN ('pendente', 'confirmada');
-- Se retornar 1 ou mais, o horario esta ocupado. O indice acima e a garantia final,
-- caso dois moradores confirmem no mesmo instante.

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
                       CHECK (status IN ('aguardando_retirada', 'retirada'))
);

-- ---------------------------------------------------------------
-- Visitantes (controle de entrada e saida feito pela portaria)
-- ---------------------------------------------------------------
CREATE TABLE visitante (
    id_visitante       SERIAL PRIMARY KEY,
    id_unidade         INT NOT NULL REFERENCES unidade (id_unidade),
    id_registrado_por  INT NOT NULL REFERENCES usuario (id_usuario),
    nome               VARCHAR(120) NOT NULL,
    documento          VARCHAR(20),
    motivo             VARCHAR(100),
    data_entrada       TIMESTAMP NOT NULL DEFAULT NOW(),
    data_saida         TIMESTAMP,
    CHECK (data_saida IS NULL OR data_saida >= data_entrada)
);

-- ---------------------------------------------------------------
-- Ocorrencias (RF07, RF08, RN08, RN09)
-- ---------------------------------------------------------------
CREATE TABLE ocorrencia (
    id_ocorrencia  SERIAL PRIMARY KEY,
    id_morador     INT NOT NULL REFERENCES morador (id_morador),
    assunto        VARCHAR(150) NOT NULL,
    descricao      TEXT NOT NULL,
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
    UNIQUE (id_unidade, tipo, competencia),
    -- pago tem data de pagamento; pendente nao tem
    CHECK ((status = 'pago' AND data_pagamento IS NOT NULL)
        OR (status = 'pendente' AND data_pagamento IS NULL)),
    CHECK (EXTRACT(DAY FROM competencia) = 1)
);
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
