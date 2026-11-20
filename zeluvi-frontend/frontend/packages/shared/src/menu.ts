import type { Perfil } from './types';
export interface ItemMenu { rota:string; rotulo:string }
/** Itens do menu por perfil (Guia de estilo 03/04). Web: menu lateral. Mobile: 5 itens na barra + "Mais". */
export const menuPorPerfil:Record<'morador'|'sindico'|'portaria',ItemMenu[]>={
  morador:[['/','Início'],['/comunicados','Comunicados'],['/ocorrencias','Ocorrências'],['/reservas','Reservas'],['/encomendas','Encomendas'],['/mudanca','Avisar mudança'],['/mensagens','Mensagens'],['/assembleias','Assembleias']].map(([rota,rotulo])=>({rota,rotulo})),
  sindico:[['/','Painel executivo'],['/copiloto','Copiloto IA'],['/comunicados','Comunicados'],['/ocorrencias','Ocorrências'],['/reservas','Reservas'],['/moradores','Moradores'],['/automacoes','Automações'],['/assembleias','Assembleias'],['/mensagens','Mensagens']].map(([rota,rotulo])=>({rota,rotulo})),
  portaria:[['/','Início do turno'],['/encomendas','Encomendas'],['/mudancas','Mudanças'],['/ocorrencias','Ocorrências'],['/comunicados','Comunicados'],['/mensagens','Mensagens']].map(([rota,rotulo])=>({rota,rotulo})),
};
export const grupoDoPerfil=(p:Perfil)=>p==='morador'?'morador':p==='porteiro'?'portaria':'sindico';
