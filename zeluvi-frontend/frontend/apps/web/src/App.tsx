import { useEffect } from 'react'; import { SessaoProvider, useSessao } from './session'; import { useRota, ir } from './router'; import { Layout } from './components/Layout';
import { Login } from './pages/Login'; import { EsqueciSenha } from './pages/EsqueciSenha'; import { RedefinirSenha } from './pages/RedefinirSenha';
import { Inicio } from './pages/Inicio'; import { Reservas } from './pages/Reservas';
const publicas=['/login','/esqueci-senha','/redefinir-senha'];
function Rotas(){
  const {sessao}=useSessao(); const rota=useRota(); const publica=publicas.includes(rota);
  useEffect(()=>{ if(!sessao&&!publica) ir('/login'); else if(sessao&&publica) ir('/'); },[sessao,publica]);
  if(!sessao) return rota==='/esqueci-senha'?<EsqueciSenha/>:rota==='/redefinir-senha'?<RedefinirSenha/>:<Login/>;
  return <Layout>{rota==='/reservas'?<Reservas/>:rota==='/'?<Inicio/>:<><h1>Em construção</h1><p className="sub">Esta tela será feita a partir do próximo protótipo.</p></>}</Layout>;
}
export const App=()=><SessaoProvider><Rotas/></SessaoProvider>;
