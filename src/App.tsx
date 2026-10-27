import { Link, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Articles from "./pages/Articles";
import Content from "./pages/Content";
import Research from "./pages/Research";
import Join from "./pages/Join";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Member from "./pages/Member";
import EditorialEditor from "./pages/EditorialEditor";

type PlaceholderPageProps = { title: string; description: string };
function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return <main className="page-shell simple-page"><p className="eyebrow">Economic Policy Lab</p><h1>{title}</h1><p>{description}</p><Link to="/" className="button button-outline">Back to Home</Link></main>;
}
function NotFoundPage() {
  return <PlaceholderPage title="Page not found" description="The page you requested could not be found." />;
}
export default function App() {
  return <div className="app"><Header /><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/articles" element={<Articles />} />
    <Route path="/articles/:id" element={<Content />} />
    <Route path="/research" element={<Research />} />
    <Route path="/content" element={<Content />} />
    <Route path="/join" element={<Join />} />
    <Route path="/login" element={<Login />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/admin" element={<Admin />} />
    <Route path="/editor" element={<EditorialEditor />} />
    <Route path="/editor/:id" element={<EditorialEditor />} />
    <Route path="/member" element={<Member />} />
    <Route path="/team" element={<PlaceholderPage title="Our Team" description="Meet the people behind the Economic Policy Lab." />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes><footer className="site-footer">© 2025 Komunitas Ekonom Muda Indonesia / Economic Policy Lab. All rights reserved.</footer></div>;
}
