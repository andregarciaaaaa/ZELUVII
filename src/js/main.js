/* ============================================================
   ZELUVI — raiz do app: sessão real (JWT), roteamento por perfil e notificações
   ============================================================ */

function RedefinirSenhaScreen() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [senha, setSenha] = useState("");
  const [conf, setConf] = useState("");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setLoading(true); setErro("");
    try {
      await ZeluviAPI.redefinirSenha(token, senha, conf);
      setOk(true);
    } catch (err) { setErro(mensagemDeErro(err)); } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: FONT_BODY }}>
      <Card style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}><Building2 size={17} color="#fff" /></div>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, color: C.ink }}>Zeluvi</span>
        </div>
        {ok ? (
          <>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 8 }}>Senha criada!</div>
            <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 18 }}>Sua senha foi alterada com sucesso. Agora é só entrar.</div>
            <Button style={{ width: "100%" }} onClick={() => { window.location.href = "/"; }}>Ir para o login</Button>
          </>
        ) : (
          <form onSubmit={enviar}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 6 }}>Criar nova senha</div>
            <div style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 16 }}>Use pelo menos 8 caracteres, com letra e número.</div>
            {!token && <MsgErroForm msg="Link inválido: falta o código de redefinição. Peça um novo link na tela de login." />}
            <Field label="Nova senha"><input required type="password" autoComplete="new-password" style={inputStyle} value={senha} onChange={(e) => setSenha(e.target.value)} /></Field>
            <Field label="Confirme a nova senha"><input required type="password" autoComplete="new-password" style={inputStyle} value={conf} onChange={(e) => setConf(e.target.value)} /></Field>
            <MsgErroForm msg={erro} />
            <Button type="submit" style={{ width: "100%" }} disabled={loading || !token}>{loading ? "Salvando..." : "Salvar nova senha"}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}

// Notificações montadas a partir do resumo da API (tempo real por WebSocket/push fica para a integração)
async function carregarNotificacoes(role) {
  const [resumo, avisos] = await Promise.all([ZeluviAPI.get("/dashboard"), ZeluviAPI.get("/avisos", { limite: 3 })]);
  const lista = [];
  avisos.dados.forEach((a) => lista.push({ id: `aviso-${a.id}`, texto: `Aviso: ${a.titulo}`, tempo: fmt.data(a.publicadoEm) }));
  if (resumo.encomendasPendentes) lista.push({ id: "enc", texto: `${resumo.encomendasPendentes} encomenda(s) aguardando retirada.`, tempo: "agora" });
  if (resumo.ocorrenciasEmAberto) lista.push({ id: "oc", texto: `${resumo.ocorrenciasEmAberto} ocorrência(s) em aberto.`, tempo: "agora" });
  if (role === "sindico" && resumo.reservasPendentesDeAprovacao) lista.push({ id: "res", texto: `${resumo.reservasPendentesDeAprovacao} reserva(s) aguardando sua aprovação.`, tempo: "agora" });
  if (role === "sindico" && resumo.cobrancasEmAtraso) lista.push({ id: "cob", texto: `${resumo.cobrancasEmAtraso} cobrança(s) em atraso.`, tempo: "agora" });
  if (role === "morador" && resumo.cobrancasPendentes) lista.push({ id: "cobm", texto: `${resumo.cobrancasPendentes} cobrança(s) pendente(s).`, tempo: "agora" });
  return lista;
}

function usuarioParaUi(u) {
  return {
    id: u.id, name: u.nome, email: u.email,
    unidade: u.unidade ? u.unidade.numero : "-",
    bloco: u.unidade && u.unidade.bloco ? `Bloco ${u.unidade.bloco}` : "",
  };
}

