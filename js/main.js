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
  function tripCard(t, deal){
    const link = `book.html?trip=${t.id}`;
    const off = deal === true && t.was > t.price && !t.flash ? Math.round((1 - t.price / t.was) * 100) : 0;   // deals: show the saving
    return `
    <article class="trip-card" data-country="${t.country}" data-style="${t.styles.join(' ')}">
      <a class="trip-img" href="${link}" tabindex="-1">
        <img src="${t.img}" alt="${t.alt}" loading="lazy">
        <span class="dur">${t.days} days</span>
        ${t.flash ? `<span class="chip flash"><i class="fa-solid fa-bolt"></i> −${t.flash.pct}%</span>` : off ? `<span class="chip flash">−${off}%</span>` : t.badge ? `<span class="tc-label${t.badgeType ? ' ' + t.badgeType : ''}">${t.badge}</span>` : ''}
      </a>
      ${wishBtn(t.id)}
      <div class="trip-body">
        <h3><a href="${link}">${t.title}</a></h3>
        <p class="trip-desc">${t.route || t.countries}</p>
        ${t.reviews ? `<p class="tc-rating"><span class="stars" style="--r:${t.rating}" aria-label="Rated ${t.rating} out of 5"></span><b translate="no">${t.rating.toFixed(1)}</b><span>(${t.reviews.toLocaleString('en-US')})</span></p>` : ''}
        ${t.flash && t.flash.ends ? `<p class="flash-ends"><i class="fa-regular fa-clock"></i> Sale ends ${new Date(t.flash.ends).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</p>` : ''}
      </div>
      <div class="trip-foot">
        <div class="trip-price"><small>From</small><span class="price-now" data-usd="${t.price}"></span>${t.flash || off ? `<span class="price-was" data-usd="${t.was}"></span>` : '<small>per person</small>'}</div>
        <a class="btn btn-sm" href="${link}">View dates</a>
      </div>
    </article>`;
  }
  function lastMinuteCard(t){
    const link = `book.html?trip=${t.id}`;
    return `
    <article class="trip-card">
      <a class="trip-img" href="${link}" tabindex="-1">
        <img src="${t.img}" alt="${t.alt}" loading="lazy">
        <span class="dur">${t.days} days</span>
      </a>
      ${wishBtn(t.id)}
      <div class="trip-body">
        <h3><a href="${link}">${t.title}</a></h3>
        <p class="trip-desc">Departs ${t.departs}</p>
      </div>
      <div class="trip-foot">
        <div class="trip-price"><span class="price-now" data-usd="${t.price}"></span><span class="price-was" data-usd="${t.was}"></span></div>
        <a class="btn btn-sm" href="${link}">View dates</a>
      </div>
    </article>`;
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
    .sort((a, b) => b.reviews - a.reviews);

  // Homepage: one tile per landscape, linking to those trips
  $$('[data-lands]').forEach(el => {
    el.innerHTML = LANDS.map(l => `<a class="land-tile" href="trips.html?land=${l.key}"><i class="fa-solid ${l.icon}"></i><b>${l.label}</b><span>${pick({ packLand:l.key }).length} trips</span></a>`).join('');
  });

  // Destinations page: a row per landscape the country has
  $$('[data-country-lands]').forEach(el => {
    const c = el.dataset.countryLands;
    el.innerHTML = LANDS.map(l => {
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
    el.innerHTML = pick(el.dataset).slice(0, el.classList.contains('carousel') ? 12 : 3).map(tripCard).join('');
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

  return { $, $$, store, params, toast, money, emailOk, tripCard, lastMinuteCard, refresh, wish, updateCarNav, sendEnquiry, lead, track, LANDS, inLand };
})();
