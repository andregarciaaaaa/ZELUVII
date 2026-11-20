import { useEffect, useState } from 'react';
/** Roteador mínimo por pathname (sem dependências extras). */
export const useRota=()=>{const [p,setP]=useState(location.pathname);useEffect(()=>{const f=()=>setP(location.pathname);addEventListener('popstate',f);return()=>removeEventListener('popstate',f);},[]);return p;};
export const ir=(to:string)=>{history.pushState({},'',to);dispatchEvent(new PopStateEvent('popstate'));};
export const Link=({to,children,...r}:{to:string;children:React.ReactNode}&React.AnchorHTMLAttributes<HTMLAnchorElement>)=>
  <a href={to} onClick={e=>{e.preventDefault();ir(to);}} {...r}>{children}</a>;
