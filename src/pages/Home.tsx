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

const fallbackImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD5v2HztceLAnjheFXT5oLLAJXbH-K38seoBQlLw7ojAupPSn2fqb7a70qj-OFLX6mBLiykLiyyt7C5npbQWole3TIOWV38c0KFcIJRiwlo-TA8dvKsVlmZMuF1Re88yPuyDO_h9NENyevHpHofGRfsvQOUPljDwGKaEXsJCzNBfcU1Vh3WHrBghnaLt0i2HE8wUGiVB8FOStBsdquNXn4imlh6jpKiZyEvZjmLOOE_aKnfX_Lic6ej",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCCGPiJPxs_Xoo3c2nMvQAndnpwMtnZ82Dpp-OyuUZp7jfn5W2urtfwd3FXumZmT0AGPmrpxfmv4EqLIC7NUGdIOWw77hBhmBLy8l-MQutx_cE1YefHHheK2DQhTq6z3U7Q08wa4rUJ79lkPF7_T6WZi4DHwxmTbWMwKAZmimthWzSU4bYh8vennt3LY8Hn_YO9hB7YwtEn7NzKxYEw9nfH0jzk9PvnMluwOA-RuX7GgQiPw8be8E19",
];

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
          .limit(3);

        if (featuredResult.error) throw featuredResult.error;

        let items = (featuredResult.data ?? []) as FeaturedItem[];

        if (items.length === 0) {
          const latestResult = await supabase
            .from("articles")
            .select(
              "id, title, excerpt, category, author_name, cover_image_url, published_at, content_type, is_featured, featured_order"
            )
            .eq("status", "published")
            .order("published_at", { ascending: false })
            .limit(3);

          if (latestResult.error) throw latestResult.error;
          items = (latestResult.data ?? []) as FeaturedItem[];
        }

        if (active) setArticles(items);
      } catch (err) {
        console.error("Failed to load articles:", err);
        if (active) setError("Articles could not be loaded. Please try again later.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadArticles();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-eyebrow">Global Perspective</p>
          <h1>Empowering Young Economists for Evidence-Based Policy</h1>
          <p className="home-hero-description">
            The Economic Policy Lab (EPL) rigorously evaluates policy interventions,
            advancing the frontier of applied economics to foster sustainable growth
            and equitable development across emerging markets.
          </p>
          <div className="home-hero-actions">
            <Link to="/research" className="home-button home-button-dark">
              Explore Research
            </Link>
            <Link to="/join" className="home-button home-button-outline">
              Join the Community
            </Link>
          </div>
        </div>

        <aside className="home-latest-paper">
          <img
            className="home-latest-image"
            src={fallbackImages[1]}
            alt="Modern institutional architecture in monochrome"
            loading="lazy"
          />
          <div className="home-paper-copy">
            <p className="home-muted-label">Latest Working Paper</p>
            <h2>Inflation Targeting in Emerging Economies: A Post-Pandemic Review</h2>
            <p>
              Analyzing the efficacy of central bank interventions amidst global
              supply chain disruptions.
            </p>
            <Link to="/research" className="home-read-link">
              Read Abstract <span aria-hidden="true">→</span>
            </Link>
          </div>
        </aside>
      </section>

      <section className="home-featured">
        <div className="home-section-heading">
          <h2>Featured Commentary</h2>
          <Link to="/articles" className="home-view-all">View All</Link>
        </div>

        {loading && <p className="status-message">Loading articles...</p>}
        {!loading && error && <p className="status-message" role="alert">{error}</p>}
        {!loading && !error && articles.length === 0 && (
          <p className="status-message">No published articles are available yet.</p>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="home-commentary-grid">
            {articles.map((article, index) => (
              <Link
                key={article.id}
                to={`/content?id=${encodeURIComponent(String(article.id))}`}
                className="home-commentary-card"
              >
                <div className="home-commentary-image-wrap">
                  <img
                    src={article.cover_image_url || fallbackImages[index % fallbackImages.length]}
                    alt=""
                    className="home-commentary-image"
                    loading="lazy"
                  />
                </div>
                <p className="home-commentary-category">
                  {article.category || article.content_type || "Commentary"}
                </p>
                <h3>{article.title}</h3>
                {article.excerpt && <p className="home-commentary-excerpt">{article.excerpt}</p>}
                <div className="home-commentary-author">
                  {article.author_name || "Economic Policy Lab"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
