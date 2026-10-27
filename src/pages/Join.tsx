import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

export default function Join() {
  const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const institution = String(form.get("institution") || "").trim();
    const expertise = String(form.get("expertise") || "");
    const statement = String(form.get("statement") || "").trim();
    const subject = encodeURIComponent("EPL Membership Application — " + name);
    const body = encodeURIComponent("Name: " + name + "\nEmail: " + email + "\nInstitution: " + institution + "\nArea of expertise: " + expertise + "\n\nStatement of interest:\n" + statement);
    setMessage("Your email app will open with the application prepared. Please send it to complete your submission.");
    window.location.href = "mailto:contact@kemiepl.org?subject=" + subject + "&body=" + body;
  }
  return <main className="join-page">
    <section className="join-hero"><p className="eyebrow">Economic Policy Lab</p><h1>Shape the Economic Discourse</h1><p>Contribute to thoughtful economic research, policy analysis, and evidence-based public discussion.</p></section>
    <div className="join-layout"><section className="join-benefits"><h2>Why join EPL?</h2>
      <article><h3>Rigorous research</h3><p>Work on economic questions with a focus on evidence, accuracy, and scholarly integrity.</p></article>
      <article><h3>High-impact publication</h3><p>Contribute to research, policy briefs, and analysis that help people understand public policy.</p></article>
      <article><h3>Intellectual community</h3><p>Collaborate with contributors and learn through feedback and shared research.</p></article>
      <h3>Membership pathways</h3><p><strong>Fellow</strong> — lead research initiatives.</p><p><strong>Analyst</strong> — contribute analysis and policy briefs.</p><p><strong>Associate</strong> — support research and editorial work.</p>
    </section><section className="join-form-panel"><h2>Membership Application</h2><p>Tell us about your interests and how you would like to contribute.</p>
      {message && <p className="form-message" role="status">{message}</p>}
      <form className="join-form" onSubmit={submit}>
        <label>Full name<input name="name" required autoComplete="name" /></label>
        <label>Email address<input name="email" type="email" required autoComplete="email" /></label>
        <label>Institution / organisation<input name="institution" /></label>
        <label>Area of expertise<select name="expertise"><option>Macroeconomics</option><option>Microeconomics</option><option>Development Economics</option><option>Public Policy</option><option>Econometrics</option><option>Other</option></select></label>
        <label>Statement of interest<textarea name="statement" rows={5} required placeholder="Describe your research interests and why you would like to join EPL." /></label>
        <button className="epl-button">Prepare application email</button>
      </form>
      <p className="auth-note">This form prepares an email; it does not create an account automatically. Account access is managed separately by EPL.</p>
    </section></div>
    <p className="join-login">Already have an account? <Link to="/login">Log in</Link></p>
  </main>;
}
