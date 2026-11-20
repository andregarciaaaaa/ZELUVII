/** Tipos alinhados ao DER final / dicionário de dados (SCRUM-67). Valores fixos em minúsculo, sem acento. */
export type Perfil = 'morador'|'sindico'|'porteiro'|'administracao';
export type StatusReserva = 'pendente'|'confirmada'|'recusada'|'cancelada';
export type StatusOcorrencia = 'solicitada'|'em_andamento'|'aguardando_terceiro'|'resolvida'|'cancelada';
export type StatusEncomenda = 'aguardando_retirada'|'retirada';
export interface Usuario { id_usuario:number; nome:string; email:string; perfil:Perfil; id_condominio:number; id_unidade?:number; unidade?:string }
export interface Sessao { access_token:string; refresh_token:string; usuario:Usuario }
export interface AreaComum { id_area:number; nome:string; regras?:string; capacidade?:number }
export interface Reserva { id_reserva:number; id_area:number; id_morador:number; inicio:string; fim:string; status:StatusReserva; area?:string }
export interface NovaReserva { id_area:number; inicio:string; fim:string; convidados?:number; observacao?:string }
/** Aviso como a API do back-end devolve (GET /avisos). */
export interface Aviso { id:number; titulo:string; conteudo:string; autor:{id:number;nome:string}; publicadoEm:string; expiraEm:string|null; atualizadoEm:string|null }
export interface NovoAviso { titulo:string; conteudo:string }
