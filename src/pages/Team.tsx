import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type TeamMember = {
  id: string;
  name: string;
  role_title: string;
  bio: string;
  image_url: string | null;
  section: "board" | "member";
  sort_order: number;
  linkedin_url: string | null;
  instagram_url: string | null;
};

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadTeam() {
      const { data, error: queryError } = await supabase
        .from("team_members")
        .select("id,name,role_title,bio,image_url,section,sort_order,linkedin_url,instagram_url")
        .eq("is_active", true)
        .order("section", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (!active) return;
      if (queryError) setError("The team directory could not be loaded right now.");
      else setMembers((data ?? []) as TeamMember[]);
      setLoading(false);
    }
    void loadTeam();
    return () => { active = false; };
  }, []);

  const board = members.filter((member) => member.section === "board");
  const team = members.filter((member) => member.section === "member");

  function renderMember(member: TeamMember) {
    return (
      <article className="team-card" key={member.id}>
        <div className="team-photo-wrap">
          {member.image_url ? (
            <img className="team-photo" src={member.image_url} alt={member.name} loading="lazy" />
          ) : (
            <div className="team-photo-placeholder" aria-label="No photo provided">Photo coming soon</div>
          )}
        </div>
        <div className="team-card-body">
          <p className="team-role">{member.role_title}</p>
          <h3>{member.name}</h3>
          {member.bio && <p className="team-bio">{member.bio}</p>}
          {(member.linkedin_url || member.instagram_url) && (
            <div className="team-socials">
              {member.linkedin_url && <a href={member.linkedin_url} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
              {member.instagram_url && <a href={member.instagram_url} target="_blank" rel="noreferrer">Instagram ↗</a>}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <main className="team-page">
      <header className="team-hero">
        <p className="eyebrow">Economic Policy Lab</p>
        <h1>Our <span>Team</span></h1>
        <p>Meet the people contributing to evidence-based economic research, thoughtful policy discussion, and a stronger community.</p>
      </header>
      {loading ? <div className="team-loading" role="status">Loading team directory…</div> : error ? (
        <p className="team-message" role="alert">{error}</p>
      ) : members.length === 0 ? (
        <p className="team-message">Our team profiles will be published here soon.</p>
      ) : (
        <>
          {board.length > 0 && <section className="team-section"><div className="team-section-heading"><h2>Founder &amp; Board of Directors</h2></div><div className="team-grid">{board.map(renderMember)}</div></section>}
          {team.length > 0 && <section className="team-section"><div className="team-section-heading"><h2>Our Members</h2></div><div className="team-grid">{team.map(renderMember)}</div></section>}
        </>
      )}
    </main>
  );
}
