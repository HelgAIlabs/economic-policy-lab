import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Submission = { id: string; title: string; content_type: string; status: string; updated_at: string; excerpt: string | null };
export default function Member() {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState("");
  const [items, setItems] = useState<Submission[]>([]);
  const [message, setMessage] = useState("Loading your workspace…");
  const [ready, setReady] = useState(false);
  const load = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from("articles").select("id,title,content_type,status,updated_at,excerpt").eq("author_id", userId).order("updated_at", { ascending: false });
    if (error) { setMessage("Could not load submissions: " + error.message); return; }
    setItems((data ?? []) as Submission[]); setMessage("");
  }, []);
  useEffect(() => {
    let active = true;
    async function init() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) { navigate("/login", { replace: true }); return; }
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role,display_name").eq("id", session.user.id).maybeSingle();
      if (!active) return;
      if (profileError) { setMessage("Could not verify your profile: " + profileError.message); return; }
      if (profile?.role === "admin") { navigate("/admin", { replace: true }); return; }
      setIdentity(profile?.display_name || session.user.email || "Member");
      setReady(true); await load(session.user.id);
    }
    void init();
    return () => { active = false; };
  }, [navigate, load]);
  async function logout() { await supabase.auth.signOut(); navigate("/login", { replace: true }); }
  if (!ready) return <main className="member-page"><p>{message}</p></main>;
  const count = (status: string) => items.filter(item => item.status === status).length;
  return <main className="member-page">
    <header className="member-heading"><div><p className="eyebrow">Economic Policy Lab · Member workspace</p><h1>Welcome, {identity}.</h1><p>Manage your articles and research submissions.</p></div><div className="member-actions"><Link className="text-button" to="/">View website</Link><button className="text-button" onClick={logout}>Log out</button></div></header>
    <section className="member-stats"><div><span>All submissions</span><strong>{items.length}</strong></div><div><span>Drafts</span><strong>{count("draft")}</strong></div><div><span>Under review</span><strong>{count("pending")}</strong></div><div><span>Published</span><strong>{count("published")}</strong></div></section>
    <section className="member-list"><div className="member-list-heading"><div><p className="eyebrow">Your work</p><h2>Submissions</h2></div><Link className="epl-button" to="/member/write">Create submission</Link></div>
      {message && <p className="form-message" role="status">{message}</p>}
      {!items.length && !message ? <div className="member-empty"><h3>No submissions yet</h3><p>Start with an article or research paper. You can save a draft before sending it for editorial review.</p><Link className="epl-button" to="/member/write">Create your first submission</Link></div> : <div className="member-submissions">{items.map(item=><article className="member-submission" key={item.id}><div><span className="status-pill">{item.status || "draft"}</span><p className="member-type">{item.content_type === "research" ? "Research" : "Article"}</p><h3>{item.title || "Untitled submission"}</h3>{item.excerpt && <p className="member-excerpt">{item.excerpt}</p>}<small>Last updated {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : "—"}</small></div><Link className="text-button" to={"/member/write?id=" + encodeURIComponent(item.id)}>{item.status === "published" ? "View" : "Edit"}</Link></article>)}</div>}
    </section>
  </main>;
}