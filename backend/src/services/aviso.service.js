// Regras de negocio dos avisos (Especificacao da API de Avisos, Ocorrencias e Portaria v1.0, secao 3)
const avisoRepository = require('../repositories/aviso.repository');
const AppError = require('../utils/AppError');

const NAO_ENCONTRADO = () => new AppError(404, 'NAO_ENCONTRADO', 'Aviso nao encontrado.');

// Formato de saida da API (nomes da spec, nao os nomes das colunas)
function paraResposta(aviso) {
  return {
    id: aviso.id,
    titulo: aviso.titulo,
    conteudo: aviso.conteudo,
    autor: aviso.autor ? { id: aviso.autor.id, nome: aviso.autor.nome } : null,
    publicadoEm: aviso.dataPublicacao,
    expiraEm: aviso.expiraEm,
    atualizadoEm: aviso.atualizadoEm,
  };
}

function expirado(aviso) {
  return aviso.expiraEm !== null && aviso.expiraEm <= new Date();
}

// Busca o aviso do condominio do usuario; morador e porteiro nao enxergam avisos expirados
async function obter(id, usuario) {
  const aviso = await avisoRepository.buscarPorId(id, usuario.condominioId);
  if (!aviso) throw NAO_ENCONTRADO();
  if (expirado(aviso) && usuario.perfil !== 'SINDICO') throw NAO_ENCONTRADO();
  return aviso;
}

module.exports = {
  async listar({ limite, cursor, incluirExpirados }, usuario) {
    const avisos = await avisoRepository.listar({
      condominioId: usuario.condominioId,
      // So o sindico pode ver os expirados
      incluirExpirados: usuario.perfil === 'SINDICO' && incluirExpirados,
      limite,
      cursor,
    });

    const temMais = avisos.length > limite;
    const pagina = temMais ? avisos.slice(0, limite) : avisos;

    return {
      dados: pagina.map(paraResposta),
      proximoCursor: temMais ? String(pagina[pagina.length - 1].id) : null,
    };
  },

  async buscar(id, usuario) {
    return paraResposta(await obter(id, usuario));
  },

  async criar(dados, usuario) {
    // Autor e condominio vem do token, nunca do corpo
    const aviso = await avisoRepository.criar({
      titulo: dados.titulo,
      conteudo: dados.conteudo,
      expiraEm: dados.expiraEm ?? null,
      dataPublicacao: new Date(), // explicito: mesma referencia de fuso (UTC) que o expiraEm
      condominioId: usuario.condominioId,
      autorId: usuario.id,
    });
    return paraResposta(aviso);
  },

  async atualizar(id, dados, usuario) {
    await obter(id, usuario);
    const aviso = await avisoRepository.atualizar(id, { ...dados, atualizadoEm: new Date() });
    return paraResposta(aviso);
  },

  async remover(id, usuario) {
    await obter(id, usuario);
    await avisoRepository.remover(id);
  },
};
