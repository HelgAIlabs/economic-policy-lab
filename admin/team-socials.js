import { supabase } from '../supabase-client.js';

(() => {
  const $ = (s) => document.querySelector(s);
  const form = $('#personForm');
  if (!form) return;

  const socialWrap = document.createElement('div');
  socialWrap.className = 'grid sm:grid-cols-2 gap-3';
  socialWrap.innerHTML = `
    <label class="block text-sm font-semibold">LinkedIn profile
      <input id="linkedin_url" type="url" placeholder="https://www.linkedin.com/in/..." class="mt-2 w-full border p-3 font-normal">
    </label>
    <label class="block text-sm font-semibold">Instagram profile
      <input id="instagram_url" type="url" placeholder="https://www.instagram.com/..." class="mt-2 w-full border p-3 font-normal">
    </label>`;
  const imageBlock = $('#image_url')?.closest('div');
  (imageBlock?.parentElement || form).insertBefore(socialWrap, imageBlock?.parentElement?.nextSibling || null);

  const normalize = (value) => {
    const v = String(value || '').trim();
    if (!v) return null;
    try {
      const u = new URL(v);
      return u.protocol === 'https:' ? u.toString() : null;
    } catch { return null; }
  };

  const clearSocials = () => {
    $('#linkedin_url').value = '';
    $('#instagram_url').value = '';
  };

  document.addEventListener('click', async (event) => {
    const edit = event.target.closest('[data-team-edit]');
    if (!edit) return;
    const id = edit.dataset.teamEdit;
    const { data } = await supabase.from('team_members').select('linkedin_url,instagram_url').eq('id', id).single();
    if (data) {
      $('#linkedin_url').value = data.linkedin_url || '';
      $('#instagram_url').value = data.instagram_url || '';
    }
  }, true);

  $('#cancel')?.addEventListener('click', () => setTimeout(clearSocials, 0));

  form.onsubmit = async (event) => {
    event.preventDefault();
    const message = $('#message');
    const show = (text, ok = false) => {
      message.textContent = text;
      message.className = 'mt-5 p-4 border ' + (ok ? 'border-green-600 text-green-700 bg-green-50' : 'border-[#af2b3e] text-[#af2b3e] bg-red-50');
    };

    const linkedin = normalize($('#linkedin_url').value);
    const instagram = normalize($('#instagram_url').value);
    if ($('#linkedin_url').value.trim() && !linkedin) return show('Please enter a valid HTTPS LinkedIn URL.');
    if ($('#instagram_url').value.trim() && !instagram) return show('Please enter a valid HTTPS Instagram URL.');

    const payload = {
      name: $('#name').value.trim(),
      role_title: $('#role_title').value.trim(),
      bio: $('#bio').value.trim(),
      image_url: $('#image_url').value.trim() || null,
      linkedin_url: linkedin,
      instagram_url: instagram,
      section: $('#section').value,
      sort_order: Number($('#sort_order').value) || 0,
      is_active: $('#is_active').checked,
      updated_at: new Date().toISOString()
    };
    if (!payload.name || !payload.role_title) return show('Name and title are required.');

    const id = $('#personId').value;
    const result = id
      ? await supabase.from('team_members').update(payload).eq('id', id)
      : await supabase.from('team_members').insert(payload);
    if (result.error) return show(result.error.message);

    show(id ? 'Profile updated, including social links.' : 'Person added, including social links.', true);
    setTimeout(() => location.reload(), 500);
  };
})();
