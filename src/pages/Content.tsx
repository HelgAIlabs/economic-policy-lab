
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type ArticleContent = {
  title: string;
  excerpt: string | null;
  category: string | null;
  author_name: string | null;
  cover_image_url: string | null;
  content: string | null;
  content_type: string | null;
  published_at: string | null;
};

export default function Content() {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const id = routeId || searchParams.get("id");

  const [article, setArticle] = useState<ArticleContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadContent() {
      setLoading(true);
      setError("");
      setArticle(null);

      if (!id) {
        setError("Content not found.");
        setLoading(false);
        return;
      }

      try {
        const result = await supabase
          .from("articles")
          .select(
            "title, excerpt, category, author_name, cover_image_url, content, content_type, published_at, status"
          )
          .eq("id", id)
          .eq("status", "published")
          .single();

        if (result.error || !result.data) {
          throw result.error ?? new Error("Content unavailable");
        }

        if (active) {
          setArticle(result.data as ArticleContent);
          document.title =
            `${result.data.title} — Economic Policy Lab`;
        }
      } catch (err) {
        console.error("Unable to load content:", err);

        if (active) {
          setError("This content is not available.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadContent();

    return () => {
      active = false;
    };
  }, [id]);

  const isResearch = article?.content_type === "research";
  const backPath = isResearch ? "/research" : "/articles";

  return (
    <main className="content-page">
      <Link to={backPath} className="content-back">
        {isResearch ? "← Back to Research" : "← Back to Articles"}
      </Link>

      {loading && (
        <p className="status-message">Loading content...</p>
      )}

      {!loading && error && (
        <p className="content-error" role="alert">
          {error}
        </p>
      )}

      {!loading && article && (
        <article className="content-detail">
          <p className="content-category">
            {isResearch ? "Research" : "Article"}
            {article.category ? ` · ${article.category}` : ""}
          </p>

          <h1>{article.title}</h1>

          <p className="content-byline">
            {article.author_name || "EPL Member"}
            {article.published_at
              ? ` · ${new Date(
                  article.published_at
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}`
              : ""}
          </p>

          {article.cover_image_url && (
            <img
              src={article.cover_image_url}
              alt=""
              className="content-cover"
            />
          )}

          {article.excerpt && (
            <p className="content-excerpt">{article.excerpt}</p>
          )}

          {article.content ? (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{
                __html: article.content,
              }}
            />
          ) : (
            <p className="status-message">
              No content has been added yet.
            </p>
          )}
        </article>
      )}
    </main>
  );
}
