-- ZELUVI - migracao 2: alinha o banco com as especificacoes de API (Sprint 5 e 6).
-- Nao edita a migracao "init" (regra do README_BANCO): tudo aqui e ALTER.
-- Motivo de cada mudanca esta em docs/08-desenvolvimento/analise-de-coerencia.md.

-- Necessaria para a restricao de exclusao das reservas (API de Areas Comuns, secao 4.3)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------------
-- area_comum: funcionamento, limites e flag de aprovacao
-- ---------------------------------------------------------------
ALTER TABLE "area_comum"
    ADD COLUMN "horario_abertura"         VARCHAR(5) NOT NULL DEFAULT '08:00',
    ADD COLUMN "horario_fechamento"       VARCHAR(5) NOT NULL DEFAULT '22:00',
    ADD COLUMN "duracao_maxima_horas"     INTEGER,
    ADD COLUMN "antecedencia_maxima_dias" INTEGER NOT NULL DEFAULT 60,
    ADD COLUMN "ativa"                    BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "exige_aprovacao"          BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "criada_em"                TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "area_comum" ADD CONSTRAINT ck_area_abertura
    CHECK (horario_abertura ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "area_comum" ADD CONSTRAINT ck_area_fechamento
    CHECK (horario_fechamento ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "area_comum" ADD CONSTRAINT ck_area_funcionamento
    CHECK (horario_fechamento > horario_abertura);
ALTER TABLE "area_comum" ADD CONSTRAINT ck_area_duracao
    CHECK (duracao_maxima_horas IS NULL OR duracao_maxima_horas BETWEEN 1 AND 24);
ALTER TABLE "area_comum" ADD CONSTRAINT ck_area_antecedencia
    CHECK (antecedencia_maxima_dias BETWEEN 1 AND 180);
ALTER TABLE "area_comum" ADD CONSTRAINT ck_area_capacidade
    CHECK (capacidade IS NULL OR capacidade BETWEEN 1 AND 1000);

-- ---------------------------------------------------------------
-- reserva: periodo livre (nao so blocos de 3h), fuso, sobreposicao barrada pelo banco
-- ---------------------------------------------------------------
DROP INDEX "reserva_sem_duplicidade";
ALTER TABLE "reserva" DROP CONSTRAINT ck_reserva_inicio;
ALTER TABLE "reserva" DROP CONSTRAINT ck_reserva_fim;

ALTER TABLE "reserva"
    ALTER COLUMN "inicio" TYPE TIMESTAMPTZ(6) USING "inicio" AT TIME ZONE 'America/Sao_Paulo',
    ALTER COLUMN "fim"    TYPE TIMESTAMPTZ(6) USING "fim"    AT TIME ZONE 'America/Sao_Paulo',
    ALTER COLUMN "id_morador" DROP NOT NULL,
    ADD COLUMN "id_criado_por" INTEGER,
    ADD COLUMN "observacao"    VARCHAR(500),
    ADD COLUMN "criada_em"     TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "cancelada_em"  TIMESTAMPTZ(6);

UPDATE "reserva" r SET "id_criado_por" = m."id_usuario"
  FROM "morador" m WHERE m."id_morador" = r."id_morador";
ALTER TABLE "reserva" ALTER COLUMN "id_criado_por" SET NOT NULL;

ALTER TABLE "reserva" ADD CONSTRAINT "reserva_id_criado_por_fkey"
    FOREIGN KEY ("id_criado_por") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reserva" DROP CONSTRAINT "reserva_id_morador_fkey";
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_id_morador_fkey"
    FOREIGN KEY ("id_morador") REFERENCES "morador"("id_morador") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reserva" ADD CONSTRAINT ck_reserva_periodo CHECK (fim > inicio);

-- RN05: duas reservas pendentes/confirmadas da mesma area nunca se sobrepoem.
-- Encostar (fim de uma = inicio da outra) nao conta como sobrepor: intervalo [inicio, fim).
ALTER TABLE "reserva" ADD CONSTRAINT reserva_sem_sobreposicao
    EXCLUDE USING gist ("id_area" WITH =, tstzrange("inicio", "fim", '[)') WITH &&)
    WHERE (status IN ('pendente', 'confirmada'));

-- ---------------------------------------------------------------
-- ocorrencia: qualquer perfil abre, protocolo, categoria e local
-- ---------------------------------------------------------------
CREATE SEQUENCE ocorrencia_protocolo_seq;

ALTER TABLE "ocorrencia"
    ADD COLUMN "id_condominio" INTEGER,
    ADD COLUMN "id_autor"      INTEGER,
    ADD COLUMN "protocolo"     VARCHAR(20),
    ADD COLUMN "categoria"     VARCHAR(20) NOT NULL DEFAULT 'outros',
    ADD COLUMN "local"         VARCHAR(100);

UPDATE "ocorrencia" o SET "id_autor" = m."id_usuario", "id_condominio" = u."id_condominio"
  FROM "morador" m JOIN "unidade" u ON u."id_unidade" = m."id_unidade"
 WHERE m."id_morador" = o."id_morador";
UPDATE "ocorrencia"
   SET "protocolo" = 'OC-' || to_char("data_abertura", 'YYYY') || '-' || lpad(nextval('ocorrencia_protocolo_seq')::text, 6, '0')
 WHERE "protocolo" IS NULL;

ALTER TABLE "ocorrencia"
    ALTER COLUMN "id_condominio" SET NOT NULL,
    ALTER COLUMN "id_autor" SET NOT NULL,
    ALTER COLUMN "protocolo" SET NOT NULL,
    ALTER COLUMN "protocolo" SET DEFAULT ((('OC-'::text || to_char(now(), 'YYYY'::text)) || '-'::text) || lpad((nextval('ocorrencia_protocolo_seq'::regclass))::text, 6, '0'::text)),
    ALTER COLUMN "id_morador" DROP NOT NULL;

CREATE UNIQUE INDEX "ocorrencia_protocolo_key" ON "ocorrencia"("protocolo");
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_id_condominio_fkey"
    FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_id_autor_fkey"
    FOREIGN KEY ("id_autor") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ocorrencia" DROP CONSTRAINT "ocorrencia_id_morador_fkey";
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_id_morador_fkey"
    FOREIGN KEY ("id_morador") REFERENCES "morador"("id_morador") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ocorrencia" ADD CONSTRAINT ck_ocorrencia_categoria
    CHECK (categoria IN ('manutencao', 'limpeza', 'elevador', 'iluminacao', 'outros'));

-- ---------------------------------------------------------------
-- comunicado (aviso): validade, edicao e remocao logica
-- ---------------------------------------------------------------
ALTER TABLE "comunicado"
    ADD COLUMN "expira_em"     TIMESTAMP(6),
    ADD COLUMN "atualizado_em" TIMESTAMP(6),
    ADD COLUMN "removido_em"   TIMESTAMP(6);

-- ---------------------------------------------------------------
-- encomenda: status "entregue" (historia 8.1 e API) no lugar de "retirada"
-- ---------------------------------------------------------------
ALTER TABLE "encomenda" DROP CONSTRAINT ck_encomenda_status;
UPDATE "encomenda" SET "status" = 'entregue' WHERE "status" = 'retirada';
ALTER TABLE "encomenda" ADD CONSTRAINT ck_encomenda_status
    CHECK (status IN ('aguardando_retirada', 'entregue'));

-- ---------------------------------------------------------------
-- visitante: tipo (visitante ou prestador) e observacao
-- ---------------------------------------------------------------
ALTER TABLE "visitante"
    ADD COLUMN "tipo"       VARCHAR(20) NOT NULL DEFAULT 'visitante',
    ADD COLUMN "observacao" VARCHAR(255);
ALTER TABLE "visitante" ADD CONSTRAINT ck_visitante_tipo
    CHECK (tipo IN ('visitante', 'prestador'));

-- ---------------------------------------------------------------
-- lancamento: mais de uma multa ou taxa extra por mes; so a cota e unica
-- ---------------------------------------------------------------
DROP INDEX "lancamento_id_unidade_tipo_competencia_key";
ALTER TABLE "lancamento" ADD COLUMN "descricao" VARCHAR(150);
CREATE UNIQUE INDEX lancamento_cota_unica
    ON "lancamento" ("id_unidade", "competencia") WHERE tipo = 'cota_condominial';

-- ---------------------------------------------------------------
-- Indices nas chaves estrangeiras mais consultadas
-- ---------------------------------------------------------------
CREATE INDEX "token_redefinicao_senha_id_usuario_criado_em_idx" ON "token_redefinicao_senha"("id_usuario", "criado_em");
CREATE INDEX "token_redefinicao_senha_token_hash_idx" ON "token_redefinicao_senha"("token_hash");
CREATE INDEX "morador_id_unidade_idx" ON "morador"("id_unidade");
CREATE INDEX "comunicado_id_condominio_data_publicacao_idx" ON "comunicado"("id_condominio", "data_publicacao");
CREATE INDEX "prestador_id_condominio_idx" ON "prestador"("id_condominio");
CREATE INDEX "faq_id_condominio_idx" ON "faq"("id_condominio");
CREATE INDEX "reserva_id_area_inicio_idx" ON "reserva"("id_area", "inicio");
CREATE INDEX "reserva_id_morador_idx" ON "reserva"("id_morador");
CREATE INDEX "encomenda_id_unidade_status_idx" ON "encomenda"("id_unidade", "status");
CREATE INDEX "visitante_id_unidade_data_entrada_idx" ON "visitante"("id_unidade", "data_entrada");
CREATE INDEX "ocorrencia_id_condominio_status_idx" ON "ocorrencia"("id_condominio", "status");
CREATE INDEX "ocorrencia_id_autor_idx" ON "ocorrencia"("id_autor");
CREATE INDEX "historico_ocorrencia_id_ocorrencia_data_alteracao_idx" ON "historico_ocorrencia"("id_ocorrencia", "data_alteracao");
CREATE INDEX "lancamento_id_unidade_vencimento_idx" ON "lancamento"("id_unidade", "vencimento");
CREATE INDEX "despesa_id_condominio_competencia_idx" ON "despesa"("id_condominio", "competencia");
