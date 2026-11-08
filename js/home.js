/* =========================================================
   SafariNomad: home page
   Featured-trips carousel, last-minute cards, search widget,
   live trip counts and the "When should you go?" planner.
   ========================================================= */

(function(){
  const { $, $$ } = SN;

  /* ---------- Which trips are in "Flash deals" (worked out first, so no trip shows twice) ----------
     Admin flash sales first, then last-minute departures, then any other trip on sale. */
  const flashTrips = TRIPS.filter(t => t.flash).slice(0, 3);
  const lmDeals = LAST_MINUTE.slice(0, 3 - flashTrips.length);
  const saleTrips = TRIPS.filter(t => !t.flash && t.was > t.price).slice(0, 3 - flashTrips.length - lmDeals.length);
  const dealIds = new Set([...flashTrips, ...saleTrips].map(t => t.id));

  /* ---------- Packages: the first section, a grid with travel-style tabs ----------
     "Top picks" = trips marked featured; a style tab shows that style's best-rated trips.
     Each tab shows how many packages it has; tabs with none are hidden. */
  const pkgGrid = $('#tripGrid');
  const SHOW = 9;
  const loved = t => (t.rating || 0) * Math.log10((t.reviews || 0) + 10);
  const ofStyle = style => style ? TRIPS.filter(t => t.styles.includes(style)) : TRIPS;
  const fromPrice = list => list.length ? Math.min(...list.map(t => t.price)) : 0;
  $$('[data-pkg-total]').forEach(el => { el.textContent = TRIPS.length; });
  $$('#tripTabs .tab').forEach(t => {
    const n = ofStyle(t.dataset.style).length;
    if(!n){ t.hidden = true; return; }
    if(t.dataset.style) t.insertAdjacentHTML('beforeend', ` <span class="tab-n">${n}</span>`);
  });
  function renderFeatured(style){
    const all = ofStyle(style);
    let list = all.filter(t => !dealIds.has(t.id) && (style || t.featured))
      .sort((a, b) => style ? loved(b) - loved(a) : 0).slice(0, SHOW);
    // Top picks: fill any gap with the next best-rated packages, so the grid has full rows
    if(!style && list.length < SHOW) list = list.concat(all.filter(t => !dealIds.has(t.id) && !list.includes(t)).sort((a, b) => loved(b) - loved(a)).slice(0, SHOW - list.length));
    pkgGrid.innerHTML = list.map(t => SN.tripCard(t)).join('');
    $('#emptyState').classList.toggle('show', list.length === 0);
    $$('#tripTabs .tab').forEach(t => { const on = t.dataset.style === style; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
    const url = style ? `trips.html?style=${style}` : 'trips.html';
    const name = style ? STYLE_NAMES[style].toLowerCase() : '';
    $('#tripsAll').href = url;
    $('#tripsAllBtn').href = url;
    $('#tripsAllBtn').textContent = `See all ${all.length} ${name ? name + ' ' : ''}packages`;
    $('#pkgSub').innerHTML = `${all.length} package${all.length === 1 ? '' : 's'}${name ? ` · ${STYLE_NAMES[style]}` : ''} · from <b data-usd="${fromPrice(all)}"></b> per person`;
    SN.refresh();
  }
  $$('#tripTabs .tab').forEach(t => t.addEventListener('click', () => renderFeatured(t.dataset.style)));
  renderFeatured('');

  /* ---------- Hero: six rotating themes (Wildlife, Beaches, Hikes & camping, Flights, Stays, Cars) ----------
     Each theme (.hero-slide) has one photo; the next theme cross-fades in every
     6 seconds with its own
     headline, line and button (data-title / data-lead / data-cta / data-href).
     Labelled tabs jump to a theme; the pause button stops it (remembered).
     Reduced motion: no auto-advance. Photos load just before they are shown. */
  const slides = $$('.hero-slide');
  if(slides.length){
    const tabs = $('#heroThemes'), place = $('#heroPlace span'), pauseBtn = $('#heroPause'), text = $('#heroText');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const STEP = 6000;                                   // ms per theme (one photo each)
    const photos = slides.map(s => $$('img', s));
    let cur = 0, pic = 0, timer = 0, paused = reduce || !!SN.store.get('heroPaused');
    const load = img => { if(img && img.dataset.src){ img.srcset = img.dataset.srcset; img.src = img.dataset.src; delete img.dataset.src; } };
    // The photo after (t, p): next in the same theme, or the first photo of the next theme
    const after = (t, p) => p + 1 < photos[t].length ? [t, p + 1] : [(t + 1) % slides.length, 0];
    tabs.innerHTML = slides.map((s, i) => `<button type="button" role="tab" aria-selected="${i === 0}"${i === 0 ? ' class="on"' : ''}><i class="fa-solid ${s.dataset.icon}" aria-hidden="true"></i> ${s.dataset.theme}</button>`).join('');
    const setText = s => {
      $('#heroTitle').innerHTML = s.dataset.title;
      $('#heroLead').textContent = s.dataset.lead;
      const cta = $('#heroCta');
      cta.href = s.dataset.href;
      cta.innerHTML = `<span>${s.dataset.cta.replace('{n}', `<b>${TRIPS.length}</b>`)}</span> <i class="fa-solid ${s.dataset.ctaIcon}"></i>`;
    };
    const show = (t, p) => {
      const [nt, np] = after(t, p);
      load(photos[t][p]); load(photos[nt][np]);           // this photo and the one after it
      photos[cur][pic].classList.remove('on');
      photos[t][p].classList.add('on');
      if(t !== cur){
        slides[cur].classList.remove('on');
        slides[t].classList.add('on');
        $$('button', tabs).forEach((d, k) => { d.classList.toggle('on', k === t); d.setAttribute('aria-selected', k === t); });
        // Phones: the tags are one swipeable row, so slide it to keep the active tag in view (never scrolls the page)
        if(tabs.scrollWidth > tabs.clientWidth) tabs.scrollTo({ left: Math.max(0, tabs.children[t].offsetLeft - 16), behavior: reduce ? 'auto' : 'smooth' });
        // Fade the words out, swap them, fade back in
        text.classList.add('swap');
        setTimeout(() => { setText(slides[t]); text.classList.remove('swap'); }, reduce ? 0 : 220);
      }
      cur = t; pic = p;
      place.textContent = photos[t][p].dataset.place || '';
    };
    const next = () => show(...after(cur, pic));
    const setBtn = () => {
      pauseBtn.innerHTML = paused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
      pauseBtn.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
      $('.hero').classList.toggle('is-paused', paused);
    };
    const start = () => { clearInterval(timer); if(!paused) timer = setInterval(next, STEP); };
    tabs.addEventListener('click', e => { const b = e.target.closest('button'); if(b){ show([...tabs.children].indexOf(b), 0); start(); } });
    pauseBtn.addEventListener('click', () => { paused = !paused; SN.store.set('heroPaused', paused); setBtn(); start(); });
    document.addEventListener('visibilitychange', () => { if(document.hidden) clearInterval(timer); else start(); });
    load(photos[0][1]); place.textContent = photos[0][0].dataset.place || ''; setBtn(); start();
  }

  /* ---------- Trust strip: worked out from the trips' own ratings ---------- */
  const reviews = TRIPS.reduce((n, t) => n + (t.reviews || 0), 0);
  const rating = reviews ? TRIPS.reduce((n, t) => n + (t.rating || 0) * (t.reviews || 0), 0) / reviews : 0;
  $$('[data-trust="rating"]').forEach(el => { el.textContent = rating.toFixed(1) + '/5'; });
  $$('[data-trust="reviews"]').forEach(el => { el.textContent = (Math.floor(reviews / 100) * 100).toLocaleString('en-US') + '+'; });

  /* ---------- Pick up where you left off (trips opened on the booking page) ---------- */
  const recentIds = SN.store.get('recentTrips') || [];
  const recent = recentIds.map(id => TRIPS.find(t => t.id === id)).filter(Boolean).slice(0, 8);
  if(recent.length){
    $('#recentRow').innerHTML = recent.map(t => SN.tripCard(t)).join('');
    $('#recentSec').hidden = false;
  }

  /* ---------- Flash deals: admin flash sales first, then last-minute departures ---------- */
  const lastMinute = $('#lastMinuteGrid');
  if(lastMinute){
    const flash = flashTrips, lm = lmDeals, sale = saleTrips;
    lastMinute.innerHTML = [...flash, ...sale].map(t => SN.tripCard(t, true)).join('') + lm.map(SN.lastMinuteCard).join('');
    // Countdown to the soonest-ending flash sale
    const ends = flash.map(t => t.flash.ends && new Date(t.flash.ends).getTime()).filter(x => x > Date.now()).sort((a, b) => a - b)[0];
    const clock = $('#dealClock');
    if(ends && clock){
      const pad = n => String(n).padStart(2, '0');
      const tick = () => {
        const ms = ends - Date.now();
        if(ms <= 0){ clock.hidden = true; return clearInterval(timer); }
        const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, sec = Math.floor(ms / 1e3) % 60;
        clock.innerHTML = `<i class="fa-regular fa-clock"></i> ${SNI18N.t('Ends in')} <b translate="no">${d ? d + 'd ' : ''}${pad(h)}:${pad(m)}:${pad(sec)}</b>`;
      };
      clock.hidden = false; tick();
      const timer = setInterval(tick, 1000);
    }
  }

  /* ---------- "Get flash deals first": slides in once after 25 s or 60% scroll ---------- */
  const pop = $('#dealPop');
  const popSeen = SN.store.get('dealPop');
  if(pop && !(popSeen && Date.now() - popSeen < 14 * 864e5)){
    let shown = false;
    const show = () => { if(shown) return; shown = true; pop.hidden = false; requestAnimationFrame(() => pop.classList.add('show')); };
    const hide = () => { pop.classList.remove('show'); SN.store.set('dealPop', Date.now()); setTimeout(() => { pop.hidden = true; }, 300); };
    setTimeout(show, 25000);
    window.addEventListener('scroll', () => { if(window.scrollY > (document.body.scrollHeight - innerHeight) * 0.6) show(); }, { passive:true });
    $('#dealPopX').addEventListener('click', hide);
    $('#dealPopForm').addEventListener('submit', async e => {
      e.preventDefault();
      const email = $('#dealPopEmail').value.trim(), msg = $('#dealPopMsg');
      if(!SN.emailOk(email)){ msg.textContent = SNI18N.t('Please enter a valid email address.'); return; }
      try{ await SN.sendEnquiry('Flash deal alerts', { Email: email }); }
      catch(err){ if(err.message !== 'offline'){ msg.textContent = SNI18N.t('Something went wrong. Please try again.'); return; } }
      msg.textContent = SNI18N.t("You're on the list!");
      setTimeout(hide, 1600);
    });
  }

  /* ---------- Live counts on destination tiles & ways cards ---------- */
  $$('[data-count-country]').forEach(el => {
    const list = TRIPS.filter(t => t.country === el.dataset.countCountry);
    const from = Math.min(...list.map(t => t.price));
    el.innerHTML = `${list.length} trip${list.length === 1 ? '' : 's'}` + (list.length ? ` · from <b data-usd="${from}"></b>` : '');
  });
  $$('[data-count-style]').forEach(el => {
    const n = TRIPS.filter(t => t.styles.includes(el.dataset.countStyle)).length;
    el.textContent = `${n} trip${n === 1 ? '' : 's'}`;
  });

  /* ---------- Search widget ---------- */
  const fields = $$('.search-field');
  const closeFields = except => fields.forEach(f => {
    if(f !== except){ f.classList.remove('open'); $('.sf-btn', f).setAttribute('aria-expanded', false); }
  });
  fields.forEach(f => {
    const btn = $('.sf-btn', f);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = !f.classList.contains('open');
      closeFields(f);
      f.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
    });
    $('.sf-drop', f).addEventListener('click', e => e.stopPropagation());
  });
  document.addEventListener('click', () => closeFields());
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeFields(); });

  const search = { country:'', len:'', months:[] };
  const valueEl = { country:'#destVal', len:'#lenVal' };
  $$('.sf-opt[data-set]').forEach(opt => opt.addEventListener('click', () => {
    const key = opt.dataset.set;
    search[key] = opt.dataset.value;
    $$(`.sf-opt[data-set="${key}"]`).forEach(o => o.classList.toggle('selected', o === opt));
    $(valueEl[key]).textContent = opt.dataset.label;
    closeFields();
  }));

  // How many trips fit each duration
  $$('[data-len-count]').forEach(el => {
    const n = TRIPS.filter(t => DURATIONS[el.dataset.lenCount].fits(t.days)).length;
    el.textContent = n ? `${n} trip${n === 1 ? '' : 's'}` : 'Tailor-made';
  });

  // Travellers stepper
  const pax = { adults:2, children:0, rooms:1 };
  const paxMin = { adults:1, children:0, rooms:1 };
  function renderPax(){
    $$('.stepper').forEach(s => {
      const k = s.dataset.pax;
      $('output', s).textContent = pax[k];
      $('[data-step="-1"]', s).disabled = pax[k] <= paxMin[k];
      $('[data-step="1"]', s).disabled = pax[k] >= 12;
    });
    let t = `${pax.adults} adult${pax.adults > 1 ? 's' : ''}`;
    if(pax.children) t += `, ${pax.children} child${pax.children > 1 ? 'ren' : ''}`;
    $('#paxVal').textContent = t;
  }
  $$('.stepper button').forEach(b => b.addEventListener('click', () => {
    const k = b.closest('.stepper').dataset.pax;
    pax[k] = Math.max(paxMin[k], Math.min(12, pax[k] + +b.dataset.step));
    renderPax();
  }));
  renderPax();

  // "When?": pick a year, then one or more months
  const grid = $('#monthGrid'), yearsEl = $('#monthYears');
  const now = new Date(), thisYear = now.getFullYear();
  let year = thisYear;
  const picked = new Set();                                   // "2026-12"
  const key = (y, m) => `${y}-${m}`;
  function drawMonths(){
    yearsEl.innerHTML = [thisYear, thisYear + 1].map(y => `<button type="button" class="${y === year ? 'on' : ''}" data-year="${y}">${y}</button>`).join('');
    grid.innerHTML = MONTH_NAMES.map((name, i) => {
      const m = i + 1, past = year === thisYear && m < now.getMonth() + 1;
      return `<button type="button" class="mg-month${picked.has(key(year, m)) ? ' selected' : ''}" data-month="${m}" ${past ? 'disabled' : ''}>${name}</button>`;
    }).join('');
  }
  yearsEl.addEventListener('click', e => { const b = e.target.closest('[data-year]'); if(b){ year = +b.dataset.year; drawMonths(); } });
  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-month]'); if(!b) return;
    const k = key(year, b.dataset.month);
    picked.has(k) ? picked.delete(k) : picked.add(k);
    search.months = [...new Set([...picked].map(x => +x.split('-')[1]))];
    drawMonths(); renderWhen();
  });
  function renderWhen(){
    const list = [...picked].sort((a, b) => { const [ya, ma] = a.split('-').map(Number), [yb, mb] = b.split('-').map(Number); return ya - yb || ma - mb; });
    $('#dateVal').textContent = !list.length ? 'Anytime'
      : list.length <= 2 ? list.map(x => { const [y, m] = x.split('-'); return `${MONTH_NAMES[m - 1]} ${y}`; }).join(', ')
      : `${list.length} months`;
  }
  drawMonths();
  $('#monthAny').addEventListener('click', () => { picked.clear(); search.months = []; drawMonths(); renderWhen(); closeFields(); });
  $('#monthDone').addEventListener('click', () => closeFields());

  // Search → trips page with filters in the URL
  $('#searchBtn').addEventListener('click', () => {
    const q = new URLSearchParams();
    if(search.country) q.set('country', search.country);
    if(search.len) q.set('len', search.len);
    if(search.months.length) q.set('months', search.months.join(','));
    location.href = 'trips.html' + (q.toString() ? '?' + q : '');
  });
})();
