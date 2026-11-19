import type { Cliente } from './http';
import type { Sessao, AreaComum, Reserva, NovaReserva, Aviso } from './types';
/** ATENÇÃO: os caminhos abaixo seguem a convenção do repositório; confirmar com as Especificações da API (há divergência /api/v1 x /v1). */
export const criarApi=(c:Cliente)=>({
  login:(email:string,senha:string,manter=false)=>c.post<Sessao>('/auth/login',{email,senha,manter_conectado:manter}),
  esqueciSenha:(email:string)=>c.post<{mensagem:string}>('/auth/esqueci-senha',{email}),
  redefinirSenha:(token:string,nova_senha:string)=>c.post<{mensagem:string}>('/auth/redefinir-senha',{token,nova_senha}),
  areas:()=>c.get<AreaComum[]>('/areas-comuns'),
  ocupados:(id_area:number,data:string)=>c.get<{inicio:string}[]>(`/areas-comuns/${id_area}/disponibilidade?data=${data}`),
  minhasReservas:()=>c.get<Reserva[]>('/reservas?minhas=true'),
  reservar:(r:NovaReserva)=>c.post<Reserva>('/reservas',r),
  cancelarReserva:(id:number)=>c.patch<Reserva>(`/reservas/${id}`,{status:'cancelada'}),
  comunicados:()=>c.get<Aviso[]>('/comunicados'),
});
export type Api=ReturnType<typeof criarApi>;
