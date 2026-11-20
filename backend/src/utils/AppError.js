// Erro de negocio com status HTTP e codigo fixo (Arquitetura do Back-end, 3.3).
// Os services lancam: throw new AppError(404, 'NAO_ENCONTRADO', 'Aviso nao encontrado.')
class AppError extends Error {
  constructor(status, codigo, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.mensagem = mensagem;
    this.detalhes = detalhes;
  }
}

module.exports = AppError;
