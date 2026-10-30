import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "../navigation";
import { api, ApiError } from "../api";
import { clinicalNumber } from "../format";
import { AtlasIcon } from "../components/AtlasIcon";
import { ErrorPanel, Loading } from "../components/Feedback";
import { PatientScene } from "../components/PatientScene";
import { VitalMeter } from "../components/VitalMeter";
import { useSimulation } from "../hooks/useSimulation";
import type { Simulation } from "../types";

const labels: Record<string, string> = {
  LOW: "Baixa",
  MODERATE: "Moderada",
  HIGH: "Alta",
  active: "ativo",
  inhibited: "abordado",
  inactive: "resolvido",
  correct: "conduta adequada",
  partially_correct: "conduta parcialmente adequada",
  assessment: "avaliação do quadro",
  incorrect: "reavaliar conduta",
};
const label = (value: string) =>
  labels[value] || value.replaceAll("_", " ").toLowerCase();
const advanceChoices = [10, 15, 30, 60, 120, 300, 600];
const advanceLabel = (seconds: number) => seconds < 60 ? `${seconds} s` : `${seconds / 60} min`;
const defaultAdvance = (minutes: number) => minutes === 1 ? 10 : minutes <= 5 ? 30 : 60;
function actionError(reason: unknown) {
  if (reason instanceof ApiError) {
    if (reason.status === 503)
      return `${reason.message} Tente novamente; seu texto foi preservado.`;
    if (reason.code === "stale_simulation")
      return "O atendimento mudou durante a avaliação. Revise o quadro e tente novamente.";
    if (reason.code === "already_finished")
      return "O atendimento terminou. Consulte o resultado.";
  }
  return reason instanceof Error
    ? reason.message
    : "Não foi possível completar a ação.";
}

