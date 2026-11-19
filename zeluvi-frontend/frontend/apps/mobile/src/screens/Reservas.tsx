import { useEffect, useState } from 'react'; import { ScrollView, Text, View } from 'react-native';
import { ApiError, PERIODOS, periodoDe, horasOcupadas, STATUS_RESERVA, cores, type AreaComum, type Reserva } from '@zeluvi/shared';
import { Campo, Botao, Chip, Card, Alerta, s } from '../ui'; import { useSessao } from '../session';
const hoje=()=>new Date().toISOString().slice(0,10);
export function Reservas(){
  const {api}=useSessao(); const [areas,setAreas]=useState<AreaComum[]>([]); const [area,setArea]=useState<number>(); const [data,setData]=useState(hoje());
  const [ocup,setOcup]=useState<Set<number>>(new Set()); const [hora,setHora]=useState<number|null>(null); const [conv,setConv]=useState(''); const [minhas,setMinhas]=useState<Reserva[]>([]); const [msg,setMsg]=useState<{ok:boolean;t:string}|null>(null);
  const carregar=()=>api.minhasReservas().then(setMinhas).catch(()=>{});
  useEffect(()=>{api.areas().then(a=>{setAreas(a);setArea(a[0]?.id_area);}).catch(e=>setMsg({ok:false,t:e.message}));carregar();},[]);
  const atualizar=()=>area&&/^\d{4}-\d{2}-\d{2}$/.test(data)&&api.ocupados(area,data).then(o=>setOcup(horasOcupadas(o))).catch(()=>setOcup(new Set()));
  useEffect(()=>{setHora(null);atualizar();},[area,data]);
  async function confirmar(){ if(!area||hora===null) return; try{ await api.reservar({id_area:area,...periodoDe(data,hora),convidados:conv?+conv:undefined});
      setMsg({ok:true,t:'Reserva enviada. Aguardando aprovação do síndico.'}); setHora(null); atualizar(); carregar(); }
    catch(e){ if(e instanceof ApiError&&e.codigo==='CONFLITO'){ setMsg({ok:false,t:'Horário indisponível. Escolha um dos períodos livres.'}); atualizar(); } else setMsg({ok:false,t:(e as Error).message}); } }
  return <ScrollView style={{flex:1,backgroundColor:cores.fundo}} contentContainerStyle={{padding:24}}><Text style={s.h1}>Reservas</Text><Text style={[s.sub,{marginBottom:16}]}>Escolha a área, o dia e um período livre.</Text>
    {msg?<Alerta ok={msg.ok} texto={msg.t}/>:null}
    <Card><Text style={s.rotulo}>Área comum</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:16}}>{areas.map(a=><Chip key={a.id_area} texto={a.nome} ativo={area===a.id_area} onPress={()=>setArea(a.id_area)}/>)}</View>
      <Campo rotulo="Data (AAAA-MM-DD)" value={data} onChangeText={setData} keyboardType="numbers-and-punctuation"/>
      <Text style={s.rotulo}>Período da reserva</Text><View style={{gap:8,marginBottom:16}}>{PERIODOS.map(p=><Chip key={p.hora} texto={ocup.has(p.hora)?p.rotulo.split(' · ')[0]+' · Ocupado':p.rotulo} ativo={hora===p.hora} desabilitado={ocup.has(p.hora)} onPress={()=>setHora(p.hora)}/>)}</View>
      <Campo rotulo="Número de convidados" value={conv} onChangeText={t=>setConv(t.replace(/\D/g,''))} keyboardType="number-pad" placeholder="Ex.: 40"/>
      <Botao texto="Confirmar reserva" onPress={confirmar} desabilitado={hora===null}/></Card>
    <Text style={[s.h1,{fontSize:22,marginVertical:8}]}>Minhas reservas</Text>
    {minhas.map(r=>{const st=STATUS_RESERVA[r.status];return <Card key={r.id_reserva}><Text style={{color:cores[st.tom].texto,fontWeight:'600'}}>{st.texto}</Text><Text style={{fontWeight:'700',fontSize:18}}>{r.area??'Área comum'}</Text><Text style={s.sub}>{new Date(r.inicio).toLocaleString('pt-BR')}</Text>
      {(r.status==='pendente'||r.status==='confirmada')&&<Botao variante="texto" texto="Cancelar" onPress={()=>api.cancelarReserva(r.id_reserva).then(carregar)}/>}</Card>;})}</ScrollView>;
}
