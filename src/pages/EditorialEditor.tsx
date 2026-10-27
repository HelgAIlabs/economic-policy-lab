import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type ArticleRow = {
  id: string | number;
  title: string | null;
  excerpt: string | null;
  category: string | null;
  author_name: string | null;
  cover_image_url: string | null;
  content: string | null;
  content_type: string | null;
  status: string | null;
  is_featured?: boolean | null;
  featured_order?: number | null;
};

const editorButtonStyle: React.CSSProperties = {
  border: "1px solid #d7dce2",
  background: "#fff",
  borderRadius: 8,
  padding: "8px 11px",
  cursor: "pointer",
  color: "#243044",
};

export default function EditorialEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("");
  const [kind, setKind] = useState("article");
  const [coverUrl, setCoverUrl] = useState("");
  const [status, setStatus] = useState("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredOrder, setFeaturedOrder] = useState(1);

  useEffect(() => {
    let active = true;
    async function init() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate("/login", { replace: true });
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role,display_name")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!active) return;
      if (profileError || !["admin", "editor"].includes(profile?.role || "")) {
        navigate("/login", { replace: true });
        return;
      }
      setUserId(session.user.id);
      setAuthor(profile?.display_name || "");
      if (id) {
        const { data, error: articleError } = await supabase
          .from("articles")
          .select("id,title,excerpt,category,author_name,cover_image_url,content,content_type,status,is_featured,featured_order")
          .eq("id", id)
          .maybeSingle();
        if (!active) return;
        if (articleError || !data) {
          setMessage("Could not load this article. " + (articleError?.message || ""));
        } else {
          const item = data as ArticleRow;
          setTitle(item.title || "");
          setExcerpt(item.excerpt || "");
          setCategory(item.category || "");
          setAuthor(item.author_name || profile?.display_name || "");
          setKind(item.content_type === "research" ? "research" : "article");
          setCoverUrl(item.cover_image_url || "");
          setStatus(item.status || "draft");
          setIsFeatured(Boolean(item.is_featured));
          setFeaturedOrder(Number(item.featured_order || 1));
          if (bodyRef.current) bodyRef.current.innerHTML = item.content || "";
          window.setTimeout(() => {
            if (bodyRef.current && item.content) bodyRef.current.innerHTML = item.content;
          }, 0);
        }
      }
      setReady(true);
    }
    void init();
    return () => { active = false; };
  }, [id, navigate]);

  function format(command: string, value?: string) {
    bodyRef.current?.focus();
    document.execCommand(command, false, value);
  }

  function insertHeading(level: 2 | 3) {
    bodyRef.current?.focus();
    document.execCommand("formatBlock", false, level === 2 ? "h2" : "h3");
  }

  function insertImage() {
    const url = window.prompt("Paste the image URL:");
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (!["https:", "http:"].includes(parsed.protocol)) {
        setMessage("Please use a valid http or https image URL.");
        return;
      }
      bodyRef.current?.focus();
      document.execCommand("insertHTML", false, '<figure><img src="' + parsed.href.replace(/"/g, "&quot;") + '" alt="" style="max-width:100%;height:auto;border-radius:12px" /><figcaption>Image caption (edit this text)</figcaption></figure><p><br></p>');
      setMessage("");
    } catch {
      setMessage("Please paste a valid image URL.");
    }
  }

  async function save(nextStatus: "draft" | "pending" | "published") {
    if (!title.trim()) {
      setMessage("Please add a title first.");
      return;
    }
    setSaving(true);
    setMessage("");
    const html = bodyRef.current?.innerHTML || "";
    const payload = {
      title: title.trim(),
      excerpt: excerpt.trim() || null,
      category: category.trim() || null,
      author_name: author.trim() || null,
      cover_image_url: coverUrl.trim() || null,
      content: html,
      content_type: kind,
      status: nextStatus,
      is_featured: isFeatured,
      featured_order: featuredOrder,
      updated_at: new Date().toISOString(),
      ...(nextStatus === "published" ? { published_at: new Date().toISOString() } : {}),
      ...(!id ? { author_id: userId } : {}),
    };
    const result = id
      ? await supabase.from("articles").update(payload).eq("id", id)
      : await supabase.from("articles").insert(payload).select("id").single();
    setSaving(false);
    if (result.error) {
      setMessage("Save failed: " + result.error.message);
      return;
    }
    setStatus(nextStatus);
    setMessage(nextStatus === "published" ? "Published successfully." : nextStatus === "pending" ? "Saved and submitted for review." : "Draft saved.");
    if (!id && result.data && "id" in result.data) {
      navigate("/editor/" + encodeURIComponent(String(result.data.id)), { replace: true });
    }
  }

  if (!ready) return <main className="page-shell"><p>{message || "Checking editorial access…"}</p></main>;

  return (
    <main className="page-shell" style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px 64px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 24 }}>
        <div><p className="eyebrow">Economic Policy Lab · Editorial</p><h1 style={{ margin: "8px 0" }}>{id ? "Edit publication" : "Create publication"}</h1><p>Write your article or research, add images, then save a draft or publish.</p></div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link className="text-button" to="/editor/team">Manage EPL team</Link><Link className="text-button" to={userId ? "/editor" : "/login"}>← Editorial workspace</Link></div>
      </div>
      {message && <p role="status" style={{ padding: 12, borderRadius: 8, background: "#f3f5f7", marginBottom: 16 }}>{message}</p>}
      <form onSubmit={e => e.preventDefault()} style={{ display: "grid", gap: 18 }}>
        <label style={{ display: "grid", gap: 7 }}>Publication type
          <select value={kind} onChange={e => setKind(e.target.value)} style={{ padding: 12, borderRadius: 8, border: "1px solid #ccd2d9" }}>
            <option value="article">Article</option><option value="research">Research</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 7 }}>Title *
          <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Enter the main title" style={{ padding: 12, borderRadius: 8, border: "1px solid #ccd2d9" }} />
        </label>
        <label style={{ display: "grid", gap: 7 }}>Short introduction / excerpt
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={3} placeholder="A short summary shown on the article card" style={{ padding: 12, borderRadius: 8, border: "1px solid #ccd2d9", resize: "vertical" }} />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          <label style={{ display: "grid", gap: 7 }}>Category
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Fiscal Policy" style={{ padding: 12, borderRadius: 8, border: "1px solid #ccd2d9" }} />
          </label>
          <label style={{ display: "grid", gap: 7 }}>Author / contributor
            <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name" style={{ padding: 12, borderRadius: 8, border: "1px solid #ccd2d9" }} />
          </label>
        </div>
        <label style={{ display: "grid", gap: 7 }}>Cover image URL
          <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://…" style={{ padding: 12, borderRadius: 8, border: "1px solid #ccd2d9" }} />
        </label>
        <section style={{ display: "grid", gap: 10, padding: 16, border: "1px solid #d7dce2", borderRadius: 12 }}>
          <h2 style={{ margin: 0 }}>Homepage highlight</h2>
          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
            Show this publication in the homepage Featured Commentary section
          </label>
          <label style={{ display: "grid", gap: 7, maxWidth: 240 }}>Display order (1 appears first)
            <input type="number" min={1} max={3} value={featuredOrder} onChange={e => setFeaturedOrder(Math.max(1, Math.min(3, Number(e.target.value) || 1)))} style={{ padding: 12, borderRadius: 8, border: "1px solid #ccd2d9" }} />
          </label>
          <p style={{ margin: 0, color: "#687385" }}>Only published items appear on the homepage. The homepage displays up to three highlighted publications.</p>
        </section>
        {coverUrl && <img src={coverUrl} alt="Cover preview" style={{ maxWidth: 360, maxHeight: 220, objectFit: "cover", borderRadius: 12 }} onError={e => { e.currentTarget.style.display = "none"; }} />}
        <section style={{ display: "grid", gap: 10 }}>
          <div><h2 style={{ marginBottom: 6 }}>Article body</h2><p style={{ marginTop: 0 }}>Write directly below. Use headings to create sections and add images between paragraphs.</p></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, padding: 10, border: "1px solid #d7dce2", borderRadius: "10px 10px 0 0", background: "#f7f8fa" }}>
            <button type="button" style={editorButtonStyle} onClick={() => format("bold")}><b>B</b></button>
            <button type="button" style={{ ...editorButtonStyle, fontStyle: "italic" }} onClick={() => format("italic")}>Italic</button>
            <button type="button" style={editorButtonStyle} onClick={() => insertHeading(2)}>Subheading</button>
            <button type="button" style={editorButtonStyle} onClick={() => insertHeading(3)}>Small heading</button>
            <button type="button" style={editorButtonStyle} onClick={() => format("insertUnorderedList")}>• Bullets</button>
            <button type="button" style={editorButtonStyle} onClick={() => format("insertOrderedList")}>1. Numbered list</button>
            <button type="button" style={editorButtonStyle} onClick={() => format("formatBlock", "blockquote")}>Quote</button>
            <button type="button" style={editorButtonStyle} onClick={insertImage}>＋ Insert image</button>
            <button type="button" style={editorButtonStyle} onClick={() => format("createLink", window.prompt("Paste link URL:") || "")}>Insert link</button>
          </div>
          <div ref={bodyRef} contentEditable suppressContentEditableWarning role="textbox" aria-label="Article body editor" aria-multiline="true" data-placeholder="Start writing here… Select text to format it. Use Subheading for section titles." style={{ minHeight: 320, padding: 18, border: "1px solid #d7dce2", borderTop: 0, borderRadius: "0 0 10px 10px", outline: "none", lineHeight: 1.8, background: "#fff" }} />
        </section>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", borderTop: "1px solid #e1e5e9", paddingTop: 18 }}>
          <span style={{ marginRight: "auto", color: "#687385" }}>Current status: {status}</span>
          <button type="button" disabled={saving} onClick={() => void save("draft")} style={editorButtonStyle}>{saving ? "Saving…" : "Save draft"}</button>
          <button type="button" disabled={saving} onClick={() => void save("pending")} style={editorButtonStyle}>Submit for review</button>
          <button type="button" disabled={saving} onClick={() => void save("published")} style={{ ...editorButtonStyle, background: "#172b3a", color: "#fff", borderColor: "#172b3a" }}>Publish</button>
        </div>
      </form>
    </main>
  );
}
