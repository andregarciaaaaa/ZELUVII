/* ============================================================
   ZELUVI — telas ligadas à API (parte 1): utilitários, dashboards, avisos, ocorrências
   Depende de: app.js (UI base) e api.js (ZeluviAPI). Roles da UI: morador | sindico | portaria
   ============================================================ */

const { fmt, mensagemDeErro } = ZeluviAPI;

/* ---------- utilitários ---------- */
function useCarregar(carregar, deps) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null });
  const [n, setN] = useState(0);
  useEffect(() => {
    let vivo = true;
    setEstado((e) => ({ ...e, carregando: true, erro: null }));
    carregar()
      .then((d) => { if (vivo) setEstado({ dados: d, carregando: false, erro: null }); })
      .catch((e) => { if (vivo) setEstado({ dados: null, carregando: false, erro: mensagemDeErro(e) }); });
    return () => { vivo = false; };
    // eslint-disable-next-line
  }, [...deps, n]);
  return { ...estado, recarregar: () => setN((x) => x + 1) };
}

function Carregando({ texto = "Carregando..." }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, color: C.textMuted, fontSize: 14 }}>
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> {texto}
      </div>
    </Card>
  );
}

function CaixaErro({ msg, onRetry }) {
  return (
    <Card>
      <div role="alert" style={{ display: "flex", alignItems: "center", gap: 12, color: C.danger, fontSize: 13.5 }}>
        <AlertTriangle size={18} />
        <span style={{ flex: 1 }}>{msg}</span>
        {onRetry && <Button variant="outline" onClick={onRetry}>Tentar de novo</Button>}
      </div>
    </Card>
  );
}

function MsgErroForm({ msg }) {
  if (!msg) return null;
  return <div role="alert" style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 9, background: C.dangerLight, color: C.danger, fontSize: 13 }}>{msg}</div>;
}

// Executa uma ação da API mostrando o erro em toast; devolve true se deu certo
async function tentar(acao, showToast, sucesso) {
  try {
    await acao();
    if (sucesso) showToast(sucesso);
    return true;
  } catch (e) {
    showToast(mensagemDeErro(e));
    return false;
  }
}

/* ---------- rótulos e estilos ---------- */
const OC_STATUS = {
  SOLICITADA: "Solicitada", EM_ANDAMENTO: "Em andamento", AGUARDANDO_TERCEIRO: "Aguardando terceiro",
  RESOLVIDA: "Resolvida", CANCELADA: "Cancelada",
};
const OC_STYLE = {
  SOLICITADA: { bg: C.amberLight, fg: C.amber },
  EM_ANDAMENTO: { bg: C.primaryLight, fg: C.primary },
  AGUARDANDO_TERCEIRO: { bg: C.infoLight, fg: C.info },
  RESOLVIDA: { bg: C.primaryLight, fg: C.primaryDark },
  CANCELADA: { bg: "#EDEFEC", fg: C.textFaint },
};
const OC_CATEGORIAS = [
  { id: "MANUTENCAO", label: "Manutenção", icon: Wrench },
  { id: "LIMPEZA", label: "Limpeza", icon: Sparkles },
  { id: "ELEVADOR", label: "Elevador", icon: ArrowUpDown },
  { id: "ILUMINACAO", label: "Iluminação", icon: Lightbulb },
  { id: "OUTROS", label: "Outros", icon: MoreHorizontal },
];

function StatusBadge({ status }) {
  const s = OC_STYLE[status] || OC_STYLE.CANCELADA;
  return <Badge bg={s.bg} fg={s.fg}>{OC_STATUS[status] || status}</Badge>;
}

/* ============================================================
   DASHBOARDS
   ============================================================ */
