import { supabase } from '../supabase-client.js';

// The main admin page owns the team editor. This fallback takes over only when
// that inline module never finishes initializing, preventing a stuck "Loading…"
// state while keeping the existing editor behavior intact.
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

async function fallback() {
  const count = $('#count');
  const listEl = $('#team-list');
  if (!count || !listEl || count.textContent !== 'Loading…') return;

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) return;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'admin') return;

  let people = [];
  const form = $('#personForm');
  const messageEl = $('#team-message');

  const message = (text, ok = false) => {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = 'mt-5 p-4 border ' + (ok ? 'border-green-600 text-green-700 bg-green-50' : 'border-[#af2b3e] text-[#af2b3e] bg-red-50');
  };

  const reset = () => {
    ['personId','name','role_title','bio','linkedin_url','instagram_url','image_url'].forEach(id => { const e = $('#'+id); if (e) e.value = ''; });
    $('#section').value = 'member';
    $('#sort_order').value = people.filter(p => p.section === 'member').length;
    $('#is_active').checked = true;
    $('#preview').classList.add('hidden');
    $('#cancel').classList.add('hidden');
    $('#save-person').textContent = 'Save person';
    $('#image_file').value = '';
  };

  const render = () => {
    const q = ($('#team-search')?.value || '').trim().toLowerCase();
    const visible = people.filter(p => !q || [p.name,p.role_title,p.bio,p.section].some(v => String(v || '').toLowerCase().includes(q)));
    count.textContent = `${people.length} people total · ${people.filter(p => p.section === 'board').length} board · ${people.filter(p => p.section === 'member').length} members`;
    listEl.innerHTML = visible.length ? visible.map(p => `
      <article class="bg-white border p-4 flex flex-col sm:flex-row gap-4 ${p.is_active ? '' : 'opacity-50'}">
        <div class="w-24 h-24 shrink-0 bg-gray-100 border overflow-hidden">${p.image_url ? `<img src="${esc(p.image_url)}" class="w-full h-full object-cover grayscale" alt="">` : '<div class="w-full h-full flex items-center justify-center text-xs text-gray-400">No photo</div>'}</div>
        <div class="min-w-0 flex-1">
          <div class="text-xs uppercase tracking-wider text-[#af2b3e]">${p.section === 'board' ? 'Board' : 'Member'} · ${p.is_active ? 'Visible' : 'Hidden'}</div>
          <h4 class="serif text-2xl font-bold mt-1">${esc(p.name)}</h4>
          <p class="text-sm font-semibold text-[#af2b3e] mt-1">${esc(p.role_title)}</p>
          <p class="text-sm text-gray-600 mt-2 line-clamp-2">${esc(p.bio)}</p>
          <div class="flex flex-wrap gap-2 mt-3">${p.linkedin_url ? '<span class="text-xs border px-2 py-1">LinkedIn ✓</span>' : ''}${p.instagram_url ? '<span class="text-xs border px-2 py-1">Instagram ✓</span>' : ''}</div>
        </div>
        <div class="flex sm:flex-col gap-2 justify-end"><button data-fb-edit="${p.id}" class="border px-4 py-2 text-xs">Edit</button><button data-fb-delete="${p.id}" class="border border-red-300 text-red-700 px-4 py-2 text-xs">Delete</button></div>
      </article>`).join('') : '<div class="bg-white border p-10 text-center text-gray-500">No people found.</div>';
  };

  const load = async () => {
    const { data, error } = await supabase.from('team_members').select('*').order('section').order('sort_order').order('created_at');
    if (error) return message(`Could not load team directory: ${error.message}`);
    people = data || [];
    render();
  };

  const normalize = (v) => {
    let u = String(v || '').trim();
    if (!u) return null;
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    return u;
  };

  $('#team-search').oninput = render;
  $('#cancel').onclick = reset;
  $('#team-list').onclick = async (e) => {
    const edit = e.target.closest('[data-fb-edit]');
    const del = e.target.closest('[data-fb-delete]');
    if (edit) {
      const p = people.find(x => x.id === edit.dataset.fbEdit);
      if (!p) return;
      $('#personId').value = p.id;
      $('#name').value = p.name || '';
      $('#role_title').value = p.role_title || '';
      $('#section').value = p.section || 'member';
      $('#bio').value = p.bio || '';
      $('#linkedin_url').value = p.linkedin_url || '';
      $('#instagram_url').value = p.instagram_url || '';
      $('#sort_order').value = p.sort_order ?? 0;
      $('#is_active').checked = !!p.is_active;
      $('#image_url').value = p.image_url || '';
      if (p.image_url) { $('#preview').src = p.image_url; $('#preview').classList.remove('hidden'); }
      $('#cancel').classList.remove('hidden');
      $('#save-person').textContent = 'Update person';
      $('#team').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (del) {
      const p = people.find(x => x.id === del.dataset.fbDelete);
      if (!p || !confirm(`Delete “${p.name}” from the team directory?`)) return;
      const { error } = await supabase.from('team_members').delete().eq('id', p.id);
      if (error) return message(error.message);
      message('Person removed.', true);
      await load();
    }
  };

  $('#upload').onclick = async () => {
    const file = $('#image_file').files?.[0];
    if (!file) return message('Choose a profile photo first.');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${session.user.id}/team-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('team-images').upload(path, file, { contentType: file.type, upsert: false });
    if (error) return message(error.message);
    const url = supabase.storage.from('team-images').getPublicUrl(path).data.publicUrl;
    $('#image_url').value = url;
    $('#preview').src = url;
    $('#preview').classList.remove('hidden');
  };

  $('#image_url').oninput = () => {
    const u = $('#image_url').value.trim();
    if (u) { $('#preview').src = u; $('#preview').classList.remove('hidden'); }
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const p = {
      name: $('#name').value.trim(),
      role_title: $('#role_title').value.trim(),
      bio: $('#bio').value.trim(),
      linkedin_url: normalize($('#linkedin_url').value),
      instagram_url: normalize($('#instagram_url').value),
      image_url: normalize($('#image_url').value),
      section: $('#section').value,
      sort_order: Number($('#sort_order').value) || 0,
      is_active: $('#is_active').checked,
      updated_at: new Date().toISOString()
    };
    if (!p.name || !p.role_title) return message('Name and title are required.');
    if (p.linkedin_url && !/linkedin\.com/i.test(p.linkedin_url)) return message('Please enter a LinkedIn URL.');
    if (p.instagram_url && !/instagram\.com/i.test(p.instagram_url)) return message('Please enter an Instagram URL.');
    const id = $('#personId').value;
    const result = id ? await supabase.from('team_members').update(p).eq('id', id) : await supabase.from('team_members').insert(p);
    if (result.error) return message(result.error.message);
    message(id ? 'Profile updated successfully.' : 'Person added successfully.', true);
    reset();
    await load();
  };

  await load();
}

setTimeout(() => fallback().catch(err => console.error('Team directory fallback:', err)), 900);
