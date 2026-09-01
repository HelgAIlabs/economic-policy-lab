import { supabase } from '../supabase-client.js';

(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const safe = (value) => {
    try { const u = new URL(String(value || '').trim()); return u.protocol === 'https:' ? u.toString() : null; }
    catch { return null; }
  };

  // Keep the board cards compact on desktop while preserving the existing responsive layout.
  const style = document.createElement('style');
  style.textContent = `
    #board { max-width: 896px; margin-left: auto; margin-right: auto; }
    #board .card { padding: 16px !important; gap: 20px !important; }
    #board .card > div:first-child { width: 42% !important; }
    #board .card > div:nth-child(2) { width: 58% !important; }
    #board .card img { height: 300px !important; }
    #board .card h3 { font-size: 2rem !important; line-height: 1.1 !important; }
    #board .card p.text-xl { font-size: 1rem !important; line-height: 1.6 !important; }
    @media (max-width: 767px) {
      #board { max-width: none; }
      #board .card { padding: 16px !important; gap: 16px !important; }
      #board .card > div:first-child, #board .card > div:nth-child(2) { width: 100% !important; }
      #board .card img { height: 280px !important; }
    }
  `;
  document.head.appendChild(style);

  const addButtons = (person) => {
    const target = safe(person.linkedin_url) || safe(person.instagram_url);
    if (!target) return;
    const headings = [...document.querySelectorAll('#board h3,#board h4,#members h3')];
    const heading = headings.find((el) => el.textContent.trim() === person.name);
    if (!heading || heading.parentElement.querySelector('.team-social-links')) return;
    const wrap = document.createElement('div');
    wrap.className = 'team-social-links flex items-center gap-3 mt-5';
    if (safe(person.linkedin_url)) {
      wrap.innerHTML += `<a href="${esc(safe(person.linkedin_url))}" target="_blank" rel="noopener noreferrer" aria-label="${esc(person.name)} on LinkedIn" title="LinkedIn" class="inline-flex items-center justify-center w-9 h-9 border border-[#c4c7c7] hover:bg-black hover:text-white transition-colors"><span class="font-bold text-sm">in</span></a>`;
    }
    if (safe(person.instagram_url)) {
      wrap.innerHTML += `<a href="${esc(safe(person.instagram_url))}" target="_blank" rel="noopener noreferrer" aria-label="${esc(person.name)} on Instagram" title="Instagram" class="inline-flex items-center justify-center w-9 h-9 border border-[#c4c7c7] hover:bg-black hover:text-white transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg></a>`;
    }
    heading.parentElement.appendChild(wrap);
  };

  const load = async () => {
    const { data } = await supabase.from('team_members').select('name,linkedin_url,instagram_url').eq('is_active', true);
    (data || []).forEach(addButtons);
  };

  const observer = new MutationObserver(() => load());
  observer.observe(document.body, { childList: true, subtree: true });
  load();
})();
