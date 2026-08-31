import { supabase } from '../supabase-client.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function showMessage(text, ok = false) {
  const el = $('#message');
  if (!el) return;
  el.textContent = text;
  el.className = 'mt-5 p-4 border ' + (ok
    ? 'border-green-600 text-green-700 bg-green-50'
    : 'border-[#af2b3e] text-[#af2b3e] bg-red-50');
}

function showTeamMessage(text, ok = false) {
  const el = $('#team-message');
  if (!el) return;
  el.textContent = text;
  el.className = 'mt-5 p-4 border ' + (ok
    ? 'border-green-600 text-green-700 bg-green-50'
    : 'border-[#af2b3e] text-[#af2b3e] bg-red-50');
}

async function loadArticlesFallback() {
  const rows = $('#rows');
  if (!rows) return false;

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const session = sessionData?.session;
    if (!session) {
      showMessage('Your admin session is not available. Please log in again.');
      return false;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role,display_name')
      .eq('id', session.user.id)
      .maybeSingle();
    if (profileError) throw new Error(`Profile lookup failed: ${profileError.message}`);
    if (profile?.role !== 'admin') {
      showMessage('This account does not have admin access.');
      return false;
    }

    $('#identity').textContent = profile.display_name || session.user.email;

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw new Error(`Articles query failed: ${error.message}`);

    const items = data || [];
    const type = { value: 'all' };
    const status = { value: 'all' };

    const render = () => {
      const q = ($('#search')?.value || '').trim().toLowerCase();
      let list = items.filter(a =>
        (type.value === 'all' || (a.content_type || 'article') === type.value) &&
        (status.value === 'all' || a.status === status.value) &&
        (!q || [a.title, a.author_name, a.category, a.content_type, a.status]
          .some(v => String(v || '').toLowerCase().includes(q)))
      );

      if ($('#sort')?.value === 'title') {
        list.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
      } else {
        list.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
      }

      $('#s-total').textContent = items.length;
      $('#s-pending').textContent = items.filter(x => x.status === 'pending').length;
      $('#s-published').textContent = items.filter(x => x.status === 'published').length;
      $('#s-archived').textContent = items.filter(x => x.status === 'archived').length;

      rows.innerHTML = list.length ? list.map(a => {
        const s = a.status;
        const badge = s === 'pending'
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : s === 'published'
          ? 'bg-green-50 text-green-800 border-green-200'
          : s === 'rejected'
          ? 'bg-red-50 text-red-800 border-red-200'
          : s === 'archived'
          ? 'bg-gray-100 text-gray-700 border-gray-300'
          : 'bg-white text-gray-700 border-gray-300';

        return `<tr class="row border-b">
          <td class="p-4"><span class="pill border px-2 py-1 ${a.content_type === 'research' ? 'text-[#af2b3e]' : 'text-gray-700'}">${a.content_type === 'research' ? 'Research' : 'Article'}</span></td>
          <td class="p-4"><a href="/admin/edit?id=${encodeURIComponent(a.id)}" class="serif text-lg font-bold hover:text-[#af2b3e]">${esc(a.title || 'Untitled')}</a></td>
          <td class="p-4 text-sm">${esc(a.author_name || 'EPL Member')}</td>
          <td class="p-4 text-sm text-gray-600">${esc(a.category || '—')}</td>
          <td class="p-4"><span class="pill border px-2 py-1 ${badge}">${esc(s || 'draft')}</span></td>
          <td class="p-4 text-sm text-gray-600">${new Date(a.updated_at || a.created_at).toLocaleDateString()}</td>
          <td class="p-4"><div class="flex flex-wrap justify-end gap-2">
            ${s === 'pending' ? `<button data-fallback-action="approve" data-id="${a.id}" class="bg-black text-white px-3 py-2 text-xs">Approve & publish</button><button data-fallback-action="reject" data-id="${a.id}" class="border px-3 py-2 text-xs">Reject</button>` : ''}
            ${s === 'published' ? `<button data-fallback-action="archive" data-id="${a.id}" class="border px-3 py-2 text-xs">Archive</button>` : ''}
            ${s === 'archived' || s === 'rejected' ? `<button data-fallback-action="restore" data-id="${a.id}" class="border px-3 py-2 text-xs">Restore</button>` : ''}
            <a href="/admin/edit?id=${encodeURIComponent(a.id)}" class="border px-3 py-2 text-xs">Edit</a>
            ${s !== 'published' ? `<button data-fallback-action="delete" data-id="${a.id}" class="border border-red-300 text-red-700 px-3 py-2 text-xs">Delete</button>` : ''}
          </div></td>
        </tr>`;
      }).join('') : '<tr><td colspan="7" class="p-12 text-center text-gray-500">No content found in the database.</td></tr>';
    };

    render();
    $('#search')?.addEventListener('input', render);
    $('#sort')?.addEventListener('change', render);
    document.querySelectorAll('.type-tab').forEach(btn => btn.addEventListener('click', () => {
      type.value = btn.dataset.type || 'all';
      document.querySelectorAll('.type-tab').forEach(x => x.classList.remove('bg-black', 'text-white'));
      btn.classList.add('bg-black', 'text-white');
      render();
    }));
    document.querySelectorAll('.status-tab').forEach(btn => btn.addEventListener('click', () => {
      status.value = btn.dataset.status || 'all';
      document.querySelectorAll('.status-tab').forEach(x => x.classList.remove('bg-black', 'text-white'));
      btn.classList.add('bg-black', 'text-white');
      render();
    }));

    rows.addEventListener('click', async event => {
      const btn = event.target.closest('[data-fallback-action]');
      if (!btn) return;
      const action = btn.dataset.fallbackAction;
      const id = btn.dataset.id;
      const item = items.find(x => String(x.id) === String(id));
      if (!item) return;

      if (['delete', 'archive', 'approve'].includes(action)) {
        const prompt = action === 'delete'
          ? `Permanently delete “${item.title}”?`
          : action === 'archive'
          ? `Archive “${item.title}”?`
          : `Publish “${item.title}” publicly?`;
        if (!confirm(prompt)) return;
      }

      const patch = action === 'approve'
        ? { status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        : action === 'reject'
        ? { status: 'rejected', published_at: null, updated_at: new Date().toISOString() }
        : action === 'archive'
        ? { status: 'archived', updated_at: new Date().toISOString() }
        : action === 'restore'
        ? { status: 'draft', published_at: null, updated_at: new Date().toISOString() }
        : null;

      if (action === 'delete') {
        const { error } = await supabase.from('articles').delete().eq('id', id);
        if (error) return showMessage(`Delete failed: ${error.message}`);
      } else if (patch) {
        const { error } = await supabase.from('articles').update(patch).eq('id', id);
        if (error) return showMessage(`Update failed: ${error.message}`);
      }

      showMessage('Content updated successfully.', true);
      setTimeout(() => location.reload(), 250);
    });

    return true;
  } catch (err) {
    showMessage(`Dashboard could not load: ${err?.message || err}`);
    return false;
  }
}

async function loadTeamFallback() {
  const listEl = $('#team-list');
  const countEl = $('#count');
  if (!listEl || !countEl) return;

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
    const visible = people.filter(p => !q || [p.name, p.role_title, p.bio, p.section]
      .some(v => String(v || '').toLowerCase().includes(q)));

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
        </div>
        <div class="flex sm:flex-col gap-2 justify-end">
          <button data-team-edit="${p.id}" class="border px-4 py-2 text-xs">Edit</button>
          <button data-team-delete="${p.id}" class="border border-red-300 text-red-700 px-4 py-2 text-xs">Delete</button>
        </div>
      </article>`).join('') : '<div class="bg-white border p-10 text-center text-gray-500">No people found.</div>';
  } catch (err) {
    showTeamMessage(`Team directory could not load: ${err?.message || err}`);
  }
}

// The original admin module can fail before reaching its loaders. This script is loaded
// separately so the dashboard can still connect to the integrated Supabase database and
// expose the real database error instead of leaving the UI stuck on “Loading…”.
window.setTimeout(async () => {
  const articlesStillLoading = $('#rows')?.textContent?.includes('Loading');
  const statsStillEmpty = $('#s-total')?.textContent === '—';
  const teamStillLoading = $('#count')?.textContent?.includes('Loading');

  if (articlesStillLoading || statsStillEmpty) await loadArticlesFallback();
  if (teamStillLoading) await loadTeamFallback();
}, 1200);
