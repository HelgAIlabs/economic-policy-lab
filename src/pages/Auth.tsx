import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Checking your session…");
  useEffect(() => {
    let active = true;
    async function check() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) { if (active) setMessage("We could not verify your session. Please log in again."); return; }
      if (!session) { navigate("/login", { replace: true }); return; }
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
      if (!active) return;
      if (profileError) { setMessage("Your account role could not be verified. Please contact EPL support."); return; }
      navigate(profile?.role === "admin" ? "/admin" : "/member", { replace: true });
    }
    void check();
    return () => { active = false; };
  }, [navigate]);
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">Economic Policy Lab</p><h1>Account access</h1><p className="auth-copy">{message}</p><Link className="back-link" to="/login">Go to login</Link></section></main>;
}
