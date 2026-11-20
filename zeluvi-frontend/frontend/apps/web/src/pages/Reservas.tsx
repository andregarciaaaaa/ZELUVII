import { useEffect, useState } from 'react';
import { ApiError, PERIODOS, periodoDe, horasOcupadas, STATUS_RESERVA, type AreaComum, type Reserva } from '@zeluvi/shared';
import { useSessao } from '../session'; import { Campo } from '../components/Campo';
const hoje=()=>new Date().toISOString().slice(0,10);
export function Reservas(){
  const {api}=useSessao(); const [areas,setAreas]=useState<AreaComum[]>([]); const [area,setArea]=useState<number>(); const [data,setData]=useState(hoje());
  const [ocup,setOcup]=useState<Set<number>>(new Set()); const [hora,setHora]=useState<number|null>(null); const [conv,setConv]=useState(''); const [obs,setObs]=useState('');
  const [minhas,setMinhas]=useState<Reserva[]>([]); const [msg,setMsg]=useState<{ok:boolean;t:string}|null>(null);
  const carregarMinhas=()=>api.minhasReservas().then(setMinhas).catch(()=>{});
  useEffect(()=>{api.areas().then(a=>{setAreas(a);setArea(a[0]?.id_area);}).catch(e=>setMsg({ok:false,t:e.message}));carregarMinhas();},[api]);
  const atualizar=()=>area&&api.ocupados(area,data).then(o=>setOcup(horasOcupadas(o))).catch(()=>setOcup(new Set()));
  useEffect(()=>{setHora(null);atualizar();},[area,data]);
  async function confirmar(){ if(!area||hora===null) return setMsg({ok:false,t:'Escolha um período livre.'});
    try{ await api.reservar({id_area:area,...periodoDe(data,hora),convidados:conv?+conv:undefined,observacao:obs||undefined});
      setMsg({ok:true,t:'Reserva enviada. Aguardando aprovação do síndico.'}); setHora(null); atualizar(); carregarMinhas(); }
    catch(e){ if(e instanceof ApiError&&e.codigo==='CONFLITO'){ setMsg({ok:false,t:'Horário indisponível. Esse período acabou de ser reservado. Escolha um dos horários livres.'}); atualizar(); } else setMsg({ok:false,t:(e as Error).message}); } }
  return <><h1>Reservas</h1><p className="sub">Escolha a área, o dia e um período livre.</p>
    {msg&&<div className={'alerta'+(msg.ok?' ok':'')} role="alert">{msg.t}</div>}
    <div className="card" style={{maxWidth:640}}>
      <Campo id="area" rotulo="Área comum"><select id="area" value={area} onChange={e=>setArea(+e.target.value)}>{areas.map(a=><option key={a.id_area} value={a.id_area}>{a.nome}</option>)}</select></Campo>
      <Campo id="data" rotulo="Data"><input id="data" type="date" min={hoje()} value={data} onChange={e=>setData(e.target.value)}/></Campo>
      <div className="campo"><span id="per" style={{fontWeight:600,fontSize:14}}>Período da reserva</span>
        <div role="group" aria-labelledby="per" style={{display:'flex',gap:8,flexWrap:'wrap'}}>{PERIODOS.map(p=>{const o=ocup.has(p.hora);
          return <button type="button" key={p.hora} className="chip" disabled={o} aria-pressed={hora===p.hora} onClick={()=>setHora(p.hora)}>{o?p.rotulo.split(' · ')[0]+' · Ocupado':p.rotulo}</button>;})}</div>
        <span className="small sub">Os períodos ocupados aparecem tracejados.</span></div>
      <Campo id="conv" rotulo="Número de convidados"><input id="conv" inputMode="numeric" placeholder="Ex.: 40" value={conv} onChange={e=>setConv(e.target.value.replace(/\D/g,''))}/></Campo>
      <Campo id="obs" rotulo="Observação (opcional)"><textarea id="obs" placeholder="Ex.: festa de aniversário infantil" value={obs} onChange={e=>setObs(e.target.value)}/></Campo>
      <div style={{textAlign:'right'}}><button className="btn" onClick={confirmar} disabled={hora===null}>Confirmar reserva</button></div></div>
    <h2 style={{margin:'32px 0 12px'}}>Minhas reservas</h2>
    <div className="grid">{minhas.map(r=>{const s=STATUS_RESERVA[r.status];return <article className="card" key={r.id_reserva}>
      <span className={'selo t-'+s.tom}>{s.texto}</span><h3>{r.area??'Área comum'}</h3>
      <p className="sub small">{new Date(r.inicio).toLocaleString('pt-BR',{dateStyle:'full',timeStyle:'short'})}</p>
      {(r.status==='pendente'||r.status==='confirmada')&&<button className="btn txt" style={{color:'#B3261E'}} onClick={()=>api.cancelarReserva(r.id_reserva).then(carregarMinhas)}>Cancelar</button>}</article>;})}</div></>;
}