export function SimulationPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const {
    simulation,
    remainingSeconds,
    evolution,
    loading,
    error,
    setError,
    refresh,
    beginAction,
    commit,
    endAction,
  } = useSimulation(id);
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [message, setMessage] = useState("");
  const [pendingText, setPendingText] = useState("");
  const [streamPreview, setStreamPreview] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [reportId, setReportId] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [showProtocols, setShowProtocols] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [evolutionExpanded, setEvolutionExpanded] = useState(false);
  const [advanceSeconds, setAdvanceSeconds] = useState(30);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!simulation) return;
    const saved = Number(localStorage.getItem(`advance-seconds:${simulation.time_limit_minutes}`));
    setAdvanceSeconds(saved >= 1 && saved <= simulation.time_limit_minutes * 60
      ? saved : defaultAdvance(simulation.time_limit_minutes));
  }, [simulation?.time_limit_minutes]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const scrollToBottom = () => {
      if (streamPreview) {
        el.scrollTop = el.scrollHeight;
      } else {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: "smooth",
        });
      }
    };
    scrollToBottom();
    const frame = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(frame);
  }, [simulation?.interactions, pendingText, streamPreview, showProtocols, showReport]);

  const activeSymptoms = simulation?.symptoms.filter((item) => item.state === "active") || [];
  const symptom =
    activeSymptoms.find((item) => item.name === selectedSymptom)?.name ||
    activeSymptoms[0]?.name ||
    "";

  async function action(name: string, task: () => Promise<Simulation | void>) {
    if (!beginAction()) return;
    setBusy(name);
    setError("");
    setNotice("");
    try {
      const updated = await task();
      if (updated) commit(updated);
    } catch (reason) {
      await refresh(true);
      setError(actionError(reason));
    } finally {
      endAction();
      setBusy("");
    }
  }
  function send(event: FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!text || !symptom) return;
    setPendingText(text);
    setStreamPreview("");
    void action("interaction", async () => {
      try {
        const response = await api.interactStream(id, text, symptom, setStreamPreview);
        setMessage("");
        return response.simulation;
      } finally {
        setPendingText("");
        setStreamPreview("");
      }
    });
  }
  function reveal() {
    if (!symptom) return;
    void action("protocol", async () => {
      const response = await api.reveal(id, symptom);
      setNotice(`Protocolo ${symptom}: nível ${response.level} revelado.`);
      setShowProtocols(true);
      await refresh(true);
    });
  }
  function report(event: FormEvent) {
    event.preventDefault();
    if (!reportId || !reportDescription.trim()) return;
    void action("report", async () => {
      await api.report(id, reportId, reportDescription.trim());
      setNotice("Resposta reportada. Obrigado pelo feedback.");
      setReportId("");
      setReportDescription("");
      setShowReport(false);
      await refresh(true);
    });
  }
  if (loading && !simulation)
    return (
      <main className="page">
        <Loading label="Carregando atendimento…" />
      </main>
    );
  if (!simulation)
    return (
      <main className="page">
        <ErrorPanel
          message={error || "Simulação não encontrada."}
          retry={() => void refresh()}
        />
      </main>
    );

  const hasCriticalSign = simulation.vital_signs.some(
    (item) => item.is_critical,
  );
  const hasIntenseSymptom = simulation.symptoms.some(
    (item) => item.state === "active" && item.severity === "HIGH",
  );
  const state = hasCriticalSign
    ? "critical"
    : hasIntenseSymptom
      ? "intense"
      : "stable";
  const urgentTime =
    simulation.is_running &&
    remainingSeconds <= Math.max(60, simulation.time_limit_minutes * 15);
  const expiring = simulation.is_running && remainingSeconds === 0;
  const availableAdvances = advanceChoices.filter(value => value <= simulation.time_limit_minutes * 60);
  const selectedAdvance = advanceSeconds >= 1 && advanceSeconds <= simulation.time_limit_minutes * 60
    ? advanceSeconds
    : defaultAdvance(simulation.time_limit_minutes);
  const timerText = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
  const elapsedSeconds = simulation.is_running
    ? simulation.time_limit_minutes * 60 - remainingSeconds
    : simulation.elapsed_time_minutes * 60;
  const progress = Math.min(
    100,
    Math.round((elapsedSeconds / (simulation.time_limit_minutes * 60)) * 100),
  );
  const outcome = simulation.result?.definitive_outcome;
  const evolutionTone = evolution?.changes.some(change => change.tone === "critical" || change.tone === "worse")
    ? "has-worse"
    : evolution ? "has-change" : "";
  const selectedProtocol = simulation.protocols.find(
    (item) => item.symptom_name === symptom,
  );
  function finish() {
    void action("finish", async () => {
      const result = await api.finish(id);
      navigate(`/simulacoes/${id}/resultado`);
      return result;
    });
  }
  return (
    <main className="immersion-page">
      <header className={`immersion-toolbar ${urgentTime ? "is-urgent" : ""}`}>
        <div className="immersion-navigation">
          <Link className="immersion-back" to="/" aria-label="Voltar ao painel">
            <span aria-hidden="true">←</span> Painel
          </Link>
          <h1 className="sr-only">Simulação clínica</h1>
        </div>
        <div
          className="immersion-clock"
          role="timer"
          aria-label={
            simulation.is_running
              ? `Tempo restante: ${timerText}`
              : `Tempo utilizado: ${simulation.elapsed_time_minutes} minutos`
          }
        >
          <span>
            {simulation.is_running ? "TEMPO RESTANTE" : "TEMPO UTILIZADO"}
          </span>
          <strong>
            <time
              dateTime={
                simulation.is_running
                  ? `PT${remainingSeconds}S`
                  : `PT${simulation.elapsed_time_minutes}M`
              }
            >
              {simulation.is_running
                ? timerText
                : `${simulation.elapsed_time_minutes} min`}
            </time>
          </strong>
          <div
            className="immersion-progress"
            role="progressbar"
            aria-label="Tempo decorrido"
            aria-valuemin={0}
            aria-valuemax={simulation.time_limit_minutes * 60}
            aria-valuenow={elapsedSeconds}
          >
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
        {simulation.is_running ? (
          <div className="immersion-end">
            {confirmFinish ? (
              <>
                <button
                  type="button"
                  className="end-confirm"
                  onClick={finish}
                  disabled={!!busy || expiring}
                >
                  Confirmar fim
                </button>
                <button
                  type="button"
                  className="end-cancel"
                  onClick={() => setConfirmFinish(false)}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                className="end-trigger"
                onClick={() => setConfirmFinish(true)}
                disabled={!!busy || expiring}
                title="Encerrar simulação"
              >
                <span aria-hidden="true">■</span> Encerrar
              </button>
            )}
          </div>
        ) : (
          <Link className="end-trigger" to={`/simulacoes/${id}/resultado`}>
            Resultado ↗
          </Link>
        )}
      </header>
      {error && <ErrorPanel message={error} retry={() => void refresh()} />}
      {notice && (
        <div className="immersion-notice" role="status">
          ✓ {notice}
        </div>
      )}
      <div className="immersion-workspace">
        <section
          className={`immersion-stage stage-${state}`}
          aria-label="Ambiente de simulação clínica"
        >
          <PatientScene
            simulationId={id}
            state={state}
            running={simulation.is_running}
          />
          <div className="immersion-stage-shade" aria-hidden="true" />
          {simulation.is_running && <div className="immersion-patient-status">
            <span>
              {simulation.is_running
                ? "PACIENTE EM ATENDIMENTO"
                : "ATENDIMENTO ENCERRADO"}
            </span>
            <strong>
              {hasCriticalSign
                ? "Sinais críticos"
                : hasIntenseSymptom
                  ? "O quadro exige atenção"
                  : "Em observação"}
            </strong>
          </div>}
          <section
            className="immersion-chat"
            aria-label="Conversa com o paciente"
          >
            {showProtocols ? (
              <div className="chat-drawer" id="chat-protocols">
                <div className="chat-drawer-heading">
                  <strong>Protocolos</strong>
                  <button
                    type="button"
                    aria-label="Fechar protocolos"
                    onClick={() => setShowProtocols(false)}
                  >
                    ×
                  </button>
                </div>
                <p className="chat-protocol-note">1 · Orientação inicial &nbsp; 2 · Direcionamento &nbsp; 3 · Conduta esperada. Uma resposta parcial cobre apenas parte da conduta do nível 3.</p>
                <label htmlFor="protocol-symptom">Sintoma para consultar</label>
                <div className="chat-protocol-controls">
                  <select
                    id="protocol-symptom"
                    value={symptom}
                    onChange={(event) => setSelectedSymptom(event.target.value)}
                    disabled={!!busy || expiring || !activeSymptoms.length}
                  >
                    {activeSymptoms.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="chat-protocol-reveal"
                    onClick={reveal}
                    disabled={
                      !!busy ||
                      expiring ||
                      !symptom ||
                      (simulation.protocol_progress[symptom] || 0) >= 3
                    }
                  >
                    Revelar próximo nível
                  </button>
                </div>
                {selectedProtocol?.content.length ? (
                  <div className="chat-protocol-content">
                    <strong>
                      {selectedProtocol.symptom_name} · nível{" "}
                      {selectedProtocol.revealed_level} de 3
                    </strong>
                    {selectedProtocol.content.map((content, index) => (
                      <p key={index}>
                        <b>{index + 1} · {['Orientação', 'Direcionamento', 'Conduta esperada'][index]}</b><br />{content}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p>Nenhuma orientação revelada para este sintoma.</p>
                )}
                {selectedProtocol?.reference_source && (
                  <p className="chat-protocol-source">Conteúdo didático adaptado de <a href={selectedProtocol.reference_source} target="_blank" rel="noopener noreferrer">NHS · consultar fonte ↗</a></p>
                )}
              </div>
            ) : showReport ? (
              <form className="chat-drawer" onSubmit={report}>
                <div className="chat-drawer-heading">
                  <strong>Denunciar resposta</strong>
                  <button
                    type="button"
                    aria-label="Fechar denúncia"
                    onClick={() => setShowReport(false)}
                  >
                    ×
                  </button>
                </div>
                <label htmlFor="report-interaction">Resposta</label>
                <select
                  id="report-interaction"
                  value={reportId}
                  onChange={(event) => setReportId(event.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {simulation.interactions.map((item, index) => (
                    <option value={item.id} key={item.id}>
                      Resposta {index + 1}
                    </option>
                  ))}
                </select>
                <label htmlFor="report-description">O que houve?</label>
                <textarea
                  id="report-description"
                  value={reportDescription}
                  onChange={(event) => setReportDescription(event.target.value)}
                  maxLength={2000}
                  required
                />
                <button
                  className="button button-primary"
                  disabled={!!busy || expiring}
                >
                  Enviar denúncia
                </button>
              </form>
            ) : (
              <div
                ref={messagesContainerRef}
                className="immersion-messages"
                aria-live="polite"
                aria-relevant="additions"
              >
                {simulation.interactions.length ? (
                  simulation.interactions.map((item, index) => (
                    <div className="immersion-exchange" key={item.id}>
                      <div className="immersion-message student">
                        <small>VOCÊ · {index + 1}</small>
                        <p>{item.student_text}</p>
                      </div>
                      <div className="immersion-message patient">
                        <small>PACIENTE</small>
                        <p>{item.patient_response}</p>
                        {simulation.is_running && (
                          <button
                            type="button"
                            className="message-report"
                            title="Denunciar esta resposta"
                            aria-label={`Denunciar resposta ${index + 1}`}
                            onClick={() => {
                              setReportId(item.id);
                              setShowReport(true);
                              setShowProtocols(false);
                            }}
                          >
                            <AtlasIcon name="alert" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : !simulation.is_running ? (
                  <p className="immersion-empty">
                    Nenhuma interação foi registrada neste atendimento.
                  </p>
                ) : <div className="immersion-empty"><strong>Comece observando o quadro.</strong><p>Leia os sinais vitais e sintomas. Depois, pergunte sobre outras queixas ou descreva uma conduta para o sintoma selecionado. Use Protocolo se precisar de orientação.</p></div>}
                {pendingText && <div className="immersion-exchange" aria-live="polite">
                  <div className="immersion-message student"><small>VOCÊ · ENVIANDO</small><p>{pendingText}</p></div>
                  <div className="immersion-message patient streaming"><small>PACIENTE · {streamPreview ? "RESPONDENDO" : "PREPARANDO RESPOSTA"}</small><p>{streamPreview || "Aguardando o paciente…"}</p></div>
                </div>}
              </div>
            )}
            {simulation.is_running && (
              <>
                <div className="immersion-chat-tools">
                  <button
                    type="button"
                    className="chat-tool"
                    title="Abrir protocolos"
                    aria-label="Abrir protocolos"
                    aria-expanded={showProtocols}
                    onClick={() => {
                      setShowProtocols(!showProtocols);
                      setShowReport(false);
                    }}
                  >
                    <AtlasIcon name="protocol" /> <span>Protocolo</span>
                  </button>
                  <div className="chat-time-control">
                    <label htmlFor="advance-interval">Avançar</label>
                    <select
                      id="advance-interval"
                      value={availableAdvances.includes(selectedAdvance) ? selectedAdvance : "custom"}
                      onChange={(event) => {
                        const seconds = event.target.value === "custom"
                          ? Math.min(45, simulation.time_limit_minutes * 60)
                          : Number(event.target.value);
                        setAdvanceSeconds(seconds);
                        localStorage.setItem(`advance-seconds:${simulation.time_limit_minutes}`, String(seconds));
                      }}
                      disabled={!!busy || expiring}
                    >
                      {availableAdvances.map(seconds => (
                        <option key={seconds} value={seconds}>{advanceLabel(seconds)}</option>
                      ))}
                      <option value="custom">Personalizado</option>
                    </select>
                    {!availableAdvances.includes(selectedAdvance) && (
                      <label className="chat-time-custom" htmlFor="custom-advance">
                        <input
                          id="custom-advance"
                          type="number"
                          min={1}
                          max={simulation.time_limit_minutes * 60}
                          value={selectedAdvance}
                          onChange={(event) => {
                            const seconds = Math.max(1, Math.min(simulation.time_limit_minutes * 60, Number(event.target.value)));
                            setAdvanceSeconds(seconds);
                            localStorage.setItem(`advance-seconds:${simulation.time_limit_minutes}`, String(seconds));
                          }}
                        />
                        <span>segundos</span>
                      </label>
                    )}
                    <button
                      type="button"
                      className="chat-tool"
                      title={`Aguardar ${advanceLabel(selectedAdvance)}; o quadro pode se agravar`}
                      aria-label={`Aguardar ${advanceLabel(selectedAdvance)}`}
                      onClick={() => void action("time", () => api.advance(id, selectedAdvance))}
                      disabled={!!busy || expiring}
                    >
                      <AtlasIcon name="clock" /> <span>+{advanceLabel(selectedAdvance)}</span>
                    </button>
                  </div>
                </div>
                {!showProtocols && !showReport && (
                  <form
                    className="immersion-compose"
                    onSubmit={send}
                    aria-busy={busy === "interaction"}
                  >
                    <label htmlFor="interaction-text">
                      Sua pergunta ou conduta
                    </label>
                    <div>
                      <textarea
                        id="interaction-text"
                        rows={3}
                        maxLength={2000}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                            event.preventDefault();
                            event.currentTarget.form?.requestSubmit();
                          }
                        }}
                        placeholder="Pergunte sobre outras queixas ou descreva sua conduta…"
                        disabled={!!busy || !symptom || expiring}
                        required
                      />
                      <button
                        type="submit"
                        aria-label="Enviar interação"
                        disabled={
                          !!busy || !symptom || !message.trim() || expiring
                        }
                      >
                        {busy === "interaction" ? "…" : "➤"}
                      </button>
                    </div>
                    <small className="compose-hint">Enter envia · Shift + Enter quebra a linha</small>
                    {error && <p className="compose-error" role="alert">{error}</p>}
                  </form>
                )}
              </>
            )}
          </section>
          {!simulation.is_running && <div className="immersion-outcome" role="status">
            <span className="eyebrow light">CASO CONCLUÍDO</span>
            <strong>{outcome === "Agravamento crítico" ? "O quadro chegou a um ponto crítico." : outcome === "Tempo esgotado" ? "O tempo do atendimento acabou." : outcome === "Atendimento bem-sucedido" ? "Você estabilizou o quadro." : "Atendimento concluído."}</strong>
            <p>Suas decisões, os sinais finais e o retorno do caso estão prontos para revisão.</p>
            <Link className="button button-primary" to={`/simulacoes/${id}/resultado`}>Ver resultado completo ↗</Link>
          </div>}
        </section>
        <section className={`immersion-context ${evolutionTone}`} aria-label="Evolução clínica" aria-live="polite">
          <div className="reading-evolution">
            <button type="button" className="reading-evolution-toggle" aria-expanded={evolutionExpanded} aria-controls="evolution-details" onClick={() => setEvolutionExpanded(value => !value)}>
              <span>Evolução do quadro</span>
              <strong>{evolution?.title || "Sem mudanças relevantes"}</strong>
              <small>{evolution ? `${evolution.changes.slice(0, 2).map(change => change.name).join(" · ")}${evolution.changes.length > 2 ? ` · +${evolution.changes.length - 2}` : ""}` : "Nenhuma alteração visível desde a última atualização"}</small>
              <span className="reading-evolution-chevron" aria-hidden="true">{evolutionExpanded ? "−" : "+"}</span>
            </button>
            <div id="evolution-details" className="reading-evolution-details" hidden={!evolutionExpanded}>
              {evolution ? <ul className="reading-change-list">
                {evolution.changes.map((change) => <li className={`change-${change.tone}`} key={change.key}>
                  <span>{change.name}</span><span>{change.before} <b aria-hidden="true">→</b> {change.after}</span>
                </li>)}
              </ul> : <p>Observe o quadro, pergunte sobre outras queixas e acompanhe a resposta às suas condutas.</p>}
            </div>
          </div>
        </section>
        <aside className="immersion-readings" aria-label="Estado clínico atual">
          <h2 className="reading-heading">
            <span>Sinais vitais</span>
            <small>{simulation.vital_signs.length} monitorados</small>
          </h2>
          <div className="reading-vitals">
            {simulation.vital_signs.length === 0 ? (
              <p>Sem medidas registradas.</p>
            ) : (
              simulation.vital_signs.map((item) => (
                <div
                  className={`reading-vital ${item.is_critical ? "is-critical" : ""}`}
                  key={item.name}
                >
                  <span className="reading-vital-name">{item.name}</span>
                  <strong>
                    {clinicalNumber(item.value)}
                    <small> {item.unit}</small>
                  </strong>
                  <VitalMeter vital={item} />
                  <div className="reading-vital-status">
                    {evolution?.changes
                      .filter((change) => change.key === `vital-${item.name}`)
                      .map((change) => (
                        <small key={change.key}>
                          Antes {change.before} → agora {change.after}
                        </small>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
        <aside className="immersion-review" aria-label="Sintomas visíveis">
          <h2 className="reading-heading">
            <span>Sintomas visíveis</span>
            <small>{simulation.symptoms.length} no quadro</small>
          </h2>
          {simulation.symptoms.length === 0 ? (
            <p>Sem sintomas visíveis.</p>
          ) : (
            <div className="reading-symptoms">
              {simulation.symptoms.map((item) => (
                <div className={`reading-symptom severity-${item.severity.toLowerCase()} ${item.state !== "active" ? "is-addressed" : ""}`} key={item.name}>
                  <header className="reading-symptom-title">
                    <strong>{item.name}</strong>
                    <span>
                      {clinicalNumber(item.intensity)}
                      <small>/10</small>
                    </span>
                  </header>
                  <p className="reading-symptom-meta">
                    <span>{label(item.state)}</span>
                    <span>{label(item.severity)}</span>
                  </p>
                  <div
                    className="reading-symptom-scale"
                    role="meter"
                    aria-label={`Intensidade de ${item.name}`}
                    aria-valuemin={0}
                    aria-valuemax={10}
                    aria-valuenow={item.intensity}
                    style={{ background: `linear-gradient(to right, var(--severity-color, #b16c16) 0%, var(--severity-color, #b16c16) ${Math.max(0, Math.min(100, item.intensity * 10))}%, #dbe4eb ${Math.max(0, Math.min(100, item.intensity * 10))}%, #dbe4eb 100%)` }}
                  />
                  <small className="reading-symptom-caption">
                    {item.state === "active" ? "Intensidade atual" : "Queixa abordada; acompanhe as demais"}
                  </small>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
