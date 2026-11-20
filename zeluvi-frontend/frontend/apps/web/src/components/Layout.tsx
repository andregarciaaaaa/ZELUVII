import { menuPorPerfil, grupoDoPerfil } from '@zeluvi/shared';
import { useSessao } from '../session'; import { Link, useRota } from '../router';
export function Layout({children}:{children:React.ReactNode}){
  const {sessao,sair}=useSessao(); const rota=useRota(); if(!sessao) return null;
  const g=grupoDoPerfil(sessao.usuario.perfil); const ini=sessao.usuario.nome.split(' ').map(s=>s[0]).slice(0,2).join('');
  return <div className="app"><nav className="menu" aria-label="Menu principal">
    <div className="logo">Zeluvi</div><div className="small sub" style={{padding:'0 12px 12px'}}>{g==='morador'?'MORADOR':g==='portaria'?'PORTARIA':'SÍNDICO / ADMINISTRAÇÃO'}</div>
    {menuPorPerfil[g].map(i=><Link key={i.rota} to={i.rota} aria-current={rota===i.rota?'page':undefined}>{i.rotulo}</Link>)}
    <div className="rodape"><strong>{ini} {sessao.usuario.nome}</strong><div className="small sub">{sessao.usuario.unidade??'Administração'}</div>
      <button className="btn txt" onClick={sair}>Sair</button></div></nav><main>{children}</main></div>;
}
