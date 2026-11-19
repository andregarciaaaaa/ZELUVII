import { lerErro, erroSemConexao } from './errors';
import type { Sessao } from './types';
export interface Armazenamento { ler():Sessao|null; gravar(s:Sessao|null):void }
/** Cliente stateless: Bearer no cabeçalho, refresh rotativo em 401 e Idempotency-Key em escritas. */
export function criarCliente(baseUrl:string, store:Armazenamento) {
  let renovando:Promise<boolean>|null=null;
  async function renovar():Promise<boolean>{
    const s=store.ler(); if(!s) return false;
    try{
      const r=await fetch(`${baseUrl}/auth/refresh`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
      if(!r.ok){ store.gravar(null); return false; }
      store.gravar({...s,...(await r.json())}); return true;
    }catch{ return false; }
  }
  async function req<T>(metodo:string, caminho:string, corpo?:unknown, tentou=false):Promise<T>{
    const h:Record<string,string>={'Content-Type':'application/json'};
    const s=store.ler(); if(s) h.Authorization=`Bearer ${s.access_token}`;
    if(metodo!=='GET') h['Idempotency-Key']=crypto.randomUUID();
    let res:Response;
    try{ res=await fetch(baseUrl+caminho,{method:metodo,headers:h,body:corpo?JSON.stringify(corpo):undefined}); }
    catch{ throw erroSemConexao(); }
    if(res.status===401 && !tentou && s){ renovando??=renovar().finally(()=>{renovando=null;}); if(await renovando) return req(metodo,caminho,corpo,true); }
    if(!res.ok) throw await lerErro(res);
    return res.status===204 ? (undefined as T) : res.json();
  }
  return { get:<T>(c:string)=>req<T>('GET',c), post:<T>(c:string,b?:unknown)=>req<T>('POST',c,b), patch:<T>(c:string,b?:unknown)=>req<T>('PATCH',c,b) };
}
export type Cliente=ReturnType<typeof criarCliente>;
