import { useState } from 'react'; import { ApiError, validarNovaSenha, validarConfirmacao } from '@zeluvi/shared';
import { useSessao } from '../session'; import { Campo } from '../components/Campo'; import { Link, ir } from '../router';
export function RedefinirSenha(){
  const {api}=useSessao(); const token=new URLSearchParams(location.search).get('token')??'';
  const [n,setN]=useState(''); const [c,setCf]=useState(''); const [er,setEr]=useState<Record<string,string|null>>({}); const [expirou,setExp]=useState(!token);
  async function enviar(e:React.FormEvent){ e.preventDefault(); const x={n:validarNovaSenha(n),c:validarConfirmacao(n,c)}; setEr(x); if(x.n||x.c) return;
    try{ await api.redefinirSenha(token,n); ir('/login'); }catch(err){ if(err instanceof ApiError&&err.codigo==='TOKEN_REDEFINICAO_INVALIDO') setExp(true); else setEr({n:(err as Error).message}); } }
  if(expirou) return <div className="centro"><div className="card"><h2>Link expirado</h2><p className="sub">O link vale por 30 minutos. Solicite um novo e-mail.</p><Link to="/esqueci-senha" className="btn">Solicitar novo link</Link></div></div>;
  return <div className="centro"><form className="card" onSubmit={enviar} noValidate><div className="logo">Zeluvi</div><h2>Redefinir senha</h2><p className="sub">Crie uma nova senha para sua conta.</p>
    <Campo id="n" rotulo="Nova senha" erro={er.n} ajuda="Mínimo de 8 caracteres."><input id="n" type="password" autoComplete="new-password" value={n} onChange={e=>setN(e.target.value)}/></Campo>
    <Campo id="c" rotulo="Confirmar nova senha" erro={er.c}><input id="c" type="password" autoComplete="new-password" value={c} onChange={e=>setCf(e.target.value)}/></Campo>
    {c&&n===c&&!er.c&&<p role="status" style={{color:'#1B6B45'}}>✓ As senhas coincidem</p>}<button className="btn big">Salvar nova senha</button></form></div>;
}
