/* ============================================================
   ZELUVI — cliente da API (script comum, carregado antes do React)
   Guarda o token, chama /api/v1 e converte erros no formato { codigo, mensagem, detalhes }.
   ============================================================ */
(function () {
  // Mesma origem por padrão (o backend serve este front). Para apontar outro servidor:
  //   <script>window.ZELUVI_API_URL = "http://localhost:3000/api/v1"</script> antes deste arquivo.
  const BASE = window.ZELUVI_API_URL || "/api/v1";
  const CHAVE_TOKEN = "zeluvi.token";
  const TZ = "America/Sao_Paulo";

  const guardar = {
    ler() { try { return localStorage.getItem(CHAVE_TOKEN); } catch (e) { return null; } },
    gravar(t) { try { localStorage.setItem(CHAVE_TOKEN, t); } catch (e) { /* sem storage: sessão só em memória */ } },
    limpar() { try { localStorage.removeItem(CHAVE_TOKEN); } catch (e) { /* ignora */ } },
  };
  let tokenEmMemoria = guardar.ler();
  let aoExpirar = null;

  class ApiError extends Error {
    constructor(status, codigo, mensagem, detalhes) {
      super(mensagem);
      this.status = status; this.codigo = codigo; this.mensagem = mensagem; this.detalhes = detalhes || [];
    }
  }

  async function request(metodo, caminho, corpo, { semToken = false } = {}) {
    const headers = {};
    if (corpo !== undefined) headers["Content-Type"] = "application/json";
    if (!semToken && tokenEmMemoria) headers.Authorization = "Bearer " + tokenEmMemoria;
    let res;
    try {
      res = await fetch(BASE + caminho, { method: metodo, headers, body: corpo !== undefined ? JSON.stringify(corpo) : undefined });
    } catch (e) {
      throw new ApiError(0, "SEM_CONEXAO", "Não foi possível falar com o servidor. Verifique se a API está rodando.");
    }
    if (res.status === 204) return null;
    let json = null;
    try { json = await res.json(); } catch (e) { /* sem corpo */ }
    if (!res.ok) {
      const erro = (json && json.erro) || {};
      const err = new ApiError(res.status, erro.codigo || "ERRO", erro.mensagem || "Erro inesperado.", erro.detalhes);
      // 401 fora do login = sessão vencida: volta para a tela de entrada
      if (res.status === 401 && !semToken && aoExpirar) aoExpirar(err);
      throw err;
    }
    return json;
  }

  const qs = (obj) => {
    const p = new URLSearchParams();
    Object.entries(obj || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.set(k, v); });
    const s = p.toString();
    return s ? "?" + s : "";
  };

  // ---- datas no fuso do condomínio ----
  const fmtParts = (d, opts) => new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, ...opts }).format(new Date(d));
  const fmt = {
    data: (d) => (d ? fmtParts(d, { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"),
    dataCurta: (d) => (d ? fmtParts(d, { day: "2-digit", month: "2-digit" }) : "—"),
    hora: (d) => (d ? fmtParts(d, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }) : "—"),
    dataHora: (d) => (d ? fmt.dataCurta(d) + " " + fmt.hora(d) : "—"),
    // 'YYYY-MM-DD' de um instante, no fuso local
    iso(d) { const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d)); return p; },
    hoje() { return fmt.iso(new Date()); },
    somarDias(dataStr, n) { const d = new Date(dataStr + "T12:00:00-03:00"); d.setUTCDate(d.getUTCDate() + n); return fmt.iso(d); },
    // 'YYYY-MM-DD' + 'HH:mm' (horário de Brasília) -> ISO com fuso
    instante: (dataStr, hhmm) => new Date(dataStr + "T" + hhmm + ":00-03:00").toISOString(),
    // 'YYYY-MM-DD' (coluna DATE) -> dd/mm/aaaa sem deslocar de dia
    dataSql: (s) => (s ? s.slice(8, 10) + "/" + s.slice(5, 7) + "/" + s.slice(0, 4) : "—"),
    brl: (n) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  };

  function mensagemDeErro(e) {
    if (!e) return "Erro inesperado.";
    if (e.detalhes && e.detalhes.length) return e.mensagem + " " + e.detalhes.map((d) => d.mensagem).join(" ");
    return e.mensagem || "Erro inesperado.";
  }

  const ROLE_DA_API = { MORADOR: "morador", SINDICO: "sindico", PORTEIRO: "portaria" };

  const get = (c, params) => request("GET", c + qs(params));
  const post = (c, corpo) => request("POST", c, corpo || {});
  const patch = (c, corpo) => request("PATCH", c, corpo || {});
  const del = (c) => request("DELETE", c);

  window.ZeluviAPI = {
    BASE, ApiError, fmt, mensagemDeErro, ROLE_DA_API,
    temToken: () => Boolean(tokenEmMemoria),
    aoExpirar: (fn) => { aoExpirar = fn; },
    sair() { tokenEmMemoria = null; guardar.limpar(); },
    async login(email, senha) {
      const r = await request("POST", "/auth/login", { email, senha }, { semToken: true });
      tokenEmMemoria = r.token; guardar.gravar(r.token);
      return r.usuario;
    },
    me: () => get("/auth/me"),
    esqueciSenha: (email) => request("POST", "/auth/esqueci-senha", { email }, { semToken: true }),
    redefinirSenha: (token, novaSenha, confirmacaoSenha) => request("POST", "/auth/redefinir-senha", { token, novaSenha, confirmacaoSenha }, { semToken: true }),
    get, post, patch, del,
  };
})();
