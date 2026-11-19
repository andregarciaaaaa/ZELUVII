import { useState } from 'react'; import { validarEmail } from '@zeluvi/shared';
import { useSessao } from '../session'; import { Campo } from '../components/Campo'; import { Link } from '../router';
export function EsqueciSenha(){
  const {api}=useSessao(); const [email,setEmail]=useState(''); const [erro,setErro]=useState<string|null>(null); const [enviado,setEnviado]=useState(false); const [c,setC]=useState(false);
  async function enviar(e:React.FormEvent){ e.preventDefault(); const v=validarEmail(email); setErro(v); if(v) return; setC(true);
    try{ await api.esqueciSenha(email.trim()); }catch{} /* resposta neutra: nunca revela se o e-mail existe */ setEnviado(true); setC(false); }
  if(enviado) return <div className="centro"><div className="card"><div className="logo">Zeluvi</div><h2>Verifique seu e-mail</h2>
    <p className="alerta ok" role="status">✓ Se o endereço estiver cadastrado, enviaremos um link para redefinir sua senha.</p><Link to="/login" className="btn sec">Voltar para o login</Link></div></div>;
  return <div className="centro"><form className="card" onSubmit={enviar} noValidate><div className="logo">Zeluvi</div><h2>Recuperar senha</h2><p className="sub">Informe o e-mail vinculado à sua conta.</p>
    <Campo id="email" rotulo="E-mail" erro={erro}><input id="email" type="email" placeholder="nome@exemplo.com" value={email} onChange={e=>setEmail(e.target.value)}/></Campo>
    <button className="btn big" disabled={c}>Enviar instruções</button><p><Link to="/login">← Voltar para o login</Link></p></form></div>;
}
