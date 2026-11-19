/* ============================================================
   ZELUVI — telas ligadas à API (parte 3): financeiro, comunidade/prestadores, perfil
   ============================================================ */

const COB_TIPO = { COTA_CONDOMINIAL: "Cota condominial", TAXA_EXTRA: "Taxa extra", MULTA: "Multa" };
const DESP_CAT = { FOLHA: "Folha / Funcionários", MANUTENCAO: "Manutenção", AGUA_ENERGIA: "Água e energia", LIMPEZA: "Limpeza", SEGURANCA: "Segurança", ADMINISTRATIVO: "Administrativo" };

function StatusPagamento({ item }) {
  if (item.status === "PAGO") return <Badge bg={C.primaryLight} fg={C.primaryDark}>Pago {fmt.dataSql(item.dataPagamento)}</Badge>;
  if (item.atrasada) return <Badge bg={C.dangerLight} fg={C.danger}>Em atraso</Badge>;
  return <Badge bg={C.amberLight} fg={C.amber}>Pendente</Badge>;
}

function FinanceiroPage({ role, showToast }) {
  return role === "sindico" ? <FinanceiroSindico showToast={showToast} /> : <FinanceiroMorador />;
}

function FinanceiroMorador() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => ZeluviAPI.get("/cobrancas", { limite: 100 }), []);
  if (carregando) return <Carregando />;
  if (erro) return <CaixaErro msg={erro} onRetry={recarregar} />;
  const lista = dados.dados;
  const pendentes = lista.filter((c) => c.status === "PENDENTE");
  const atrasadas = pendentes.filter((c) => c.atrasada);
  const totalPendente = pendentes.reduce((s, c) => s + c.valor, 0);

  return (
    <div className="fade-up">
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard icon={DollarSign} label="Em aberto" value={fmt.brl(totalPendente)} accent={totalPendente ? C.amber : C.primary} />
        <StatCard icon={AlertTriangle} label="Em atraso" value={atrasadas.length} accent={atrasadas.length ? C.danger : C.primary} />
        <StatCard icon={CheckCircle2} label="Pagas" value={lista.filter((c) => c.status === "PAGO").length} accent={C.primary} />
      </div>
      <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 12 }}>Você vê apenas as cobranças da sua unidade. O pagamento é feito pelo boleto, fora do sistema.</div>
      {lista.length === 0 ? (
        <Card><EmptyState icon={DollarSign} title="Nenhuma cobrança" desc="Não há cobranças lançadas para a sua unidade." /></Card>
      ) : (
        <Card padded={false} style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 620 }}>
            <thead>
              <tr style={{ background: C.bg, textAlign: "left" }}>
                {["Tipo", "Competência", "Vencimento", "Valor", "Situação", ""].map((h) => (
                  <th key={h} style={{ padding: "11px 16px", fontSize: 11.5, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: C.ink }}>{COB_TIPO[c.tipo]}{c.descricao && <div style={{ fontSize: 11.5, color: C.textFaint, fontWeight: 400 }}>{c.descricao}</div>}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{c.competencia.slice(5, 7)}/{c.competencia.slice(0, 4)}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{fmt.dataSql(c.vencimento)}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: C.ink }}>{fmt.brl(c.valor)}</td>
                  <td style={{ padding: "12px 16px" }}><StatusPagamento item={c} /></td>
                  <td style={{ padding: "12px 16px" }}>{c.boletoUrl && c.status === "PENDENTE" && <a href={c.boletoUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.primary, fontWeight: 600, fontSize: 12.5 }}>Abrir boleto</a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function FinanceiroSindico({ showToast }) {
  const mesAtual = fmt.hoje().slice(0, 7) + "-01";
  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [resumo, cobrancas, despesas, serie] = await Promise.all([
      ZeluviAPI.get("/financeiro/resumo"),
      ZeluviAPI.get("/cobrancas", { limite: 100 }),
      ZeluviAPI.get("/despesas", { limite: 100 }),
      Promise.all([-5, -4, -3, -2, -1, 0].map((delta) => {
        const d = new Date(mesAtual + "T12:00:00-03:00"); d.setUTCMonth(d.getUTCMonth() + delta);
        return ZeluviAPI.get("/financeiro/resumo", { competencia: fmt.iso(d).slice(0, 7) + "-01" });
      })),
    ]);
    return { resumo, cobrancas: cobrancas.dados, despesas: despesas.dados, serie };
  }, []);
  const unidades = useUnidades(true);
  const [aba, setAba] = useState("cobrancas");
  const [modal, setModal] = useState(null); // "cobranca" | "despesa"
  const [fc, setFc] = useState({ unidadeId: "", tipo: "COTA_CONDOMINIAL", descricao: "", competencia: mesAtual, valor: "", vencimento: "" });
  const [fd, setFd] = useState({ categoria: "MANUTENCAO", descricao: "", fornecedor: "", competencia: mesAtual, valor: "", vencimento: "" });
  const [erroForm, setErroForm] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setEnviando(true); setErroForm("");
    try {
      if (modal === "cobranca") {
        const corpo = { unidadeId: Number(fc.unidadeId), tipo: fc.tipo, competencia: fc.competencia, valor: Number(fc.valor), vencimento: fc.vencimento };
        if (fc.descricao.trim()) corpo.descricao = fc.descricao.trim();
        await ZeluviAPI.post("/cobrancas", corpo);
        showToast("Cobrança lançada.");
      } else {
        const corpo = { categoria: fd.categoria, descricao: fd.descricao, competencia: fd.competencia, valor: Number(fd.valor), vencimento: fd.vencimento };
        if (fd.fornecedor.trim()) corpo.fornecedor = fd.fornecedor.trim();
        await ZeluviAPI.post("/despesas", corpo);
        showToast("Despesa registrada.");
      }
      setModal(null); recarregar();
    } catch (err) { setErroForm(mensagemDeErro(err)); } finally { setEnviando(false); }
  }
  async function pagar(tipo, item) {
    if (await tentar(() => ZeluviAPI.patch(`/${tipo}/${item.id}/pagamento`, {}), showToast, "Pagamento registrado.")) recarregar();
  }

  if (carregando) return <Carregando />;
  if (erro) return <CaixaErro msg={erro} onRetry={recarregar} />;
  const { resumo, cobrancas, despesas, serie } = dados;
  const abrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const grafico = serie.map((r) => ({ mes: abrev[Number(r.competencia.slice(5, 7)) - 1], receitas: r.receitas.previsto, despesas: r.despesas.previsto }));
  const porCategoria = Object.entries(despesas.reduce((acc, d) => { acc[d.categoria] = (acc[d.categoria] || 0) + d.valor; return acc; }, {}))
    .map(([k, valor]) => ({ nome: DESP_CAT[k], valor }));
  const saldo = resumo.receitas.recebido - resumo.despesas.pago;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard icon={TrendingUp} label="Recebido no mês" value={fmt.brl(resumo.receitas.recebido)} accent={C.primary} />
        <StatCard icon={DollarSign} label="A receber no mês" value={fmt.brl(resumo.receitas.pendente)} accent={C.info} />
        <StatCard icon={AlertTriangle} label="Em atraso" value={fmt.brl(resumo.receitas.emAtraso)} accent={resumo.receitas.emAtraso ? C.danger : C.primary} />
        <StatCard icon={TrendingDown} label="Despesas pagas no mês" value={fmt.brl(resumo.despesas.pago)} accent={C.amber} />
        <StatCard icon={DollarSign} label="Saldo do mês (recebido − pago)" value={fmt.brl(saldo)} accent={saldo >= 0 ? C.primary : C.danger} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }} className="grid-stack">
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>Receitas x Despesas (previsto por competência)</div>
          <BarChartSVG data={grafico} xKey="mes" height={240} formatValue={fmtBRL}
            series={[{ key: "receitas", label: "Receitas", color: C.primary }, { key: "despesas", label: "Despesas", color: C.amber }]} />
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>Despesas por categoria</div>
          {porCategoria.length === 0 ? <div style={{ fontSize: 13, color: C.textMuted }}>Nenhuma despesa registrada.</div> : (
            <>
              <div style={{ display: "flex", justifyContent: "center" }}><DonutChartSVG data={porCategoria} colors={PIE_COLORS} size={190} formatValue={fmtBRL} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {porCategoria.map((d, i) => (
                  <div key={d.nome} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span style={{ flex: 1, color: C.textMuted }}>{d.nome}</span>
                    <span style={{ fontWeight: 600, color: C.ink }}>{fmt.brl(d.valor)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[["cobrancas", "Cobranças das unidades"], ["despesas", "Despesas do condomínio"]].map(([id, label]) => (
            <button key={id} onClick={() => setAba(id)} style={{ padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: `1px solid ${aba === id ? C.primary : C.border}`, background: aba === id ? C.primary : C.surface, color: aba === id ? "#fff" : C.textMuted }}>{label}</button>
          ))}
        </div>
        <Button icon={Plus} onClick={() => { setErroForm(""); setModal(aba === "cobrancas" ? "cobranca" : "despesa"); }}>{aba === "cobrancas" ? "Lançar cobrança" : "Registrar despesa"}</Button>
      </div>

      <Card padded={false} style={{ overflowX: "auto" }}>
        {aba === "cobrancas" ? (
          cobrancas.length === 0 ? <EmptyState icon={DollarSign} title="Nenhuma cobrança" desc="Lance a cota condominial das unidades." /> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
              <thead><tr style={{ background: C.bg, textAlign: "left" }}>
                {["Unidade", "Tipo", "Competência", "Vencimento", "Valor", "Situação", ""].map((h) => <th key={h} style={{ padding: "11px 16px", fontSize: 11.5, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {cobrancas.map((c) => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: C.ink }}>{rotuloUnidade(c.unidade)}</td>
                    <td style={{ padding: "12px 16px", color: C.textMuted }}>{COB_TIPO[c.tipo]}</td>
                    <td style={{ padding: "12px 16px", color: C.textMuted }}>{c.competencia.slice(5, 7)}/{c.competencia.slice(0, 4)}</td>
                    <td style={{ padding: "12px 16px", color: C.textMuted }}>{fmt.dataSql(c.vencimento)}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: C.ink }}>{fmt.brl(c.valor)}</td>
                    <td style={{ padding: "12px 16px" }}><StatusPagamento item={c} /></td>
                    <td style={{ padding: "12px 16px" }}>{c.status === "PENDENTE" && <Button variant="outline" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => pagar("cobrancas", c)}>Marcar como paga</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          despesas.length === 0 ? <EmptyState icon={DollarSign} title="Nenhuma despesa" desc="Registre os gastos do condomínio." /> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
              <thead><tr style={{ background: C.bg, textAlign: "left" }}>
                {["Descrição", "Categoria", "Fornecedor", "Vencimento", "Valor", "Situação", ""].map((h) => <th key={h} style={{ padding: "11px 16px", fontSize: 11.5, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {despesas.map((d) => (
                  <tr key={d.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: C.ink }}>{d.descricao}</td>
                    <td style={{ padding: "12px 16px", color: C.textMuted }}>{DESP_CAT[d.categoria]}</td>
                    <td style={{ padding: "12px 16px", color: C.textMuted }}>{d.fornecedor || "—"}</td>
                    <td style={{ padding: "12px 16px", color: C.textMuted }}>{fmt.dataSql(d.vencimento)}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: C.ink }}>{fmt.brl(d.valor)}</td>
                    <td style={{ padding: "12px 16px" }}><StatusPagamento item={d} /></td>
                    <td style={{ padding: "12px 16px" }}>{d.status === "PENDENTE" && <Button variant="outline" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => pagar("despesas", d)}>Marcar como paga</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </Card>
      <div style={{ fontSize: 12, color: C.textFaint, marginTop: 10 }}>Módulo financeiro provisório: a especificação da API de taxas (SCRUM-68) ainda está em análise.</div>

      <Modal open={modal === "cobranca"} onClose={() => setModal(null)} title="Lançar cobrança">
        <form onSubmit={salvar}>
          <Field label="Unidade">
            <select required style={inputStyle} value={fc.unidadeId} onChange={(e) => setFc({ ...fc, unidadeId: e.target.value })}>
              <option value="">Selecione...</option>
              {unidades.map((u) => <option key={u.id} value={u.id}>{rotuloUnidade(u)}</option>)}
            </select>
          </Field>
          <Field label="Tipo">
            <select style={inputStyle} value={fc.tipo} onChange={(e) => setFc({ ...fc, tipo: e.target.value })}>
              {Object.entries(COB_TIPO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Descrição (opcional)"><input maxLength={150} style={inputStyle} value={fc.descricao} onChange={(e) => setFc({ ...fc, descricao: e.target.value })} placeholder="Ex: barulho após as 22h" /></Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Mês de referência"><input required type="month" style={inputStyle} value={fc.competencia.slice(0, 7)} onChange={(e) => setFc({ ...fc, competencia: e.target.value + "-01" })} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Vencimento"><input required type="date" style={inputStyle} value={fc.vencimento} onChange={(e) => setFc({ ...fc, vencimento: e.target.value })} /></Field></div>
          </div>
          <Field label="Valor (R$)"><input required type="number" step="0.01" min="0.01" style={inputStyle} value={fc.valor} onChange={(e) => setFc({ ...fc, valor: e.target.value })} /></Field>
          <MsgErroForm msg={erroForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" type="button" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? "Salvando..." : "Lançar"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "despesa"} onClose={() => setModal(null)} title="Registrar despesa">
        <form onSubmit={salvar}>
          <Field label="Descrição"><input required minLength={3} maxLength={150} style={inputStyle} value={fd.descricao} onChange={(e) => setFd({ ...fd, descricao: e.target.value })} /></Field>
          <Field label="Categoria">
            <select style={inputStyle} value={fd.categoria} onChange={(e) => setFd({ ...fd, categoria: e.target.value })}>
              {Object.entries(DESP_CAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Fornecedor (opcional)"><input maxLength={120} style={inputStyle} value={fd.fornecedor} onChange={(e) => setFd({ ...fd, fornecedor: e.target.value })} /></Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Mês de referência"><input required type="month" style={inputStyle} value={fd.competencia.slice(0, 7)} onChange={(e) => setFd({ ...fd, competencia: e.target.value + "-01" })} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Vencimento"><input required type="date" style={inputStyle} value={fd.vencimento} onChange={(e) => setFd({ ...fd, vencimento: e.target.value })} /></Field></div>
          </div>
          <Field label="Valor (R$)"><input required type="number" step="0.01" min="0.01" style={inputStyle} value={fd.valor} onChange={(e) => setFd({ ...fd, valor: e.target.value })} /></Field>
          <MsgErroForm msg={erroForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" type="button" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? "Salvando..." : "Registrar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ============================================================
   COMUNIDADE (morador) e PRESTADORES (síndico): prestadores + FAQ
   ============================================================ */
function InformacoesPage({ role, showToast }) {
  const editar = role === "sindico";
  const prest = useCarregar(() => ZeluviAPI.get("/prestadores"), []);
  const faq = useCarregar(() => ZeluviAPI.get("/faq"), []);
  const [modal, setModal] = useState(null); // "prestador" | "faq"
  const [fp, setFp] = useState({ nome: "", servico: "", telefone: "", observacoes: "" });
  const [ff, setFf] = useState({ pergunta: "", resposta: "" });
  const [erroForm, setErroForm] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setEnviando(true); setErroForm("");
    try {
      if (modal === "prestador") {
        const corpo = { nome: fp.nome, servico: fp.servico };
        if (fp.telefone.trim()) corpo.telefone = fp.telefone.trim();
        if (fp.observacoes.trim()) corpo.observacoes = fp.observacoes.trim();
        await ZeluviAPI.post("/prestadores", corpo); prest.recarregar();
      } else {
        await ZeluviAPI.post("/faq", ff); faq.recarregar();
      }
      setModal(null); setFp({ nome: "", servico: "", telefone: "", observacoes: "" }); setFf({ pergunta: "", resposta: "" });
      showToast("Salvo.");
    } catch (err) { setErroForm(mensagemDeErro(err)); } finally { setEnviando(false); }
  }
  async function remover(rota, id, recarregar) {
    if (!window.confirm("Remover este item?")) return;
    if (await tentar(() => ZeluviAPI.del(`/${rota}/${id}`), showToast, "Removido.")) recarregar();
  }

  if (prest.carregando || faq.carregando) return <Carregando />;
  if (prest.erro || faq.erro) return <CaixaErro msg={prest.erro || faq.erro} onRetry={() => { prest.recarregar(); faq.recarregar(); }} />;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Prestadores cadastrados</div>
        {editar && <Button icon={Plus} onClick={() => { setErroForm(""); setModal("prestador"); }}>Novo prestador</Button>}
      </div>
      {prest.dados.dados.length === 0 ? (
        <Card><EmptyState icon={Wrench} title="Nenhum prestador cadastrado" desc="Os prestadores indicados pelo condomínio aparecem aqui." /></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }} className="area-grid">
          {prest.dados.dados.map((p) => (
            <Card key={p.id}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{p.nome}</div>
              <Badge bg={C.infoLight} fg={C.info} style={{ marginTop: 6 }}>{p.servico}</Badge>
              {p.telefone && <div style={{ fontSize: 13, color: C.textMuted, marginTop: 10 }}>{p.telefone}</div>}
              {p.observacoes && <div style={{ fontSize: 12, color: C.textFaint, marginTop: 6, lineHeight: 1.5 }}>{p.observacoes}</div>}
              {editar && <Button variant="outline" style={{ marginTop: 12, padding: "6px 10px", fontSize: 12 }} onClick={() => remover("prestadores", p.id, prest.recarregar)}>Remover</Button>}
            </Card>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 12px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Perguntas frequentes</div>
        {editar && <Button icon={Plus} onClick={() => { setErroForm(""); setModal("faq"); }}>Nova pergunta</Button>}
      </div>
      {faq.dados.dados.length === 0 ? (
        <Card><EmptyState icon={BookOpen} title="Nenhuma pergunta cadastrada" desc="O síndico pode cadastrar as dúvidas mais comuns." /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {faq.dados.dados.map((f) => (
            <Card key={f.id}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 6 }}>{f.pergunta}</div>
              <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6 }}>{f.resposta}</div>
              {editar && <Button variant="outline" style={{ marginTop: 10, padding: "6px 10px", fontSize: 12 }} onClick={() => remover("faq", f.id, faq.recarregar)}>Remover</Button>}
            </Card>
          ))}
        </div>
      )}
      <div style={{ fontSize: 12, color: C.textFaint, marginTop: 14 }}>Avaliações com estrelas e a rede de recomendações entre moradores ainda não têm tabela no banco: ficam para a próxima etapa.</div>

      <Modal open={modal === "prestador"} onClose={() => setModal(null)} title="Novo prestador">
        <form onSubmit={salvar}>
          <Field label="Nome"><input required minLength={3} maxLength={150} style={inputStyle} value={fp.nome} onChange={(e) => setFp({ ...fp, nome: e.target.value })} /></Field>
          <Field label="Serviço"><input required minLength={2} maxLength={100} style={inputStyle} value={fp.servico} onChange={(e) => setFp({ ...fp, servico: e.target.value })} placeholder="Ex: Elétrica" /></Field>
          <Field label="Telefone (opcional)"><input maxLength={30} style={inputStyle} value={fp.telefone} onChange={(e) => setFp({ ...fp, telefone: e.target.value })} /></Field>
          <Field label="Observações (opcional)"><textarea maxLength={2000} style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={fp.observacoes} onChange={(e) => setFp({ ...fp, observacoes: e.target.value })} /></Field>
          <MsgErroForm msg={erroForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" type="button" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>Salvar</Button>
          </div>
        </form>
      </Modal>
      <Modal open={modal === "faq"} onClose={() => setModal(null)} title="Nova pergunta frequente">
        <form onSubmit={salvar}>
          <Field label="Pergunta"><input required minLength={3} maxLength={255} style={inputStyle} value={ff.pergunta} onChange={(e) => setFf({ ...ff, pergunta: e.target.value })} /></Field>
          <Field label="Resposta"><textarea required maxLength={5000} style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={ff.resposta} onChange={(e) => setFf({ ...ff, resposta: e.target.value })} /></Field>
          <MsgErroForm msg={erroForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" type="button" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ============================================================
   MEU PERFIL
   ============================================================ */
function PerfilPage({ role, user, showToast }) {
  const [enviando, setEnviando] = useState(false);
  async function pedirNovaSenha() {
    setEnviando(true);
    await tentar(() => ZeluviAPI.esqueciSenha(user.email), showToast, "Enviamos um link para o seu e-mail para criar uma nova senha.");
    setEnviando(false);
  }
  const linhas = [
    ["Nome", user.name], ["E-mail", user.email], ["Perfil", ROLE_LABEL[role]],
    ...(role === "morador" ? [["Unidade", `${user.unidade}${user.bloco ? ` · ${user.bloco}` : ""}`]] : []),
  ];
  return (
    <div className="fade-up" style={{ maxWidth: 560 }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 999, background: C.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>
            {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: C.ink }}>{user.name}</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>{ROLE_LABEL[role]}</div>
          </div>
        </div>
        {linhas.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderTop: `1px solid ${C.border}`, fontSize: 13.5 }}>
            <span style={{ color: C.textMuted }}>{k}</span><span style={{ fontWeight: 600, color: C.ink }}>{v}</span>
          </div>
        ))}
        <div style={{ marginTop: 18 }}>
          <Button variant="outline" onClick={pedirNovaSenha} disabled={enviando}>{enviando ? "Enviando..." : "Alterar minha senha por e-mail"}</Button>
        </div>
      </Card>
    </div>
  );
}
