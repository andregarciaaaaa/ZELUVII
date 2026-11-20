import { useEffect, useState } from 'react'; import { ApiError, type Aviso } from '@zeluvi/shared';
import { useSessao } from '../session'; import { Campo } from '../components/Campo';
/** Mesmas regras da API: título de 3 a 150 caracteres, conteúdo de 1 a 5000. */
const validarTitulo=(v:string)=>v.trim().length>=3&&v.trim().length<=150?null:'O título deve ter de 3 a 150 caracteres.';
const validarConteudo=(v:string)=>v.trim().length>=1&&v.trim().length<=5000?null:'Escreva o conteúdo do aviso (até 5000 caracteres).';
const data=(iso:string)=>new Date(iso).toLocaleString('pt-BR',{dateStyle:'long',timeStyle:'short'});
/** Todos os perfis leem os avisos; só o síndico publica, edita e remove (CRUD de Avisos). */
export function Comunicados(){
  const {api,sessao}=useSessao(); const ehSindico=sessao!.usuario.perfil==='sindico';
  const [avisos,setAvisos]=useState<Aviso[]>([]); const [carregando,setCarregando]=useState(true);
  const [editando,setEditando]=useState<Aviso|null>(null); const [titulo,setTitulo]=useState(''); const [conteudo,setConteudo]=useState('');
  const [erros,setErros]=useState<Record<string,string|null>>({}); const [msg,setMsg]=useState<{ok:boolean;t:string}|null>(null); const [enviando,setEnviando]=useState(false);
  const carregar=()=>api.avisos().then(setAvisos).catch(e=>setMsg({ok:false,t:e.message})).finally(()=>setCarregando(false));
  useEffect(()=>{carregar();},[api]);
  function limpar(){ setEditando(null); setTitulo(''); setConteudo(''); setErros({}); }
  function editar(a:Aviso){ setEditando(a); setTitulo(a.titulo); setConteudo(a.conteudo); setErros({}); setMsg(null); window.scrollTo({top:0,behavior:'smooth'}); }
  async function salvar(e:React.FormEvent){ e.preventDefault(); setMsg(null);
    const er={titulo:validarTitulo(titulo),conteudo:validarConteudo(conteudo)}; setErros(er); if(er.titulo||er.conteudo) return;
    const corpo={titulo:titulo.trim(),conteudo:conteudo.trim()}; setEnviando(true);
    try{ if(editando) await api.editarAviso(editando.id,corpo); else await api.criarAviso(corpo);
      setMsg({ok:true,t:editando?'Aviso atualizado.':'Aviso publicado.'}); limpar(); await carregar(); }
    catch(x){ if(x instanceof ApiError&&Object.keys(x.campos).length) setErros(x.campos); setMsg({ok:false,t:(x as Error).message}); }
    finally{ setEnviando(false); } }
  async function remover(a:Aviso){ if(!window.confirm(`Remover o aviso "${a.titulo}"?`)) return; setMsg(null);
    try{ await api.removerAviso(a.id); if(editando?.id===a.id) limpar(); setMsg({ok:true,t:'Aviso removido.'}); await carregar(); }
    catch(x){ setMsg({ok:false,t:(x as Error).message}); } }
  return <><h1>Comunicados</h1><p className="sub">{ehSindico?'Publique avisos para os moradores e a portaria.':'Avisos publicados pela administração do condomínio.'}</p>
    {msg&&<div className={'alerta'+(msg.ok?' ok':'')} role="alert">{msg.t}</div>}
    {ehSindico&&<form className="card" onSubmit={salvar} noValidate style={{maxWidth:640,marginBottom:24}}>
      <h2 style={{marginBottom:12}}>{editando?'Editar aviso':'Novo aviso'}</h2>
      <Campo id="titulo" rotulo="Título" erro={erros.titulo}><input id="titulo" maxLength={150} placeholder="Ex.: Manutenção dos elevadores" value={titulo} onChange={e=>setTitulo(e.target.value)}/></Campo>
      <Campo id="conteudo" rotulo="Conteúdo" erro={erros.conteudo}><textarea id="conteudo" maxLength={5000} placeholder="Escreva o aviso para os moradores" value={conteudo} onChange={e=>setConteudo(e.target.value)}/></Campo>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        {editando&&<button type="button" className="btn sec" onClick={limpar}>Cancelar</button>}
        <button className="btn" disabled={enviando}>{enviando?'Salvando…':editando?'Salvar alterações':'Publicar aviso'}</button></div></form>}
    {carregando?<p className="sub">Carregando avisos…</p>:avisos.length===0?<p className="sub">Nenhum aviso publicado por enquanto.</p>:
    <div className="grid">{avisos.map(a=><article className="card" key={a.id}>
      <span className="selo t-info">{data(a.publicadoEm)}</span><h3 style={{marginTop:8}}>{a.titulo}</h3>
      <p className="sub" style={{whiteSpace:'pre-wrap'}}>{a.conteudo}</p>
      <p className="small sub">Por {a.autor.nome}{a.atualizadoEm?` · editado em ${data(a.atualizadoEm)}`:''}</p>
      {ehSindico&&<div style={{display:'flex',gap:8}}><button className="btn sec" onClick={()=>editar(a)}>Editar</button>
        <button className="btn del" onClick={()=>remover(a)}>Remover</button></div>}</article>)}</div>}</>;
}
