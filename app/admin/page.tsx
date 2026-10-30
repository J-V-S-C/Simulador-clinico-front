"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, adminTokenStore, type AdminFeedback } from "../../src/api";
import type { User } from "../../src/types";

export default function AdminPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<User[]>([]);
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"accounts" | "feedback">("accounts");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await adminApi.me();
      const [users, reviews] = await Promise.all([adminApi.accounts(), adminApi.feedback()]);
      setAccounts(users);
      setFeedback(reviews);
    } catch (reason) {
      if (!adminTokenStore.get()) router.replace("/admin/entrar");
      else setError(reason instanceof Error ? reason.message : "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { if (!adminTokenStore.get()) router.replace("/admin/entrar"); else void load(); }, [load, router]);

  async function logout() {
    try { await adminApi.logout(); } catch { /* Clear local session even if the server is unreachable. */ } finally {
      adminTokenStore.clear();
      router.replace("/admin/entrar");
    }
  }

  return <main className="admin-page">
    <header className="admin-header"><div><span className="eyebrow">SIMULADOR CLÍNICO / ADMINISTRAÇÃO</span><h1>Contas e avaliações</h1><p>Consulte os registros enviados pelos estudantes.</p></div><button className="button button-outline" onClick={() => void logout()}>Sair</button></header>
    {loading ? <p role="status">Carregando dados…</p> : error ? <div role="alert"><p>{error}</p><button className="button button-outline" onClick={() => void load()}>Tentar novamente</button></div> : <>
      <div className="admin-stats"><div><strong>{accounts.length}</strong><span>contas cadastradas</span></div><div><strong>{feedback.length}</strong><span>avaliações enviadas</span></div></div>
      <div className="dashboard-tabs" role="tablist" aria-label="Dados administrativos">
        <button type="button" role="tab" aria-selected={tab === "accounts"} onClick={() => setTab("accounts")}>Contas</button>
        <button type="button" role="tab" aria-selected={tab === "feedback"} onClick={() => setTab("feedback")}>Feedbacks</button>
      </div>
      {tab === "accounts" ? <section role="tabpanel" aria-label="Contas cadastradas"><h2>Contas cadastradas</h2>{accounts.length === 0 ? <p>Nenhuma conta cadastrada.</p> : <div className="admin-list">{accounts.map(account => <article className="admin-record" key={account.id}><strong>{account.name}</strong><span>{account.email}</span><small>{feedback.filter(item => item.user_id === account.id).length} avaliação(ões)</small></article>)}</div>}</section>
        : <section role="tabpanel" aria-label="Feedbacks enviados"><h2>Feedbacks enviados</h2>{feedback.length === 0 ? <p>Nenhuma avaliação enviada.</p> : <div className="admin-list">{feedback.map(item => <article className="admin-record" key={item.simulation_id}>
          <div className="admin-record-heading"><strong>{item.user_name}</strong><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("pt-BR")}</time></div>
          <span>{item.user_email}</span><small>Atendimento {item.simulation_id}</small>
          <p>{item.liked ? "Gostou da experiência" : "Não gostou da experiência"} · Clareza {item.clarity}/5 · Dificuldade {item.difficulty}/5</p>
          <p><b>Recurso mais útil:</b> {item.useful_feature || "Não informado"}</p><p><b>Sugestão de melhoria:</b> {item.improvement || "Não informada"}</p>
        </article>)}</div>}</section>}
    </>}
  </main>;
}
