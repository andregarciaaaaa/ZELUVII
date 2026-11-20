import type { Reserva } from './types';
/** Dicionário de dados: início só às 09h, 12h, 15h ou 18h; duração sempre 3 h. (O protótipo mostra manhã/tarde/noite com outros horários: ajustar protótipo ou banco.) */
export const PERIODOS=[
  {hora:9,rotulo:'Manhã · 9h às 12h'},{hora:12,rotulo:'Meio-dia · 12h às 15h'},
  {hora:15,rotulo:'Tarde · 15h às 18h'},{hora:18,rotulo:'Noite · 18h às 21h'},
] as const;
export const periodoDe=(data:string,hora:number)=>{
  const ini=new Date(`${data}T${String(hora).padStart(2,'0')}:00:00`); const fim=new Date(ini.getTime()+3*3600e3);
  return {inicio:ini.toISOString(),fim:fim.toISOString()};
};
export const horasOcupadas=(ocupados:{inicio:string}[])=>new Set(ocupados.map(o=>new Date(o.inicio).getHours()));
export const STATUS_RESERVA:Record<Reserva['status'],{texto:string;tom:'atencao'|'sucesso'|'erro'|'info'}>={
  pendente:{texto:'Aguardando aprovação',tom:'atencao'}, confirmada:{texto:'Confirmada',tom:'sucesso'},
  recusada:{texto:'Recusada',tom:'erro'}, cancelada:{texto:'Cancelada',tom:'info'}};
