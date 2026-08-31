import { supabase } from '../supabase-client.js';

(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const safe = (value) => {
    try {
      const u = new URL(String(value || '').trim());
      return u.protocol === 'https:' ? u.toString() : null;
    } catch { return null; }
  };

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
