// Erro de negocio com o formato unico da API: { erro: { codigo, mensagem, detalhes } }.
class AppError extends Error {
  constructor(status, codigo, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.mensagem = mensagem;
    this.detalhes = detalhes;
  }

  static validacao(detalhes, mensagem = 'Dados inválidos.') {
    return new AppError(400, 'VALIDACAO', mensagem, detalhes);
  }
  static naoAutenticado(mensagem = 'Token inválido ou expirado.') {
    return new AppError(401, 'NAO_AUTENTICADO', mensagem);
  }
  static semPermissao(mensagem = 'Seu perfil não tem acesso a esta ação.') {
    return new AppError(403, 'SEM_PERMISSAO', mensagem);
  }
  static naoEncontrado(mensagem = 'Registro não encontrado.') {
    return new AppError(404, 'NAO_ENCONTRADO', mensagem);
  }
  static conflito(mensagem) {
    return new AppError(409, 'CONFLITO', mensagem);
  }
}

module.exports = AppError;
