/* =========================================================
   SafariNomad: shared behaviour (loaded on every page)
   ---------------------------------------------------------
   Menus, drawer, currency, language, saved trips (hearts),
   toast messages, newsletter forms, carousels and the
   trip-card templates used by the home, trips and deals pages.

   Page scripts use the helpers through the global  SN  object.
   ========================================================= */

const SN = (function(){
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const store = {
    get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } },
    set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  };
  const params = new URLSearchParams(location.search);

  /* ---------- Month lists (<select data-months>): the next 18 months, shown in the page language.
     The value stays in English (e.g. "March 2027") so the team reads it the same way. ---------- */
  document.querySelectorAll('select[data-months]').forEach(sel => {
    const now = new Date(), lang = document.documentElement.lang || 'en';
    for(let i = 0; i < 18; i++){
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const o = document.createElement('option');
      o.value = d.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
      try { o.textContent = d.toLocaleString(lang, { month: 'long', year: 'numeric' }); } catch { o.textContent = o.value; }
      sel.appendChild(o);
    }
  });

  /* ---------- Airport picker: country first, then its airports (data in js/data.js) ----------
     airportPicker(countrySelect, airportSelect, { other }) fills both and keeps them in step.
     The visitor's country is guessed from the browser language (en-US → United States), else UK. */
  function airportPicker(countrySel, airportSel, opts = {}){
    if(typeof AIRPORT_COUNTRIES === 'undefined' || !countrySel || !airportSel) return null;
    const EA = ['KE', 'TZ', 'UG', 'RW'];
    const o = c => `<option value="${c.code}">${c.name}</option>`;
    countrySel.innerHTML = `<optgroup label="Flying in from">${AIRPORT_COUNTRIES.filter(c => !EA.includes(c.code)).map(o).join('')}</optgroup>`
      + `<optgroup label="Already in East Africa">${AIRPORT_COUNTRIES.filter(c => EA.includes(c.code)).map(o).join('')}</optgroup>`;
    const country = () => AIRPORT_COUNTRIES.find(c => c.code === countrySel.value) || AIRPORT_COUNTRIES[0];
    const fill = () => {
      airportSel.innerHTML = Object.entries(country().airports).map(([k, v]) => `<option value="${k}">${v} (${k})</option>`).join('')
        + (opts.other ? '<option value="">Other airport / not sure</option>' : '');
    };
    const region = (navigator.languages || [navigator.language || '']).map(l => (l.split('-')[1] || '').toUpperCase()).find(r => AIRPORT_COUNTRIES.some(c => c.code === r));
    const langGuess = { nl:'NL', es:'ES', de:'DE', fr:'FR', it:'IT', pt:'PT' }[(navigator.language || '').slice(0, 2)];
    countrySel.value = opts.country || region || langGuess || 'GB';
    fill();
    countrySel.addEventListener('change', () => { fill(); airportSel.dispatchEvent(new Event('change', { bubbles:true })); });
    return {
      // Select an airport by code (its country comes with it)
      set(code){
        const c = AIRPORT_COUNTRIES.find(x => x.airports[code]);
        if(!c) return false;
        countrySel.value = c.code; fill(); airportSel.value = code; return true;
      },
      country,
      // e.g. "Amsterdam Schiphol (AMS), Netherlands", or just the country when the airport is "Other"
      label: () => airportSel.value ? `${country().airports[airportSel.value]} (${airportSel.value}), ${country().name}` : `${country().name} (airport not decided)`
    };
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg){
    const t = $('#toast');
    if(!t) return;
    $('#toastMsg').textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
  }

  /* ---------- Header shadow on scroll ---------- */
  const header = $('#siteHeader');
  if(header) window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 10), {passive:true});

  /* ---------- Mobile drawer ---------- */
  const drawer = $('#drawer'), drawerBg = $('#drawerBg'), burger = $('#burger');
  function setDrawer(open){
    if(!drawer) return;
    drawer.classList.toggle('open', open);
    drawerBg.classList.toggle('open', open);
    document.body.classList.toggle('no-scroll', open);
    burger.setAttribute('aria-expanded', open);
  }
  if(drawer){
    burger.addEventListener('click', () => setDrawer(true));
    $('#drawerClose').addEventListener('click', () => setDrawer(false));
    drawerBg.addEventListener('click', () => setDrawer(false));
    $$('#drawer a, #drawer [data-open-search]').forEach(a => a.addEventListener('click', () => setDrawer(false)));
  }
  document.addEventListener('keydown', e => { if(e.key === 'Escape') setDrawer(false); });
  // Close hover menus after a click so they don't stay open through focus
  $$('.menu-bar .drop a, .util-menu button').forEach(a => a.addEventListener('click', () => a.blur()));

  /* ---------- Currency ---------- */
  // Prices are stored in USD and shown in US dollars or euros
  const RATES = { USD:{r:1,s:'$'}, EUR:{r:0.92,s:'€'} };
  let currency = RATES[store.get('currency')] ? store.get('currency') : 'USD';   // older visits may have saved GBP/KES
  function money(usd){
    const c = RATES[currency];
    const v = Math.round(usd * c.r);
    return c.s + v.toLocaleString('en-US');
  }
  function applyCurrency(){
    $$('[data-usd]').forEach(el => el.textContent = money(+el.dataset.usd));
    $$('[data-save]').forEach(el => el.textContent = 'You save ' + money(+el.dataset.save));
    const label = $('#curLabel');
    if(label) label.textContent = currency + ' ' + RATES[currency].s;
    $$('button[data-currency]').forEach(b => b.classList.toggle('active', b.dataset.currency === currency));
  }
  $$('button[data-currency]').forEach(b => b.addEventListener('click', () => {
    currency = b.dataset.currency; store.set('currency', currency); applyCurrency();
    document.dispatchEvent(new CustomEvent('currencychange'));
  }));

  /* ---------- Saved trips (heart buttons) ---------- */
  const wish = new Set(store.get('wishlist') || []);
  function renderWish(){
    $$('.wish').forEach(btn => {
      const on = wish.has(btn.dataset.id);
      btn.classList.toggle('on', on);
      btn.innerHTML = on ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
      btn.setAttribute('aria-pressed', on);
    });
    const c = $('#wishCount');
    if(c) c.textContent = wish.size;
    const tc = $('#tabWishCount');
    if(tc) tc.textContent = wish.size || '';
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest('.wish');
    if(!btn) return;
    e.preventDefault();
    const id = btn.dataset.id;
    if(wish.has(id)){ wish.delete(id); toast('Removed from your saved trips'); }
    else { wish.add(id); toast('Saved! Find it under the heart icon'); }
    store.set('wishlist', [...wish]);
    renderWish();
    document.dispatchEvent(new CustomEvent('wishchange'));
  });

  /* ---------- Newsletter forms (any form.news-form) ---------- */
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  document.addEventListener('submit', e => {
    const f = e.target.closest('.news-form');
    if(!f) return;
    e.preventDefault();
    const input = f.querySelector('input[type=email]');
    if(!emailOk(input.value.trim())){ toast('Please enter a valid email address'); return; }
    sendEnquiry('Newsletter / brochure', { Email: input.value.trim() }).catch(() => {});
    f.reset(); toast('Thanks! Your 2027 brochure is on its way.');
  });

  /* ---------- Save a form on the server (admin dashboard) ----------
     Resolves true when saved; rejects when the server isn't available
     (for example when the site is opened straight from the folder). */
  async function sendEnquiry(type, fields, extra){
    if(!/^https?:/.test(location.protocol)) throw new Error('offline');
    const r = await fetch('/api/enquiries', { method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(Object.assign({ type, fields, page: location.pathname.split('/').pop() || 'index.html' }, extra)) });
    if(!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'failed');
    return true;
  }

  /* ---------- Anonymous visit counts (admin → Insights) ----------
     One small request per page view: the page, the package opened, what was browsed
     (country / style / place from the link), where the visit came from (another site's
     domain), and the time zone and language. Nothing that identifies a person; the server
     only keeps daily totals. Not sent from the admin page or when opened from a file. */
  function track(t, extra){
    if(!/^https?:/.test(location.protocol) || !navigator.sendBeacon) return;
    try{ navigator.sendBeacon('/api/track', new Blob([JSON.stringify(Object.assign({ t }, extra))], { type:'application/json' })); }catch(e){}
  }
  (function(){
    const page = location.pathname.split('/').pop() || 'index.html';
    if(page === 'admin.html') return;
    let s = false;                                    // first page of this tab's visit = one session
    try{ if(!sessionStorage.getItem('sn-s')){ sessionStorage.setItem('sn-s', '1'); s = true; } }catch(e){}
    let ref = '';
    try{ const r = document.referrer && new URL(document.referrer); if(r && r.host !== location.host) ref = r.host.replace(/^www\./, ''); }catch(e){}
    const interests = [
      params.get('country') && 'country:' + params.get('country'),
      ...(params.get('style') || '').split(',').filter(Boolean).map(x => 'style:' + x),
      page === 'trips.html' && params.get('q') && 'place:' + params.get('q')
    ].filter(Boolean);
    let tz = '';
    try{ tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; }catch(e){}
    track('view', { page, trip: page === 'book.html' ? (params.get('trip') || '') : '', interests, s, ref, tz, lang: navigator.language || '' });
  })();

  /* ---------- Follow-up leads (booking and customise forms) ----------
     lead('booking', 'book') gives { draft, save(data), done() }.
     save() sends what the visitor has filled in so far, 2 s after they stop typing,
     and again when the tab is hidden or closed. The server keeps it only once there
     is an email or phone, so the team can follow up if they leave midway.
     data = { step, resume (link to continue), fields:{ Name, Email, Phone, … } } */
  function lead(source, key){
    const storeKey = 'draft-' + key;
    let draft = store.get(storeKey);
    if(!draft){ draft = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 12); store.set(storeKey, draft); }
    const online = /^https?:/.test(location.protocol);
    let pending = null, timer = 0, lastSent = '', finished = false;
    function flush(beacon){
      clearTimeout(timer);
      if(!pending || !online || finished) return;
      const body = JSON.stringify(Object.assign({ draft, source, page: location.pathname.split('/').pop() }, pending));
      if(body === lastSent) return;
      lastSent = body;
      if(beacon && navigator.sendBeacon) navigator.sendBeacon('/api/leads', new Blob([body], { type:'application/json' }));
      else fetch('/api/leads', { method:'POST', headers:{ 'Content-Type':'application/json' }, body, keepalive:true }).catch(() => {});
    }
    window.addEventListener('pagehide', () => flush(true));
    document.addEventListener('visibilitychange', () => { if(document.hidden) flush(true); });
    return {
      draft,
      save(data){ pending = data; clearTimeout(timer); timer = setTimeout(flush, 2000); },
      done(){ finished = true; pending = null; clearTimeout(timer); store.set(storeKey, null); }
    };
  }

  // Remember the email typed on this device, so forms can offer it with one tap
  document.addEventListener('change', e => {
    if(e.target.matches && e.target.matches('input[type=email]') && emailOk(e.target.value.trim())) store.set('myEmail', e.target.value.trim());
  });

  /* ---------- Carousels (buttons with data-car="carouselId") ---------- */
  function updateCarNav(){
    $$('.car-btn').forEach(b => {
      const c = document.getElementById(b.dataset.car);
      if(!c) return;
      const max = c.scrollWidth - c.clientWidth - 2;
      b.disabled = b.dataset.dir === '-1' ? c.scrollLeft <= 2 : c.scrollLeft >= max;
    });
  }
  $$('.car-btn').forEach(b => b.addEventListener('click', () => {
    const c = document.getElementById(b.dataset.car);
    c.scrollBy({left: +b.dataset.dir * c.clientWidth * 0.9, behavior:'smooth'});
  }));
  $$('.carousel').forEach(c => c.addEventListener('scroll', updateCarNav, {passive:true}));
  window.addEventListener('resize', updateCarNav);

  /* ---------- "Chat with an expert" launcher ---------- */
  const chat = $('#chat');
  if(chat){
    const launcher = $('#chatLauncher');
    const setChat = open => {
      chat.classList.toggle('open', open);
      launcher.setAttribute('aria-expanded', open);
    };
    launcher.addEventListener('click', () => setChat(!chat.classList.contains('open')));
    $$('[data-open-chat]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setChat(!chat.classList.contains('open')); }));
    $('#chatClose').addEventListener('click', () => setChat(false));
    document.addEventListener('click', e => { if(e.target.isConnected && !chat.contains(e.target)) setChat(false); });
    document.addEventListener('keydown', e => { if(e.key === 'Escape') setChat(false); });

    // Online / away, based on office hours in Nairobi (UTC+3)
    const now = new Date(Date.now() + 3 * 36e5);
    const day = now.getUTCDay(), hour = now.getUTCHours();
    const hrs = SITE.hours || { open:8, close:18, days:[1,2,3,4,5,6] };
    const online = hrs.days.includes(day) && hour >= hrs.open && hour < hrs.close;
    const status = $('#chatStatus');
    status.classList.toggle('away', !online);
    $('span', status).textContent = online ? 'Online now · replies in minutes' : 'Away · we will reply first thing tomorrow';
    chat.classList.toggle('is-away', !online);
  }

  /* ---------- Card templates ----------
     YouTube-style cards: rounded thumbnail with a length badge,
     a 2-line title, grey info lines, then price and button. */
  const wishBtn = id => `<button class="wish" data-id="${id}" aria-label="Save trip"><i class="fa-regular fa-heart"></i></button>`;
  /* Package card, YouTube style: one big photo, the whole card is one link, and under the photo a round
     icon for the kind of trip (where YouTube shows the channel), the title, where it goes and the price. */
  const TRIP_ICON = { wildlife:'fa-paw', gorilla:'fa-leaf', beach:'fa-umbrella-beach', trek:'fa-mountain-sun', camping:'fa-campground',
    family:'fa-children', luxury:'fa-gem', adventure:'fa-person-hiking', abroad:'fa-plane' };
  const tripIcon = t => TRIP_ICON[(t.styles || [])[0]] || 'fa-compass';
  function cardShell(c){
    return `
    <article class="trip-card"${c.country ? ` data-country="${c.country}"` : ''}>
      <a class="trip-link" href="${c.link}" aria-label="${String(c.label).replace(/"/g, '&quot;')}"></a>
      <div class="trip-img"><img src="${c.img}" alt="${c.alt}" loading="lazy"><span class="dur">${c.days} days</span>${c.chip || ''}</div>
      ${c.id ? wishBtn(c.id) : ''}
      <div class="trip-meta">
        <span class="trip-icon" aria-hidden="true"><i class="fa-solid ${c.icon}"></i></span>
        <div class="trip-text">
          <h3>${c.title}</h3>
          <p class="trip-where">${c.where}</p>
          <p class="trip-price">${c.price}</p>
          ${c.extra || ''}
        </div>
      </div>
    </article>`;
  }
  function tripCard(t, deal){
    const off = deal === true && t.was > t.price && !t.flash ? Math.round((1 - t.price / t.was) * 100) : 0;   // deals: show the saving
    const chip = t.flash ? `<span class="chip flash"><i class="fa-solid fa-bolt"></i> −${t.flash.pct}%</span>` : off ? `<span class="chip flash">−${off}%</span>` : t.badge ? `<span class="tc-label${t.badgeType ? ' ' + t.badgeType : ''}">${t.badge}</span>` : '';
    return cardShell({
      link:'tour-' + t.id, label:`${t.title}, ${t.days} days`, img:t.img, alt:t.alt, days:t.days, chip, id:t.id, icon:tripIcon(t), country:t.country,
      title:t.title, where:t.countries,
      price:`From <span class="price-now" data-usd="${t.price}"></span>${t.flash || off ? ` <span class="price-was" data-usd="${t.was}"></span>` : ' per person'}`,
      extra: t.flash && t.flash.ends ? `<p class="flash-ends"><i class="fa-regular fa-clock"></i> Sale ends ${new Date(t.flash.ends).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</p>` : ''
    });
  }
  function lastMinuteCard(t){
    return cardShell({
      link:'book.html?trip=' + t.id, label:`${t.title}, departs ${t.departs}`, img:t.img, alt:t.alt, days:t.days, id:t.id, icon:'fa-hourglass-half',
      title:t.title, where:`${t.countries} · departs ${t.departs}`,
      price:`<span class="price-now" data-usd="${t.price}"></span> <span class="price-was" data-usd="${t.was}"></span>`
    });
  }

  /* ---------- Package & place rows (home and destinations pages) ----------
       <div data-pack-country="kenya">   trips in a country
       <div data-pack-style="gorilla">   trips of a travel style
       <div data-pack-maxdays="4">       short trips
       <div data-pack-land="lakes">       trips in a landscape (see LANDSCAPES in data.js)
       (attributes combine: data-pack-country="uganda" data-pack-land="rivers")
       <div data-country-lands="uganda"> one scrolling row per landscape that country has
       <div data-places="kenya">         places in a country ("" = most popular anywhere)
     A .carousel row gets up to 12 trips; a grid gets 3. */
  const tripsAt = p => { const re = new RegExp(p.match); return TRIPS.filter(t => re.test(t.title + ' ' + t.route)); };
  function placeCard(p){
    const trips = tripsAt(p);
    const from = Math.min(...trips.map(t => t.price));
    return `
    <a class="place-card" href="trips.html?q=${encodeURIComponent(p.name)}">
      <img src="${p.img}" alt="${p.name}" loading="lazy">
      <div class="pc-body"><h3>${p.name}</h3><span>${trips.length} ${trips.length === 1 ? 'trip' : 'trips'} · from <b data-usd="${from}"></b></span></div>
    </a>`;
  }
  // Landscapes (savannah, lakes, coast…) from js/data.js; also used by trips.js
  const LANDS = typeof LANDSCAPES !== 'undefined' ? LANDSCAPES : [];
  const inLand = (t, key) => { const l = LANDS.find(x => x.key === key); return !!l && new RegExp(l.match).test(t.title + ' ' + t.route); };
  const pick = ({ packCountry:c, packStyle:s, packMaxdays:d, packLand:l }) => TRIPS.filter(t =>
      (!c || t.country === c) && (!s || t.styles.includes(s)) && (!d || t.days <= +d) && (!l || inLand(t, l)))
    .sort((a, b) => !!b.featured - !!a.featured);

  // Homepage: one tile per landscape, linking to those trips

  // Destinations page: a row per landscape the country has
  $$('[data-country-lands]').forEach(el => {
    const c = el.dataset.countryLands;
    // Rows in main-first order: parks (and gorilla forests), then beaches, lakes, mountains, rivers
    const ROW = { savannah:0, forests:0, coast:1, lakes:2, mountains:3, rivers:4 };
    const ranked = typeof TripRank !== 'undefined' ? TripRank.order(TRIPS.filter(t => t.country === c)) : [];
    const firstAt = l => { const i = ranked.findIndex(t => inLand(t, l.key) && TripRank.group(t) === ROW[l.key]); return i < 0 ? 999 : i; };
    const rows = LANDS.slice().sort((a, b) => (ROW[a.key] ?? 9) - (ROW[b.key] ?? 9) || firstAt(a) - firstAt(b));
    el.innerHTML = rows.map(l => {
      const n = pick({ packCountry:c, packLand:l.key }).length;
      if(!n) return '';
      const id = `land-${c}-${l.key}`;
      return `
      <div class="row-label"><h3><i class="fa-solid ${l.icon}"></i> ${l.label} <small>(${n})</small></h3>
        <div class="car-nav"><button class="car-btn" data-car="${id}" data-dir="-1" aria-label="Previous trips"><i class="fa-solid fa-arrow-left"></i></button><button class="car-btn" data-car="${id}" data-dir="1" aria-label="Next trips"><i class="fa-solid fa-arrow-right"></i></button></div></div>
      <div class="carousel" id="${id}" data-pack-country="${c}" data-pack-land="${l.key}"></div>`;
    }).join('');
  });
  $$('[data-pack-country],[data-pack-style],[data-pack-maxdays],[data-pack-land]').forEach(el => {
    const n = el.classList.contains('carousel') ? 12 : 3, found = pick(el.dataset);
    // A country row: main first, and a landscape row starts with trips that are mainly about that landscape
    // (Naivasha before a Mara safari that passes a lake)
    const ROWG = { savannah:0, forests:0, coast:1, lakes:2, mountains:3, rivers:4 }, g = ROWG[el.dataset.packLand];
    const own = t => g === undefined || TripRank.group(t) === g ? 0 : 1;
    const list = el.dataset.packCountry && typeof TripRank !== 'undefined' ? TripRank.order(found).sort((a, b) => own(a) - own(b)).slice(0, n)
      : typeof TripMix !== 'undefined' ? TripMix.pick(found, n) : found.slice(0, n);
    el.innerHTML = list.map(tripCard).join('');
  });
  if(typeof PLACES !== 'undefined') $$('[data-places]').forEach(el => {
    const c = el.dataset.places;
    const list = PLACES.filter(p => !c || p.country === c && tripsAt(p).length)
      .sort((a, b) => tripsAt(b).length - tripsAt(a).length).slice(0, c ? 10 : 14);
    el.innerHTML = list.map(placeCard).join('');
  });

  /* Call after injecting cards so prices, hearts and arrows update */
  function refresh(){ applyCurrency(); renderWish(); updateCarNav(); }

  /* ---------- Language (the translating is done by js/i18n.js) ---------- */
  function showLanguage(code){
    const label = $('#langLabel');
    if(label) label.textContent = code.toUpperCase();
    $$('button[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === code));
  }
  $$('button[data-lang]').forEach(b => b.addEventListener('click', () => SNI18N.setLang(b.dataset.lang)));
  document.addEventListener('langchange', e => showLanguage(e.detail.lang));

  /* ---------- Start ---------- */
  document.addEventListener('DOMContentLoaded', () => { refresh(); showLanguage(SNI18N.lang); });

  return { $, $$, store, params, toast, money, emailOk, tripCard, lastMinuteCard, refresh, wish, updateCarNav, sendEnquiry, lead, track, LANDS, inLand, airportPicker };
})();
