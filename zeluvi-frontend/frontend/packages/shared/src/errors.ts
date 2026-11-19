/** Aceita {erro:{codigo,mensagem,detalhes:[{campo,mensagem}]}} (Autenticação/Moradores) e RFC 9457 {codigo,detail,erros:[...]} (Arquitetura). */
export class ApiError extends Error {
  constructor(public status:number, public codigo:string, mensagem:string, public campos:Record<string,string>={}) { super(mensagem); }
}
export async function lerErro(res:Response):Promise<ApiError> {
  let b:any={}; try{ b=await res.json(); }catch{}
  const e=b.erro??b;
  const lista=e.detalhes??e.erros??[];
  const campos:Record<string,string>={}; for(const d of lista) if(d.campo) campos[d.campo]=d.mensagem;
  return new ApiError(res.status, e.codigo??'DESCONHECIDO', e.mensagem??e.detail??'Algo deu errado. Tente novamente.', campos);
}
export const erroSemConexao=()=>new ApiError(0,'SEM_CONEXAO','Sem conexão. Verifique a internet e tente novamente.');
