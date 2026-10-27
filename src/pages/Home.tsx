
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type FeaturedItem = {
  id: string | number;
  title: string;
  excerpt: string | null;
  category: string | null;
  author_name: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  content_type: string | null;
  is_featured: boolean | null;
  featured_order?: number | null;
};

export default function Home() {
  const [articles, setArticles] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadArticles() {
      setLoading(true);
      setError("");

      try {
        const featuredResult = await supabase
          .from("articles")
          .select(
            "id, title, excerpt, category, author_name, cover_image_url, published_at, content_type, is_featured, featured_order"
          )
          .eq("status", "published")
          .eq("is_featured", true)
          .order("featured_order", { ascending: true })
          .order("published_at", { ascending: false })
          .limit(9);

        if (featuredResult.error) {
          throw featuredResult.error;
        }

        let items = (featuredResult.data ?? []) as FeaturedItem[];

        if (items.length === 0) {
          const latestResult = await supabase
            .from("articles")
            .select(
              "id, title, excerpt, category, author_name, cover_image_url, published_at, content_type, is_featured, featured_order"
            )
            .eq("status", "published")
            .order("published_at", { ascending: false })
            .limit(6);

          if (latestResult.error) {
            throw latestResult.error;
          }

          items = (latestResult.data ?? []) as FeaturedItem[];
        }

        if (active) {
          setArticles(items);
        }
      } catch (err) {
        console.error("Failed to load articles:", err);

        if (active) {
          setError("Articles could not be loaded. Please try again later.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadArticles();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Economic Policy Lab</p>
          <h1>Evidence-based economics for a changing world.</h1>
          <p className="hero-description">
            Research, commentary, and policy analysis from the Economic Policy
            Lab.
          </p>
        </div>

        <aside className="hero-note">
          <p className="eyebrow">Live editorial feed</p>
          <h2>Featured work</h2>
          <p>
            Featured pieces are managed through the admin dashboard. Only
            published articles marked as featured appear here.
          </p>
        </aside>
      </section>

      <section className="featured-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">From the editorial desk</p>
            <h2>Featured Articles &amp; Research</h2>
          </div>
          <Link to="/articles" className="text-link">
            All articles
          </Link>
        </div>

        {loading && <p className="status-message">Loading articles...</p>}

        {!loading && error && (
          <p className="status-message" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && articles.length === 0 && (
          <p className="status-message">
            No published articles are available yet.
          </p>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="article-grid">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/content?id=${encodeURIComponent(String(article.id))}`}
                className="article-card"
              >
                {article.cover_image_url && (
                  <img
                    src={article.cover_image_url}
                    alt=""
                    className="article-cover"
                    loading="lazy"
                  />
                )}

                <div className="article-card-content">
                  <p className="article-category">
                    {article.category || article.content_type || "Article"}
                  </p>

                  <h3>{article.title}</h3>

                  {article.excerpt && <p>{article.excerpt}</p>}

                  <div className="article-meta">
                    {article.author_name && <span>{article.author_name}</span>}

                    {article.published_at && (
                      <time dateTime={article.published_at}>
                        {new Date(article.published_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </time>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