function App() {
  const [session, setSession] = useState(null); // { role, user }
  const [iniciando, setIniciando] = useState(ZeluviAPI.temToken());
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [toast, setToast] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  }

  function entrar(usuarioApi) {
    setSession({ role: ZeluviAPI.ROLE_DA_API[usuarioApi.perfil], user: usuarioParaUi(usuarioApi) });
    setPage("dashboard");
  }
  function sair(motivo) {
    ZeluviAPI.sair();
    setSession(null); setNotifs([]); setPage("dashboard");
    if (motivo) showToast(motivo);
  }

  // Sessão guardada: confere o token com /auth/me ao abrir a página
  useEffect(() => {
    ZeluviAPI.aoExpirar(() => sair("Sua sessão expirou. Entre novamente."));
    if (!ZeluviAPI.temToken()) return;
    ZeluviAPI.me().then(entrar).catch(() => ZeluviAPI.sair()).finally(() => setIniciando(false));
    // eslint-disable-next-line
  }, []);

  // Notificações: carrega ao entrar e a cada minuto
  useEffect(() => {
    if (!session) return undefined;
    let vivo = true;
    const carregar = () => carregarNotificacoes(session.role).then((n) => {
      if (vivo) setNotifs((antigas) => n.map((x) => ({ ...x, lida: (antigas.find((a) => a.id === x.id) || {}).lida || false })));
    }).catch(() => {});
    carregar();
    const t = setInterval(carregar, 60000);
    return () => { vivo = false; clearInterval(t); };
  }, [session && session.user.id]);

  if (window.location.pathname === "/redefinir-senha") return <RedefinirSenhaScreen />;
  if (iniciando) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, color: C.textMuted, fontFamily: FONT_BODY }}>Carregando Zeluvi…</div>;
  if (!session) return <LoginScreen onLogin={entrar} />;

  const { role, user } = session;
  const navItems = NAV[role];
  const pageTitle = page === "dashboard" ? `Olá, ${user.name.split(" ")[0]}` : (navItems.find((n) => n.id === page)?.label || "Zeluvi");
  const props = { role, user, showToast, setPage };

  let content;
  switch (page) {
    case "dashboard":
      content = role === "morador" ? <DashboardMorador {...props} /> : role === "sindico" ? <DashboardSindico {...props} /> : <DashboardPortaria {...props} />;
      break;
    case "ocorrencias": content = <OcorrenciasPage {...props} />; break;
    case "reservas": content = <ReservasPage {...props} />; break;
    case "comunicados": content = <ComunicadosPage {...props} />; break;
    case "entregas": content = <EntregasPage {...props} />; break;
    case "visitantes": content = <VisitantesPage {...props} />; break;
    case "financeiro": content = <FinanceiroPage {...props} />; break;
    case "moradores": content = <MoradoresPage {...props} />; break;
    case "funcionarios": content = <FuncionariosPage {...props} />; break;
    case "comunidade":
    case "prestadores": content = <InformacoesPage {...props} />; break;
    case "perfil": content = <PerfilPage {...props} />; break;
    case "copiloto": content = <CopilotoPage />; break;
    default: content = <StubPage id={page} />;
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT_BODY, "--sidebar-width": (collapsed ? 74 : 240) + "px" }}>
      <Sidebar role={role} page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="content-area">
        <Topbar user={user} role={role} onLogout={() => sair()} setMobileOpen={setMobileOpen} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifs={notifs} setNotifs={setNotifs} pageTitle={pageTitle} />
        <div style={{ padding: "0 24px 40px", maxWidth: 1280 }}>
          {content}
        </div>
      </div>
      {toast && (
        <div role="status" className="pop-in" style={{ position: "fixed", bottom: 24, right: 24, background: C.ink, color: "#fff", padding: "12px 18px", borderRadius: 11, fontSize: 13.5, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 12px 32px rgba(15,33,27,0.3)", zIndex: 200, maxWidth: 360 }}>
          <CheckCircle2 size={16} color={C.amber} /> {toast}
        </div>
      )}
    </div>
  );
}

const rootEl = document.getElementById("root");
rootEl.innerHTML = "";
ReactDOM.createRoot(rootEl).render(<App />);
