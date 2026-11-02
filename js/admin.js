/* =========================================================
   SafariNomad: admin dashboard (admin.html)
   ---------------------------------------------------------
   Reads bookings, enquiries and assistant questions from the
   server (/api/admin/...) and lets the team update their status
   and keep private notes. Needs the Node server (npm start).
   Everything visitors typed is escaped before it is shown.
   ========================================================= */

(function(){
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const usd = n => '$' + Math.round(n || 0).toLocaleString('en-US');
  const DAY = 86400000;
  const dateOnly = iso => new Date(iso + 'T00:00:00Z');
  const fmtDate = iso => iso ? dateOnly(iso).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric', timeZone:'UTC' }) : '–';
  const fmtWhen = iso => {
    const d = new Date(iso), mins = Math.round((Date.now() - d) / 60000);
    if(mins < 1) return 'just now';
    if(mins < 60) return mins + ' min ago';
    if(mins < 1440) return Math.round(mins / 60) + ' h ago';
    if(mins < 10080) return Math.round(mins / 1440) + ' d ago';
    return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  };
  const LANG = { en:'English', fr:'French', es:'Spanish', de:'German' };

  let token = sessionStorage.getItem('sn-admin') || '';
  let data = { bookings:[], enquiries:[], questions:[], trips:[] };
  let view = 'overview', filter = 'all', query = '', openItem = null;

  /* ---------- Server calls ---------- */
  async function api(path, opts = {}){
    const r = await fetch('/api/admin/' + path, Object.assign({}, opts, {
      headers: Object.assign({ 'Content-Type':'application/json', Authorization:'Bearer ' + token }, opts.headers || {})
    }));
    const body = await r.json().catch(() => ({}));
    if(r.status === 401 && path !== 'login'){ signOut(); throw new Error('Signed out'); }
    if(!r.ok) throw new Error(body.error || 'Something went wrong');
    return body;
  }
  function toast(msg, err){
    const t = $('#toast');
    t.textContent = msg; t.className = 'adm-toast show' + (err ? ' err' : '');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  /* ---------- Sign in / out ---------- */
  if(!/^https?:/.test(location.protocol)){
    $('#loginErr').innerHTML = 'The admin dashboard needs the website server. Run <code>npm start</code> and open <b>http://localhost:3000/admin.html</b>.';
  }
  $('#pwShow').addEventListener('click', () => { const i = $('#pw'); i.type = i.type === 'password' ? 'text' : 'password'; });
  // Warn about Caps Lock, a common reason for "Wrong password"
  ['keydown', 'keyup'].forEach(ev => $('#pw').addEventListener(ev, e => { if(e.getModifierState) $('#capsWarn').hidden = !e.getModifierState('CapsLock'); }));
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    $('#loginErr').textContent = '';
    try{
      const r = await api('login', { method:'POST', body:JSON.stringify({ password:$('#pw').value }) });
      token = r.token; sessionStorage.setItem('sn-admin', token);
      $('#pw').value = '';
      start();
    }catch(err){ $('#loginErr').textContent = err.message === 'Failed to fetch' ? 'Can\'t reach the server. Is it running?' : err.message; }
  });
  function signOut(){
    token = ''; sessionStorage.removeItem('sn-admin');
    $('#app').hidden = true; $('#login').hidden = false;
    clearInterval(start.timer);
  }
  $('#logout').addEventListener('click', async () => { try{ await api('logout', { method:'POST' }); }catch(e){} signOut(); });

  async function load(quiet){
    try{
      data = await api('data');
      $('#updated').textContent = 'Updated ' + new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
      counts(); if(!VIEWS[view].custom || !quiet) render();
      if(openItem) openDetail(openItem.kind, openItem.id, true);
    }catch(err){ if(!quiet && err.message !== 'Signed out') toast(err.message, true); }
  }
  function start(){
    $('#login').hidden = true; $('#app').hidden = false;
    load();
    clearInterval(start.timer);
    start.timer = setInterval(() => load(true), 30000);   // keep it fresh
  }
  $('#refresh').addEventListener('click', () => { load(); toast('Refreshed'); });

  function counts(){
    const set = (id, n) => { $(id).textContent = n || ''; };
    set('#cntBookings', data.bookings.filter(b => b.status === 'pending').length);
    set('#cntEnquiries', data.enquiries.filter(e => e.status === 'new').length);
    set('#cntQuestions', data.questions.filter(q => q.status === 'new').length);
  }

  /* ---------- Navigation ---------- */
  const VIEWS = {
    overview:   { title:'Overview', sub:'What needs your attention today.', filters:null },
    bookings:   { title:'Bookings', sub:'Every booking made on the website. Click one to confirm, cancel or add a note.', filters:['all','pending','confirmed','completed','cancelled'] },
    departures: { title:'Departures', sub:'Seats booked on each upcoming departure.', filters:['upcoming','past'] },
    enquiries:  { title:'Enquiries', sub:'Quote requests, flight requests, guide requests and sign-ups.', filters:['all','new','replied','closed'] },
    questions:  { title:'Chat questions', sub:'What travellers asked Nomad, the AI assistant, and how it answered.', filters:['all','new','reviewed'] }
  };
  // Website content pages live in js/admin-content.js
  Object.entries(AdminContent.VIEWS).forEach(([k, v]) => { VIEWS[k] = Object.assign({ filters:null, custom:true }, v); });
  const contentCtx = { api, toast, esc, query: () => query };
  $('#nav').addEventListener('click', e => {
    const b = e.target.closest('[data-view]');
    if(b) go(b.dataset.view);
  });
  function go(v, f){
    view = v; filter = f || (VIEWS[v].filters || ['all'])[0]; query = ''; $('#search').value = '';
    $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
    render();
    window.scrollTo({ top:0 });
  }
  $('#search').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); render(); });
  $('#filters').addEventListener('click', e => { const b = e.target.closest('[data-filter]'); if(b){ filter = b.dataset.filter; render(); } });

  const matches = (obj) => !query || JSON.stringify(obj).toLowerCase().includes(query);
  const pill = s => `<span class="pill ${esc(s)}">${esc(s)}</span>`;

  function render(){
    const v = VIEWS[view];
    $('#viewTitle').textContent = v.title;
    $('#viewSub').textContent = v.sub;
    $('#export').hidden = view === 'overview' || !!v.custom;
    if(v.custom){ $('#filters').innerHTML = ''; return AdminContent.render(view, $('#view'), contentCtx); }
    $('#filters').innerHTML = v.filters ? v.filters.map(f => {
      const n = countFor(f);
      return `<button data-filter="${f}" class="${f === filter ? 'on' : ''}">${f[0].toUpperCase() + f.slice(1)}${n !== null ? ` <b>${n}</b>` : ''}</button>`;
    }).join('') : '';
    $('#view').innerHTML = ({ overview, bookings, departures, enquiries, questions })[view]();
  }
  function countFor(f){
    const list = view === 'bookings' ? data.bookings : view === 'enquiries' ? data.enquiries : view === 'questions' ? data.questions : null;
    if(!list) return null;
    return f === 'all' ? list.length : list.filter(x => x.status === f).length;
  }
  const empty = (icon, text) => `<div class="adm-empty"><i class="fa-solid ${icon}"></i><p>${text}</p></div>`;
  const today = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10); // Nairobi date
  const party = b => b.adults + b.children;

  /* ---------- Overview ---------- */
  function overview(){
    const active = data.bookings.filter(b => b.status !== 'cancelled');
    const pending = data.bookings.filter(b => b.status === 'pending');
    const next30 = active.filter(b => b.date >= today() && dateOnly(b.date) - dateOnly(today()) <= 30 * DAY);
    const value = data.bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((s, b) => s + b.total, 0);
    const newEnq = data.enquiries.filter(e => e.status === 'new');
    const qToday = data.questions.filter(q => q.created.slice(0, 10) === new Date().toISOString().slice(0, 10));

    const stat = (icon, n, label, go, tone) => `<button class="stat ${tone || ''}" ${go ? `data-go="${go}"` : ''}><i class="fa-solid ${icon}"></i><b>${n}</b><span>${label}</span></button>`;
    const feed = [
      ...data.bookings.map(b => ({ t:b.created, kind:'bookings', id:b.id, icon:'fa-calendar-check', text:`<b>${esc(b.name)}</b> booked <b>${esc(b.tripTitle)}</b> for ${party(b)} on ${fmtDate(b.date)}`, s:b.status })),
      ...data.enquiries.map(e => ({ t:e.created, kind:'enquiries', id:e.id, icon:'fa-envelope', text:`<b>${esc(e.fields.name || e.fields.Name || e.fields.email || e.fields.Email || 'Someone')}</b> sent a ${esc(e.type.toLowerCase())}`, s:e.status })),
      ...data.questions.map(q => ({ t:q.created, kind:'questions', id:q.id, icon:'fa-comment-dots', text:`Asked Nomad: “${esc(q.question.slice(0, 90))}${q.question.length > 90 ? '…' : ''}”`, s:q.status }))
    ].sort((a, b) => b.t.localeCompare(a.t)).slice(0, 8);

    const upcoming = departuresList().filter(d => d.date >= today()).slice(0, 5);
    return `
      <div class="stats">
        ${stat('fa-hourglass-half', pending.length, 'Bookings to confirm', 'bookings:pending', pending.length ? 'hot' : '')}
        ${stat('fa-plane-departure', next30.reduce((s, b) => s + party(b), 0), 'Travellers in the next 30 days', 'departures:upcoming')}
        ${stat('fa-sack-dollar', usd(value), 'Confirmed booking value', 'bookings:confirmed')}
        ${stat('fa-envelope-open-text', newEnq.length, 'New enquiries', 'enquiries:new', newEnq.length ? 'hot' : '')}
        ${stat('fa-comments', qToday.length, 'Chat questions today', 'questions:all')}
      </div>
      <div class="adm-cols">
        <div class="panel">
          <h2>Latest activity</h2>
          ${feed.length ? `<ul class="feed">${feed.map(f => `<li data-open="${f.kind}:${f.id}"><i class="fa-solid ${f.icon}"></i><div><p>${f.text}</p><small>${fmtWhen(f.t)}</small></div>${pill(f.s)}</li>`).join('')}</ul>` : empty('fa-seedling', 'Nothing yet. New bookings, enquiries and chat questions will appear here.')}
        </div>
        <div class="panel">
          <h2>Next departures</h2>
          ${upcoming.length ? upcoming.map(depRow).join('') : empty('fa-van-shuttle', 'No upcoming departures booked yet.')}
        </div>
      </div>`;
  }
  $('#view').addEventListener('click', e => {
    const g = e.target.closest('[data-go]');
    if(g){ const [v, f] = g.dataset.go.split(':'); return go(v, f); }
    const o = e.target.closest('[data-open]');
    if(o){ const [k, id] = o.dataset.open.split(':'); openDetail(k, id); }
  });

  /* ---------- Bookings ---------- */
  function filteredBookings(){
    return data.bookings.filter(b => (filter === 'all' || b.status === filter) && matches(b))
      .sort((a, b) => b.created.localeCompare(a.created));
  }
  function bookings(){
    const list = filteredBookings();
    if(!list.length) return empty('fa-calendar', query ? 'No bookings match your search.' : 'No bookings here yet.');
    return `<div class="table-wrap"><table class="adm-table">
      <thead><tr><th>Ref</th><th>Traveller</th><th>Trip</th><th>Start date</th><th>Party</th><th>Total</th><th>Status</th><th>Received</th></tr></thead>
      <tbody>${list.map(b => `
        <tr data-open="bookings:${b.id}">
          <td data-l="Ref"><b class="ref">${esc(b.ref)}</b></td>
          <td data-l="Traveller"><b>${esc(b.name)}</b><small>${esc(b.email)}</small></td>
          <td data-l="Trip">${esc(b.tripTitle)}${b.private ? ' <span class="tag">Private</span>' : ''}</td>
          <td data-l="Start date">${fmtDate(b.date)}<small>${b.days} days</small></td>
          <td data-l="Party">${b.adults} ad${b.children ? ` + ${b.children} ch` : ''}</td>
          <td data-l="Total"><b>${usd(b.total)}</b></td>
          <td data-l="Status">${pill(b.status)}</td>
          <td data-l="Received">${fmtWhen(b.created)}</td>
        </tr>`).join('')}</tbody></table></div>`;
  }

  /* ---------- Departures ---------- */
  function departuresList(){
    const map = {};
    data.bookings.filter(b => b.status !== 'cancelled').forEach(b => {
      const key = b.trip + '|' + b.date + (b.private ? '|' + b.id : '');
      const trip = data.trips.find(t => t.id === b.trip) || {};
      map[key] = map[key] || { trip:b.trip, title:b.tripTitle, date:b.date, endDate:b.endDate, capacity:b.private ? party(b) : trip.capacity || 12, private:b.private, seats:0, list:[] };
      map[key].seats += party(b); map[key].list.push(b);
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }
  function depRow(d){
    const pct = Math.min(100, Math.round(d.seats / d.capacity * 100));
    const days = Math.round((dateOnly(d.date) - dateOnly(today())) / DAY);
    return `<div class="dep" data-open="bookings:${d.list[0].id}">
      <div class="dep-date"><b>${dateOnly(d.date).getUTCDate()}</b><span>${dateOnly(d.date).toLocaleDateString('en-GB', { month:'short', timeZone:'UTC' })}</span></div>
      <div class="dep-info">
        <strong>${esc(d.title)}${d.private ? ' <span class="tag">Private</span>' : ''}</strong>
        <small>${fmtDate(d.date)} → ${fmtDate(d.endDate)} · ${days >= 0 ? `in ${days} day${days === 1 ? '' : 's'}` : 'departed'}</small>
        <div class="bar"><i style="width:${pct}%" class="${d.private ? '' : pct >= 100 ? 'full' : pct >= 75 ? 'high' : ''}"></i></div>
        <small class="names">${d.list.map(b => esc(b.name) + (b.status === 'pending' ? ' <em>(pending)</em>' : '')).join(', ')}</small>
      </div>
      <div class="dep-seats"><b>${d.seats}</b>/${d.capacity}<span>seats</span></div>
    </div>`;
  }
  function departures(){
    const list = departuresList().filter(d => (filter === 'past' ? d.date < today() : d.date >= today()) && matches(d));
    if(filter === 'past') list.reverse();
    return list.length ? `<div class="panel">${list.map(depRow).join('')}</div>` : empty('fa-van-shuttle', 'No departures here yet.');
  }

  /* ---------- Enquiries ---------- */
  const emailOf = e => Object.entries(e.fields).find(([k]) => /e-?mail/i.test(k))?.[1] || '';
  const nameOf = e => Object.entries(e.fields).find(([k]) => /name/i.test(k))?.[1] || emailOf(e);
  function enquiries(){
    const list = data.enquiries.filter(e => (filter === 'all' || e.status === filter) && matches(e)).sort((a, b) => b.created.localeCompare(a.created));
    if(!list.length) return empty('fa-envelope-open', query ? 'No enquiries match your search.' : 'No enquiries here yet.');
    return `<div class="cards">${list.map(e => {
      const msg = e.fields.message || e.fields.Message || e.fields['Trip details'] || Object.entries(e.fields).filter(([k]) => !/e-?mail|name|phone/i.test(k)).map(([k, v]) => `${k}: ${v}`).join(' · ');
      return `<article class="card ${e.status === 'new' ? 'unread' : ''}" data-open="enquiries:${e.id}">
        <header><span class="type">${esc(e.type)}</span>${pill(e.status)}<small>${fmtWhen(e.created)}</small></header>
        <h3>${esc(nameOf(e))}</h3><p class="muted">${esc(emailOf(e))}</p>
        <p class="clip">${esc(msg)}</p>
      </article>`;
    }).join('')}</div>`;
  }

  /* ---------- Chat questions ---------- */
  function questions(){
    const list = data.questions.filter(q => (filter === 'all' || q.status === filter) && matches(q)).sort((a, b) => b.created.localeCompare(a.created));
    if(!list.length) return empty('fa-comments', query ? 'No questions match your search.' : 'No chat questions yet. They appear when visitors talk to Nomad while the server is running.');
    return `<div class="qa-list">${list.map(q => `
      <article class="qa ${q.status === 'new' ? 'unread' : ''}" data-open="questions:${q.id}">
        <div class="qa-q"><i class="fa-solid fa-user"></i><p>${esc(q.question)}</p></div>
        <div class="qa-a"><i class="fa-solid fa-robot"></i><p>${q.answer ? esc(q.answer) : `<em>${q.offline ? 'Answered with the offline FAQ (no AI key set)' : 'No reply recorded'}</em>`}</p></div>
        <footer>${pill(q.status)}<span><i class="fa-solid fa-language"></i> ${LANG[q.lang] || esc(q.lang)}</span>${q.page ? `<span><i class="fa-regular fa-file"></i> ${esc(q.page)}</span>` : ''}<span><i class="fa-regular fa-clock"></i> ${fmtWhen(q.created)}</span></footer>
      </article>`).join('')}</div>`;
  }

  /* ---------- Detail drawer ---------- */
  const STATUS = { bookings:['pending','confirmed','completed','cancelled'], enquiries:['new','replied','closed'], questions:['new','reviewed'] };
  const row = (k, v) => v || v === 0 ? `<div><dt>${k}</dt><dd>${v}</dd></div>` : '';
  function openDetail(kind, id, keep){
    const item = data[kind].find(x => x.id === id);
    if(!item){ closeDetail(); return; }
    if(keep && document.activeElement && document.activeElement.id === 'note') return;   // don't wipe a note being typed
    openItem = { kind, id };
    let body = '';
    if(kind === 'bookings'){
      const b = item;
      const mail = `mailto:${b.email}?subject=${encodeURIComponent(`Your SafariNomad booking ${b.ref}: ${b.tripTitle}`)}&body=${encodeURIComponent(`Hi ${b.name.split(' ')[0]},\n\nThank you for booking ${b.tripTitle} starting ${fmtDate(b.date)}.\n\n`)}`;
      body = `<div class="dr-head"><span class="ref">${esc(b.ref)}</span>${pill(b.status)}</div>
        <h2>${esc(b.tripTitle)}</h2>
        <p class="muted">${fmtDate(b.date)} → ${fmtDate(b.endDate)} · ${b.days} days${b.private ? ' · Private' : ''}</p>
        <dl class="dl">
          ${row('Traveller', esc(b.name))}${row('Email', `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`)}
          ${row('Phone', b.phone ? `${esc(b.phone)} <a class="wa" target="_blank" rel="noopener" href="https://wa.me/${esc(b.phone.replace(/\D/g, ''))}"><i class="fa-brands fa-whatsapp"></i></a>` : '')}
          ${row('Lives in', esc(b.country))}
          ${row('Travellers', `${b.adults} adult${b.adults === 1 ? '' : 's'}${b.children ? `, ${b.children} child${b.children === 1 ? '' : 'ren'}` : ''}`)}
          ${row('Total', `<b>${usd(b.total)}</b>${b.private ? ' <small>(private price to confirm)</small>' : ''}`)}
          ${row('Deposit', usd(b.deposit))}${row('Balance due', fmtDate(b.balanceDue))}
          ${row('Site language', LANG[b.lang] || esc(b.lang))}${row('Currency shown', esc(b.currency))}
          ${row('Received', new Date(b.created).toLocaleString('en-GB'))}
        </dl>
        ${b.notes ? `<h4>Traveller's notes</h4><p class="quote">${esc(b.notes)}</p>` : ''}
        <a class="adm-btn wide" href="${esc(mail)}"><i class="fa-solid fa-reply"></i> Email ${esc(b.name.split(' ')[0])}</a>`;
    }
    if(kind === 'enquiries'){
      const e = item;
      const mail = `mailto:${emailOf(e)}?subject=${encodeURIComponent('Re: your SafariNomad ' + e.type.toLowerCase())}`;
      body = `<div class="dr-head"><span class="type">${esc(e.type)}</span>${pill(e.status)}</div>
        <h2>${esc(nameOf(e))}</h2><p class="muted">${new Date(e.created).toLocaleString('en-GB')}${e.page ? ' · from ' + esc(e.page) : ''}</p>
        <dl class="dl">${Object.entries(e.fields).map(([k, v]) => row(esc(k), esc(v).replace(/\n/g, '<br>'))).join('')}</dl>
        <a class="adm-btn wide" href="${esc(mail)}"><i class="fa-solid fa-reply"></i> Reply by email</a>`;
    }
    if(kind === 'questions'){
      const q = item;
      const thread = data.questions.filter(x => x.session && x.session === q.session).sort((a, b) => a.created.localeCompare(b.created));
      body = `<div class="dr-head"><span class="type">Chat</span>${pill(q.status)}</div>
        <h2>Conversation</h2><p class="muted">${LANG[q.lang] || esc(q.lang)}${q.page ? ' · on ' + esc(q.page) : ''} · ${new Date(q.created).toLocaleString('en-GB')}</p>
        <div class="thread">${(thread.length ? thread : [q]).map(x => `
          <div class="bubble me ${x.id === q.id ? 'hl' : ''}">${esc(x.question)}</div>
          <div class="bubble bot">${x.answer ? esc(x.answer) : `<em>${x.offline ? 'Offline FAQ answer shown' : 'No reply recorded'}</em>`}</div>`).join('')}</div>
        <p class="tip"><i class="fa-solid fa-lightbulb"></i> Asked often? Add the answer to <code>KNOWLEDGE</code> in js/data.js so Nomad answers it perfectly.</p>`;
    }
    body += `<h4>Status</h4><div class="seg">${STATUS[kind].map(s => `<button data-status="${s}" class="${item.status === s ? 'on' : ''}">${s}</button>`).join('')}</div>`;
    if(kind !== 'questions') body += `<h4>Private team note</h4><textarea id="note" rows="4" placeholder="Only the team sees this…">${esc(item.note || '')}</textarea><button class="adm-btn" id="saveNote"><i class="fa-solid fa-floppy-disk"></i> Save note</button>`;
    $('#drawerBody').innerHTML = body;
    $('#drawer').classList.add('open'); $('#drawerBg').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false');

    $$('#drawerBody [data-status]').forEach(btn => btn.addEventListener('click', () => update(kind, id, { status:btn.dataset.status })));
    const sn = $('#saveNote');
    if(sn) sn.addEventListener('click', () => update(kind, id, { note:$('#note').value }));
    // Opening a new item marks it as seen
    if(!keep && kind === 'questions' && item.status === 'new') update(kind, id, { status:'reviewed' }, true);
  }
  function closeDetail(){
    openItem = null;
    $('#drawer').classList.remove('open'); $('#drawerBg').classList.remove('open'); $('#drawer').setAttribute('aria-hidden', 'true');
  }
  $('#drawerX').addEventListener('click', closeDetail);
  $('#drawerBg').addEventListener('click', closeDetail);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeDetail(); });

  async function update(kind, id, change, quiet){
    try{
      const { item } = await api('update', { method:'POST', body:JSON.stringify(Object.assign({ kind, id }, change)) });
      const i = data[kind].findIndex(x => x.id === id);
      data[kind][i] = item;
      counts(); render(); openDetail(kind, id, false);
      if(!quiet) toast(change.status ? `Marked as ${change.status}` : 'Note saved');
    }catch(err){ if(err.message !== 'Signed out') toast(err.message, true); }
  }

  /* ---------- CSV export ---------- */
  $('#export').addEventListener('click', () => {
    let rows = [];
    if(view === 'bookings') rows = [['Ref','Status','Trip','Start','End','Private','Adults','Children','Total USD','Deposit USD','Balance due','Name','Email','Phone','Country','Notes','Team note','Received'],
      ...filteredBookings().map(b => [b.ref, b.status, b.tripTitle, b.date, b.endDate, b.private ? 'yes' : 'no', b.adults, b.children, b.total, b.deposit, b.balanceDue, b.name, b.email, b.phone, b.country, b.notes, b.note, b.created])];
    if(view === 'departures') rows = [['Trip','Start','End','Seats booked','Capacity','Travellers'], ...departuresList().map(d => [d.title, d.date, d.endDate, d.seats, d.capacity, d.list.map(b => `${b.name} (${b.ref})`).join('; ')])];
    if(view === 'enquiries'){
      const keys = [...new Set(data.enquiries.flatMap(e => Object.keys(e.fields)))];
      rows = [['Type','Status','Received','Page', ...keys, 'Team note'], ...data.enquiries.filter(e => filter === 'all' || e.status === filter).map(e => [e.type, e.status, e.created, e.page, ...keys.map(k => e.fields[k] || ''), e.note])];
    }
    if(view === 'questions') rows = [['Asked','Language','Page','Question','Answer','Status'], ...data.questions.filter(q => filter === 'all' || q.status === filter).map(q => [q.created, q.lang, q.page, q.question, q.answer || (q.offline ? '(offline answer)' : ''), q.status])];
    // Quote every cell; neutralise spreadsheet formulas from visitor text
    const cell = v => { let s = String(v ?? ''); if(/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const csv = '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
    a.download = `safarinomad-${view}-${today()}.csv`;
    a.click();
  });

  if(token) start();
})();
