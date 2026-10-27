
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Article = {
  id: string | number;
  title: string;
  excerpt: string | null;
  category: string | null;
  author_name: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  content_type: string | null;
};

const categories = [
  "All",
  "Macroeconomics",
  "Fiscal Policy",
  "Sustainability",
];

const PAGE_SIZE = 6;

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [category, setCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadArticles() {
      setLoading(true);
      setError("");

      try {
        const result = await supabase
          .from("articles")
          .select(
            "id, title, excerpt, category, author_name, cover_image_url, published_at, content_type"
          )
          .eq("status", "published")
          .order("published_at", { ascending: false });

        if (result.error) throw result.error;

        if (active) {
          setArticles((result.data ?? []) as Article[]);
        }
      } catch (err) {
        console.error("Unable to load articles:", err);

        if (active) {
          setError(
            "Articles could not be loaded. Please try again later."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadArticles();

    return () => {
      active = false;
    };
  }, []);

  const filteredArticles =
    category === "All"
      ? articles
      : articles.filter(
          (article) =>
            article.category?.toLowerCase() ===
            category.toLowerCase()
        );

  const visibleArticles = filteredArticles.slice(0, visibleCount);

  function selectCategory(value: string) {
    setCategory(value);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <main className="articles-page">
      <section className="articles-intro">
        <div>
          <p className="eyebrow">Economic Policy Lab</p>
          <h1>Articles &amp; Insights</h1>
          <p className="articles-description">
            Expert analysis and commentary on current economic
            trends, fiscal policies, and sustainable development
            initiatives.
          </p>
        </div>

        <div className="category-filters" aria-label="Filter articles">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={
                category === item
                  ? "category-button selected"
                  : "category-button"
              }
              aria-pressed={category === item}
              onClick={() => selectCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {loading && (
        <p className="status-message">Loading articles...</p>
      )}

      {!loading && error && (
        <p className="status-message" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && visibleArticles.length === 0 && (
        <p className="status-message">
          No published articles found in this category.
        </p>
      )}

      {!loading && !error && visibleArticles.length > 0 && (
        <section className="articles-grid" aria-label="Published articles">
          {visibleArticles.map((article) => (
            <article className="insight-card" key={article.id}>
              <Link
                to={`/content?id=${encodeURIComponent(String(article.id))}`}
                className="insight-image-link"
                aria-label={`Read ${article.title}`}
              >
                {article.cover_image_url ? (
                  <img
                    src={article.cover_image_url}
                    alt=""
                    className="insight-image"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="insight-image insight-image-placeholder"
                    aria-hidden="true"
                  />
                )}
              </Link>

              <p className="insight-category">
                {article.category || article.content_type || "Article"}
              </p>

              <h2>
                <Link
                  to={`/content?id=${encodeURIComponent(String(article.id))}`}
                >
                  {article.title}
                </Link>
              </h2>

              {article.excerpt && (
                <p className="insight-excerpt">{article.excerpt}</p>
              )}

              <div className="insight-meta">
                <span>{article.author_name || "EPL Member"}</span>

                {article.published_at && (
                  <time dateTime={article.published_at}>
                    {new Date(
                      article.published_at
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading &&
        !error &&
        visibleArticles.length < filteredArticles.length && (
          <div className="load-more">
            <button
              type="button"
              className="load-more-button"
              onClick={() =>
                setVisibleCount((count) => count + PAGE_SIZE)
              }
            >
              Load More Articles
            </button>
          </div>
        )}
    </main>
  );
      }
