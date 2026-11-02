/* =========================================================
   SafariNomad: home page
   Featured-trips carousel, last-minute cards, search widget,
   live trip counts and the "When should you go?" planner.
   ========================================================= */

(function(){
  const { $, $$ } = SN;

  /* ---------- Featured trips + country tabs ---------- */
  const carousel = $('#tripCarousel');
  function renderFeatured(country){
    const list = TRIPS.filter(t => t.featured && (!country || t.country === country));
    carousel.innerHTML = list.map(SN.tripCard).join('');
    $('#emptyState').classList.toggle('show', list.length === 0);
    $$('#tripTabs .tab').forEach(t => t.classList.toggle('active', t.dataset.country === country));
    $('#tripsAll').href = country ? `trips.html?country=${country}` : 'trips.html';
    carousel.scrollLeft = 0;
    SN.refresh();
  }
  $$('#tripTabs .tab').forEach(t => t.addEventListener('click', () => renderFeatured(t.dataset.country)));
  renderFeatured('');

  /* ---------- Hero slideshow ----------
     4K photos that cross-fade every 6 seconds, each with a slow zoom.
     Only the next photo is loaded ahead of time. Dots jump to a photo;
     the pause button stops it (remembered). Reduced motion: no auto-advance. */
  const slides = $$('.hero-slide');
  if(slides.length){
    const dots = $('#heroDots'), place = $('#heroPlace span'), pauseBtn = $('#heroPause');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cur = 0, timer = 0, paused = reduce || !!SN.store.get('heroPaused');
    const load = i => { const img = slides[i].querySelector('img'); if(img.dataset.src){ img.srcset = img.dataset.srcset; img.src = img.dataset.src; delete img.dataset.src; } };
    dots.innerHTML = slides.map((s, i) => `<button type="button" aria-label="${i + 1}: ${s.dataset.place}"${i === 0 ? ' class="on"' : ''}></button>`).join('');
    const show = i => {
      load(i); load((i + 1) % slides.length);
      slides[cur].classList.remove('on');
      cur = i;
      slides[cur].classList.add('on');
      $$('button', dots).forEach((d, k) => d.classList.toggle('on', k === cur));
      place.textContent = slides[cur].dataset.place;
    };
    const next = () => show((cur + 1) % slides.length);
    const setBtn = () => {
      pauseBtn.innerHTML = paused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
      pauseBtn.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
      $('.hero').classList.toggle('is-paused', paused);
    };
    const start = () => { clearInterval(timer); if(!paused) timer = setInterval(next, 6000); };
    dots.addEventListener('click', e => { const b = e.target.closest('button'); if(b){ show([...dots.children].indexOf(b)); start(); } });
    pauseBtn.addEventListener('click', () => { paused = !paused; SN.store.set('heroPaused', paused); setBtn(); start(); });
    document.addEventListener('visibilitychange', () => { if(document.hidden) clearInterval(timer); else start(); });
    load(1); setBtn(); start();
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
    const flash = TRIPS.filter(t => t.flash).slice(0, 3);
    const lm = LAST_MINUTE.slice(0, 3 - flash.length);
    const sale = TRIPS.filter(t => !t.flash && t.was > t.price).slice(0, 3 - flash.length - lm.length);   // fill any gap with other savings
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

  /* ---------- When to go ---------- */
  const WHEN = [
    {m:'Jan', t:'January: calving season begins', d:'Hot, dry and green. Wildebeest gather on the short-grass plains of southern Serengeti (Ndutu) to give birth, and predators follow. A great month for Kenya and gorilla trekking too.', tags:['Ndutu calving','Gorilla trekking','Beach weather'], img:'lion-and-cub'},
    {m:'Feb', t:'February: peak calving', d:'Up to 8,000 calves are born a day in the southern Serengeti, so big-cat action is intense. Dry weather makes this one of the best months for a combined safari and beach trip.', tags:['Predator action','Southern Serengeti','Zanzibar'], img:'lioness'},
    {m:'Mar', t:'March: the quiet shoulder', d:'The last dry weeks before the long rains. Parks are quieter, lodge rates start dropping, and the herds are still in the south.', tags:['Fewer crowds','Value rates'], img:'serengeti-acacia'},
    {m:'Apr', t:'April: Green Season savings', d:'The long rains bring emerald plains, dramatic skies and the lowest prices of the year, with up to 25% off. Showers are usually short afternoon bursts.', tags:['Up to 25% off','Photography','Birding'], img:'zebra'},
    {m:'May', t:'May: lush and uncrowded', d:'Green Season continues and the migration starts moving north-west through the central Serengeti. Ideal for travellers who want a quiet, private feel.', tags:['Private feel','Central Serengeti'], img:'elephants-grassland'},
    {m:'Jun', t:'June: dry season begins', d:'Grass shortens and animals gather around water. The herds reach the Grumeti River in the western Serengeti, and gorilla high season starts in Uganda and Rwanda.', tags:['Grumeti crossings','Gorilla season','Kilimanjaro'], img:'giraffe-sunset', peak:true},
    {m:'Jul', t:'July: the Mara crossings begin', d:'The migration pours into Kenya\'s Maasai Mara and the famous Mara River crossings start. Peak season, so book 9–12 months ahead for the best camps.', tags:['River crossings','Maasai Mara','Book early'], img:'lion-walking', peak:true},
    {m:'Aug', t:'August: the migration at its peak', d:'The most dramatic month for river crossings, with dry weather and superb game viewing across East Africa. Also perfect for gorilla trekking.', tags:['Peak crossings','Family holidays','Gorilla trekking'], img:'lion-and-cub', peak:true},
    {m:'Sep', t:'September: big herds, fewer families', d:'The herds are still in the Mara, the school holidays are over and the weather is dry. Many guides say this is the best month of the year.', tags:['Maasai Mara','Kilimanjaro','Honeymoons'], img:'elephant-savannah', peak:true},
    {m:'Oct', t:'October: great value, great game', d:'The herds begin drifting back south into Tanzania. It\'s shoulder season, with excellent sightings, thinner crowds and better lodge availability.', tags:['Shoulder pricing','Serengeti','Beach'], img:'elephant-amboseli'},
    {m:'Nov', t:'November: the short rains', d:'Brief showers refresh the land and the herds return to the northern Serengeti. Look out for last-minute deals and migratory birds arriving.', tags:['Last-minute deals','Birding'], img:'flamingo'},
    {m:'Dec', t:'December: festive safaris', d:'Green landscapes, newborn animals and warm evenings under the stars. A popular festive escape, often ending on the Kenyan or Zanzibar coast.', tags:['Festive trips','Safari & beach','Families'], img:'coast-resort', peak:true}
  ];
  const monthsEl = $('#months');
  WHEN.forEach((w, i) => {
    const b = document.createElement('button');
    b.className = 'month' + (w.peak ? ' peak' : '');
    b.textContent = w.m; b.type = 'button';
    b.addEventListener('click', () => showMonth(i));
    monthsEl.appendChild(b);
  });
  function showMonth(i){
    const w = WHEN[i];
    $$('.month').forEach((b, j) => b.classList.toggle('active', i === j));
    $('#whenTitle').textContent = w.t;
    $('#whenText').textContent = w.d;
    $('#whenTags').innerHTML = w.tags.map(t => `<span class="chip">${t}</span>`).join('');
    $('#whenImg').src = `images/${w.img}.jpg`;
  }
  showMonth(new Date().getMonth());
})();
