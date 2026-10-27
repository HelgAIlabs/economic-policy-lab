import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { supabase } from "./lib/supabase";

type FeaturedItem = {
  id: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  author_name: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  content_type: string | null;
  is_featured: boolean | null;
};

function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand">Economic Policy Lab</Link>
        <Link to="/login" className="login-link">Log in</Link>
      </div>
      <nav className="main-nav" aria-label="Main navigation">
        {[
          ["/", "Home"],
          ["/research", "Research"],
          ["/articles", "Articles"],
          ["/team", "Team"],
          ["/join", "Join Us"]
        ].map(([to, label]) => (
          <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>
        ))}
      </nav>
    </header>
  );
}

function HomePage() {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadFeatured() {
      const fields = "id,title,excerpt,category,author_name,cover_image_url,published_at,content_type,is_featured";
      const featured = await supabase
        .from("articles")
        .select(fields)
        .eq("status", "published")
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(6);

      if (!active) return;
      if (featured.error) {
        setError("Featured work could not be loaded right now.");
        setLoading(false);
        return;
      }

      let data = featured.data as FeaturedItem[] | null;
      if (!data?.length) {
        const fallback = await supabase
          .from("articles")
          .select(fields)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(6);
        if (!active) return;
        if (fallback.error) {
          setError("Published work could not be loaded right now.");
          setLoading(false);
          return;
        }
        data = fallback.data as FeaturedItem[] | null;
      }
      setItems(data ?? []);
      setLoading(false);
    }
    void loadFeatured();
    return () => { active = false; };
  }, []);

  return (
    <>
      <main className="page-shell">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Economic Policy Lab</p>
            <h1>Evidence-based economics for a changing world.</h1>
            <p className="hero-description">
              Research, commentary, and policy analysis from the Economic Policy Lab.
            </p>
            <div className="hero-actions">
              <Link className="button button-dark" to="/research">Explore Research</Link>
              <Link className="button button-outline" to="/join">Join the Community</Link>
            </div>
          </div>
          <aside className="hero-note">
            <p className="eyebrow">Live editorial feed</p>
            <h2>Featured work</h2>
            <p>This section is managed from the admin dashboard. Published pieces appear here automatically.</p>
          </aside>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Editorial selection</p>
              <h2>Featured Articles &amp; Research</h2>
            </div>
            <Link to="/articles" className="text-link">View all →</Link>
          </div>

          {loading && <p className="status-message">Loading featured work…</p>}
          {!loading && error && <p className="status-message error">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="status-message">No published work yet.</p>
          )}
          {!loading && !error && items.length > 0 && (
            <div className="article-grid">
              {items.map((item) => (
                <Link className="article-card" to={`/content?id=${encodeURIComponent(item.id)}`} key={item.id}>
                  {item.cover_image_url ? (
                    <img src={item.cover_image_url} alt="" className="article-image" />
                  ) : (
                    <div className="article-image image-placeholder" aria-hidden="true" />
                  )}
                  <div className="article-meta">
                    <span>{item.content_type === "research" ? "Research" : item.category || "Article"}</span>
                    {item.is_featured && <span className="featured-label">Featured</span>}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt || ""}</p>
                  <div className="article-byline">
                    {item.author_name || "EPL Member"}
                    {item.published_at ? ` · ${new Date(item.published_at).toLocaleDateString()}` : ""}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="page-shell simple-page">
      <p className="eyebrow">Economic Policy Lab</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link className="button button-outline" to="/">Back to Home</Link>
    </main>
  );
}

export default function App() {
  return (
    <div className="app">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/articles" element={<PlaceholderPage title="Articles & Insights" description="Editorial analysis and commentary from the Economic Policy Lab." />} />
        <Route path="/research" element={<PlaceholderPage title="Research Archive" description="Working papers, policy briefs, and research from the Economic Policy Lab." />} />
        <Route path="/team" element={<PlaceholderPage title="Our Team" description="Meet the people behind the Economic Policy Lab." />} />
        <Route path="/join" element={<PlaceholderPage title="Join Us" description="Learn how to participate in the Economic Policy Lab." />} />
        <Route path="/login" element={<PlaceholderPage title="Log in" description="The existing secure Supabase login will be migrated in the authentication phase." />} />
        <Route path="*" element={<PlaceholderPage title="Page not found" description="The page you requested could not be found." />} />
      </Routes>
      <footer className="site-footer">
        © 2025 Komunitas Ekonom Muda Indonesia / Economic Policy Lab. All rights reserved.
      </footer>
    </div>
  );
}