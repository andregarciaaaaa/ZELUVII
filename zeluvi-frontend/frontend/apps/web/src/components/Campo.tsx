export function Campo({id,rotulo,erro,ajuda,children}:{id:string;rotulo:string;erro?:string|null;ajuda?:string;children:React.ReactNode}){
  return <div className={'campo'+(erro?' tem-erro':'')}><label htmlFor={id}>{rotulo}</label>{children}
    {erro?<span className="erro" role="alert">⚠ {erro}</span>:ajuda&&<span className="small sub">{ajuda}</span>}</div>;
}
