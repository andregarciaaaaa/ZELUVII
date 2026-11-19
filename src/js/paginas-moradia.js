/* ============================================================
   ZELUVI — telas ligadas à API (parte 2): reservas, encomendas, visitantes, moradores, funcionários
   ============================================================ */

/* ============================================================
   RESERVAS
   ============================================================ */
const RES_STATUS = {
  PENDENTE: { label: "Aguardando aprovação", bg: C.amberLight, fg: C.amber },
  CONFIRMADA: { label: "Confirmada", bg: C.primaryLight, fg: C.primaryDark },
  RECUSADA: { label: "Recusada", bg: C.dangerLight, fg: C.danger },
  CANCELADA: { label: "Cancelada", bg: "#EDEFEC", fg: C.textFaint },
};

function iconeDaArea(nome) {
  const n = nome.toLowerCase();
  if (n.includes("salão") || n.includes("salao") || n.includes("festa")) return PartyPopper;
  if (n.includes("churras")) return Flame;
  if (n.includes("gourmet")) return UtensilsCrossed;
  if (n.includes("quadra") || n.includes("academia")) return Dumbbell;
  if (n.includes("elevador")) return ArrowUpDown;
  return Trees;
}

const hhmmParaMin = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
const minParaHhmm = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");

function ReservasPage({ role, user, showToast }) {
  const ehSindico = role === "sindico";
  const podeReservar = role !== "portaria";
  const areas = useCarregar(() => ZeluviAPI.get("/areas"), [role]);
  const reservas = useCarregar(() => ZeluviAPI.get("/reservas", { de: fmt.somarDias(fmt.hoje(), -30), limite: 100 }), [role]);

  const [areaModal, setAreaModal] = useState(null);
  const [data, setData] = useState(fmt.hoje());
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [obs, setObs] = useState("");
  const [ocupado, setOcupado] = useState([]);
  const [erroForm, setErroForm] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [novaArea, setNovaArea] = useState(false);
  const [formArea, setFormArea] = useState({ nome: "", capacidade: "", regras: "", horarioAbertura: "08:00", horarioFechamento: "22:00", duracaoMaximaHoras: "", exigeAprovacao: false });

  async function carregarDisponibilidade(area, dia) {
    try {
      const d = await ZeluviAPI.get(`/areas/${area.id}/disponibilidade`, { data: dia });
      setOcupado(d.ocupado); setErroForm("");
    } catch (err) { setOcupado([]); setErroForm(mensagemDeErro(err)); }
  }

  function abrirReserva(area) {
    setAreaModal(area); setInicio(""); setFim(""); setObs(""); setErroForm("");
    setData(fmt.hoje());
    carregarDisponibilidade(area, fmt.hoje());
  }
  function mudarData(v) {
    setData(v); setInicio(""); setFim("");
    if (v) carregarDisponibilidade(areaModal, v);
  }

  // blocos de 1 hora dentro do funcionamento; marca os que já estão ocupados
  const horas = useMemo(() => {
    if (!areaModal) return [];
    const lista = [];
    for (let m = hhmmParaMin(areaModal.horarioAbertura); m < hhmmParaMin(areaModal.horarioFechamento); m += 60) lista.push(m);
    return lista;
  }, [areaModal]);

  function bloqueado(minInicio) {
    const ini = new Date(fmt.instante(data, minParaHhmm(minInicio))).getTime();
    const fimBloco = ini + 3600000;
    return ocupado.some((o) => new Date(o.inicio).getTime() < fimBloco && new Date(o.fim).getTime() > ini);
  }
  const passado = (minInicio) => new Date(fmt.instante(data, minParaHhmm(minInicio))).getTime() <= Date.now();

  function escolherHora(m) {
    const hh = minParaHhmm(m);
    if (!inicio || fim || hhmmParaMin(hh) < hhmmParaMin(inicio)) { setInicio(hh); setFim(""); return; }
    // segundo clique define o fim (hora cheia seguinte ao bloco clicado)
    const fimMin = m + 60;
    const a = hhmmParaMin(inicio);
    for (let x = a; x < fimMin; x += 60) if (bloqueado(x)) { setInicio(hh); setFim(""); return; }
    if ((fimMin - a) / 60 > areaModal.duracaoMaximaHoras) { showToast(`Esta área permite no máximo ${areaModal.duracaoMaximaHoras} h por reserva.`); return; }
    setFim(minParaHhmm(fimMin));
  }
  const noIntervalo = (m) => inicio && (fim ? m >= hhmmParaMin(inicio) && m < hhmmParaMin(fim) : m === hhmmParaMin(inicio));

  async function confirmar() {
    if (!inicio) { setErroForm("Escolha o horário de início (e clique em outro bloco para definir o fim)."); return; }
    const fimEfetivo = fim || minParaHhmm(hhmmParaMin(inicio) + 60);
    setEnviando(true); setErroForm("");
    try {
      const corpo = { areaId: areaModal.id, inicio: fmt.instante(data, inicio), fim: fmt.instante(data, fimEfetivo) };
      if (obs.trim()) corpo.observacao = obs.trim();
      const r = await ZeluviAPI.post("/reservas", corpo);
      setAreaModal(null);
      showToast(r.status === "PENDENTE"
        ? `Pedido enviado: ${areaModal.nome} em ${fmt.dataCurta(r.inicio)} aguarda a aprovação do síndico.`
        : `Reserva de ${areaModal.nome} confirmada para ${fmt.dataCurta(r.inicio)}, ${fmt.hora(r.inicio)}–${fmt.hora(r.fim)}.`);
      reservas.recarregar();
    } catch (err) {
      setErroForm(mensagemDeErro(err));
      if (err.status === 409) carregarDisponibilidade(areaModal, data); // horário ocupado: atualiza a grade
    } finally { setEnviando(false); }
  }

  async function cancelar(r) {
    if (!window.confirm("Cancelar esta reserva? O horário volta a ficar livre.")) return;
    if (await tentar(() => ZeluviAPI.del(`/reservas/${r.id}`), showToast, "Reserva cancelada.")) reservas.recarregar();
  }
  async function decidir(r, status) {
    if (await tentar(() => ZeluviAPI.patch(`/reservas/${r.id}`, { status }), showToast, status === "CONFIRMADA" ? "Reserva aprovada." : "Reserva recusada.")) reservas.recarregar();
  }
  async function alternarArea(a) {
    if (await tentar(() => ZeluviAPI.patch(`/areas/${a.id}`, { ativa: !a.ativa }), showToast, a.ativa ? "Área desativada." : "Área reativada.")) areas.recarregar();
  }
  async function criarArea(e) {
    e.preventDefault();
    setEnviando(true); setErroForm("");
    const corpo = { nome: formArea.nome, horarioAbertura: formArea.horarioAbertura, horarioFechamento: formArea.horarioFechamento, exigeAprovacao: formArea.exigeAprovacao };
    if (formArea.capacidade) corpo.capacidade = Number(formArea.capacidade);
    if (formArea.regras.trim()) corpo.regras = formArea.regras.trim();
    if (formArea.duracaoMaximaHoras) corpo.duracaoMaximaHoras = Number(formArea.duracaoMaximaHoras);
    try {
      await ZeluviAPI.post("/areas", corpo);
      setNovaArea(false); showToast("Área cadastrada."); areas.recarregar();
    } catch (err) { setErroForm(mensagemDeErro(err)); } finally { setEnviando(false); }
  }

  if (areas.carregando || reservas.carregando) return <Carregando />;
  if (areas.erro || reservas.erro) return <CaixaErro msg={areas.erro || reservas.erro} onRetry={() => { areas.recarregar(); reservas.recarregar(); }} />;

  const lista = reservas.dados.dados;
  const minhas = role === "morador" ? lista.filter((r) => r.morador) : lista; // o morador vê datas de todos, detalhes só das próprias
  const agora = Date.now();

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Áreas comuns</div>
        {ehSindico && <Button icon={Plus} onClick={() => { setErroForm(""); setNovaArea(true); }}>Nova área</Button>}
      </div>
      {areas.dados.dados.length === 0 && <Card><EmptyState icon={Calendar} title="Nenhuma área cadastrada" desc={ehSindico ? "Cadastre a primeira área comum para liberar reservas." : "O síndico ainda não cadastrou áreas comuns."} /></Card>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }} className="area-grid">
        {areas.dados.dados.map((a) => {
          const Ic = iconeDaArea(a.nome);
          return (
            <Card key={a.id} style={{ opacity: a.ativa ? 1 : 0.6 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Ic size={18} color={C.primary} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 4 }}>{a.nome} {!a.ativa && <Badge bg="#EDEFEC" fg={C.textFaint}>Inativa</Badge>}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                {a.horarioAbertura}–{a.horarioFechamento} · até {a.duracaoMaximaHoras} h{a.capacidade ? ` · ${a.capacidade} pessoas` : ""}
              </div>
              {a.exigeAprovacao && <Badge bg={C.amberLight} fg={C.amber}>Precisa de aprovação do síndico</Badge>}
              {a.regras && <div style={{ fontSize: 11.5, color: C.textFaint, lineHeight: 1.5, marginTop: 8 }}>{a.regras}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {podeReservar && a.ativa && <Button variant="outline" style={{ flex: 1 }} icon={Calendar} onClick={() => abrirReserva(a)}>Reservar</Button>}
                {ehSindico && <Button variant="outline" style={{ padding: "8px 10px", fontSize: 12 }} onClick={() => alternarArea(a)}>{a.ativa ? "Desativar" : "Reativar"}</Button>}
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>{role === "morador" ? "Reservas do condomínio" : "Todas as reservas"}</div>
      {minhas.length === 0 ? (
        <Card><EmptyState icon={Calendar} title="Nenhuma reserva encontrada" desc="Ainda não há reservas registradas." /></Card>
      ) : (
        <Card padded={false}>
          {minhas.map((r, i) => {
            const Ic = iconeDaArea(r.area.nome);
            const st = RES_STATUS[r.status];
            const propria = r.morador && r.morador.id === user.id;
            const ativa = ["PENDENTE", "CONFIRMADA"].includes(r.status);
            const podeCancelar = ativa && (ehSindico ? new Date(r.fim).getTime() > agora : propria && new Date(r.inicio).getTime() > agora);
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", flexWrap: "wrap", borderBottom: i < minhas.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <Ic size={18} color={C.primary} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{r.area.nome}{propria ? " · sua reserva" : ""}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>
                    {fmt.data(r.inicio)} · {fmt.hora(r.inicio)}–{fmt.hora(r.fim)}
                    {r.morador ? ` · ${r.morador.nome}${r.unidade ? ` (Un. ${r.unidade.numero})` : ""}` : role !== "morador" ? " · Condomínio" : ""}
                  </div>
                  {r.observacao && <div style={{ fontSize: 11.5, color: C.textFaint }}>{r.observacao}</div>}
                </div>
                <Badge bg={st.bg} fg={st.fg}>{st.label}</Badge>
                {ehSindico && r.status === "PENDENTE" && (
                  <>
                    <Button style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => decidir(r, "CONFIRMADA")}>Aprovar</Button>
                    <Button variant="outline" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => decidir(r, "RECUSADA")}>Recusar</Button>
                  </>
                )}
                {podeCancelar && <Button variant="outline" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => cancelar(r)}>Cancelar</Button>}
              </div>
            );
          })}
        </Card>
      )}

      <Modal open={!!areaModal} onClose={() => setAreaModal(null)} title={`Reservar ${areaModal ? areaModal.nome : ""}`} width={560}>
        {areaModal && (
          <>
            <Field label="Data">
              <input type="date" style={inputStyle} value={data} min={fmt.hoje()} max={fmt.somarDias(fmt.hoje(), areaModal.antecedenciaMaximaDias)} onChange={(e) => mudarData(e.target.value)} />
            </Field>
            <Field label={`Horário (funciona das ${areaModal.horarioAbertura} às ${areaModal.horarioFechamento}; máximo ${areaModal.duracaoMaximaHoras} h)`}>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Clique no bloco de início e depois no último bloco que você quer usar.</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {horas.map((m) => {
                  const ocu = bloqueado(m); const pas = passado(m); const sel = noIntervalo(m);
                  return (
                    <button key={m} type="button" disabled={ocu || pas} onClick={() => escolherHora(m)} style={{
                      padding: "9px 4px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: ocu || pas ? "not-allowed" : "pointer",
                      border: `1px solid ${sel ? C.primary : C.borderStrong}`,
                      background: ocu ? "#F1F1EF" : sel ? C.primaryLight : "#fff",
                      color: ocu || pas ? C.textFaint : sel ? C.primaryDark : C.ink,
                      textDecoration: ocu ? "line-through" : "none",
                    }}>{minParaHhmm(m)}{ocu ? " ocupado" : ""}</button>
                  );
                })}
              </div>
            </Field>
            {inicio && <div style={{ fontSize: 13, fontWeight: 600, color: C.primaryDark, marginBottom: 12 }}>Reserva: {inicio} às {fim || minParaHhmm(hhmmParaMin(inicio) + 60)}</div>}
            <Field label="Observação (opcional)"><input maxLength={500} style={inputStyle} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: aniversário, 40 pessoas" /></Field>
            {areaModal.regras && <div style={{ fontSize: 12, color: C.textMuted, background: C.bg, padding: 12, borderRadius: 9, marginBottom: 16, lineHeight: 1.5 }}>{areaModal.regras}</div>}
            {areaModal.exigeAprovacao && role === "morador" && <div style={{ fontSize: 12, color: C.amber, marginBottom: 12 }}>Esta área precisa de aprovação do síndico. O horário fica retido até ele decidir.</div>}
            <MsgErroForm msg={erroForm} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setAreaModal(null)}>Cancelar</Button>
              <Button onClick={confirmar} disabled={enviando}>{enviando ? "Enviando..." : "Confirmar reserva"}</Button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={novaArea} onClose={() => setNovaArea(false)} title="Nova área comum">
        <form onSubmit={criarArea}>
          <Field label="Nome"><input required minLength={3} maxLength={100} style={inputStyle} value={formArea.nome} onChange={(e) => setFormArea({ ...formArea, nome: e.target.value })} /></Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Abre às"><input required type="time" style={inputStyle} value={formArea.horarioAbertura} onChange={(e) => setFormArea({ ...formArea, horarioAbertura: e.target.value })} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Fecha às"><input required type="time" style={inputStyle} value={formArea.horarioFechamento} onChange={(e) => setFormArea({ ...formArea, horarioFechamento: e.target.value })} /></Field></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Capacidade"><input type="number" min="1" max="1000" style={inputStyle} value={formArea.capacidade} onChange={(e) => setFormArea({ ...formArea, capacidade: e.target.value })} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Máx. horas por reserva"><input type="number" min="1" max="24" style={inputStyle} value={formArea.duracaoMaximaHoras} onChange={(e) => setFormArea({ ...formArea, duracaoMaximaHoras: e.target.value })} /></Field></div>
          </div>
          <Field label="Regras de uso"><textarea maxLength={2000} style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={formArea.regras} onChange={(e) => setFormArea({ ...formArea, regras: e.target.value })} /></Field>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
            <input type="checkbox" checked={formArea.exigeAprovacao} onChange={(e) => setFormArea({ ...formArea, exigeAprovacao: e.target.checked })} /> Reservas dos moradores precisam da minha aprovação
          </label>
          <MsgErroForm msg={erroForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" type="button" onClick={() => setNovaArea(false)}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? "Salvando..." : "Cadastrar área"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ============================================================
   ENCOMENDAS (rota "entregas")
   ============================================================ */
function useUnidades(ativo) {
  const [unidades, setUnidades] = useState([]);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (ativo) ZeluviAPI.get("/unidades").then((r) => setUnidades(r.dados)).catch(() => setUnidades([]));
  }, [ativo, n]);
  unidades.recarregar = () => setN((x) => x + 1);
  return unidades;
}
const rotuloUnidade = (u) => `${u.bloco ? `Bloco ${u.bloco} · ` : ""}Un. ${u.numero}`;

function EntregasPage({ role, showToast }) {
  const ehPorteiro = role === "portaria";
  const { dados, carregando, erro, recarregar } = useCarregar(() => ZeluviAPI.get("/encomendas", { limite: 100 }), [role]);
  const unidades = useUnidades(ehPorteiro);
  const [novoOpen, setNovoOpen] = useState(false);
  const [form, setForm] = useState({ unidadeId: "", descricao: "", transportadora: "", codigoRastreio: "" });
  const [erroForm, setErroForm] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function registrar(e) {
    e.preventDefault();
    setEnviando(true); setErroForm("");
    const corpo = { unidadeId: Number(form.unidadeId), descricao: form.descricao };
    if (form.transportadora.trim()) corpo.transportadora = form.transportadora.trim();
    if (form.codigoRastreio.trim()) corpo.codigoRastreio = form.codigoRastreio.trim();
    try {
      await ZeluviAPI.post("/encomendas", corpo);
      setNovoOpen(false); setForm({ unidadeId: "", descricao: "", transportadora: "", codigoRastreio: "" });
      showToast("Encomenda registrada."); recarregar();
    } catch (err) { setErroForm(mensagemDeErro(err)); } finally { setEnviando(false); }
  }
  async function retirada(e) {
    if (await tentar(() => ZeluviAPI.patch(`/encomendas/${e.id}`, { status: "ENTREGUE" }), showToast, "Retirada registrada com data e hora.")) recarregar();
  }

  if (carregando) return <Carregando />;
  if (erro) return <CaixaErro msg={erro} onRetry={recarregar} />;
  const lista = dados.dados;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, color: C.textMuted }}>{role === "morador" ? "Encomendas da sua unidade." : "Encomendas de todas as unidades."}</div>
        {ehPorteiro && <Button icon={Plus} onClick={() => { setErroForm(""); setNovoOpen(true); }}>Registrar encomenda</Button>}
      </div>
      {lista.length === 0 ? (
        <Card><EmptyState icon={Package} title="Nenhuma encomenda registrada" desc="Não há encomendas para exibir no momento." /></Card>
      ) : (
        <Card padded={false} style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 }}>
            <thead>
              <tr style={{ background: C.bg, textAlign: "left" }}>
                {["Unidade", "Descrição", "Transportadora", "Código", "Recebida em", "Status", ""].map((h) => (
                  <th key={h} style={{ padding: "11px 16px", fontSize: 11.5, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((e) => (
                <tr key={e.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: C.ink }}>{rotuloUnidade(e.unidade)}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{e.descricao}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{e.transportadora || "—"}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted, fontFamily: FONT_MONO, fontSize: 12 }}>{e.codigoRastreio || "—"}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{fmt.dataHora(e.recebidaEm)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {e.status === "ENTREGUE"
                      ? <Badge bg={C.primaryLight} fg={C.primaryDark}>Entregue {fmt.dataHora(e.retiradaEm)}</Badge>
                      : <Badge bg={C.amberLight} fg={C.amber}>Aguardando retirada</Badge>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {ehPorteiro && e.status !== "ENTREGUE" && <Button variant="outline" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => retirada(e)}>Confirmar retirada</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={novoOpen} onClose={() => setNovoOpen(false)} title="Registrar encomenda">
        <form onSubmit={registrar}>
          <Field label="Unidade de destino">
            <select required style={inputStyle} value={form.unidadeId} onChange={(e) => setForm({ ...form, unidadeId: e.target.value })}>
              <option value="">Selecione...</option>
              {unidades.map((u) => <option key={u.id} value={u.id}>{rotuloUnidade(u)}</option>)}
            </select>
          </Field>
          <Field label="Descrição"><input required maxLength={255} style={inputStyle} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Caixa média, Correios" /></Field>
          <Field label="Transportadora (opcional)"><input maxLength={60} style={inputStyle} value={form.transportadora} onChange={(e) => setForm({ ...form, transportadora: e.target.value })} /></Field>
          <Field label="Código de rastreio (opcional)"><input maxLength={40} style={inputStyle} value={form.codigoRastreio} onChange={(e) => setForm({ ...form, codigoRastreio: e.target.value })} /></Field>
          <MsgErroForm msg={erroForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" type="button" onClick={() => setNovoOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? "Registrando..." : "Registrar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ============================================================
   VISITANTES
   ============================================================ */
function VisitantesPage({ role, showToast }) {
  const ehPorteiro = role === "portaria";
  const [filtro, setFiltro] = useState("TODOS");
  const { dados, carregando, erro, recarregar } = useCarregar(() => ZeluviAPI.get("/visitantes", { limite: 100 }), [role]);
  const unidades = useUnidades(ehPorteiro);
  const [novoOpen, setNovoOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo: "VISITANTE", unidadeId: "", observacao: "" });
  const [erroForm, setErroForm] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function registrar(e) {
    e.preventDefault();
    setEnviando(true); setErroForm("");
    const corpo = { nome: form.nome, tipo: form.tipo, unidadeId: Number(form.unidadeId) };
    if (form.observacao.trim()) corpo.observacao = form.observacao.trim();
    try {
      await ZeluviAPI.post("/visitantes", corpo);
      setNovoOpen(false); setForm({ nome: "", tipo: "VISITANTE", unidadeId: "", observacao: "" });
      showToast("Entrada registrada."); recarregar();
    } catch (err) { setErroForm(mensagemDeErro(err)); } finally { setEnviando(false); }
  }
  async function saida(v) {
    if (await tentar(() => ZeluviAPI.patch(`/visitantes/${v.id}`, { status: "SAIU" }), showToast, "Saída registrada.")) recarregar();
  }

  if (carregando) return <Carregando />;
  if (erro) return <CaixaErro msg={erro} onRetry={recarregar} />;
  const lista = dados.dados.filter((v) => filtro === "TODOS" || v.status === filtro);

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[["TODOS", "Todos"], ["NO_CONDOMINIO", "No condomínio"], ["SAIU", "Já saíram"]].map(([id, label]) => (
            <button key={id} onClick={() => setFiltro(id)} style={{ padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: `1px solid ${filtro === id ? C.primary : C.border}`, background: filtro === id ? C.primary : C.surface, color: filtro === id ? "#fff" : C.textMuted }}>{label}</button>
          ))}
        </div>
        {ehPorteiro && <Button icon={Plus} onClick={() => { setErroForm(""); setNovoOpen(true); }}>Registrar entrada</Button>}
      </div>
      {lista.length === 0 ? (
        <Card><EmptyState icon={Truck} title="Nenhum visitante" desc={role === "morador" ? "Nenhum visitante foi registrado na sua unidade." : "Nenhum registro para este filtro."} /></Card>
      ) : (
        <Card padded={false} style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 680 }}>
            <thead>
              <tr style={{ background: C.bg, textAlign: "left" }}>
                {["Nome", "Tipo", "Unidade", "Entrada", "Saída", "Status", ""].map((h) => (
                  <th key={h} style={{ padding: "11px 16px", fontSize: 11.5, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((v) => (
                <tr key={v.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: C.ink }}>{v.nome}{v.observacao && <div style={{ fontSize: 11.5, color: C.textFaint, fontWeight: 400 }}>{v.observacao}</div>}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{v.tipo === "PRESTADOR" ? "Prestador" : "Visitante"}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{rotuloUnidade(v.unidade)}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{fmt.dataHora(v.entradaEm)}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{v.saidaEm ? fmt.dataHora(v.saidaEm) : "—"}</td>
                  <td style={{ padding: "12px 16px" }}>{v.status === "SAIU" ? <Badge bg="#EDEFEC" fg={C.textFaint}>Saiu</Badge> : <Badge bg={C.primaryLight} fg={C.primaryDark}>No condomínio</Badge>}</td>
                  <td style={{ padding: "12px 16px" }}>{ehPorteiro && v.status !== "SAIU" && <Button variant="outline" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => saida(v)}>Registrar saída</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={novoOpen} onClose={() => setNovoOpen(false)} title="Registrar entrada">
        <form onSubmit={registrar}>
          <Field label="Nome"><input required minLength={3} maxLength={100} style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
          <Field label="Tipo">
            <select style={inputStyle} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="VISITANTE">Visitante</option><option value="PRESTADOR">Prestador de serviço</option>
            </select>
          </Field>
          <Field label="Unidade visitada">
            <select required style={inputStyle} value={form.unidadeId} onChange={(e) => setForm({ ...form, unidadeId: e.target.value })}>
              <option value="">Selecione...</option>
              {unidades.map((u) => <option key={u.id} value={u.id}>{rotuloUnidade(u)}</option>)}
            </select>
          </Field>
          <Field label="Observação (opcional)"><input maxLength={255} style={inputStyle} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Ex: técnico da internet" /></Field>
          <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 14 }}>Por privacidade (LGPD), o documento do visitante não é coletado.</div>
          <MsgErroForm msg={erroForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" type="button" onClick={() => setNovoOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? "Registrando..." : "Registrar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ============================================================
   MORADORES (síndico)
   ============================================================ */
const SEM_MORADOR = { nome: "", email: "", telefone: "", unidadeId: "", tipo: "PROPRIETARIO" };

function MoradoresPage({ showToast }) {
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(1);
  const { dados, carregando, erro, recarregar } = useCarregar(
    () => ZeluviAPI.get("/moradores", { busca: buscaAplicada || undefined, pagina, limite: 20 }), [buscaAplicada, pagina]
  );
  const unidades = useUnidades(true);
  const [aberto, setAberto] = useState(null); // "novo" | morador em edição
  const [form, setForm] = useState(SEM_MORADOR);
  const [erroForm, setErroForm] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [unidadeOpen, setUnidadeOpen] = useState(false);
  const [formUn, setFormUn] = useState({ bloco: "", numero: "" });

  function abrirNovo() { setForm(SEM_MORADOR); setErroForm(""); setAberto("novo"); }
  function abrirEdicao(m) {
    setForm({ nome: m.nome, email: m.email, telefone: m.telefone || "", unidadeId: String(m.unidade.id), tipo: m.tipo });
    setErroForm(""); setAberto(m);
  }

  async function salvar(e) {
    e.preventDefault();
    setEnviando(true); setErroForm("");
    try {
      if (aberto === "novo") {
        const corpo = { nome: form.nome, email: form.email, unidadeId: Number(form.unidadeId), tipo: form.tipo };
        if (form.telefone) corpo.telefone = form.telefone.replace(/\D/g, "");
        const r = await ZeluviAPI.post("/moradores", corpo);
        showToast(r.conviteEnviado ? `Morador cadastrado. Convite enviado para ${r.email}.` : "Morador cadastrado.");
      } else {
        await ZeluviAPI.patch(`/moradores/${aberto.id}`, {
          nome: form.nome, email: form.email, unidadeId: Number(form.unidadeId), tipo: form.tipo,
          telefone: form.telefone ? form.telefone.replace(/\D/g, "") : null,
        });
        showToast("Cadastro atualizado.");
      }
      setAberto(null); recarregar();
    } catch (err) { setErroForm(mensagemDeErro(err)); } finally { setEnviando(false); }
  }
  async function alternarAtivo(m) {
    const acao = m.ativo ? "desativar" : "reativar";
    if (!window.confirm(`Deseja ${acao} ${m.nome}?${m.ativo ? " Ele(a) não conseguirá mais entrar no sistema, mas o histórico é mantido." : ""}`)) return;
    if (await tentar(() => ZeluviAPI.patch(`/moradores/${m.id}`, { ativo: !m.ativo }), showToast, m.ativo ? "Morador desativado." : "Morador reativado.")) recarregar();
  }
  async function criarUnidade(e) {
    e.preventDefault();
    setEnviando(true); setErroForm("");
    try {
      await ZeluviAPI.post("/unidades", { numero: formUn.numero, ...(formUn.bloco ? { bloco: formUn.bloco } : {}) });
      setUnidadeOpen(false); setFormUn({ bloco: "", numero: "" }); showToast("Unidade cadastrada.");
      unidades.recarregar(); // atualiza a lista usada nos formulários
    } catch (err) { setErroForm(mensagemDeErro(err)); } finally { setEnviando(false); }
  }

  if (erro) return <CaixaErro msg={erro} onRetry={recarregar} />;
  const lista = dados ? dados.dados : [];
  const total = dados ? dados.total : 0;
  const paginas = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <form onSubmit={(e) => { e.preventDefault(); setPagina(1); setBuscaAplicada(busca.trim()); }} style={{ display: "flex", gap: 8 }}>
          <input style={{ ...inputStyle, width: 240 }} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail" />
          <Button type="submit" variant="outline" icon={Search}>Buscar</Button>
        </form>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="outline" onClick={() => { setErroForm(""); setUnidadeOpen(true); }}>Nova unidade</Button>
          <Button icon={Plus} onClick={abrirNovo}>Novo morador</Button>
        </div>
      </div>

      {carregando ? <Carregando /> : lista.length === 0 ? (
        <Card><EmptyState icon={Users} title="Nenhum morador encontrado" desc="Cadastre o primeiro morador para enviar o convite de acesso." /></Card>
      ) : (
        <Card padded={false} style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 }}>
            <thead>
              <tr style={{ background: C.bg, textAlign: "left" }}>
                {["Nome", "E-mail", "Telefone", "Unidade", "Vínculo", "Situação", ""].map((h) => (
                  <th key={h} style={{ padding: "11px 16px", fontSize: 11.5, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((m) => (
                <tr key={m.id} style={{ borderTop: `1px solid ${C.border}`, opacity: m.ativo ? 1 : 0.6 }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: C.ink }}>{m.nome}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{m.email}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{m.telefone || "—"}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{rotuloUnidade(m.unidade)}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{m.tipo === "PROPRIETARIO" ? "Proprietário" : "Inquilino"}</td>
                  <td style={{ padding: "12px 16px" }}>{m.ativo ? <Badge bg={C.primaryLight} fg={C.primaryDark}>Ativo</Badge> : <Badge bg="#EDEFEC" fg={C.textFaint}>Inativo</Badge>}</td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <Button variant="outline" style={{ padding: "6px 10px", fontSize: 12, marginRight: 6 }} onClick={() => abrirEdicao(m)}>Editar</Button>
                    <Button variant="outline" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => alternarAtivo(m)}>{m.ativo ? "Desativar" : "Reativar"}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {paginas > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 14, fontSize: 13, color: C.textMuted }}>
          <Button variant="outline" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
          Página {pagina} de {paginas} ({total} moradores)
          <Button variant="outline" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>Próxima</Button>
        </div>
      )}

      <Modal open={!!aberto} onClose={() => setAberto(null)} title={aberto === "novo" ? "Novo morador" : "Editar morador"}>
        <form onSubmit={salvar}>
          <Field label="Nome completo"><input required minLength={3} maxLength={100} style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
          <Field label="E-mail"><input required type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Telefone com DDD (opcional)"><input style={inputStyle} inputMode="numeric" placeholder="44999998888" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></Field>
          <Field label="Unidade">
            <select required style={inputStyle} value={form.unidadeId} onChange={(e) => setForm({ ...form, unidadeId: e.target.value })}>
              <option value="">Selecione...</option>
              {unidades.map((u) => <option key={u.id} value={u.id}>{rotuloUnidade(u)}</option>)}
            </select>
          </Field>
          <Field label="Vínculo">
            <select style={inputStyle} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="PROPRIETARIO">Proprietário</option><option value="INQUILINO">Inquilino</option>
            </select>
          </Field>
          {aberto === "novo" && <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>O morador recebe um e-mail de convite (vale 48 horas) para criar a própria senha.</div>}
          <MsgErroForm msg={erroForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" type="button" onClick={() => setAberto(null)}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? "Salvando..." : aberto === "novo" ? "Cadastrar e enviar convite" : "Salvar"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={unidadeOpen} onClose={() => setUnidadeOpen(false)} title="Nova unidade" width={400}>
        <form onSubmit={criarUnidade}>
          <Field label="Bloco (opcional)"><input maxLength={30} style={inputStyle} value={formUn.bloco} onChange={(e) => setFormUn({ ...formUn, bloco: e.target.value })} placeholder="Ex: A" /></Field>
          <Field label="Número"><input required maxLength={20} style={inputStyle} value={formUn.numero} onChange={(e) => setFormUn({ ...formUn, numero: e.target.value })} placeholder="Ex: 101" /></Field>
          <MsgErroForm msg={erroForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" type="button" onClick={() => setUnidadeOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>Cadastrar unidade</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ============================================================
   FUNCIONÁRIOS (síndicos e porteiros)
   ============================================================ */
function FuncionariosPage({ showToast }) {
  const { dados, carregando, erro, recarregar } = useCarregar(() => ZeluviAPI.get("/usuarios"), []);
  const [novoOpen, setNovoOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", perfil: "PORTEIRO" });
  const [erroForm, setErroForm] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function criar(e) {
    e.preventDefault();
    setEnviando(true); setErroForm("");
    const corpo = { nome: form.nome, email: form.email, perfil: form.perfil };
    if (form.telefone) corpo.telefone = form.telefone.replace(/\D/g, "");
    try {
      await ZeluviAPI.post("/usuarios", corpo);
      setNovoOpen(false); setForm({ nome: "", email: "", telefone: "", perfil: "PORTEIRO" });
      showToast(`Cadastro criado. Convite enviado para ${corpo.email}.`); recarregar();
    } catch (err) { setErroForm(mensagemDeErro(err)); } finally { setEnviando(false); }
  }

  if (carregando) return <Carregando />;
  if (erro) return <CaixaErro msg={erro} onRetry={recarregar} />;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button icon={Plus} onClick={() => { setErroForm(""); setNovoOpen(true); }}>Novo funcionário</Button>
      </div>
      <Card padded={false} style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
          <thead>
            <tr style={{ background: C.bg, textAlign: "left" }}>
              {["Nome", "E-mail", "Perfil", "Situação"].map((h) => (
                <th key={h} style={{ padding: "11px 16px", fontSize: 11.5, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.dados.map((u) => (
              <tr key={u.id} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: C.ink }}>{u.nome}</td>
                <td style={{ padding: "12px 16px", color: C.textMuted }}>{u.email}</td>
                <td style={{ padding: "12px 16px", color: C.textMuted }}>{u.perfil === "SINDICO" ? "Síndico" : "Porteiro"}</td>
                <td style={{ padding: "12px 16px" }}>{u.ativo ? <Badge bg={C.primaryLight} fg={C.primaryDark}>Ativo</Badge> : <Badge bg="#EDEFEC" fg={C.textFaint}>Inativo</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={novoOpen} onClose={() => setNovoOpen(false)} title="Novo funcionário">
        <form onSubmit={criar}>
          <Field label="Nome completo"><input required minLength={3} maxLength={100} style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
          <Field label="E-mail"><input required type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Telefone com DDD (opcional)"><input style={inputStyle} inputMode="numeric" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></Field>
          <Field label="Perfil">
            <select style={inputStyle} value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })}>
              <option value="PORTEIRO">Porteiro</option><option value="SINDICO">Síndico</option>
            </select>
          </Field>
          <MsgErroForm msg={erroForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" type="button" onClick={() => setNovoOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? "Salvando..." : "Cadastrar e enviar convite"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
