import { useState } from 'react'; import { Text, View } from 'react-native';
import { validarEmail } from '@zeluvi/shared'; import { Campo, Botao, Alerta, s } from '../ui'; import { useSessao } from '../session';
export function EsqueciSenha({voltar}:{voltar():void}){
  const {api}=useSessao(); const [email,setEmail]=useState(''); const [erro,setErro]=useState<string|null>(null); const [ok,setOk]=useState(false);
  async function enviar(){ const v=validarEmail(email); setErro(v); if(v) return; try{await api.esqueciSenha(email.trim());}catch{} setOk(true); }
  return <View style={[s.tela,{justifyContent:'center'}]}><Text style={s.h1}>{ok?'Verifique seu e-mail':'Recuperar senha'}</Text>
    {ok?<Alerta ok texto="✓ Se o endereço estiver cadastrado, enviaremos um link para redefinir sua senha."/>:<>
      <Text style={[s.sub,{marginBottom:16}]}>Informe o e-mail vinculado à sua conta.</Text>
      <Campo rotulo="E-mail" erro={erro} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
      <Botao texto="Enviar instruções" onPress={enviar}/></>}
    <View style={{height:12}}/><Botao variante="texto" texto="← Voltar para o login" onPress={voltar}/></View>;
}
