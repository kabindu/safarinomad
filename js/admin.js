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
      const r = await api('login', { method:'POST', body:JSON.stringify({ username:$('#user').value, password:$('#pw').value }) });
      token = r.token; sessionStorage.setItem('sn-admin', token);
      try{ sessionStorage.setItem('sn-weak', r.weak ? '1' : ''); }catch(e){}
      $('#pw').value = '';
      start();
    }catch(err){ $('#loginErr').textContent = err.message === 'Failed to fetch' ? 'Can\'t reach the server. Is it running?' : err.message; $('#pw').select(); }
  });
  function signOut(){
    token = ''; sessionStorage.removeItem('sn-admin'); sessionStorage.removeItem('sn-weak');
    data = { bookings:[], enquiries:[], questions:[], trips:[] }; AdminTeam.reset(); closeDetail();
    $('#app').hidden = true; $('#login').hidden = false;
    clearInterval(start.timer);
  }
  $('#logout').addEventListener('click', async () => { try{ await api('logout', { method:'POST' }); }catch(e){} signOut(); });

  async function load(quiet){
    try{
      data = await api('data');
      $('#updated').textContent = 'Updated ' + new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
      applyRole();
      $('#demoBar').hidden = !data.demo;
      $('#demoBtn span').textContent = data.demo ? 'Clear demo data' : 'Load demo data';
      counts(); if(!(VIEWS[view].custom || VIEWS[view].manual) || !quiet) render();   // content and Insights refresh on demand
      if(openItem) openDetail(openItem.kind, openItem.id, true);
    }catch(err){ if(!quiet && err.message !== 'Signed out') toast(err.message, true); }
  }
  // Show only what this person's role allows (the server checks too)
  const can = what => (data.can || []).includes(what);
  function applyRole(){
    const me = data.me || {};
    $('#meName').textContent = me.name || '';
    $('#meRole').textContent = me.roleLabel || '';
    $$('[data-perm]').forEach(el => { el.hidden = !can(el.dataset.perm); });
    let weak = ''; try{ weak = sessionStorage.getItem('sn-weak'); }catch(e){}
    $('#pwBar').hidden = !weak;
    if(me.mustChange) openAccount(true);
    const need = { packages:'website', flights:'website', deals:'website', flash:'website', lastminute:'website', team:'team' }[view];
    if(need && !can(need)) go('overview');
  }
  // Every person and their name, for "assigned to" and "done by"
  const who = id => ((data.team || []).find(u => u.id === id) || {}).name || '';

  function start(){
    $('#login').hidden = true; $('#app').hidden = false;
    load();
    clearInterval(start.timer);
    start.timer = setInterval(() => load(true), 30000);   // keep it fresh
  }
  $('#refresh').addEventListener('click', () => { load(); toast('Refreshed'); });

  // Demo data: fictional records for presenting the dashboard (each flagged on the server, so clearing removes only those)
  async function setDemo(on){
    if(!on && !confirm('Remove all demo records? Real bookings and enquiries stay.')) return;
    try{
      await api('demo', { method:'POST', body:JSON.stringify({ action: on ? 'load' : 'clear' }) });
      await load();
      toast(on ? 'Demo data loaded' : 'Demo data cleared');
    }catch(err){ if(err.message !== 'Signed out') toast(err.message, true); }
  }
  $('#demoBtn').addEventListener('click', () => setDemo(!data.demo));
  $('#demoClear').addEventListener('click', () => setDemo(false));

  function counts(){
    const set = (id, n) => { $(id).textContent = n || ''; };
    set('#cntBookings', data.bookings.filter(b => b.status === 'pending').length);
    set('#cntEnquiries', data.enquiries.filter(e => e.status === 'new').length);
    set('#cntQuestions', data.questions.filter(q => q.status === 'new').length);
    set('#cntLeads', (data.leads || []).filter(l => l.status === 'open').length);
    // Total waiting, on the phone Menu button
    set('#menuCount', ['#cntBookings', '#cntEnquiries', '#cntLeads'].reduce((n, id) => n + (Number($(id).textContent) || 0), 0));
  }

  /* ---------- Navigation ---------- */
  const VIEWS = {
    overview:   { title:'Today', sub:'What needs doing now, oldest first. Everything else is one click away.', filters:null },
    insights:   { title:'Insights', sub:'Visits, most booked packages and the destinations travellers ask for. Click any package or place to open its records.', filters:null, manual:true },
    bookings:   { title:'Bookings', sub:'Every booking made on the website. Click one to confirm, cancel or add a note.', filters:['all','pending','confirmed','completed','cancelled'] },
    departures: { title:'Bookings', sub:'Seats booked on each departure.', filters:['upcoming','past'] },
    deals:      { title:'Deals', sub:'Flash sales and last-minute departures shown on the website.', filters:null, manual:true },
    enquiries:  { title:'Enquiries', sub:'Quote requests, flight requests, guide requests and sign-ups.', filters:['all','new','replied','closed'] },
    leads:      { title:'Unfinished', sub:'Travellers who started a booking or custom trip and left before sending it. Email, call or WhatsApp them to help finish.', filters:['open','contacted','booked','lost','all'] },
    questions:  { title:'Chat questions', sub:'What travellers asked Nomad, the AI assistant, and how it answered.', filters:['all','new','reviewed'] },
    team:       { title:'Team & activity', sub:'Who is on the team, what each person has done, and every sign-in and change.', filters:null, manual:true }
  };
  // Website content pages live in js/admin-content.js
  Object.entries(AdminContent.VIEWS).forEach(([k, v]) => { VIEWS[k] = Object.assign({ filters:null, custom:true }, v); });
  // Pages that live inside another menu item (highlight that item)
  const NAV_OF = { departures:'bookings', flash:'deals', lastminute:'deals' };
  let dealTab = 'flash';
  const contentCtx = { api, toast, esc, query: () => query };
  $('#nav').addEventListener('click', e => {
    const b = e.target.closest('[data-view]');
    if(b){ go(b.dataset.view); menu(false); }
  });
  // Phones & tablets: the menu slides in from the left
  function menu(open){
    $('#app').classList.toggle('menu-open', open);
    $('#menuBtn').setAttribute('aria-expanded', open);
    if(open) ($('#nav button.on') || $('#nav button')).focus({ preventScroll:true });
  }
  $('#menuBtn').addEventListener('click', () => menu(!$('#app').classList.contains('menu-open')));
  $('#sideBg').addEventListener('click', () => menu(false));
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && $('#app').classList.contains('menu-open')) menu(false); });
  // go(view, filter, search) — Insights uses the search to open e.g. one package's bookings
  function go(v, f, q){
    view = v; filter = f || (VIEWS[v].filters || ['all'])[0]; query = (q || '').toLowerCase(); $('#search').value = q || '';
    $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.view === (NAV_OF[v] || v)));
    render();
    window.scrollTo({ top:0 });
  }
  $('#search').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); render(); });
  $('#filters').addEventListener('click', e => {
    const d = e.target.closest('[data-deal]');
    if(d){ dealTab = d.dataset.deal; return render(); }
    const b = e.target.closest('[data-filter]'); if(b){ filter = b.dataset.filter; render(); }
  });

  const matches = (obj) => !query || JSON.stringify(obj).toLowerCase().includes(query);
  const pill = s => `<span class="pill ${esc(s)}">${esc(s)}</span>`;

  function render(){
    const v = VIEWS[view];
    $('#viewTitle').textContent = v.title;
    $('#mbarTitle').textContent = v.title;
    $('#viewSub').textContent = v.sub;
    $('#export').hidden = ['overview', 'insights', 'deals', 'team'].includes(view) || !!v.custom;
    $('.adm-search').hidden = ['insights', 'overview', 'team'].includes(view);
    if(view === 'team'){ $('#filters').innerHTML = ''; return AdminTeam.render($('#view'), { api, toast, esc, data, me: data.me || {}, fmtWhen, usd, openDetail, reload: true }); }
    // Deals: one page, two tabs (the editors come from js/admin-content.js)
    if(view === 'deals'){
      $('#filters').innerHTML = [['flash', 'Flash sales'], ['lastminute', 'Last-minute departures']]
        .map(([k, l]) => `<button data-deal="${k}" class="${k === dealTab ? 'on' : ''}">${l}</button>`).join('');
      $('#view').innerHTML = `<p class="adm-hint">${esc(AdminContent.VIEWS[dealTab].sub)}</p><div id="dealBody"></div>`;
      return AdminContent.render(dealTab, $('#dealBody'), contentCtx);
    }
    if(view === 'insights'){ $('#filters').innerHTML = ''; return AdminInsights.render($('#view'), { data, esc, go }); }
    if(v.custom){ $('#filters').innerHTML = ''; return AdminContent.render(view, $('#view'), contentCtx); }
    $('#filters').innerHTML = v.filters ? v.filters.map(f => {
      const n = countFor(f);
      return `<button data-filter="${f}" class="${f === filter ? 'on' : ''}">${f[0].toUpperCase() + f.slice(1)}${n !== null ? ` <b>${n}</b>` : ''}</button>`;
    }).join('') : '';
    $('#view').innerHTML = ({ overview, bookings, departures, enquiries, questions, leads })[view]();
  }
  function countFor(f){
    const list = view === 'bookings' ? data.bookings : view === 'enquiries' ? data.enquiries : view === 'questions' ? data.questions : view === 'leads' ? (data.leads || []) : null;
    if(!list) return null;
    return f === 'all' ? list.length : list.filter(x => x.status === f).length;
  }
  const empty = (icon, text) => `<div class="adm-empty"><i class="fa-solid ${icon}"></i><p>${text}</p></div>`;
  const today = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10); // Nairobi date
  const party = b => b.adults + b.children;

  /* ---------- Today: one to-do list, then what's coming up ---------- */
  function overview(){
    const nameOf_ = e => Object.entries(e.fields || {}).find(([k]) => /name/i.test(k))?.[1] || Object.entries(e.fields || {}).find(([k]) => /e-?mail/i.test(k))?.[1] || 'Someone';
    const mailOf_ = e => Object.entries(e.fields || {}).find(([k]) => /e-?mail/i.test(k))?.[1] || '';
    const btn = (href, icon, label, cls = '') => `<a class="adm-btn ${cls}" href="${esc(href)}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''}><i class="${icon}"></i> ${label}</a>`;
    const todo = [];
    data.bookings.filter(b => b.status === 'pending').forEach(b => todo.push({
      t:b.created, icon:'fa-calendar-check', kind:'Booking', open:`bookings:${b.id}`,
      title:`Confirm <b>${esc(b.name)}</b>'s booking`,
      sub:`${esc(b.tripTitle)} · ${fmtDate(b.date)} · ${party(b)} traveller${party(b) === 1 ? '' : 's'} · ${usd(b.total)}`,
      actions: btn(`mailto:${b.email}`, 'fa-solid fa-envelope', 'Email') + (b.phone ? btn(`https://wa.me/${b.phone.replace(/\D/g, '')}`, 'fa-brands fa-whatsapp', 'WhatsApp', 'wa') : '')
    }));
    data.enquiries.filter(e => e.status === 'new').forEach(e => todo.push({
      t:e.created, icon:'fa-envelope', kind:e.type, open:`enquiries:${e.id}`,
      title:`Reply to <b>${esc(nameOf_(e))}</b>`,
      sub:esc(String(e.fields.Message || e.fields.message || e.fields.Route || e.type).replace(/\s+/g, ' ').slice(0, 110)),
      actions: mailOf_(e) ? btn(`mailto:${mailOf_(e)}?subject=${encodeURIComponent('Re: your SafariNomad ' + e.type.toLowerCase())}`, 'fa-solid fa-reply', 'Reply') : ''
    }));
    (data.leads || []).filter(l => l.status === 'open').forEach(l => todo.push({
      t:l.updated || l.created, icon:'fa-user-clock', kind:'Unfinished', open:`leads:${l.id}`,
      title:`Follow up <b>${esc(l.name || l.email || l.phone)}</b>`,
      sub:`${esc(leadWhat(l) || 'Not chosen yet')} · stopped at ${esc(l.step || '')}`,
      actions: leadActions(l)
    }));
    todo.sort((x, y) => x.t.localeCompare(y.t));                       // oldest first: nobody waits too long
    const newQ = data.questions.filter(q => q.status === 'new').length;
    const upcoming = departuresList().filter(d => d.date >= today() && dateOnly(d.date) - dateOnly(today()) <= 30 * DAY);
    // One line of numbers; the rest is in Insights
    const days = (data.analytics && data.analytics.days) || {};
    let visits = 0;
    for(let i = 0; i < 7; i++){ const k = new Date(dateOnly(today()) - i * DAY).toISOString().slice(0, 10); visits += (days[k] || {}).sessions || 0; }
    const week = data.bookings.filter(b => dateOnly(today()) - dateOnly(b.created.slice(0, 10)) < 7 * DAY).length;
    return `
      <p class="today-line">Last 7 days: <b>${visits.toLocaleString('en-US')}</b> visits · <b>${week}</b> booking request${week === 1 ? '' : 's'} · <button type="button" class="link" data-go="insights">See Insights</button></p>
      <div class="panel">
        <h2>To do ${todo.length ? `<span class="count">${todo.length}</span>` : ''}</h2>
        ${todo.length ? `<ul class="todo">${todo.map(x => `
          <li data-open="${x.open}">
            <i class="fa-solid ${x.icon}" aria-hidden="true"></i>
            <div class="todo-main"><p>${x.title}</p><small><span class="type">${esc(x.kind)}</span> ${x.sub} · ${fmtWhen(x.t)}</small></div>
            <div class="todo-actions">${x.actions}<button type="button" class="adm-btn" data-open="${x.open}">Open</button></div>
          </li>`).join('')}</ul>`
        : empty('fa-mug-hot', 'All done. New bookings, enquiries and people who left a booking halfway will appear here.')}
        ${newQ ? `<button type="button" class="todo-more" data-go="questions:new"><i class="fa-solid fa-comments"></i> ${newQ} new chat question${newQ === 1 ? '' : 's'} to look through <i class="fa-solid fa-arrow-right"></i></button>` : ''}
      </div>
      <div class="panel">
        <h2>Coming up</h2>
        ${upcoming.length ? upcoming.map(depRow).join('') : empty('fa-van-shuttle', 'No departures in the next 30 days.')}
      </div>`;
  }
  $('#view').addEventListener('click', e => {
    const g = e.target.closest('[data-go]');
    if(g){ const [v, f] = g.dataset.go.split(':'); return go(v, f); }
    if(e.target.closest('a')) return;                 // follow-up links (email, call, WhatsApp) work on their own
    const o = e.target.closest('[data-open]');
    if(o){ const [k, id] = o.dataset.open.split(':'); openDetail(k, id); }
  });

  /* ---------- Bookings ---------- */
  function filteredBookings(){
    return data.bookings.filter(b => (filter === 'all' || b.status === filter) && matches(b))
      .sort((a, b) => b.created.localeCompare(a.created));
  }
  const bookingSwitch = () => `<div class="seg adm-switch" role="tablist" aria-label="Show bookings">
      <button type="button" data-go="bookings:all" class="${view === 'bookings' ? 'on' : ''}"><i class="fa-solid fa-list"></i> List</button>
      <button type="button" data-go="departures:upcoming" class="${view === 'departures' ? 'on' : ''}"><i class="fa-solid fa-van-shuttle"></i> By departure</button></div>`;
  function bookings(){
    return bookingSwitch() + bookingsList();
  }
  function bookingsList(){
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
          <td data-l="Status">${pill(b.status)}${b.assignedTo && who(b.assignedTo) ? `<small><i class="fa-solid fa-user"></i> ${esc(who(b.assignedTo))}</small>` : ''}</td>
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
    return bookingSwitch() + departuresBody();
  }
  function departuresBody(){
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
        <header><span class="type">${esc(e.type)}</span>${pill(e.status)}${e.assignedTo && who(e.assignedTo) ? `<span class="assignee"><i class="fa-solid fa-user"></i> ${esc(who(e.assignedTo))}</span>` : ''}<small>${fmtWhen(e.created)}</small></header>
        <h3>${esc(nameOf(e))}</h3><p class="muted">${esc(emailOf(e))}</p>
        <p class="clip">${esc(msg)}</p>
      </article>`;
    }).join('')}</div>`;
  }

  /* ---------- Unfinished (leads) ---------- */
  const resumeUrl = l => l.resume ? new URL(l.resume, location.href).href : '';
  const leadWhat = l => (l.fields && (l.fields.Trip || l.fields.Route)) || '';
  function leadMail(l){
    const first = (l.name || '').split(' ')[0] || 'there', what = leadWhat(l);
    const body = `Hi ${first},\n\nThank you for looking at ${what ? what : 'a safari'} with SafariNomad. I saw you didn't get to finish, so I wanted to check if I can help with anything: dates, prices, visas or flights.\n\n${resumeUrl(l) ? `You can pick up where you left off here:\n${resumeUrl(l)}\n\n` : ''}Or simply reply to this email and I will sort it out for you.\n\nBest wishes,\nSafariNomad`;
    return `mailto:${l.email}?subject=${encodeURIComponent(`Your SafariNomad ${l.source === 'Custom trip' ? 'custom trip' : 'booking'}${what ? ': ' + what : ''}`)}&body=${encodeURIComponent(body)}`;
  }
  const waNumber = p => String(p || '').replace(/\D/g, '');
  function leadActions(l){
    return `<div class="lead-actions">
      ${l.email ? `<a class="adm-btn" href="${esc(leadMail(l))}"><i class="fa-solid fa-envelope"></i> Email</a>` : ''}
      ${l.phone ? `<a class="adm-btn" href="tel:${esc(l.phone.replace(/[^\d+]/g, ''))}"><i class="fa-solid fa-phone"></i> Call</a>
      <a class="adm-btn wa" target="_blank" rel="noopener" href="https://wa.me/${esc(waNumber(l.phone))}?text=${encodeURIComponent(`Hi ${(l.name || '').split(' ')[0]}, this is SafariNomad. I saw you started ${leadWhat(l) ? 'booking ' + leadWhat(l) : 'a booking'} on our website. Can I help you finish it?`)}"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : ''}
    </div>`;
  }
  function leads(){
    const list = (data.leads || []).filter(l => (filter === 'all' || l.status === filter) && matches(l)).sort((a, b) => (b.updated || b.created).localeCompare(a.updated || a.created));
    if(!list.length) return empty('fa-user-clock', query ? 'No one matches your search.' : filter === 'open' ? 'Nobody to follow up right now. When someone leaves a booking or custom trip halfway (after typing an email or phone), they appear here.' : 'Nothing here yet.');
    return `<div class="cards">${list.map(l => `
      <article class="card ${l.status === 'open' ? 'unread' : ''}" data-open="leads:${l.id}">
        <header><span class="type">${esc(l.source || 'Booking')}</span>${pill(l.status)}${l.assignedTo && who(l.assignedTo) ? `<span class="assignee"><i class="fa-solid fa-user"></i> ${esc(who(l.assignedTo))}</span>` : ''}<small>${fmtWhen(l.updated || l.created)}</small></header>
        <h3>${esc(l.name || 'No name yet')}</h3>
        <p class="muted">${[l.email, l.phone].filter(Boolean).map(esc).join(' · ')}</p>
        <p class="clip"><b>${esc(leadWhat(l) || 'Not chosen yet')}</b>${l.fields && l.fields.Date ? ' · ' + fmtDate(l.fields.Date) : ''}<br>Stopped at: ${esc(l.step || '')}</p>
        ${leadActions(l)}
      </article>`).join('')}</div>`;
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
  const STATUS = { bookings:['pending','confirmed','completed','cancelled'], enquiries:['new','replied','closed'], questions:['new','reviewed'], leads:['open','contacted','booked','lost'] };
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
          ${row('Lives in', esc(b.country))}${row('Nationality', esc(b.nationality))}
          ${row('Visa', esc({ help:'Wants help with visa / eTA', own:'Arranging own visa', none:'Not needed (East African citizen)' }[b.visa] || ''))}
          ${row('Flights', esc({ help:'Wants us to find flights', booked:'Already booked', later:'Will decide later' }[b.flights] || ''))}
          ${row('Flying from', esc(b.flyFrom))}${row('Arrival', esc([b.flightNo, b.arrival && b.arrival.replace('T', ' ')].filter(Boolean).join(' · ')))}
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
    if(kind === 'leads'){
      const l = item;
      body = `<div class="dr-head"><span class="type">${esc(l.source || 'Booking')}</span>${pill(l.status)}</div>
        <h2>${esc(l.name || 'No name yet')}</h2>
        <p class="muted">Started ${new Date(l.created).toLocaleString('en-GB')} · last active ${fmtWhen(l.updated || l.created)}${l.page ? ' · on ' + esc(l.page) : ''}</p>
        <p class="tip"><i class="fa-solid fa-flag"></i> Stopped at: <b>${esc(l.step || '')}</b>${l.outcome ? ` · ${esc(l.outcome)}` : ''}</p>
        <dl class="dl">${Object.entries(l.fields || {}).map(([k, v]) => row(esc(k), esc(v).replace(/\n/g, '<br>'))).join('')}</dl>
        ${resumeUrl(l) ? `<p class="muted">Link to continue: <a href="${esc(resumeUrl(l))}" target="_blank" rel="noopener">${esc(l.resume)}</a></p>` : ''}
        ${leadActions(l)}`;
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
    if(item.statusBy && who(item.statusBy)) body += `<p class="muted dr-by"><i class="fa-solid fa-user-check"></i> Marked <b>${esc(item.status)}</b> by ${esc(who(item.statusBy))}${item.statusAt ? ` · ${fmtWhen(item.statusAt)}` : ''}</p>`;
    if(kind !== 'questions'){
      const people = (data.team || []).filter(u => !u.demo || u.id === item.assignedTo);
      body += `<h4>Assigned to</h4><select class="adm-input" id="assign"><option value="">Nobody yet</option>${people.map(u => `<option value="${esc(u.id)}" ${u.id === item.assignedTo ? 'selected' : ''}>${esc(u.name)}${data.me && u.id === data.me.id ? ' (me)' : ''}</option>`).join('')}</select>`;
    }
    if(kind !== 'questions') body += `<h4>Private team note</h4><textarea id="note" rows="4" placeholder="Only the team sees this…">${esc(item.note || '')}</textarea><button class="adm-btn" id="saveNote"><i class="fa-solid fa-floppy-disk"></i> Save note</button>`;
    $('#drawerBody').innerHTML = body;
    $('#drawer').classList.add('open'); $('#drawerBg').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false');

    $$('#drawerBody [data-status]').forEach(btn => btn.addEventListener('click', () => update(kind, id, { status:btn.dataset.status })));
    const sn = $('#saveNote');
    if(sn) sn.addEventListener('click', () => update(kind, id, { note:$('#note').value }));
    const as = $('#assign');
    if(as) as.addEventListener('change', () => update(kind, id, { assignedTo:as.value }));
    // Opening a new item marks it as seen
    if(!keep && kind === 'questions' && item.status === 'new') update(kind, id, { status:'reviewed', auto:true }, true);
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
      if(!quiet) toast(change.status ? `Marked as ${change.status}` : change.assignedTo !== undefined ? (change.assignedTo ? `Assigned to ${who(change.assignedTo)}` : 'Unassigned') : 'Note saved');
    }catch(err){ if(err.message !== 'Signed out') toast(err.message, true); }
  }

  /* ---------- CSV export ---------- */
  $('#export').addEventListener('click', () => {
    let rows = [];
    if(view === 'bookings') rows = [['Ref','Status','Trip','Start','End','Private','Adults','Children','Total USD','Deposit USD','Balance due','Name','Email','Phone','Country','Nationality','Visa','Flights','Flying from','Arrival flight','Notes','Team note','Received'],
      ...filteredBookings().map(b => [b.ref, b.status, b.tripTitle, b.date, b.endDate, b.private ? 'yes' : 'no', b.adults, b.children, b.total, b.deposit, b.balanceDue, b.name, b.email, b.phone, b.country, b.nationality, b.visa, b.flights, b.flyFrom, [b.flightNo, b.arrival].filter(Boolean).join(' '), b.notes, b.note, b.created])];
    if(view === 'leads'){
      const list = (data.leads || []).filter(l => filter === 'all' || l.status === filter);
      const keys = [...new Set(list.flatMap(l => Object.keys(l.fields || {})))];
      rows = [['Status','Source','Stopped at','Started','Last active','Continue link', ...keys, 'Team note'], ...list.map(l => [l.status, l.source, l.step, l.created, l.updated, resumeUrl(l), ...keys.map(k => (l.fields || {})[k] || ''), l.note])];
    }
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
    api('log', { method:'POST', body:JSON.stringify({ action:'export', detail:`${view} (${filter}), ${rows.length - 1} rows` }) }).catch(() => {});
  });

  /* ---------- Your account: change password ---------- */
  function openAccount(force){
    const d = $('#acct');
    if(d.open) return;
    $('#acctWho').textContent = data.me ? `${data.me.name} · @${data.me.username} · ${data.me.roleLabel}` : '';
    $('#acctForce').hidden = !force; $('#acctCancel').hidden = !!force;
    d.dataset.force = force ? '1' : '';
    $('#acctErr').textContent = ''; $('#acctForm').reset();
    d.showModal(); $('#pwCur').focus();
  }
  $('#meBtn').addEventListener('click', () => openAccount(false));
  document.addEventListener('click', e => { if(e.target.closest('[data-account]')) openAccount(false); });
  $('#acctCancel').addEventListener('click', () => $('#acct').close());
  $('#acct').addEventListener('cancel', e => { if($('#acct').dataset.force) e.preventDefault(); });   // first sign-in: must choose a password
  $('#acctForm').addEventListener('submit', async e => {
    e.preventDefault();
    const next = $('#pwNew').value;
    if(next.length < 8){ $('#acctErr').textContent = 'Use at least 8 characters.'; return; }
    if(next !== $('#pwNew2').value){ $('#acctErr').textContent = 'The two new passwords don\'t match.'; return; }
    try{
      const r = await api('password', { method:'POST', body:JSON.stringify({ current:$('#pwCur').value, next }) });
      data.me = r.user;
      try{ sessionStorage.removeItem('sn-weak'); }catch(e){}
      $('#pwBar').hidden = true;
      $('#acct').dataset.force = '';
      $('#acct').close();
      toast('Password changed');
    }catch(err){ $('#acctErr').textContent = err.message; }
  });

  if(token) start();
})();