function DashboardMorador({ user, setPage }) {
  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [resumo, avisos, ocorrencias, reservas] = await Promise.all([
      ZeluviAPI.get("/dashboard"),
      ZeluviAPI.get("/avisos", { limite: 3 }),
      ZeluviAPI.get("/ocorrencias", { limite: 20 }),
      ZeluviAPI.get("/reservas", { de: fmt.hoje(), limite: 100 }),
    ]);
    return { resumo, avisos: avisos.dados, ocorrencias: ocorrencias.dados, reservas: reservas.dados };
  }, []);

  if (carregando) return <Carregando />;
  if (erro) return <CaixaErro msg={erro} onRetry={recarregar} />;
  const { resumo, avisos, ocorrencias, reservas } = dados;
  const abertas = ocorrencias.filter((o) => !["RESOLVIDA", "CANCELADA"].includes(o.status));
  const minhas = reservas.filter((r) => r.morador && r.morador.id === user.id && ["CONFIRMADA", "PENDENTE"].includes(r.status));
  const proxima = minhas[0];

  return (
    <div className="fade-up">
      <Card style={{ background: C.ink, color: "#fff", marginBottom: 20, border: "none" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Olá, {user.name.split(" ")[0]} 👋</div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Unidade {user.unidade}{user.bloco ? ` · ${user.bloco}` : ""}</div>
      </Card>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={AlertTriangle} label="Solicitações em andamento" value={abertas.length} accent={C.amber} />
        <StatCard icon={Calendar} label="Próxima reserva" value={proxima ? fmt.dataCurta(proxima.inicio) : "—"} accent={C.primary} />
        <StatCard icon={Package} label="Encomendas aguardando" value={resumo.encomendasPendentes} accent={C.info} />
        <StatCard icon={DollarSign} label={resumo.cobrancasPendentes ? "Cobranças pendentes" : "Situação financeira"} value={resumo.cobrancasPendentes ? resumo.cobrancasPendentes : "Em dia"} accent={resumo.cobrancasPendentes ? C.amber : C.primary} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }} className="grid-stack">
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 4 }}>Acesso rápido</div>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 16 }}>O que você precisa está a um clique.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="quick-grid">
            {[
              { label: "Nova ocorrência", icon: AlertTriangle, page: "ocorrencias" },
              { label: "Reservar área", icon: Calendar, page: "reservas" },
              { label: "Ver avisos", icon: Megaphone, page: "comunicados" },
              { label: "Encomendas", icon: Package, page: "entregas" },
              { label: "Financeiro", icon: DollarSign, page: "financeiro" },
              { label: "Visitantes", icon: Truck, page: "visitantes" },
              { label: "Comunidade", icon: Users, page: "comunidade" },
              { label: "Meu perfil", icon: UserCircle2, page: "perfil" },
            ].map((a) => (
              <button key={a.label} onClick={() => setPage(a.page)} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", textAlign: "left" }}>
                <a.icon size={18} color={C.primary} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{a.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>Últimos avisos</div>
          {avisos.length === 0 && <div style={{ fontSize: 13, color: C.textMuted }}>Nenhum aviso vigente.</div>}
          {avisos.map((c) => (
            <div key={c.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>{fmt.dataCurta(c.publicadoEm)}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{c.titulo}</div>
            </div>
          ))}
          <Button variant="ghost" style={{ padding: "6px 0" }} onClick={() => setPage("comunicados")}>Ver todos <ChevronRight size={14} /></Button>
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>Minhas solicitações em andamento</div>
          {abertas.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nenhuma solicitação em andamento" desc="Você não possui ocorrências ou solicitações pendentes no momento." />
          ) : (
            abertas.map((o) => (
              <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <StatusBadge status={o.status} />
                <div style={{ flex: 1, fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{o.assunto}</div>
                <span style={{ fontSize: 11.5, color: C.textFaint, fontFamily: FONT_MONO }}>{o.protocolo}</span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

function DashboardSindico({ setPage }) {
  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const hoje = fmt.hoje();
    const mes = (delta) => {
      const d = new Date(hoje.slice(0, 7) + "-01T12:00:00-03:00");
      d.setUTCMonth(d.getUTCMonth() + delta);
      return fmt.iso(d).slice(0, 7) + "-01";
    };
    const meses = [-5, -4, -3, -2, -1, 0].map(mes);
    const [resumo, moradores, ...resumos] = await Promise.all([
      ZeluviAPI.get("/dashboard"),
      ZeluviAPI.get("/moradores", { limite: 1 }),
      ...meses.map((m) => ZeluviAPI.get("/financeiro/resumo", { competencia: m })),
    ]);
    const abrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const serie = resumos.map((r) => ({
      mes: abrev[Number(r.competencia.slice(5, 7)) - 1],
      receitas: r.receitas.previsto, despesas: r.despesas.previsto,
    }));
    return { resumo, totalMoradores: moradores.total, serie };
  }, []);

  if (carregando) return <Carregando />;
  if (erro) return <CaixaErro msg={erro} onRetry={recarregar} />;
  const { resumo, totalMoradores, serie } = dados;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard icon={Users} label="Moradores cadastrados" value={totalMoradores} accent={C.info} />
        <StatCard icon={AlertTriangle} label="Ocorrências em aberto" value={resumo.ocorrenciasEmAberto} accent={C.amber} />
        <StatCard icon={Calendar} label="Reservas a aprovar" value={resumo.reservasPendentesDeAprovacao} accent={C.primary} />
        <StatCard icon={Package} label="Encomendas pendentes" value={resumo.encomendasPendentes} accent={C.info} />
        <StatCard icon={Truck} label="Visitantes no condomínio" value={resumo.visitantesNoCondominio} accent={C.primary} />
        <StatCard icon={DollarSign} label="Cobranças em atraso" value={resumo.cobrancasEmAtraso} accent={resumo.cobrancasEmAtraso ? C.danger : C.primary} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.1fr", gap: 16, marginBottom: 16 }} className="grid-stack">
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Receitas x Despesas (previsto)</div>
            <Badge bg={C.primaryLight} fg={C.primaryDark}>Últimos 6 meses</Badge>
          </div>
          <div style={{ marginTop: 12 }}>
            <AreaChartSVG data={serie} xKey="mes" height={220} formatValue={fmtBRL}
              series={[{ key: "receitas", label: "Receitas", color: C.primary }, { key: "despesas", label: "Despesas", color: C.amber }]} />
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>Atalhos do síndico</div>
          {[
            { label: "Aprovar reservas pendentes", page: "reservas", icon: Calendar },
            { label: "Atualizar ocorrências", page: "ocorrencias", icon: AlertTriangle },
            { label: "Publicar um aviso", page: "comunicados", icon: Megaphone },
            { label: "Cadastrar morador", page: "moradores", icon: Users },
            { label: "Lançar cobranças", page: "financeiro", icon: DollarSign },
          ].map((a) => (
            <button key={a.label} onClick={() => setPage(a.page)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", marginBottom: 8, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.ink, textAlign: "left" }}>
              <a.icon size={16} color={C.primary} /> {a.label}
              <ChevronRight size={14} style={{ marginLeft: "auto" }} color={C.textFaint} />
            </button>
          ))}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr", gap: 16 }} className="grid-stack">
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Índice de Saúde do Condomínio</div>
            <Badge bg={C.amberLight} fg={C.amber}>Demonstração</Badge>
          </div>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 8 }}>O "Anel de Zelo" é um conceito do protótipo, ainda sem dados reais.</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AnelDeZelo categorias={SAUDE_CATEGORIAS} size={240} />
          </div>
        </Card>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Alertas da IA Gestora</div>
            <Badge bg={C.amberLight} fg={C.amber}>Demonstração</Badge>
          </div>
          {ALERTAS_IA.slice(0, 3).map((a) => (
            <div key={a.titulo} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{a.titulo}</div>
              <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 3, lineHeight: 1.5 }}>{a.desc}</div>
            </div>
          ))}
          <Button variant="ghost" style={{ padding: "8px 0" }} onClick={() => setPage("copiloto")}>Abrir copiloto <ChevronRight size={14} /></Button>
        </Card>
      </div>
    </div>
  );
}

function DashboardPortaria({ setPage }) {
  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const hoje = fmt.hoje();
    const [resumo, encomendas, reservas] = await Promise.all([
      ZeluviAPI.get("/dashboard"),
      ZeluviAPI.get("/encomendas", { status: "AGUARDANDO_RETIRADA", limite: 5 }),
      ZeluviAPI.get("/reservas", { de: hoje, ate: hoje, limite: 50 }),
    ]);
    return { resumo, encomendas: encomendas.dados, reservas: reservas.dados.filter((r) => ["CONFIRMADA", "PENDENTE"].includes(r.status)) };
  }, []);

  if (carregando) return <Carregando />;
  if (erro) return <CaixaErro msg={erro} onRetry={recarregar} />;
  const { resumo, encomendas, reservas } = dados;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard icon={Package} label="Encomendas aguardando retirada" value={resumo.encomendasPendentes} accent={C.amber} />
        <StatCard icon={Truck} label="Visitantes no condomínio" value={resumo.visitantesNoCondominio} accent={C.info} />
        <StatCard icon={AlertTriangle} label="Minhas ocorrências em aberto" value={resumo.ocorrenciasEmAberto} accent={C.danger} />
        <StatCard icon={Calendar} label="Reservas hoje" value={reservas.length} accent={C.primary} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }} className="grid-stack">
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Encomendas aguardando retirada</div>
            <Button icon={Plus} onClick={() => setPage("entregas")}>Registrar</Button>
          </div>
          {encomendas.length === 0 && <EmptyState icon={Package} title="Nenhuma encomenda pendente" desc="Tudo foi retirado pelos moradores." />}
          {encomendas.map((e) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: C.infoLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package size={16} color={C.info} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Un. {e.unidade.numero}{e.unidade.bloco ? ` · Bloco ${e.unidade.bloco}` : ""} · {e.descricao}</div>
                <div style={{ fontSize: 11.5, color: C.textFaint }}>{e.transportadora || "—"} · {fmt.dataHora(e.recebidaEm)}</div>
              </div>
              <Badge bg={C.amberLight} fg={C.amber}>Aguardando retirada</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>Reservas de hoje</div>
          {reservas.length === 0 ? (
            <EmptyState icon={Calendar} title="Sem reservas hoje" desc="Nenhuma área comum foi reservada para hoje." />
          ) : (
            reservas.map((r) => (
              <div key={r.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{r.area.nome}</div>
                <div style={{ fontSize: 11.5, color: C.textFaint }}>{fmt.hora(r.inicio)}–{fmt.hora(r.fim)} · {r.unidade ? `Un. ${r.unidade.numero}` : "Condomínio"}</div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   AVISOS (rota "comunicados")
   ============================================================ */
function ComunicadosPage({ role, showToast }) {
  const ehSindico = role === "sindico";
  const { dados, carregando, erro, recarregar } = useCarregar(
    () => ZeluviAPI.get("/avisos", { limite: 100, incluirExpirados: ehSindico ? "true" : undefined }),
    [role]
  );
  const [aberto, setAberto] = useState(null); // null | "novo" | aviso em edição
  const [form, setForm] = useState({ titulo: "", conteudo: "", expira: "" });
  const [erroForm, setErroForm] = useState("");
  const [enviando, setEnviando] = useState(false);

  function abrirNovo() { setForm({ titulo: "", conteudo: "", expira: "" }); setErroForm(""); setAberto("novo"); }
  function abrirEdicao(a) {
    setForm({ titulo: a.titulo, conteudo: a.conteudo, expira: a.expiraEm ? fmt.iso(a.expiraEm) : "" });
    setErroForm(""); setAberto(a);
  }

  async function salvar(e) {
    e.preventDefault();
    setEnviando(true); setErroForm("");
    const corpo = { titulo: form.titulo, conteudo: form.conteudo };
    // validade vai até o fim do dia escolhido
    if (form.expira) corpo.expiraEm = fmt.instante(form.expira, "23:59");
    else if (aberto !== "novo") corpo.expiraEm = null;
    try {
      if (aberto === "novo") await ZeluviAPI.post("/avisos", corpo);
      else await ZeluviAPI.patch(`/avisos/${aberto.id}`, corpo);
      setAberto(null);
      showToast(aberto === "novo" ? "Aviso publicado." : "Aviso atualizado.");
      recarregar();
    } catch (err) { setErroForm(mensagemDeErro(err)); } finally { setEnviando(false); }
  }

  async function remover(a) {
    if (!window.confirm(`Remover o aviso "${a.titulo}"? Ele deixa de aparecer para todos.`)) return;
    if (await tentar(() => ZeluviAPI.del(`/avisos/${a.id}`), showToast, "Aviso removido.")) recarregar();
  }

  if (carregando) return <Carregando />;
  if (erro) return <CaixaErro msg={erro} onRetry={recarregar} />;
  const avisos = dados.dados;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        {ehSindico && <Button icon={Plus} onClick={abrirNovo}>Novo aviso</Button>}
      </div>
      {avisos.length === 0 && <Card><EmptyState icon={Megaphone} title="Nenhum aviso vigente" desc="Quando o síndico publicar um aviso, ele aparece aqui." /></Card>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {avisos.map((c) => {
          const expirado = c.expiraEm && new Date(c.expiraEm) < new Date();
          return (
            <Card key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {expirado && <Badge bg="#EDEFEC" fg={C.textFaint}>Expirado</Badge>}
                  {c.expiraEm && !expirado && <Badge bg={C.infoLight} fg={C.info}>Vale até {fmt.data(c.expiraEm)}</Badge>}
                  {c.atualizadoEm && <Badge bg={C.bg} fg={C.textMuted}>Editado</Badge>}
                </div>
                <span style={{ fontSize: 12, color: C.textFaint }}>{fmt.data(c.publicadoEm)} · {c.autor.nome}</span>
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{c.titulo}</div>
              <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{c.conteudo}</div>
              {ehSindico && (
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <Button variant="outline" style={{ padding: "6px 12px", fontSize: 12.5 }} onClick={() => abrirEdicao(c)}>Editar</Button>
                  <Button variant="outline" style={{ padding: "6px 12px", fontSize: 12.5, color: C.danger }} onClick={() => remover(c)}>Remover</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal open={!!aberto} onClose={() => setAberto(null)} title={aberto === "novo" ? "Novo aviso" : "Editar aviso"}>
        <form onSubmit={salvar}>
          <Field label="Título"><input required minLength={3} maxLength={150} style={inputStyle} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Field>
          <Field label="Mensagem"><textarea required maxLength={5000} style={{ ...inputStyle, minHeight: 110, resize: "vertical" }} value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} /></Field>
          <Field label="Vale até (opcional)">
            <input type="date" style={inputStyle} value={form.expira} min={fmt.hoje()} onChange={(e) => setForm({ ...form, expira: e.target.value })} />
          </Field>
          <MsgErroForm msg={erroForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" type="button" onClick={() => setAberto(null)}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? "Salvando..." : aberto === "novo" ? "Publicar aviso" : "Salvar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ============================================================
   OCORRÊNCIAS
   ============================================================ */
function OcorrenciasPage({ role, showToast }) {
  const [filtro, setFiltro] = useState("TODAS");
  const { dados, carregando, erro, recarregar } = useCarregar(() => ZeluviAPI.get("/ocorrencias", { limite: 100 }), []);
  const [novaOpen, setNovaOpen] = useState(false);
  const [form, setForm] = useState({ assunto: "", categoria: "MANUTENCAO", local: "", descricao: "" });
  const [erroForm, setErroForm] = useState("");
  const [detalhe, setDetalhe] = useState(null);
  const [novoStatus, setNovoStatus] = useState("EM_ANDAMENTO");
  const [obs, setObs] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function criar(e) {
    e.preventDefault();
    setEnviando(true); setErroForm("");
    try {
      const corpo = { assunto: form.assunto, categoria: form.categoria, descricao: form.descricao };
      if (form.local.trim()) corpo.local = form.local.trim();
      const nova = await ZeluviAPI.post("/ocorrencias", corpo);
      setNovaOpen(false);
      setForm({ assunto: "", categoria: "MANUTENCAO", local: "", descricao: "" });
      showToast(`Ocorrência registrada. Protocolo ${nova.protocolo}.`);
      recarregar();
    } catch (err) { setErroForm(mensagemDeErro(err)); } finally { setEnviando(false); }
  }

  async function abrirDetalhe(o) {
    try {
      const completo = await ZeluviAPI.get(`/ocorrencias/${o.id}`);
      setDetalhe(completo); setNovoStatus(completo.status === "EM_ANDAMENTO" ? "RESOLVIDA" : "EM_ANDAMENTO"); setObs("");
    } catch (err) { showToast(mensagemDeErro(err)); }
  }

  async function mudarStatus() {
    setEnviando(true);
    try {
      const atualizado = await ZeluviAPI.patch(`/ocorrencias/${detalhe.id}`, { status: novoStatus, ...(obs.trim() ? { observacao: obs.trim() } : {}) });
      setDetalhe(atualizado); setObs("");
      showToast(`Status atualizado para "${OC_STATUS[atualizado.status]}".`);
      recarregar();
    } catch (err) { showToast(mensagemDeErro(err)); } finally { setEnviando(false); }
  }

  if (carregando) return <Carregando />;
  if (erro) return <CaixaErro msg={erro} onRetry={recarregar} />;
  const todas = dados.dados;
  const filtradas = filtro === "TODAS" ? todas : todas.filter((o) => o.status === filtro);

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["TODAS", ...Object.keys(OC_STATUS)].map((s) => (
            <button key={s} onClick={() => setFiltro(s)} style={{
              padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${filtro === s ? C.primary : C.border}`,
              background: filtro === s ? C.primary : C.surface, color: filtro === s ? "#fff" : C.textMuted,
            }}>{s === "TODAS" ? "Todas" : OC_STATUS[s]}</button>
          ))}
        </div>
        <Button icon={Plus} onClick={() => { setErroForm(""); setNovaOpen(true); }}>Nova ocorrência</Button>
      </div>
      {role !== "sindico" && <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 12 }}>Aqui aparecem as ocorrências que você abriu.</div>}

      {filtradas.length === 0 ? (
        <Card><EmptyState icon={CheckCircle2} title="Nenhuma ocorrência encontrada" desc="Não há ocorrências para este filtro no momento." /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtradas.map((o) => {
            const cat = OC_CATEGORIAS.find((c) => c.id === o.categoria);
            return (
              <Card key={o.id} style={{ cursor: "pointer" }}>
                <div onClick={() => abrirDetalhe(o)} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {cat && <cat.icon size={17} color={C.primary} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{o.assunto}</span>
                      <span style={{ fontSize: 11.5, color: C.textFaint, fontFamily: FONT_MONO }}>{o.protocolo}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: C.textMuted, display: "flex", gap: 14, flexWrap: "wrap" }}>
                      {o.local && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {o.local}</span>}
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {fmt.data(o.abertaEm)}</span>
                      {role === "sindico" && <span>{o.autor.nome}{o.unidade ? ` · Un. ${o.unidade.numero}` : ` · ${o.autor.perfil === "PORTEIRO" ? "Portaria" : "Síndico"}`}</span>}
                    </div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={novaOpen} onClose={() => setNovaOpen(false)} title="Nova ocorrência">
        <form onSubmit={criar}>
          <Field label="Assunto"><input required minLength={3} maxLength={150} style={inputStyle} value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} placeholder="Ex: Vazamento no corredor" /></Field>
          <Field label="Categoria">
            <select style={inputStyle} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              {OC_CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Localização (opcional)"><input maxLength={100} style={inputStyle} value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} placeholder="Ex: 3º andar, corredor" /></Field>
          <Field label="Descrição"><textarea required maxLength={2000} style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o problema com detalhes..." /></Field>
          <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}><FileText size={13} /> Anexar fotos estará disponível em breve.</div>
          <MsgErroForm msg={erroForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" onClick={() => setNovaOpen(false)} type="button">Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? "Enviando..." : "Registrar ocorrência"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detalhe} onClose={() => setDetalhe(null)} title={detalhe ? detalhe.protocolo : ""} width={560}>
        {detalhe && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: C.ink }}>{detalhe.assunto}</div>
              <StatusBadge status={detalhe.status} />
            </div>
            <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6, marginBottom: 16, whiteSpace: "pre-wrap" }}>{detalhe.descricao}</div>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12.5, color: C.textMuted, marginBottom: 20 }}>
              {detalhe.local && <span><strong style={{ color: C.ink }}>Local:</strong> {detalhe.local}</span>}
              <span><strong style={{ color: C.ink }}>Categoria:</strong> {(OC_CATEGORIAS.find((c) => c.id === detalhe.categoria) || {}).label}</span>
              <span><strong style={{ color: C.ink }}>Aberta por:</strong> {detalhe.autor.nome}{detalhe.unidade ? ` (Un. ${detalhe.unidade.numero})` : ""}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: C.ink, marginBottom: 10 }}>Histórico</div>
            <div style={{ marginBottom: 20 }}>
              {detalhe.historico.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 9, height: 9, borderRadius: 999, background: C.primary, marginTop: 4 }} />
                    {i < detalhe.historico.length - 1 && <div style={{ width: 1.5, flex: 1, background: C.border, minHeight: 24 }} />}
                  </div>
                  <div style={{ paddingBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{OC_STATUS[h.statusNovo]} <span style={{ color: C.textFaint, fontWeight: 400, fontSize: 11.5 }}>· {fmt.dataHora(h.alteradoEm)} · {h.responsavel.nome}</span></div>
                    {h.observacao && <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 2 }}>{h.observacao}</div>}
                  </div>
                </div>
              ))}
            </div>
            {role === "sindico" && (
              <div style={{ background: C.bg, borderRadius: 11, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 10 }}>Atualizar andamento</div>
                <Field label="Novo status">
                  <select style={inputStyle} value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)}>
                    {Object.keys(OC_STATUS).filter((s) => s !== detalhe.status).map((s) => <option key={s} value={s}>{OC_STATUS[s]}</option>)}
                  </select>
                </Field>
                <Field label="Observação (o morador vê)"><input maxLength={500} style={inputStyle} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: Eletricista agendado para amanhã" /></Field>
                <Button onClick={mudarStatus} icon={CheckCircle2} disabled={enviando}>{enviando ? "Salvando..." : "Atualizar status"}</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
