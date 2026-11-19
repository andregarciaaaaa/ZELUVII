/** Regras dos protótipos de login/recuperação e do dicionário (telefone: só dígitos, 10 ou 11). */
export const validarEmail=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())?null:'Informe um e-mail válido.';
export const validarSenhaLogin=(v:string)=>v?null:'Digite sua senha.';
export const validarNovaSenha=(v:string)=>v.length>=8?null:'A senha precisa ter no mínimo 8 caracteres.';
export const validarConfirmacao=(a:string,b:string)=>a===b?null:'As senhas não coincidem.';
export const validarTelefone=(v:string)=>{const d=v.replace(/\D/g,'');return d===''||d.length===10||d.length===11?null:'Informe o telefone com DDD.';};
