-- ZELUVI - Avisos (tabela comunicado)
-- Campos exigidos pela "Especificacao da API de Avisos, Ocorrencias e Portaria v1.0" (secao 3)
-- que nao existiam na migracao inicial:
--   expira_em     -> aviso vigente ate essa data (historia 2.1: "comunicados vigentes")
--   atualizado_em -> data da ultima edicao (PATCH /avisos/:id)
--   removido_em   -> exclusao logica (DELETE /avisos/:id guarda o registro para auditoria)

ALTER TABLE "comunicado" ADD COLUMN "expira_em" TIMESTAMP(6);
ALTER TABLE "comunicado" ADD COLUMN "atualizado_em" TIMESTAMP(6);
ALTER TABLE "comunicado" ADD COLUMN "removido_em" TIMESTAMP(6);

-- Um aviso nao pode expirar antes de ser publicado
ALTER TABLE comunicado ADD CONSTRAINT ck_comunicado_expiracao
    CHECK (expira_em IS NULL OR expira_em > data_publicacao);

-- A listagem sempre filtra por condominio e ignora os removidos
CREATE INDEX "comunicado_id_condominio_removido_em_idx" ON "comunicado"("id_condominio", "removido_em");
