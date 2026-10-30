import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Navigate, useNavigate } from "../navigation";
import { useAuth } from "../auth";

export function AuthPage() {
  const { user, loading, sessionMessage, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (loading) return <div className="screen-center">Verificando acesso…</div>;
  if (user) return <Navigate to="/" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name);
      navigate("/");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Não foi possível entrar.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-hero">
        <div className="hero-grain" />
        <div className="auth-hero-inner">
          <div>
            <div className="hero-symbol">✳</div>
            <h1>
              O próximo passo
              <br />é <em>seu.</em>
            </h1>
            <p>
              Pratique decisões clínicas em um ambiente que reage ao tempo, às
              suas perguntas e às suas condutas.
            </p>
          </div>
        </div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-mobile-brand">✳ SIMULADOR CLÍNICO</div>
        <div className="auth-form">
          <h2>
            {mode === "login" ? "Boas-vindas de volta." : "Comece sua jornada."}
          </h2>
          <p className="muted">
            {mode === "login"
              ? "Entre para continuar seus atendimentos."
              : "Crie sua conta para iniciar uma simulação."}
          </p>
          <div className="segmented" role="group" aria-label="Tipo de acesso">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Entrar
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Criar conta
            </button>
          </div>
          <form onSubmit={submit}>
            {mode === "register" && <><label htmlFor="name">Seu nome</label><input id="name" type="text" autoComplete="name" minLength={2} maxLength={100} required value={name} onChange={event => setName(event.target.value)} placeholder="Como quer ser chamado" /></>}
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
            {mode === "register" && <small className="hint">Você pode usar um e-mail fictício em formato válido. Guarde-o com a senha para voltar à sua conta; não há recuperação de acesso por e-mail.</small>}
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={mode === "register" ? 8 : undefined}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {mode === "register" && (
              <small className="hint">Use pelo menos 8 caracteres.</small>
            )}
            {(error || sessionMessage) && (
              <p className="inline-error" role="alert">
                {error || sessionMessage}
              </p>
            )}
            <button className="button button-primary full" disabled={busy}>
              {busy
                ? "Aguarde…"
                : mode === "login"
                  ? "Entrar na plataforma →"
                  : "Criar conta →"}
            </button>
          </form>
          <p className="auth-note">
            Simulação educacional com pacientes fictícios. Não substitui
            assistência médica.
          </p>
          <p className="auth-admin-link"><Link href="/admin/entrar">Acesso administrativo</Link></p>
        </div>
      </section>
    </main>
  );
}
