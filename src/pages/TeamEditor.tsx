import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type TeamMemberForm = { name: string; role_title: string; bio: string; image_url: string; section: "board" | "member"; sort_order: number; is_active: boolean; linkedin_url: string; instagram_url: string; };

type TeamMember = {
  id: string;
  name: string;
  role_title: string;
  bio: string;
  image_url: string | null;
  section: "board" | "member";
  sort_order: number;
  is_active: boolean;
  linkedin_url?: string | null;
  instagram_url?: string | null;
};

const fieldStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 12, border: "1px solid #ccd2d9", borderRadius: 8, background: "#fff" };
const buttonStyle: React.CSSProperties = { border: "1px solid #d7dce2", background: "#fff", borderRadius: 8, padding: "9px 12px", cursor: "pointer" };
const blankMember = (): TeamMemberForm => ({ name: "", role_title: "", bio: "", image_url: "", section: "member", sort_order: 0, is_active: true, linkedin_url: "", instagram_url: "" });

export default function TeamEditor() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [form, setForm] = useState<TeamMemberForm>(blankMember());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("Checking editorial access…");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("team_members").select("id,name,role_title,bio,image_url,section,sort_order,is_active,linkedin_url,instagram_url").order("section").order("sort_order").order("created_at");
    if (error) { setMessage("Could not load team members: " + error.message); return; }
    setMembers((data || []) as TeamMember[]);
    setMessage("");
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) { navigate("/login", { replace: true }); return; }
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
      if (!active) return;
      if (profileError || !["admin", "editor"].includes(profile?.role || "")) { navigate("/login", { replace: true }); return; }
      setReady(true);
      await load();
    }
    void init();
    return () => { active = false; };
  }, [navigate, load]);

  function update<K extends keyof TeamMemberForm>(key: K, value: TeamMemberForm[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function startEdit(item: TeamMember) {
    setEditingId(item.id);
    setForm({ name: item.name || "", role_title: item.role_title || "", bio: item.bio || "", image_url: item.image_url || "", section: item.section || "member", sort_order: Number(item.sort_order || 0), is_active: item.is_active, linkedin_url: item.linkedin_url || "", instagram_url: item.instagram_url || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() { setEditingId(null); setForm(blankMember()); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.role_title.trim()) { setMessage("Name and position are required."); return; }
    setSaving(true); setMessage("");
    const payload = { ...form, name: form.name.trim(), role_title: form.role_title.trim(), bio: form.bio.trim(), image_url: form.image_url.trim() || null, linkedin_url: form.linkedin_url.trim() || null, instagram_url: form.instagram_url.trim() || null, updated_at: new Date().toISOString() };
    const result = editingId
      ? await supabase.from("team_members").update(payload).eq("id", editingId)
      : await supabase.from("team_members").insert(payload);
    setSaving(false);
    if (result.error) { setMessage("Save failed: " + result.error.message); return; }
    setMessage(editingId ? "Team profile updated." : "Team member added.");
    resetForm();
    await load();
  }

  async function toggleActive(item: TeamMember) {
    const { error } = await supabase.from("team_members").update({ is_active: !item.is_active, updated_at: new Date().toISOString() }).eq("id", item.id);
    if (error) { setMessage("Could not update visibility: " + error.message); return; }
    setMessage(item.is_active ? "Profile hidden from the public Team page." : "Profile is now visible on the public Team page.");
    await load();
  }

  async function remove(item: TeamMember) {
    if (!window.confirm("Delete " + item.name + "'s team profile permanently?")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", item.id);
    if (error) { setMessage("Delete failed: " + error.message); return; }
    if (editingId === item.id) resetForm();
    setMessage("Team profile deleted.");
    await load();
  }

  if (!ready) return <main className="page-shell" style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}><p>{message}</p></main>;

  return <main className="page-shell" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 64px" }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 26 }}>
      <div><p className="eyebrow">Economic Policy Lab · Editorial</p><h1 style={{ margin: "8px 0" }}>Team directory editor</h1><p>Add and manage EPL team profiles, photos, positions, and biographies.</p></div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link className="text-button" to="/editor">← Editorial workspace</Link><Link className="text-button" to="/team">View public team</Link></div>
    </header>
    {message && <p role="status" style={{ padding: 12, borderRadius: 8, background: "#f3f5f7", marginBottom: 16 }}>{message}</p>}
    <section style={{ padding: 20, border: "1px solid #d7dce2", borderRadius: 12, marginBottom: 30 }}>
      <h2 style={{ marginTop: 0 }}>{editingId ? "Edit team profile" : "Add a team member"}</h2>
      <form onSubmit={save} style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          <label style={{ display: "grid", gap: 7 }}>Full name *<input style={fieldStyle} required value={form.name} onChange={e => update("name", e.target.value)} placeholder="Team member name" /></label>
          <label style={{ display: "grid", gap: 7 }}>Position / title *<input style={fieldStyle} required value={form.role_title} onChange={e => update("role_title", e.target.value)} placeholder="e.g. Research Analyst" /></label>
          <label style={{ display: "grid", gap: 7 }}>Team section<select style={fieldStyle} value={form.section} onChange={e => update("section", e.target.value as "board" | "member")}><option value="board">Founder & Board of Directors</option><option value="member">Members</option></select></label>
          <label style={{ display: "grid", gap: 7 }}>Display order (lower numbers appear first)<input style={fieldStyle} type="number" value={form.sort_order} onChange={e => update("sort_order", Number(e.target.value) || 0)} /></label>
        </div>
        <label style={{ display: "grid", gap: 7 }}>Photo URL<input style={fieldStyle} type="url" value={form.image_url} onChange={e => update("image_url", e.target.value)} placeholder="https://… (direct image link)" /></label>
        {form.image_url && <img src={form.image_url} alt="Team photo preview" style={{ width: 180, height: 180, objectFit: "cover", borderRadius: 10, border: "1px solid #d7dce2" }} onError={e => { e.currentTarget.style.display = "none"; }} />}
        <label style={{ display: "grid", gap: 7 }}>Biography / description<textarea style={{ ...fieldStyle, resize: "vertical" }} rows={5} value={form.bio} onChange={e => update("bio", e.target.value)} placeholder="Write a short professional description…" /></label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          <label style={{ display: "grid", gap: 7 }}>LinkedIn URL (optional)<input style={fieldStyle} type="url" value={form.linkedin_url} onChange={e => update("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/…" /></label>
          <label style={{ display: "grid", gap: 7 }}>Instagram URL (optional)<input style={fieldStyle} type="url" value={form.instagram_url} onChange={e => update("instagram_url", e.target.value)} placeholder="https://instagram.com/…" /></label>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="checkbox" checked={form.is_active} onChange={e => update("is_active", e.target.checked)} />Visible on public Team page</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button type="submit" disabled={saving} style={{ ...buttonStyle, background: "#172b3a", color: "#fff" }}>{saving ? "Saving…" : editingId ? "Save changes" : "Add team member"}</button>{editingId && <button type="button" style={buttonStyle} onClick={resetForm}>Cancel edit</button>}</div>
      </form>
    </section>
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}><h2 style={{ margin: 0 }}>Existing team profiles ({members.length})</h2><button style={buttonStyle} onClick={() => void load()}>Refresh</button></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        {members.map(item => <article key={item.id} style={{ border: "1px solid #d7dce2", borderRadius: 12, padding: 14, display: "grid", gap: 10, opacity: item.is_active ? 1 : 0.65 }}>
          {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: 210, objectFit: "cover", borderRadius: 8 }} /> : <div style={{ height: 130, display: "grid", placeItems: "center", background: "#f3f5f7", borderRadius: 8 }}>No photo added</div>}
          <div><h3 style={{ margin: "4px 0" }}>{item.name}</h3><p style={{ margin: "4px 0", color: "#8d2635" }}>{item.role_title}</p><p style={{ margin: "8px 0", lineHeight: 1.6 }}>{item.bio || "No description yet."}</p><small>{item.section === "board" ? "Founder & Board" : "Member"} · {item.is_active ? "Visible" : "Hidden"}</small></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button style={buttonStyle} onClick={() => startEdit(item)}>Edit</button><button style={buttonStyle} onClick={() => void toggleActive(item)}>{item.is_active ? "Hide" : "Show"}</button><button style={{ ...buttonStyle, color: "#a32232" }} onClick={() => void remove(item)}>Delete</button></div>
        </article>)}
      </div>
      {members.length === 0 && <p>No team profiles yet.</p>}
    </section>
  </main>;
}
