import { supabase } from '../supabase-client.js';

const $ = (s) => document.querySelector(s);
const listEl = $('#team-list');
const countEl = $('#count');
const teamMessage = $('#team-message');

if (listEl) {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('section', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      const people = data || [];
      countEl.textContent = `${people.length} people total · ${people.filter(p => p.section === 'board').length} board · ${people.filter(p => p.section === 'member').length} members`;
      const q = ($('#team-search')?.value || '').trim().toLowerCase();
      const visible = people.filter(p => !q || [p.name,p.role_title,p.bio,p.section].some(v => String(v || '').toLowerCase().includes(q)));
      listEl.innerHTML = visible.length ? visible.map(p => `
        <article class="bg-white border p-4 flex flex-col sm:flex-row gap-4 ${p.is_active ? '' : 'opacity-50'}">
          <div class="w-24 h-24 shrink-0 bg-gray-100 border overflow-hidden">
            ${p.image_url ? `<img src="${esc(p.image_url)}" class="w-full h-full object-cover grayscale" alt="">` : '<div class="w-full h-full flex items-center justify-center text-xs text-gray-400">No photo</div>'}
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-xs uppercase tracking-wider text-[#af2b3e]">${p.section === 'board' ? 'Board' : 'Member'} · ${p.is_active ? 'Visible' : 'Hidden'}</div>
            <h4 class="serif text-2xl font-bold mt-1">${esc(p.name)}</h4>
            <p class="text-sm font-semibold text-[#af2b3e] mt-1">${esc(p.role_title)}</p>
            <p class="text-sm text-gray-600 mt-2 line-clamp-2">${esc(p.bio)}</p>
            <div class="flex flex-wrap gap-2 mt-3">
              ${p.linkedin_url ? '<span class="text-xs border px-2 py-1">LinkedIn ✓</span>' : ''}
              ${p.instagram_url ? '<span class="text-xs border px-2 py-1">Instagram ✓</span>' : ''}
            </div>
          </div>
          <div class="flex sm:flex-col gap-2 justify-end">
            <button data-team-edit="${p.id}" class="border px-4 py-2 text-xs">Edit</button>
            <button data-team-delete="${p.id}" class="border border-red-300 text-red-700 px-4 py-2 text-xs">Delete</button>
          </div>
        </article>`).join('') : '<div class="bg-white border p-10 text-center text-gray-500">No people found.</div>';
    } catch (err) {
      if (teamMessage) {
        teamMessage.textContent = `Could not load team directory: ${err?.message || err}`;
        teamMessage.className = 'mt-5 p-4 border border-[#af2b3e] text-[#af2b3e] bg-red-50';
      }
      listEl.innerHTML = '<div class="bg-white border p-10 text-center text-gray-500">Unable to load people.</div>';
    }
  };
  $('#team-search')?.addEventListener('input', load);
  window.setTimeout(load, 900);
}
