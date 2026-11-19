import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { criarCliente, criarApi, type Sessao, type Api } from '@zeluvi/shared';
const KEY='zeluvi.sessao';
const BASE=(import.meta as any).env?.VITE_API_URL ?? '/api/v1';
interface Ctx{ sessao:Sessao|null; api:Api; entrar(s:Sessao):void; sair():void }
const C=createContext<Ctx>(null!);
export const useSessao=()=>useContext(C);
export function SessaoProvider({children}:{children:ReactNode}){
  const [sessao,setSessao]=useState<Sessao|null>(()=>{try{return JSON.parse(localStorage.getItem(KEY)??'null');}catch{return null;}});
  const value=useMemo<Ctx>(()=>{
    let atual=sessao;
    const grava=(s:Sessao|null)=>{atual=s;setSessao(s);s?localStorage.setItem(KEY,JSON.stringify(s)):localStorage.removeItem(KEY);};
    const api=criarApi(criarCliente(BASE,{ler:()=>atual,gravar:grava}));
    return {sessao,api,entrar:grava,sair:()=>grava(null)};
  },[sessao]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
