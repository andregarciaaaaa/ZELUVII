import { useState } from 'react'; import { ActivityIndicator, Pressable, SafeAreaView, Text, View } from 'react-native'; import { StatusBar } from 'expo-status-bar';
import { cores } from '@zeluvi/shared'; import { SessaoProvider, useSessao } from './src/session';
import { Login } from './src/screens/Login'; import { EsqueciSenha } from './src/screens/EsqueciSenha'; import { Reservas } from './src/screens/Reservas'; import { s, Botao } from './src/ui';
// Barra inferior com até 5 itens (Guia 03); o restante fica em "Mais".
const ABAS=[['inicio','Início'],['avisos','Avisos'],['ocorr','Ocorr.'],['reservas','Reservas'],['mais','Mais']] as const;
function Raiz(){
  const {sessao,carregando,sair}=useSessao(); const [pub,setPub]=useState<'login'|'esqueci'>('login'); const [aba,setAba]=useState<string>('inicio');
  if(carregando) return <ActivityIndicator style={{flex:1}} color={cores.petroleo600}/>;
  if(!sessao) return pub==='login'?<Login irEsqueci={()=>setPub('esqueci')}/>:<EsqueciSenha voltar={()=>setPub('login')}/>;
  return <SafeAreaView style={{flex:1,backgroundColor:cores.fundo}}><View style={{flex:1}}>
    {aba==='reservas'?<Reservas/>:aba==='mais'?<View style={s.tela}><Botao texto="Sair" variante="secundario" onPress={sair}/></View>
      :<View style={s.tela}><Text style={s.h1}>Olá, {sessao.usuario.nome.split(' ')[0]}!</Text><Text style={s.sub}>{sessao.usuario.unidade}</Text></View>}</View>
    <View style={{flexDirection:'row',backgroundColor:cores.branco,borderTopWidth:1,borderColor:cores.cinza200}}>{ABAS.map(([k,r])=>
      <Pressable key={k} accessibilityRole="tab" accessibilityState={{selected:aba===k}} onPress={()=>setAba(k)} style={{flex:1,minHeight:56,alignItems:'center',justifyContent:'center'}}>
        <Text style={{color:aba===k?cores.petroleo600:cores.cinza600,fontWeight:aba===k?'700':'400'}}>{r}</Text></Pressable>)}</View></SafeAreaView>;
}
export default function App(){ return <SessaoProvider><StatusBar style="dark"/><Raiz/></SessaoProvider>; }
