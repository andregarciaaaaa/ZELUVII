-- CreateTable
CREATE TABLE "perfil" (
    "id_perfil" SERIAL NOT NULL,
    "nome" VARCHAR(30) NOT NULL,
    "descricao" VARCHAR(255),

    CONSTRAINT "perfil_pkey" PRIMARY KEY ("id_perfil")
);

-- CreateTable
CREATE TABLE "condominio" (
    "id_condominio" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "endereco" VARCHAR(255) NOT NULL,

    CONSTRAINT "condominio_pkey" PRIMARY KEY ("id_condominio")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "telefone" VARCHAR(11),
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "token_redefinicao_senha" (
    "id_token" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expira_em" TIMESTAMP(6) NOT NULL,
    "usado_em" TIMESTAMP(6),
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_redefinicao_senha_pkey" PRIMARY KEY ("id_token")
);

-- CreateTable
CREATE TABLE "usuario_condominio" (
    "id_vinculo" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_condominio" INTEGER NOT NULL,
    "id_perfil" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_condominio_pkey" PRIMARY KEY ("id_vinculo")
);

-- CreateTable
CREATE TABLE "unidade" (
    "id_unidade" SERIAL NOT NULL,
    "id_condominio" INTEGER NOT NULL,
    "identificacao" VARCHAR(30) NOT NULL,
    "bloco" VARCHAR(30),
    "numero" VARCHAR(20),

    CONSTRAINT "unidade_pkey" PRIMARY KEY ("id_unidade")
);

-- CreateTable
CREATE TABLE "morador" (
    "id_morador" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_unidade" INTEGER NOT NULL,
    "tipo_vinculo" VARCHAR(30) NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "morador_pkey" PRIMARY KEY ("id_morador")
);

-- CreateTable
CREATE TABLE "comunicado" (
    "id_comunicado" SERIAL NOT NULL,
    "id_condominio" INTEGER NOT NULL,
    "id_autor" INTEGER NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "conteudo" TEXT NOT NULL,
    "data_publicacao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comunicado_pkey" PRIMARY KEY ("id_comunicado")
);

-- CreateTable
CREATE TABLE "prestador" (
    "id_prestador" SERIAL NOT NULL,
    "id_condominio" INTEGER NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "servico" VARCHAR(100) NOT NULL,
    "telefone" VARCHAR(30),
    "observacoes" TEXT,

    CONSTRAINT "prestador_pkey" PRIMARY KEY ("id_prestador")
);

-- CreateTable
CREATE TABLE "faq" (
    "id_faq" SERIAL NOT NULL,
    "id_condominio" INTEGER NOT NULL,
    "pergunta" VARCHAR(255) NOT NULL,
    "resposta" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "faq_pkey" PRIMARY KEY ("id_faq")
);

-- CreateTable
CREATE TABLE "area_comum" (
    "id_area" SERIAL NOT NULL,
    "id_condominio" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "regras" TEXT,
    "capacidade" INTEGER,

    CONSTRAINT "area_comum_pkey" PRIMARY KEY ("id_area")
);

-- CreateTable
CREATE TABLE "reserva" (
    "id_reserva" SERIAL NOT NULL,
    "id_area" INTEGER NOT NULL,
    "id_morador" INTEGER NOT NULL,
    "inicio" TIMESTAMP(6) NOT NULL,
    "fim" TIMESTAMP(6) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pendente',
    "id_decidido_por" INTEGER,
    "decidido_em" TIMESTAMP(6),

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("id_reserva")
);

-- CreateTable
CREATE TABLE "encomenda" (
    "id_encomenda" SERIAL NOT NULL,
    "id_unidade" INTEGER NOT NULL,
    "id_registrado_por" INTEGER NOT NULL,
    "id_retirado_por" INTEGER,
    "descricao" VARCHAR(255) NOT NULL,
    "transportadora" VARCHAR(60),
    "codigo_rastreio" VARCHAR(40),
    "data_recebimento" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_retirada" TIMESTAMP(6),
    "status" VARCHAR(20) NOT NULL DEFAULT 'aguardando_retirada',

    CONSTRAINT "encomenda_pkey" PRIMARY KEY ("id_encomenda")
);

-- CreateTable
CREATE TABLE "visitante" (
    "id_visitante" SERIAL NOT NULL,
    "id_unidade" INTEGER NOT NULL,
    "id_registrado_por" INTEGER NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "documento" VARCHAR(20),
    "motivo" VARCHAR(100),
    "data_entrada" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_saida" TIMESTAMP(6),

    CONSTRAINT "visitante_pkey" PRIMARY KEY ("id_visitante")
);

-- CreateTable
CREATE TABLE "ocorrencia" (
    "id_ocorrencia" SERIAL NOT NULL,
    "id_morador" INTEGER NOT NULL,
    "assunto" VARCHAR(150) NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'solicitada',
    "data_abertura" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocorrencia_pkey" PRIMARY KEY ("id_ocorrencia")
);

-- CreateTable
CREATE TABLE "historico_ocorrencia" (
    "id_historico" SERIAL NOT NULL,
    "id_ocorrencia" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "status_anterior" VARCHAR(30),
    "status_novo" VARCHAR(30) NOT NULL,
    "observacao" TEXT,
    "data_alteracao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_ocorrencia_pkey" PRIMARY KEY ("id_historico")
);

-- CreateTable
CREATE TABLE "lancamento" (
    "id_lancamento" SERIAL NOT NULL,
    "id_unidade" INTEGER NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "competencia" DATE NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "vencimento" DATE NOT NULL,
    "data_pagamento" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pendente',
    "boleto_url" VARCHAR(500),

    CONSTRAINT "lancamento_pkey" PRIMARY KEY ("id_lancamento")
);

-- CreateTable
CREATE TABLE "despesa" (
    "id_despesa" SERIAL NOT NULL,
    "id_condominio" INTEGER NOT NULL,
    "categoria" VARCHAR(30) NOT NULL,
    "descricao" VARCHAR(150) NOT NULL,
    "fornecedor" VARCHAR(120),
    "valor" DECIMAL(10,2) NOT NULL,
    "competencia" DATE NOT NULL,
    "vencimento" DATE NOT NULL,
    "data_pagamento" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pendente',

    CONSTRAINT "despesa_pkey" PRIMARY KEY ("id_despesa")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfil_nome_key" ON "perfil"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_condominio_id_usuario_id_condominio_key" ON "usuario_condominio"("id_usuario", "id_condominio");

-- CreateIndex
CREATE UNIQUE INDEX "unidade_id_condominio_identificacao_key" ON "unidade"("id_condominio", "identificacao");

-- CreateIndex
CREATE UNIQUE INDEX "morador_id_usuario_id_unidade_key" ON "morador"("id_usuario", "id_unidade");

-- CreateIndex
CREATE UNIQUE INDEX "area_comum_id_condominio_nome_key" ON "area_comum"("id_condominio", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "lancamento_id_unidade_tipo_competencia_key" ON "lancamento"("id_unidade", "tipo", "competencia");

-- AddForeignKey
ALTER TABLE "token_redefinicao_senha" ADD CONSTRAINT "token_redefinicao_senha_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_condominio" ADD CONSTRAINT "usuario_condominio_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_condominio" ADD CONSTRAINT "usuario_condominio_id_condominio_fkey" FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_condominio" ADD CONSTRAINT "usuario_condominio_id_perfil_fkey" FOREIGN KEY ("id_perfil") REFERENCES "perfil"("id_perfil") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidade" ADD CONSTRAINT "unidade_id_condominio_fkey" FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "morador" ADD CONSTRAINT "morador_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "morador" ADD CONSTRAINT "morador_id_unidade_fkey" FOREIGN KEY ("id_unidade") REFERENCES "unidade"("id_unidade") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicado" ADD CONSTRAINT "comunicado_id_condominio_fkey" FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicado" ADD CONSTRAINT "comunicado_id_autor_fkey" FOREIGN KEY ("id_autor") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestador" ADD CONSTRAINT "prestador_id_condominio_fkey" FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq" ADD CONSTRAINT "faq_id_condominio_fkey" FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_comum" ADD CONSTRAINT "area_comum_id_condominio_fkey" FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "area_comum"("id_area") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_id_morador_fkey" FOREIGN KEY ("id_morador") REFERENCES "morador"("id_morador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_id_decidido_por_fkey" FOREIGN KEY ("id_decidido_por") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomenda" ADD CONSTRAINT "encomenda_id_unidade_fkey" FOREIGN KEY ("id_unidade") REFERENCES "unidade"("id_unidade") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomenda" ADD CONSTRAINT "encomenda_id_registrado_por_fkey" FOREIGN KEY ("id_registrado_por") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomenda" ADD CONSTRAINT "encomenda_id_retirado_por_fkey" FOREIGN KEY ("id_retirado_por") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitante" ADD CONSTRAINT "visitante_id_unidade_fkey" FOREIGN KEY ("id_unidade") REFERENCES "unidade"("id_unidade") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitante" ADD CONSTRAINT "visitante_id_registrado_por_fkey" FOREIGN KEY ("id_registrado_por") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_id_morador_fkey" FOREIGN KEY ("id_morador") REFERENCES "morador"("id_morador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_ocorrencia" ADD CONSTRAINT "historico_ocorrencia_id_ocorrencia_fkey" FOREIGN KEY ("id_ocorrencia") REFERENCES "ocorrencia"("id_ocorrencia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_ocorrencia" ADD CONSTRAINT "historico_ocorrencia_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamento" ADD CONSTRAINT "lancamento_id_unidade_fkey" FOREIGN KEY ("id_unidade") REFERENCES "unidade"("id_unidade") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesa" ADD CONSTRAINT "despesa_id_condominio_fkey" FOREIGN KEY ("id_condominio") REFERENCES "condominio"("id_condominio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ZELUVI - regras que o Prisma nao consegue descrever no schema.prisma.
-- Rode DEPOIS de criar as tabelas com a migracao do Prisma (veja o PASSO_A_PASSO.md).
-- Sao as mesmas regras do schema.sql versao 4.

-- usuario: telefone so com numeros e DDD
ALTER TABLE usuario ADD CONSTRAINT ck_usuario_telefone
    CHECK (telefone ~ '^[0-9]{10,11}$');

-- morador: tipo do vinculo
ALTER TABLE morador ADD CONSTRAINT ck_morador_tipo_vinculo
    CHECK (tipo_vinculo IN ('proprietario', 'inquilino'));

-- reserva (RN05 e RN06): status, horarios fixos de 3 horas e indice unico parcial
ALTER TABLE reserva ADD CONSTRAINT ck_reserva_status
    CHECK (status IN ('pendente', 'confirmada', 'recusada', 'cancelada'));
ALTER TABLE reserva ADD CONSTRAINT ck_reserva_inicio
    CHECK (inicio::time IN ('09:00', '12:00', '15:00', '18:00'));
ALTER TABLE reserva ADD CONSTRAINT ck_reserva_fim
    CHECK (fim = inicio + INTERVAL '3 hours');
-- pendente e confirmada seguram o horario; recusada e cancelada liberam
CREATE UNIQUE INDEX reserva_sem_duplicidade
    ON reserva (id_area, inicio)
    WHERE status IN ('pendente', 'confirmada');

-- encomenda
ALTER TABLE encomenda ADD CONSTRAINT ck_encomenda_status
    CHECK (status IN ('aguardando_retirada', 'retirada'));

-- visitante: a saida nao pode ser antes da entrada
ALTER TABLE visitante ADD CONSTRAINT ck_visitante_saida
    CHECK (data_saida IS NULL OR data_saida >= data_entrada);

-- ocorrencia (RN08): so 5 status
ALTER TABLE ocorrencia ADD CONSTRAINT ck_ocorrencia_status
    CHECK (status IN ('solicitada', 'em_andamento', 'aguardando_terceiro', 'resolvida', 'cancelada'));
ALTER TABLE historico_ocorrencia ADD CONSTRAINT ck_historico_status_anterior
    CHECK (status_anterior IN ('solicitada', 'em_andamento', 'aguardando_terceiro', 'resolvida', 'cancelada'));
ALTER TABLE historico_ocorrencia ADD CONSTRAINT ck_historico_status_novo
    CHECK (status_novo IN ('solicitada', 'em_andamento', 'aguardando_terceiro', 'resolvida', 'cancelada'));

-- lancamento (taxas)
ALTER TABLE lancamento ADD CONSTRAINT ck_lancamento_tipo
    CHECK (tipo IN ('cota_condominial', 'taxa_extra', 'multa'));
ALTER TABLE lancamento ADD CONSTRAINT ck_lancamento_valor CHECK (valor > 0);
ALTER TABLE lancamento ADD CONSTRAINT ck_lancamento_status
    CHECK (status IN ('pendente', 'pago'));
ALTER TABLE lancamento ADD CONSTRAINT ck_lancamento_pagamento
    CHECK ((status = 'pago' AND data_pagamento IS NOT NULL)
        OR (status = 'pendente' AND data_pagamento IS NULL));
ALTER TABLE lancamento ADD CONSTRAINT ck_lancamento_competencia
    CHECK (EXTRACT(DAY FROM competencia) = 1);

-- despesa
ALTER TABLE despesa ADD CONSTRAINT ck_despesa_categoria
    CHECK (categoria IN ('folha', 'manutencao', 'agua_energia', 'limpeza', 'seguranca', 'administrativo'));
ALTER TABLE despesa ADD CONSTRAINT ck_despesa_valor CHECK (valor > 0);
ALTER TABLE despesa ADD CONSTRAINT ck_despesa_status
    CHECK (status IN ('pendente', 'pago'));
ALTER TABLE despesa ADD CONSTRAINT ck_despesa_pagamento
    CHECK ((status = 'pago' AND data_pagamento IS NOT NULL)
        OR (status = 'pendente' AND data_pagamento IS NULL));
ALTER TABLE despesa ADD CONSTRAINT ck_despesa_competencia
    CHECK (EXTRACT(DAY FROM competencia) = 1);