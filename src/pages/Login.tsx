import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function destination() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
    return profile?.role === "admin" ? "/admin" : profile?.role === "editor" ? "/editor" : "/member";
  }

  useEffect(() => {
    let active = true;
    void destination().then((path) => { if (active && path) navigate(path, { replace: true }); });
    return () => { active = false; };
  }, [navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setMessage(error.message); setBusy(false); return; }
    const path = await destination();
    navigate(path || "/member", { replace: true });
  }

  async function resetPassword() {
    if (!email.trim()) { setMessage("Enter your email address first."); return; }
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + "/login" });
    setMessage(error ? error.message : "Password reset instructions have been sent if the account exists.");
    setBusy(false);
  }

  return <main className="auth-page"><section className="auth-card">
    <Link className="eyebrow" to="/">Economic Policy Lab</Link>
    <h1>Welcome back.</h1><p className="auth-copy">Sign in to access your member or administrator workspace.</p>
    {message && <p className="form-message" role="status">{message}</p>}
    <form onSubmit={submit} className="auth-form">
      <label>Email address<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
      <button className="epl-button" disabled={busy}>{busy ? "Please wait…" : "Log in"}</button>
    </form>
    <button type="button" className="text-button" disabled={busy} onClick={resetPassword}>Reset password</button>
    <p className="auth-note">EPL accounts are provided or approved by the team. Public account creation is disabled.</p>
    <Link className="back-link" to="/">Back to home</Link>
  </section></main>;
}
