import { useState } from 'react'; import { Text, View } from 'react-native';
import { ApiError, validarEmail, validarSenhaLogin } from '@zeluvi/shared';
import { Campo, Botao, Alerta, s } from '../ui'; import { useSessao } from '../session';
export function Login({irEsqueci}:{irEsqueci():void}){
  const {api,entrar}=useSessao(); const [email,setEmail]=useState(''); const [senha,setSenha]=useState(''); const [er,setEr]=useState<Record<string,string|null>>({}); const [geral,setG]=useState(''); const [c,setC]=useState(false);
  async function enviar(){ setG(''); const x={email:validarEmail(email),senha:validarSenhaLogin(senha)}; setEr(x); if(x.email||x.senha) return; setC(true);
    try{ entrar(await api.login(email.trim(),senha,true)); }catch(e){ setG(e instanceof ApiError&&e.status===401?'E-mail ou senha incorretos. Tente novamente.':(e as Error).message); } finally{ setC(false); } }
  return <View style={[s.tela,{justifyContent:'center'}]}><Text style={[s.h1,{color:'#0E4A5A'}]}>Zeluvi</Text><Text style={[s.sub,{marginBottom:24}]}>Entre para acompanhar seu condomínio.</Text>
    {geral?<Alerta texto={'! '+geral}/>:null}
    <Campo rotulo="E-mail" erro={er.email} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="nome@exemplo.com"/>
    <Campo rotulo="Senha" erro={er.senha} value={senha} onChangeText={setSenha} secureTextEntry autoComplete="password" placeholder="Digite sua senha"/>
    <Botao texto={c?'Entrando…':'Entrar'} onPress={enviar} desabilitado={c}/><View style={{height:12}}/><Botao variante="texto" texto="Esqueci minha senha" onPress={irEsqueci}/></View>;
}
