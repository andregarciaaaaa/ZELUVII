import { useState } from 'react'; import { ApiError, validarEmail, validarSenhaLogin } from '@zeluvi/shared';
import { useSessao } from '../session'; import { Campo } from '../components/Campo'; import { Link, ir } from '../router';
export function Login(){
  const {api,entrar}=useSessao(); const [email,setEmail]=useState(''); const [senha,setSenha]=useState(''); const [manter,setManter]=useState(false);
  const [erros,setErros]=useState<Record<string,string|null>>({}); const [geral,setGeral]=useState(''); const [carregando,setC]=useState(false);
  async function enviar(e:React.FormEvent){ e.preventDefault(); setGeral('');
    const er={email:validarEmail(email),senha:validarSenhaLogin(senha)}; setErros(er); if(er.email||er.senha) return;
    setC(true); try{ entrar(await api.login(email.trim(),senha,manter)); ir('/'); }
    catch(x){ setGeral(x instanceof ApiError&&x.status===401?'E-mail ou senha incorretos. Tente novamente.':(x as Error).message); }
    finally{ setC(false); } }
  return <div className="centro"><form className="card" onSubmit={enviar} noValidate>
    <div className="logo">Zeluvi</div><h2>Acesse sua conta</h2><p className="sub">Entre para acompanhar seu condomínio.</p>
    {geral&&<div className="alerta" role="alert">! {geral}</div>}
    <Campo id="email" rotulo="E-mail" erro={erros.email}><input id="email" type="email" autoComplete="username" placeholder="nome@exemplo.com" value={email} onChange={e=>setEmail(e.target.value)}/></Campo>
    <Campo id="senha" rotulo="Senha" erro={erros.senha}><input id="senha" type="password" autoComplete="current-password" placeholder="Digite sua senha" value={senha} onChange={e=>setSenha(e.target.value)}/></Campo>
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><label><input type="checkbox" checked={manter} onChange={e=>setManter(e.target.checked)}/> Manter conectado</label><Link to="/esqueci-senha">Esqueci minha senha</Link></div>
    <button className="btn big" disabled={carregando}>{carregando?'Entrando…':'Entrar'}</button>
    <p className="small sub" style={{textAlign:'center'}}>Acesso seguro ao seu condomínio</p></form></div>;
}
