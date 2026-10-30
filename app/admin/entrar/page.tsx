"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { adminApi, adminTokenStore } from "../../../src/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const session = await adminApi.login(username, password);
      adminTokenStore.set(session.access_token);
      router.replace("/admin");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="admin-login-page"><section className="admin-login-card">
    <span className="eyebrow">SIMULADOR CLÍNICO / ADMINISTRAÇÃO</span>
    <h1>Acesso administrativo</h1>
    <p>Entre para consultar contas cadastradas e avaliações enviadas.</p>
    <form onSubmit={submit}>
      <label htmlFor="admin-username">Usuário</label>
      <input id="admin-username" autoComplete="username" required value={username} onChange={event => setUsername(event.target.value)} />
      <label htmlFor="admin-password">Senha</label>
      <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
      {error && <p className="inline-error" role="alert">{error}</p>}
      <button className="button button-primary full" disabled={busy}>{busy ? "Entrando…" : "Entrar →"}</button>
    </form>
    <Link href="/entrar">Voltar ao acesso de estudantes</Link>
  </section></main>;
}
