import { Text, TextInput, Pressable, View, StyleSheet, type TextInputProps } from 'react-native';
import { cores, espaco, raios, alvoMinimo } from '@zeluvi/shared';
export function Campo({rotulo,erro,...p}:{rotulo:string;erro?:string|null}&TextInputProps){
  return <View style={{marginBottom:espaco.lg}}><Text style={s.rotulo}>{rotulo}</Text>
    <TextInput accessibilityLabel={rotulo} placeholderTextColor={cores.cinza500} style={[s.input,erro?{borderColor:cores.erro.texto}:null]} {...p}/>
    {erro?<Text style={s.erro} accessibilityRole="alert">⚠ {erro}</Text>:null}</View>;
}
export function Botao({texto,onPress,variante='primario',desabilitado}:{texto:string;onPress():void;variante?:'primario'|'secundario'|'texto';desabilitado?:boolean}){
  const p=variante==='primario';
  return <Pressable accessibilityRole="button" disabled={desabilitado} onPress={onPress}
    style={({pressed})=>[s.btn,p&&{backgroundColor:pressed?cores.petroleo800:cores.petroleo600},variante==='secundario'&&{borderWidth:1,borderColor:cores.petroleo600},desabilitado&&{backgroundColor:cores.cinza200}]}>
    <Text style={[s.btnT,!p&&{color:cores.petroleo600}]}>{texto}</Text></Pressable>;
}
export const Chip=({texto,ativo,desabilitado,onPress}:{texto:string;ativo?:boolean;desabilitado?:boolean;onPress():void})=>
  <Pressable accessibilityRole="button" accessibilityState={{selected:!!ativo,disabled:!!desabilitado}} disabled={desabilitado} onPress={onPress}
    style={[s.chip,ativo&&{backgroundColor:cores.petroleo50,borderColor:cores.petroleo600},desabilitado&&{borderStyle:'dashed',backgroundColor:cores.hoverMenu}]}>
    <Text style={{color:ativo?cores.petroleo600:cores.tinta,fontWeight:ativo?'600':'400'}}>{texto}</Text></Pressable>;
export const Card=({children}:{children:React.ReactNode})=><View style={s.card}>{children}</View>;
export const Alerta=({texto,ok}:{texto:string;ok?:boolean})=><View style={[s.alerta,ok&&{backgroundColor:cores.sucesso.fundo}]} accessibilityRole="alert"><Text style={{color:ok?cores.sucesso.texto:cores.erro.texto,fontWeight:'500'}}>{texto}</Text></View>;
export const s=StyleSheet.create({
  rotulo:{fontWeight:'600',fontSize:14,marginBottom:4,color:cores.tinta},
  input:{minHeight:alvoMinimo,borderWidth:1,borderColor:cores.cinza400,borderRadius:raios.controle,paddingHorizontal:espaco.md,backgroundColor:cores.branco,fontSize:16},
  erro:{color:cores.erro.texto,fontSize:13,marginTop:4},
  btn:{minHeight:52,borderRadius:raios.controle,alignItems:'center',justifyContent:'center',paddingHorizontal:20},
  btnT:{color:cores.branco,fontWeight:'600',fontSize:15},
  chip:{minHeight:alvoMinimo,borderRadius:raios.chip,borderWidth:1,borderColor:cores.cinza400,paddingHorizontal:16,justifyContent:'center',backgroundColor:cores.branco},
  card:{backgroundColor:cores.branco,borderWidth:1,borderColor:cores.cinza200,borderRadius:raios.card,padding:20,marginBottom:espaco.lg},
  alerta:{backgroundColor:cores.erro.fundo,borderRadius:raios.controle,padding:espaco.md,marginBottom:espaco.lg},
  h1:{fontSize:28,fontWeight:'700',color:cores.tinta,marginBottom:4},sub:{color:cores.cinza600},
  tela:{flex:1,backgroundColor:cores.fundo,padding:espaco.xl},
});
