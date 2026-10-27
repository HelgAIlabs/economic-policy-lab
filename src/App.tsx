import { Link, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Articles from "./pages/Articles";
import Content from "./pages/Content";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <main className="page-shell simple-page">
      <p className="eyebrow">Economic Policy Lab</p>
      <h1>{title}</h1>
      <p>{description}</p>

      <Link to="/" className="button button-outline">
        Back to Home
      </Link>
    </main>
  );
}

function NotFoundPage() {
  return (
    <PlaceholderPage
      title="Page not found"
      description="The page you requested could not be found."
    />
  );
}

export default function App() {
  return (
    <div className="app">
      <Header />

      <Routes>
        
        <Route path="/" element={<Home />} />

        <Route path="/articles" element={<Articles />} />

        <Route
          path="/research"
          element={
            <PlaceholderPage
              title="Research Archive"
              description="Working papers, policy briefs, and research from the Economic Policy Lab."
            />
          }
        />

        <Route
          path="/team"
          element={
            <PlaceholderPage
              title="Our Team"
              description="Meet the people behind the Economic Policy Lab."
            />
          }
        />

        <Route
          path="/join"
          element={
            <PlaceholderPage
              title="Join Us"
              description="Learn how to participate in the Economic Policy Lab."
            />
          }
        />

        <Route
          path="/login"
          element={
            <PlaceholderPage
              title="Log in"
              description="The login page will be migrated while preserving the existing Supabase authentication."
            />
          }
        />

        <Route
          <Route path="/content" element={<Content />} />
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <footer className="site-footer">
        © 2025 Komunitas Ekonom Muda Indonesia / Economic Policy Lab.
        All rights reserved.
      </footer>
    </div>
  );
}
