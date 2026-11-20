import type { Cliente } from './http';
import type { Sessao, Perfil, AreaComum, Reserva, NovaReserva, Aviso, NovoAviso } from './types';
/** Resposta do POST /auth/login do back-end: { token, usuario } com perfil em MAIÚSCULO. */
interface LoginApi { token:string; usuario:{ id:number; nome:string; email:string; perfil:string; condominioId:number; unidade:{id:number;numero:string;bloco?:string|null}|null } }
const PERFIL:Record<string,Perfil>={ SINDICO:'sindico', MORADOR:'morador', PORTEIRO:'porteiro' };
/** Converte a resposta do back-end para a Sessao usada pelo front. A API ainda não tem refresh token. */
const paraSessao=(r:LoginApi):Sessao=>({
  access_token:r.token, refresh_token:'',
  usuario:{ id_usuario:r.usuario.id, nome:r.usuario.nome, email:r.usuario.email, perfil:PERFIL[r.usuario.perfil]??'morador',
    id_condominio:r.usuario.condominioId, id_unidade:r.usuario.unidade?.id,
    unidade:r.usuario.unidade?`Unidade ${r.usuario.unidade.bloco?r.usuario.unidade.bloco+'-':''}${r.usuario.unidade.numero}`:undefined },
});
/** Caminhos de acordo com o back-end (prefixo /api/v1, definido em session.tsx). Reservas ainda seguem o contrato antigo. */
export const criarApi=(c:Cliente)=>({
  /** "manter conectado" ainda não existe no back-end (sem refresh token): o parâmetro é aceito e ignorado. */
  login:(email:string,senha:string,_manter=false)=>c.post<LoginApi>('/auth/login',{email,senha}).then(paraSessao),
  esqueciSenha:(email:string)=>c.post<{mensagem:string}>('/auth/esqueci-senha',{email}),
  redefinirSenha:(token:string,nova_senha:string)=>c.post<{mensagem:string}>('/auth/redefinir-senha',{token,nova_senha}),
  areas:()=>c.get<AreaComum[]>('/areas-comuns'),
  ocupados:(id_area:number,data:string)=>c.get<{inicio:string}[]>(`/areas-comuns/${id_area}/disponibilidade?data=${data}`),
  minhasReservas:()=>c.get<Reserva[]>('/reservas?minhas=true'),
  reservar:(r:NovaReserva)=>c.post<Reserva>('/reservas',r),
  cancelarReserva:(id:number)=>c.patch<Reserva>(`/reservas/${id}`,{status:'cancelada'}),
  avisos:()=>c.get<{dados:Aviso[]}>('/avisos').then(r=>r.dados),
  criarAviso:(a:NovoAviso)=>c.post<Aviso>('/avisos',a),
  editarAviso:(id:number,a:Partial<NovoAviso>)=>c.patch<Aviso>(`/avisos/${id}`,a),
  removerAviso:(id:number)=>c.del<void>(`/avisos/${id}`),
});
export type Api=ReturnType<typeof criarApi>;
