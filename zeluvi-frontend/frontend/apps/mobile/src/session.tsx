import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { criarCliente, criarApi, type Sessao, type Api } from '@zeluvi/shared';
const BASE=process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api/v1'; // 10.0.2.2 = localhost no emulador Android
interface Ctx{ sessao:Sessao|null; carregando:boolean; api:Api; entrar(s:Sessao):void; sair():void }
const C=createContext<Ctx>(null!); export const useSessao=()=>useContext(C);
export function SessaoProvider({children}:{children:ReactNode}){
  const [sessao,setSessao]=useState<Sessao|null>(null); const [carregando,setCar]=useState(true); const ref=useRef<Sessao|null>(null);
  const grava=(s:Sessao|null)=>{ref.current=s;setSessao(s);if(s)SecureStore.setItemAsync('sessao',JSON.stringify(s));else SecureStore.deleteItemAsync('sessao');};
  useEffect(()=>{SecureStore.getItemAsync('sessao').then(v=>{if(v){ref.current=JSON.parse(v);setSessao(ref.current);}}).finally(()=>setCar(false));},[]);
  const api=useMemo(()=>criarApi(criarCliente(BASE,{ler:()=>ref.current,gravar:grava})),[]);
  return <C.Provider value={{sessao,carregando,api,entrar:grava,sair:()=>grava(null)}}>{children}</C.Provider>;
}
