/* =========================================================
   SafariNomad admin: Team & activity (owner only)
   ---------------------------------------------------------
   - Everyone on the team, their role and when they were last
     active, with the work credited to them in a period:
     bookings confirmed (and their value), enquiries replied,
     follow-ups contacted.
   - Add people with the username and password you choose, then
     copy or WhatsApp them their sign-in details.
   - Change roles, reset passwords, switch accounts off, remove.
   - The activity log: every sign-in, status change, note,
     website edit and CSV download, filterable by person.
   Server side: server/team.mjs and /api/admin/team…
   ========================================================= */

const AdminTeam = (function(){
  const DAY = 86400000;
  const PERIODS = [['7', '7 days'], ['30', '30 days'], ['90', '90 days'], ['all', 'All time']];
  const KINDS = [['all', 'Everything'], ['signin', 'Sign-ins'], ['bookings', 'Bookings'], ['enquiries', 'Enquiries'], ['leads', 'Follow-ups'], ['website', 'Website'], ['team', 'Team'], ['export', 'Downloads'], ['security', 'Security']];
  const ROLE_HELP = { owner: 'Everything, including the team', manager: 'Everything except the team', agent: 'Bookings, enquiries, follow-ups and chat' };
  let state = { period: '30', who: 'all', kind: 'all', shown: 60, team: null, adding: false, editing: '', focusPw: false, notice: null };
  // The message you send a team member with their sign-in details
  const loginText = n => `Hi ${n.name.split(' ')[0]}, here are your SafariNomad admin details:\n\nLink: ${location.origin}/admin.html\nUsername: ${n.username}\nPassword: ${n.password}${n.mustChange ? '\n\nYou will be asked to choose your own password when you first sign in.' : ''}\n\nPlease keep them private.`;
  // Password box with show/hide and "make one for me"
  const pwField = (name, value, placeholder) => `<span class="team-pw"><input class="adm-input" name="${name}" type="text" autocomplete="new-password" spellcheck="false" minlength="8" maxlength="200" value="${value}" placeholder="${placeholder}"><button type="button" class="adm-btn" data-regen title="Make a strong password for me"><i class="fa-solid fa-wand-magic-sparkles"></i></button></span>`;
  const mustBox = `<label class="team-check"><input type="checkbox" name="mustChange"> Ask them to choose their own password when they first sign in</label>`;

  const kindOf = a => a.kind || (/sign-in/i.test(a.action) && /fail|block/i.test(a.action) ? 'security'
    : /^Signed/.test(a.action) ? 'signin' : /website|photo/i.test(a.action) ? 'website'
    : /team member|password/i.test(a.action) ? 'team' : /CSV/.test(a.action) ? 'export' : 'other');
  const ICON = { signin: 'fa-right-to-bracket', security: 'fa-shield-halved', bookings: 'fa-calendar-check', enquiries: 'fa-envelope', leads: 'fa-user-clock', questions: 'fa-comments', website: 'fa-pen-to-square', team: 'fa-users-gear', export: 'fa-file-arrow-down', other: 'fa-circle-dot' };

  // Easy to read and type: no look-alike characters (I l 1 O 0)
  function tempPassword(){
    const abc = 'abcdefghjkmnpqrstuvwxyz23456789', r = crypto.getRandomValues(new Uint8Array(12));
    return [0, 4, 8].map(i => [...r.slice(i, i + 4)].map(b => abc[b % abc.length]).join('')).join('-');
  }

  async function render(el, ctx){
    const { api, esc } = ctx;
    if(!state.team || ctx.reload){
      try { state.team = await api('team'); }
      catch(err){ el.innerHTML = `<div class="adm-empty"><i class="fa-solid fa-lock"></i><p>${esc(err.message)}</p></div>`; return; }
    }
    draw(el, ctx);
  }

  function stats(u, data, since){
    const inPeriod = x => !since || Date.parse(x.statusAt || x.updated || x.created) >= since;
    const sold = data.bookings.filter(b => b.confirmedBy === u.id && ['confirmed', 'completed'].includes(b.status) && inPeriod(b));
    return {
      sales: sold.length, value: sold.reduce((s, b) => s + (b.total || 0), 0),
      replied: data.enquiries.filter(e => e.repliedBy === u.id && inPeriod(e)).length,
      followed: (data.leads || []).filter(l => l.handledBy === u.id && inPeriod(l)).length,
      open: data.bookings.filter(b => b.assignedTo === u.id && b.status === 'pending').length + data.enquiries.filter(e => e.assignedTo === u.id && e.status === 'new').length + (data.leads || []).filter(l => l.assignedTo === u.id && l.status === 'open').length
    };
  }

  function draw(el, ctx){
    const { esc, data, me, fmtWhen, usd } = ctx;
    const { users, activity, roles } = state.team;
    const since = state.period === 'all' ? 0 : Date.now() - Number(state.period) * DAY;
    const rows = users.map(u => ({ u, s: stats(u, data, since) }));
    const top = Math.max(1, ...rows.map(r => r.s.value));
    const roleOpts = sel => Object.entries(roles).map(([k, l]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(l)}</option>`).join('');
    const seg = (name, list, on) => `<div class="seg" role="tablist">${list.map(([k, l]) => `<button type="button" data-${name}="${k}" class="${k === on ? 'on' : ''}">${l}</button>`).join('')}</div>`;

    const acts = activity.filter(a => (state.who === 'all' || a.uid === state.who) && (state.kind === 'all' || kindOf(a) === state.kind) && (!since || Date.parse(a.at) >= since)).reverse();
    const failed = activity.filter(a => kindOf(a) === 'security' && Date.now() - Date.parse(a.at) < 7 * DAY).length;

    el.innerHTML = `
      ${state.notice ? `<div class="team-notice"><i class="fa-solid fa-key"></i><div class="team-notice-body"><b>${esc(state.notice.title)}</b>
        <pre class="team-login" id="loginText">${esc(loginText(state.notice))}</pre>
        <div class="team-notice-actions"><button type="button" class="adm-btn primary" data-copy><i class="fa-regular fa-copy"></i> Copy details</button><a class="adm-btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(loginText(state.notice))}"><i class="fa-brands fa-whatsapp"></i> Send on WhatsApp</a></div>
        <small>Send them privately. For safety the password is only shown here, once; you can always set a new one with the key button.</small></div><button type="button" class="adm-drawer-x" data-dismiss aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button></div>` : ''}
      <div class="team-bar">
        ${seg('period', PERIODS, state.period)}
        <button type="button" class="adm-btn primary" data-add><i class="fa-solid fa-user-plus"></i> Add team member</button>
      </div>
      ${state.adding ? `
      <form class="team-form" id="teamAdd" novalidate>
        <h3>New team member</h3>
        <div class="team-fields">
          <label>Full name<input class="adm-input" name="name" required maxlength="60" placeholder="e.g. Amina Otieno"></label>
          <label>Username<input class="adm-input" name="username" required maxlength="30" autocapitalize="none" spellcheck="false" placeholder="e.g. amina"></label>
          <label>Role<select class="adm-input" name="role">${roleOpts('agent')}</select><small class="role-help">${esc(ROLE_HELP.agent)}</small></label>
          <label>Password <small class="role-help">at least 8 characters</small>${pwField('password', '', 'Type one, or tap the wand')}</label>
        </div>
        ${mustBox}
        <div class="adm-err" id="addErr"></div>
        <div class="adm-dialog-actions"><button type="button" class="adm-btn" data-cancel>Cancel</button><button type="submit" class="adm-btn primary">Add</button></div>
      </form>` : ''}
      <div class="table-wrap"><table class="adm-table team-table">
        <thead><tr><th>Person</th><th>Last active</th><th title="Bookings they marked confirmed, and their value">Sales</th><th title="Enquiries they marked replied">Replied</th><th title="Unfinished bookings they followed up">Follow-ups</th><th title="Open work assigned to them">Assigned</th><th></th></tr></thead>
        <tbody>${rows.map(({ u, s }) => state.editing === u.id ? `
          <tr class="team-edit"><td colspan="7"><form class="team-form inline" data-edit="${u.id}" novalidate>
            <div class="team-fields">
              <label>Full name<input class="adm-input" name="name" value="${esc(u.name)}" maxlength="60"></label>
              <label>Username<input class="adm-input" name="username" value="${esc(u.username)}" maxlength="30" autocapitalize="none" spellcheck="false"></label>
              <label>Role<select class="adm-input" name="role" ${u.id === me.id ? 'disabled' : ''}>${roleOpts(u.role)}</select>${u.id === me.id ? '<small class="role-help">You can\'t change your own role</small>' : ''}</label>
              <label>New password <small class="role-help">leave empty to keep it</small>${pwField('password', '', 'Type a new one, or tap the wand')}</label>
            </div>
            ${u.id === me.id ? '' : mustBox}
            <div class="adm-err"></div>
            <div class="adm-dialog-actions"><button type="button" class="adm-btn" data-cancel>Cancel</button><button type="submit" class="adm-btn primary">Save</button></div>
          </form></td></tr>` : `
          <tr class="${u.disabled ? 'off' : ''}">
            <td data-l="Person"><b>${esc(u.name)}${u.id === me.id ? ' <span class="tag">You</span>' : ''}${u.demo ? ' <span class="tag">Demo</span>' : ''}</b><small>@${esc(u.username)} · <span class="role ${u.role}">${esc(u.roleLabel)}</span>${u.disabled ? ' · <b class="off-tag">Switched off</b>' : ''}${!u.logins && !u.demo ? ' · hasn\'t signed in yet' : ''}</small></td>
            <td data-l="Last active">${u.lastSeen ? fmtWhen(u.lastSeen) : '<span class="muted">Never</span>'}<small>${u.logins || 0} sign-in${u.logins === 1 ? '' : 's'}</small></td>
            <td data-l="Sales"><b>${s.sales}</b> · ${usd(s.value)}<span class="team-meter"><i style="width:${Math.round(s.value / top * 100)}%"></i></span></td>
            <td data-l="Replied"><b>${s.replied}</b></td>
            <td data-l="Follow-ups"><b>${s.followed}</b></td>
            <td data-l="Assigned">${s.open ? `<b>${s.open}</b> open` : '<span class="muted">–</span>'}</td>
            <td class="team-actions">${u.demo ? '' : `
              <button type="button" class="adm-btn" data-edit-user="${u.id}" title="Edit name, username or role"><i class="fa-solid fa-pen"></i></button>
              <button type="button" class="adm-btn" data-reset="${u.id}" title="Set a new password"><i class="fa-solid fa-key"></i></button>
              ${u.id === me.id ? '' : `<button type="button" class="adm-btn" data-toggle="${u.id}" title="${u.disabled ? 'Switch on' : 'Switch off (blocks sign-in)'}"><i class="fa-solid ${u.disabled ? 'fa-toggle-off' : 'fa-toggle-on'}"></i></button>
              <button type="button" class="adm-btn danger" data-remove="${u.id}" title="Remove"><i class="fa-solid fa-trash"></i></button>`}`}
            </td>
          </tr>`).join('')}</tbody></table></div>
      <p class="adm-hint">Credit goes to whoever marks a booking <b>confirmed</b>, an enquiry <b>replied</b> or a follow-up <b>contacted</b>. Assign work to someone from any booking, enquiry or follow-up.</p>

      <div class="panel">
        <h2>Activity ${failed ? `<span class="count warn" title="Failed sign-ins in the last 7 days">${failed} failed sign-in${failed === 1 ? '' : 's'} this week</span>` : ''}</h2>
        <div class="team-filters">
          <select class="adm-input" id="actWho" aria-label="Person"><option value="all">Everyone</option>${users.map(u => `<option value="${u.id}" ${u.id === state.who ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>
          ${seg('kind', KINDS, state.kind)}
        </div>
        ${acts.length ? `<ul class="act-list">${acts.slice(0, state.shown).map(a => `
          <li ${a.ref && a.kind ? `data-open="${esc(a.kind)}:${esc(a.ref)}" class="link"` : ''}>
            <i class="fa-solid ${ICON[kindOf(a)] || ICON.other} k-${kindOf(a)}" aria-hidden="true"></i>
            <div><p><b>${esc(a.name)}</b> ${esc(a.action[0].toLowerCase() + a.action.slice(1))}${a.detail ? ` <span>${esc(a.detail)}</span>` : ''}</p>
            <small>${new Date(a.at).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${fmtWhen(a.at)}</small></div>
          </li>`).join('')}</ul>
          ${acts.length > state.shown ? `<button type="button" class="todo-more" data-more>Show more (${acts.length - state.shown} older)</button>` : ''}`
        : '<div class="adm-empty"><i class="fa-solid fa-clock-rotate-left"></i><p>Nothing in this period yet.</p></div>'}
      </div>`;
    wire(el, ctx);
  }

  function wire(el, ctx){
    const { api, toast, me } = ctx;
    const $ = s => el.querySelector(s);
    const redraw = () => draw(el, ctx);
    const refresh = async () => { state.team = await api('team'); redraw(); };
    const fail = (box, err) => { if(box) box.textContent = err.message; else toast(err.message, true); };
    const user = id => state.team.users.find(u => u.id === id);

    el.querySelectorAll('[data-period]').forEach(b => b.onclick = () => { state.period = b.dataset.period; state.shown = 60; redraw(); });
    el.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { state.kind = b.dataset.kind; state.shown = 60; redraw(); });
    const who = $('#actWho'); if(who) who.onchange = () => { state.who = who.value; state.shown = 60; redraw(); };
    const more = $('[data-more]'); if(more) more.onclick = () => { state.shown += 100; redraw(); };
    $('[data-add]').onclick = () => { state.adding = !state.adding; redraw(); if(state.adding) $('#teamAdd [name=name]').focus(); };
    el.querySelectorAll('[data-cancel]').forEach(b => b.onclick = () => { state.adding = false; state.editing = ''; redraw(); });
    const dismiss = $('[data-dismiss]'); if(dismiss) dismiss.onclick = () => { state.notice = null; redraw(); };
    const copy = $('[data-copy]');
    if(copy) copy.onclick = () => {
      const text = loginText(state.notice);
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('Sign-in details copied'))
        .catch(() => { const r = document.createRange(); r.selectNodeContents($('#loginText')); getSelection().removeAllRanges(); getSelection().addRange(r); toast('Selected: press Ctrl+C to copy'); });
    };
    el.querySelectorAll('[data-regen]').forEach(b => b.onclick = () => { const i = b.previousElementSibling; i.value = tempPassword(); i.focus(); });
    el.querySelectorAll('[data-open]').forEach(li => li.onclick = () => { const [k, id] = li.dataset.open.split(':'); ctx.openDetail(k, id); });

    const add = $('#teamAdd');
    if(add){
      const role = add.querySelector('[name=role]'), help = add.querySelector('.role-help');
      role.onchange = () => { help.textContent = ROLE_HELP[role.value]; };
      add.querySelector('[name=name]').oninput = e => {
        const un = add.querySelector('[name=username]');
        if(!un.dataset.touched) un.value = e.target.value.trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9._-]/g, '');
      };
      add.querySelector('[name=username]').oninput = e => { e.target.dataset.touched = '1'; };
      add.onsubmit = async e => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(add)); f.mustChange = !!f.mustChange;
        if((f.password || '').length < 8){ fail($('#addErr'), new Error('Passwords need at least 8 characters. Tap the wand for a strong one.')); return; }
        try {
          const { user: u } = await api('team/add', { method: 'POST', body: JSON.stringify(f) });
          state.adding = false; state.notice = { title: `${u.name} can now sign in`, name: u.name, username: u.username, password: f.password, mustChange: f.mustChange };
          await refresh();
        } catch(err){ fail($('#addErr'), err); }
      };
    }
    el.querySelectorAll('[data-edit-user]').forEach(b => b.onclick = () => { state.editing = b.dataset.editUser; state.adding = false; redraw(); });
    el.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => { state.editing = b.dataset.reset; state.adding = false; state.focusPw = true; redraw(); });
    if(state.focusPw){ state.focusPw = false; const i = $('[data-edit] [name=password]'); if(i){ i.focus(); i.scrollIntoView({ block: 'center' }); } }
    el.querySelectorAll('[data-edit]').forEach(form => form.onsubmit = async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form)); f.mustChange = !!f.mustChange;
      if(!f.password) delete f.password;
      else if(f.password.length < 8){ fail(form.querySelector('.adm-err'), new Error('Passwords need at least 8 characters. Tap the wand for a strong one.')); return; }
      try {
        const { user: u } = await api('team/update', { method: 'POST', body: JSON.stringify({ id: form.dataset.edit, ...f }) });
        state.editing = '';
        if(f.password && u.id !== me.id) state.notice = { title: `New sign-in details for ${u.name}`, name: u.name, username: u.username, password: f.password, mustChange: f.mustChange };
        toast(f.password ? 'Password changed' : 'Saved'); await refresh();
      } catch(err){ fail(form.querySelector('.adm-err'), err); }
    });
    el.querySelectorAll('[data-toggle]').forEach(b => b.onclick = async () => {
      const u = user(b.dataset.toggle);
      if(!u.disabled && !confirm(`Switch off ${u.name}'s account? They are signed out at once and can't sign in until you switch it back on.`)) return;
      try { await api('team/update', { method: 'POST', body: JSON.stringify({ id: u.id, disabled: !u.disabled }) }); toast(u.disabled ? `${u.name} switched on` : `${u.name} switched off`); await refresh(); }
      catch(err){ fail(null, err); }
    });
    el.querySelectorAll('[data-remove]').forEach(b => b.onclick = async () => {
      const u = user(b.dataset.remove);
      if(!confirm(`Remove ${u.name} from the team? Their past activity stays in the log. To keep the account for later, switch it off instead.`)) return;
      try { await api('team/remove', { method: 'POST', body: JSON.stringify({ id: u.id }) }); toast(`${u.name} removed`); await refresh(); }
      catch(err){ fail(null, err); }
    });
  }

  return { render, reset: () => { state.team = null; } };
})();
