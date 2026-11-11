/* =========================================================
   SafariNomad: admin "Website content" pages
   ---------------------------------------------------------
   Packages (photos, prices, details, show/hide), flash sales,
   last-minute deals and flight routes. Edits are kept as a
   draft until "Save & publish", which sends them to the server
   (/api/admin/content). The server stores them and rewrites
   js/content.js, so the website shows them on the next load.
   admin.js calls AdminContent.render(view, el, ctx).
   ========================================================= */

window.AdminContent = (function(){
  const VIEWS = {
    packages:   { title:'Packages', sub:'Change photos, prices and details, add new packages or hide them from the site.' },
    flash:      { title:'Flash sales', sub:'Time-limited discounts. They start and end on their own and show on the trip cards and in Flash deals on the Services page.' },
    lastminute: { title:'Last-minute deals', sub:'Fixed departures with a few seats left, shown on the home page and in Flash deals.' },
    flights:    { title:'Flights', sub:'Routes, flight times and from-fares used by the flight search.' }
  };
  const COUNTRIES = { kenya:'Kenya', tanzania:'Tanzania', uganda:'Uganda', rwanda:'Rwanda', multi:'Multi-country', world:'Beyond Africa' };
  const STYLES = { wildlife:'Wildlife', gorilla:'Gorillas & primates', beach:'Safari & beach', trek:'Trekking', camping:'Camping', family:'Family', luxury:'Luxury', adventure:'Adventure & sport', abroad:'Holidays abroad' };
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  let ctx, el, view;
  let base = null, saved = {}, draft = {}, images = [], dirty = false, loading = null;
  let pkgFilter = 'all';
  const clone = o => JSON.parse(JSON.stringify(o || {}));
  const esc = v => ctx.esc(v);
  const usd = n => '$' + Math.round(n || 0).toLocaleString('en-US');

  /* ---------- Load & save ---------- */
  async function load(){
    const r = await ctx.api('content');
    base = r.base; saved = r.content || {}; draft = clone(saved); images = r.images || [];
    dirty = false; bar();
  }
  async function publish(){
    try{
      const r = await ctx.api('content', { method:'POST', body:JSON.stringify({ content:draft }) });
      saved = r.content; draft = clone(saved); dirty = false; bar(); draw();
      ctx.toast('Saved. The website now shows your changes.');
    }catch(err){ if(err.message !== 'Signed out') ctx.toast(err.message, true); }
  }
  function touch(){ dirty = true; bar(); }

  // Sticky "unsaved changes" bar
  const barEl = document.createElement('div');
  barEl.className = 'cms-bar';
  barEl.innerHTML = `<span><i class="fa-solid fa-pen"></i> You have unsaved changes</span><button class="adm-btn" data-cms="discard">Discard</button><button class="btn btn-sm" data-cms="publish"><i class="fa-solid fa-cloud-arrow-up"></i> Save &amp; publish</button>`;
  document.body.appendChild(barEl);
  function bar(){ barEl.classList.toggle('show', dirty); }
  barEl.addEventListener('click', e => {
    const a = e.target.closest('[data-cms]'); if(!a) return;
    if(a.dataset.cms === 'publish') publish();
    if(a.dataset.cms === 'discard' && confirm('Discard all unsaved changes?')){ draft = clone(saved); dirty = false; bar(); draw(); }
  });
  window.addEventListener('beforeunload', e => { if(dirty){ e.preventDefault(); e.returnValue = ''; } });

  /* ---------- Trips: the site's trips with the draft edits applied ---------- */
  const added = () => (draft.added = draft.added || []);
  const isAdded = id => added().some(t => t.id === id);
  function trip(id){
    const a = added().find(t => t.id === id);
    if(a) return Object.assign({ styles:[], route:'', countries:'' }, a);
    const b = base.trips.find(t => t.id === id);
    return b ? Object.assign({}, b, (draft.trips || {})[id] || {}) : null;
  }
  const allTrips = () => [...base.trips.map(t => t.id), ...added().map(t => t.id)].map(trip);
  function setTrip(id, key, val){
    const a = added().find(t => t.id === id);
    if(a){ a[key] = val; return touch(); }
    draft.trips = draft.trips || {};
    const e = draft.trips[id] = draft.trips[id] || {};
    const orig = base.trips.find(t => t.id === id);
    if(JSON.stringify(orig[key] ?? (key === 'hidden' || key === 'featured' ? false : '')) === JSON.stringify(val)) delete e[key]; else e[key] = val;
    if(!Object.keys(e).length) delete draft.trips[id];
    touch();
  }
  const edited = id => isAdded(id) || !!(draft.trips || {})[id];
  const flashFor = id => (draft.flash || []).find(f => f.trip === id && flashState(f) !== 'ended');

  /* ---------- Render ---------- */
  async function render(v, container, c){
    ctx = c; el = container; view = v;
    if(!base){
      el.innerHTML = `<div class="adm-empty"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading website content…</p></div>`;
      try{ await (loading = loading || load()); }
      catch(err){ loading = null; el.innerHTML = `<div class="adm-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>${esc(err.message)}</p></div>`; return; }
      if(view !== v || el !== container) return;
    }
    draw();
  }
  function draw(){
    if(!base || !el || !VIEWS[view]) return;
    el.innerHTML = ({ packages, flash, lastminute, flights })[view]();
  }

  /* ---------- Packages ---------- */
  function packages(){
    const q = ctx.query();
    const list = allTrips().filter(t =>
      (pkgFilter === 'all' || (pkgFilter === 'hidden' ? t.hidden : pkgFilter === 'edited' ? edited(t.id) : pkgFilter === 'sale' ? (t.was || flashFor(t.id)) : t.country === pkgFilter)) &&
      (!q || (t.title + ' ' + t.route + ' ' + t.countries).toLowerCase().includes(q)));
    const chips = [['all','All'], ...Object.entries(COUNTRIES), ['sale','On sale'], ['edited','Edited'], ['hidden','Hidden']];
    return `
      <div class="cms-tools">
        <div class="cms-chips">${chips.map(([k, l]) => `<button data-pf="${k}" class="${pkgFilter === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <button class="btn btn-sm" data-act="add-trip"><i class="fa-solid fa-plus"></i> Add package</button>
      </div>
      <p class="cms-hint"><i class="fa-solid fa-circle-info"></i> Type a new price straight into the table, or click <b>Edit</b> for photos and details. Put the old price in <b>Was</b> to show a saving.</p>
      ${list.length ? `<div class="table-wrap"><table class="adm-table cms-table">
        <thead><tr><th>Photo</th><th>Package</th><th>Days</th><th>Price $</th><th>Was $</th><th>On site</th><th>Home page</th><th></th></tr></thead>
        <tbody>${list.map(t => {
          const f = flashFor(t.id);
          return `<tr class="${t.hidden ? 'is-off' : ''}" data-id="${esc(t.id)}">
          <td data-l="Photo"><button class="cms-thumb" data-act="img" title="Change photo"><img src="${esc(t.img)}" alt=""><i class="fa-solid fa-camera"></i></button></td>
          <td data-l="Package"><b>${esc(t.title)}</b><small>${esc(t.countries || COUNTRIES[t.country] || '')}${isAdded(t.id) ? ' · <span class="tag">New</span>' : edited(t.id) ? ' · <span class="tag">Edited</span>' : ''}${f ? ` · <span class="tag flash"><i class="fa-solid fa-bolt"></i> −${f.pct}%</span>` : ''}</small></td>
          <td data-l="Days"><input class="cms-num sm" type="number" min="1" max="60" data-f="days" value="${t.days}"></td>
          <td data-l="Price $"><input class="cms-num" type="number" min="1" data-f="price" value="${t.price}"></td>
          <td data-l="Was $"><input class="cms-num" type="number" min="0" data-f="was" value="${t.was || ''}" placeholder="–"></td>
          <td data-l="On site"><label class="cms-switch"><input type="checkbox" data-f="shown" ${t.hidden ? '' : 'checked'}><i></i></label></td>
          <td data-l="Home page"><label class="cms-switch"><input type="checkbox" data-f="featured" ${t.featured ? 'checked' : ''}><i></i></label></td>
          <td><button class="adm-btn" data-act="edit"><i class="fa-solid fa-pen"></i> Edit</button></td>
        </tr>`; }).join('')}</tbody></table></div>`
      : `<div class="adm-empty"><i class="fa-solid fa-suitcase"></i><p>No packages match.</p></div>`}`;
  }

  function editTrip(id){
    const isNew = !id;
    const t = isNew ? { title:'', route:'', countries:'', country:'kenya', styles:['wildlife'], days:3, group:12, stay:'Lodges', price:'', was:'', badge:'', img:'images/safari-vehicle.jpg', alt:'', featured:false } : trip(id);
    const field = (k, label, type = 'text', extra = '') => `<label class="cms-field"><span>${label}</span><input type="${type}" name="${k}" value="${esc(t[k] ?? '')}" ${extra}></label>`;
    drawer(`
      <div class="dr-head"><span class="type">${isNew ? 'New package' : 'Package'}</span></div>
      <h2>${isNew ? 'Add a package' : esc(t.title)}</h2>
      <form class="cms-form" id="tripForm">
        <div class="cms-photo"><img id="tfImg" src="${esc(t.img)}" alt=""><button type="button" class="adm-btn" data-act="pick"><i class="fa-solid fa-image"></i> Change photo</button></div>
        <input type="hidden" name="img" value="${esc(t.img)}">
        ${field('alt', 'Photo description (for screen readers)')}
        ${field('title', 'Package name', 'text', 'required maxlength="120"')}
        ${field('route', 'Route (use → between stops)', 'text', 'placeholder="Nairobi → Maasai Mara → Nakuru"')}
        <div class="cms-2">
          <label class="cms-field"><span>Country</span><select name="country">${Object.entries(COUNTRIES).map(([k, l]) => `<option value="${k}" ${t.country === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          ${field('countries', 'Countries text', 'text', 'placeholder="Kenya · Tanzania"')}
        </div>
        <div class="cms-3">
          ${field('days', 'Days', 'number', 'min="1" max="60" required')}
          ${field('group', 'Max group (1–2 = private)', 'number', 'min="1" max="40"')}
          ${field('stay', 'Stays', 'text', 'placeholder="Lodges"')}
        </div>
        <div class="cms-3">
          ${field('price', 'Price $ per person', 'number', 'min="1" required')}
          ${field('was', 'Was $ (optional)', 'number', 'min="0"')}
          ${field('badge', 'Badge (optional)', 'text', 'maxlength="30" placeholder="Best Seller"')}
        </div>
        <div class="cms-field"><span>Travel styles</span><div class="cms-checks">${Object.entries(STYLES).map(([k, l]) => `<label><input type="checkbox" name="styles" value="${k}" ${(t.styles || []).includes(k) ? 'checked' : ''}> ${l}</label>`).join('')}</div></div>
        <label class="cms-check"><input type="checkbox" name="featured" ${t.featured ? 'checked' : ''}> Show on the home page</label>
        <div class="cms-actions">
          <button class="btn btn-sm" type="submit"><i class="fa-solid fa-check"></i> ${isNew ? 'Add package' : 'Apply changes'}</button>
          ${!isNew && isAdded(id) ? `<button type="button" class="adm-btn danger" data-act="delete"><i class="fa-solid fa-trash"></i> Delete</button>` : ''}
          ${!isNew && !isAdded(id) && (draft.trips || {})[id] ? `<button type="button" class="adm-btn" data-act="reset"><i class="fa-solid fa-rotate-left"></i> Undo all edits</button>` : ''}
        </div>
        <p class="cms-hint">Changes go live when you press <b>Save &amp; publish</b>.</p>
      </form>`);
    const form = document.getElementById('tripForm');
    form.addEventListener('click', async e => {
      const a = e.target.closest('[data-act]'); if(!a) return;
      if(a.dataset.act === 'pick'){
        const p = await pickImage(form.img.value);
        if(p){ form.img.value = p; document.getElementById('tfImg').src = p; }
      }
      if(a.dataset.act === 'delete' && confirm('Delete this package?')){
        draft.added = added().filter(x => x.id !== id);
        draft.flash = (draft.flash || []).filter(f => f.trip !== id);
        touch(); closeDrawer(); draw();
      }
      if(a.dataset.act === 'reset'){ delete draft.trips[id]; touch(); closeDrawer(); draw(); }
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const v = {
        title: fd.get('title').trim(), route: fd.get('route').trim(), countries: fd.get('countries').trim() || COUNTRIES[fd.get('country')],
        country: fd.get('country'), styles: fd.getAll('styles'), stay: fd.get('stay').trim(),
        days: +fd.get('days'), group: +fd.get('group') || 12, price: +fd.get('price'), was: +fd.get('was') || 0,
        badge: fd.get('badge').trim(), img: fd.get('img'), alt: fd.get('alt').trim() || fd.get('title').trim(), featured: form.featured.checked
      };
      if(!v.styles.length) v.styles = ['wildlife'];
      if(isNew){
        let slug = v.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'package';
        while(trip(slug)) slug += '-2';
        added().push(Object.assign({ id: slug, months: [] }, v));
        touch();
      } else Object.entries(v).forEach(([k, val]) => {
        const cur = trip(id)[k];
        if(JSON.stringify(cur ?? (k === 'was' ? 0 : '')) !== JSON.stringify(val)) setTrip(id, k, k === 'badge' && !val && !cur ? undefined : val);
      });
      closeDrawer(); draw();
      ctx.toast(isNew ? 'Package added. Press Save & publish to put it live.' : 'Changes applied. Press Save & publish to put them live.');
    });
  }

  /* ---------- Flash sales ---------- */
  const NAIROBI = '+03:00';
  const localVal = iso => iso ? new Date(new Date(iso).getTime() + 3 * 3600000).toISOString().slice(0, 16) : '';
  const fromLocal = v => v ? v + ':00' + NAIROBI : '';
  function flashState(f){
    const now = Date.now();
    if(f.starts && new Date(f.starts) > now) return 'scheduled';
    if(f.ends && new Date(f.ends) < now) return 'ended';
    return 'live';
  }
  function flash(){
    const list = draft.flash || [];
    const opts = sel => allTrips().filter(t => !t.hidden).map(t => `<option value="${esc(t.id)}" ${t.id === sel ? 'selected' : ''}>${esc(t.title)}</option>`).join('');
    return `
      <div class="cms-tools"><span></span><button class="btn btn-sm" data-act="add-flash"><i class="fa-solid fa-bolt"></i> New flash sale</button></div>
      ${list.length ? `<div class="cms-list">${list.map((f, i) => {
        const t = trip(f.trip) || {}, st = flashState(f), now = Math.round((t.price || 0) * (1 - (f.pct || 0) / 100));
        return `<div class="cms-row" data-i="${i}">
          <img class="cms-row-img" src="${esc(t.img || '')}" alt="">
          <div class="cms-row-main">
            <div class="cms-2">
              <label class="cms-field"><span>Package</span><select data-ff="trip">${opts(f.trip)}</select></label>
              <label class="cms-field"><span>Label</span><input data-ff="label" value="${esc(f.label || 'Flash sale')}" maxlength="24"></label>
            </div>
            <div class="cms-3">
              <label class="cms-field"><span>Discount %</span><input type="number" min="1" max="89" data-ff="pct" value="${f.pct || ''}"></label>
              <label class="cms-field"><span>Starts (Nairobi time)</span><input type="datetime-local" data-ff="starts" value="${localVal(f.starts)}"></label>
              <label class="cms-field"><span>Ends (Nairobi time)</span><input type="datetime-local" data-ff="ends" value="${localVal(f.ends)}"></label>
            </div>
          </div>
          <div class="cms-row-side">
            <span class="pill ${st === 'live' ? 'confirmed' : st === 'ended' ? 'cancelled' : 'pending'}">${st}</span>
            <div class="cms-price"><s>${usd(t.price)}</s><b>${usd(now)}</b></div>
            <button class="adm-btn danger" data-act="del-flash" title="Remove"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`; }).join('')}</div>`
      : `<div class="adm-empty"><i class="fa-solid fa-bolt"></i><p>No flash sales yet. Create one to show a discount badge and countdown on a package.</p></div>`}`;
  }

  /* ---------- Last-minute deals ---------- */
  const lm = () => (draft.lastMinute = draft.lastMinute || clone(base.lastMinute));
  const lmList = () => draft.lastMinute || base.lastMinute;
  const toIso = s => { const d = new Date(s + ' 12:00 UTC'); return isNaN(d) ? '' : d.toISOString().slice(0, 10); };
  const fromIso = v => { const d = new Date(v + 'T12:00:00Z'); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  function lastminute(){
    const list = lmList();
    return `
      <div class="cms-tools"><span></span><button class="btn btn-sm" data-act="add-lm"><i class="fa-solid fa-plus"></i> Add deal</button></div>
      ${list.length ? `<div class="cms-list">${list.map((t, i) => `
        <div class="cms-row" data-i="${i}">
          <button class="cms-thumb big" data-act="lm-img" title="Change photo"><img src="${esc(t.img)}" alt=""><i class="fa-solid fa-camera"></i></button>
          <div class="cms-row-main">
            <div class="cms-2">
              <label class="cms-field"><span>Title</span><input data-lf="title" value="${esc(t.title)}" maxlength="120"></label>
              <label class="cms-field"><span>Country</span><input data-lf="countries" value="${esc(t.countries)}" maxlength="60"></label>
            </div>
            <div class="cms-5">
              <label class="cms-field"><span>Departs</span><input type="date" data-lf="departs" value="${toIso(t.departs)}"></label>
              <label class="cms-field"><span>Days</span><input type="number" min="1" data-lf="days" value="${t.days}"></label>
              <label class="cms-field"><span>Seats left</span><input type="number" min="0" data-lf="spaces" value="${t.spaces}"></label>
              <label class="cms-field"><span>Price $</span><input type="number" min="1" data-lf="price" value="${t.price}"></label>
              <label class="cms-field"><span>Was $</span><input type="number" min="0" data-lf="was" value="${t.was || ''}"></label>
            </div>
          </div>
          <div class="cms-row-side"><button class="adm-btn danger" data-act="del-lm" title="Remove"><i class="fa-solid fa-trash"></i></button></div>
        </div>`).join('')}</div>`
      : `<div class="adm-empty"><i class="fa-solid fa-hourglass-half"></i><p>No last-minute deals.</p></div>`}`;
  }

  /* ---------- Flights ---------- */
  const fl = () => (draft.flights = draft.flights || clone(base.flights));
  const flList = () => draft.flights || base.flights;
  function flights(){
    const q = ctx.query();
    const ap = base.airports;
    const opt = sel => Object.entries(ap).map(([c, n]) => `<option value="${c}" ${c === sel ? 'selected' : ''}>${esc(n)} (${c})</option>`).join('');
    const rows = flList().map((f, i) => ({ f, i })).filter(({ f }) => !q || (f.from + f.to + ap[f.from] + ap[f.to]).toLowerCase().includes(q));
    return `
      <div class="cms-tools"><span></span><button class="btn btn-sm" data-act="add-fl"><i class="fa-solid fa-plus"></i> Add route</button></div>
      <p class="cms-hint"><i class="fa-solid fa-circle-info"></i> <b>From fare</b> is the one-way economy price the flight search starts from. Leave it blank to use an automatic estimate.</p>
      <div class="table-wrap"><table class="adm-table cms-table">
        <thead><tr><th>From</th><th>To</th><th>Flight time</th><th>Stops</th><th>Type</th><th>From fare $</th><th></th></tr></thead>
        <tbody>${rows.map(({ f, i }) => `<tr data-i="${i}">
          <td data-l="From"><select data-flf="from">${opt(f.from)}</select></td>
          <td data-l="To"><select data-flf="to">${opt(f.to)}</select></td>
          <td data-l="Flight time"><input class="cms-num" data-flf="time" value="${esc(f.time)}" placeholder="8h 40m" pattern="\\d{1,2}h( \\d{1,2}m)?"></td>
          <td data-l="Stops"><select data-flf="stops"><option value="0" ${!f.stops ? 'selected' : ''}>Direct</option><option value="1" ${f.stops ? 'selected' : ''}>1 stop</option></select></td>
          <td data-l="Type"><select data-flf="region"><option value="europe" ${f.region === 'europe' ? 'selected' : ''}>From Europe</option><option value="regional" ${f.region !== 'europe' ? 'selected' : ''}>Within East Africa</option></select></td>
          <td data-l="From fare $"><input class="cms-num" type="number" min="20" data-flf="fare" value="${f.fare || ''}" placeholder="auto"></td>
          <td><button class="adm-btn danger" data-act="del-fl" title="Remove"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`).join('')}</tbody></table></div>`;
  }

  /* ---------- One set of listeners for every content page ---------- */
  function onChange(e){
    if(!VIEWS[view] || !el.contains(e.target)) return;
    const i = e.target, row = i.closest('[data-id],[data-i]');
    if(i.dataset.f){
      const id = row.dataset.id;
      if(i.dataset.f === 'shown') setTrip(id, 'hidden', !i.checked);
      else if(i.dataset.f === 'featured') setTrip(id, 'featured', i.checked);
      else if(i.value !== '' || i.dataset.f === 'was') setTrip(id, i.dataset.f, +i.value || 0);
      if(e.type === 'change') draw();
    }
    if(i.dataset.ff){
      const f = draft.flash[+row.dataset.i], k = i.dataset.ff;
      f[k] = k === 'pct' ? +i.value : (k === 'starts' || k === 'ends') ? fromLocal(i.value) : i.value;
      touch(); if(e.type === 'change') draw();
    }
    if(i.dataset.lf){
      const t = lm()[+row.dataset.i], k = i.dataset.lf;
      t[k] = k === 'departs' ? (i.value ? fromIso(i.value) : t[k]) : ['days','spaces','price','was'].includes(k) ? +i.value : i.value;
      touch();
    }
    if(i.dataset.flf){
      const f = fl()[+row.dataset.i], k = i.dataset.flf;
      f[k] = k === 'stops' ? +i.value : k === 'fare' ? (+i.value || undefined) : i.value;
      touch();
    }
  }
  document.addEventListener('input', onChange);
  document.addEventListener('change', onChange);

  document.addEventListener('click', async e => {
    if(!VIEWS[view] || !el || !el.contains(e.target)) return;
    const pf = e.target.closest('[data-pf]');
    if(pf){ pkgFilter = pf.dataset.pf; return draw(); }
    const a = e.target.closest('[data-act]'); if(!a) return;
    const row = a.closest('[data-id],[data-i]');
    const act = a.dataset.act;
    if(act === 'edit') editTrip(row.dataset.id);
    if(act === 'add-trip') editTrip(null);
    if(act === 'img'){ const id = row.dataset.id; const p = await pickImage(trip(id).img); if(p){ setTrip(id, 'img', p); draw(); } }
    if(act === 'add-flash'){
      const first = allTrips().find(t => !t.hidden);
      const ends = new Date(Date.now() + 7 * 86400000);
      (draft.flash = draft.flash || []).unshift({ trip:first.id, pct:15, label:'Flash sale', starts:'', ends: localVal(ends.toISOString()).slice(0, 10) + 'T23:59:00' + NAIROBI });
      touch(); draw();
    }
    if(act === 'del-flash'){ draft.flash.splice(+row.dataset.i, 1); touch(); draw(); }
    if(act === 'add-lm'){
      const d = new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10);
      lm().unshift({ id:'lm-' + Date.now().toString(36), title:'New last-minute deal', countries:'Kenya', days:3, extra:'', extraIcon:'fa-star', departs:fromIso(d), spaces:4, price:500, was:600, img:'images/lion-walking.jpg', alt:'' });
      touch(); draw();
    }
    if(act === 'del-lm' && confirm('Remove this deal?')){ lm().splice(+row.dataset.i, 1); touch(); draw(); }
    if(act === 'lm-img'){ const t = lm()[+row.dataset.i]; const p = await pickImage(t.img); if(p){ t.img = p; t.alt = t.alt || t.title; touch(); draw(); } }
    if(act === 'add-fl'){ fl().unshift({ from:'CDG', to:'NBO', time:'8h 30m', stops:0, region:'europe' }); touch(); draw(); }
    if(act === 'del-fl'){ fl().splice(+row.dataset.i, 1); touch(); draw(); }
  });

  /* ---------- Drawer (shares admin.html's detail panel) ---------- */
  function drawer(html){
    document.getElementById('drawerBody').innerHTML = html;
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerBg').classList.add('open');
    document.getElementById('drawer').setAttribute('aria-hidden', 'false');
  }
  function closeDrawer(){
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawerBg').classList.remove('open');
    document.getElementById('drawer').setAttribute('aria-hidden', 'true');
  }

  /* ---------- Photo picker: the image library + upload ---------- */
  function pickImage(current){
    return new Promise(resolve => {
      const m = document.createElement('div');
      m.className = 'cms-modal';
      const grid = () => [...images].sort((a, b) => (b.includes('/uploads/') - a.includes('/uploads/'))).map(p =>
        `<button class="${p === current ? 'on' : ''}" data-p="${esc(p)}"><img src="${esc(p)}" alt="" loading="lazy"></button>`).join('');
      m.innerHTML = `<div class="cms-modal-box">
        <header><h3>Choose a photo</h3><button class="adm-drawer-x" data-x aria-label="Close"><i class="fa-solid fa-xmark"></i></button></header>
        <label class="cms-upload"><i class="fa-solid fa-cloud-arrow-up"></i> <span>Upload a new photo</span><small>JPG, PNG or WebP. Large photos are resized for the web.</small><input type="file" accept="image/jpeg,image/png,image/webp" hidden></label>
        <div class="cms-lib">${grid()}</div>
      </div>`;
      document.body.appendChild(m);
      const done = v => { m.remove(); resolve(v); };
      m.addEventListener('click', e => {
        if(e.target === m || e.target.closest('[data-x]')) return done(null);
        const b = e.target.closest('[data-p]'); if(b) done(b.dataset.p);
      });
      m.querySelector('input[type=file]').addEventListener('change', async e => {
        const file = e.target.files[0]; if(!file) return;
        const label = m.querySelector('.cms-upload span');
        label.textContent = 'Uploading…';
        try{
          const data = await shrink(file);
          const r = await ctx.api('upload', { method:'POST', body:JSON.stringify({ name:file.name, data }) });
          images.unshift(r.path);
          ctx.toast('Photo uploaded');
          done(r.path);
        }catch(err){ label.textContent = 'Upload a new photo'; ctx.toast(err.message, true); }
      });
    });
  }
  // Resize to at most 1600px wide and save as JPEG, so pages stay fast
  function shrink(file){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1600 / img.width);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('That file could not be read as an image.'));
      img.src = URL.createObjectURL(file);
    });
  }

  return { VIEWS, render, isDirty: () => dirty, reset(){ base = null; loading = null; dirty = false; } };
})();
