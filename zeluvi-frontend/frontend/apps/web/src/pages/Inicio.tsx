import { useEffect, useState } from 'react'; import type { Aviso } from '@zeluvi/shared';
import { useSessao } from '../session'; import { Link } from '../router';
export function Inicio(){
  const {api,sessao}=useSessao(); const [avisos,setA]=useState<Aviso[]>([]); const [erro,setE]=useState('');
  useEffect(()=>{api.comunicados().then(setA).catch(e=>setE(e.message));},[api]);
  const nome=sessao!.usuario.nome.split(' ')[0]; const ehMorador=sessao!.usuario.perfil==='morador';
  return <><h1>Olá, {nome}!</h1><p className="sub">{sessao!.usuario.unidade??'Visão geral do condomínio'}</p>
    {ehMorador&&<><h2 style={{margin:'24px 0 12px'}}>Acesso rápido</h2><div className="grid"><Link className="card" to="/ocorrencias"><h3>Nova ocorrência</h3><p className="sub small">Manutenção, limpeza, iluminação</p></Link>
      <Link className="card" to="/reservas"><h3>Reservar área comum</h3><p className="sub small">Salão de festas e áreas comuns</p></Link>
      <Link className="card" to="/mudanca"><h3>Avisar mudança</h3><p className="sub small">Entrada ou saída</p></Link></div></>}
    <h2 style={{margin:'24px 0 12px'}}>Comunicados recentes</h2>{erro&&<div className="alerta" role="alert">{erro}</div>}
    <div className="grid">{avisos.slice(0,3).map(a=><article className="card" key={a.id_comunicado}><span className="selo t-info">{a.lido?'Lido':'Novo'}</span><h3>{a.titulo}</h3><p className="sub small">{a.conteudo}</p></article>)}</div></>;
}
