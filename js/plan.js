/* =========================================================
   SafariNomad: customise your own package (plan.html)
   ---------------------------------------------------------
   The visitor builds a route from PLACES, sets nights per stop,
   picks experiences, month, travellers and comfort level, and
   sees a live price estimate. "Send" saves it as a "Custom trip"
   enquiry (shown in admin.html); without the server it opens
   the visitor's email app instead.

   Links that pre-fill the builder:
     plan.html?trip=classic-kenya      start from a ready-made trip
     plan.html?place=Serengeti,Zanzibar start with these places

   ► Prices: the per-day rate for each comfort level is the median
     of our own trips at that level (see RATE below), so the estimate
     follows any price change made in data.js or the admin dashboard.
     Edit the extras, seasons and add-ons in PLAN_RULES.
   ========================================================= */

(function(){
  const { $, $$ } = SN;
  const form = $('#planForm');
  if(!form) return;

  const PLAN_RULES = {
    maxStops: 8,
    nights: { default:2, beach:3, climb:6 },              // suggested nights when a place is added
    privateUplift: 0.25,                                   // private vehicle & guide vs sharing
    season: { 7:1.1, 8:1.1, 9:1.1, 10:1.1, 12:1.1, 4:0.85, 5:0.85, 3:0.95, 11:0.95 },   // missing months = 1
    range: [0.9, 1.15],                                    // estimate shown as a range around the middle
    permits: { uganda:800, rwanda:1500 }                   // gorilla permit per person (see KNOWLEDGE in data.js)
  };

  const EXPERIENCES = [
    { key:'game',      label:'Big Five game drives',   icon:'fa-binoculars' },
    { key:'migration', label:'Great Migration',        icon:'fa-water' },
    { key:'gorilla',   label:'Gorilla trekking',       icon:'fa-tree', style:'gorilla' },
    { key:'chimps',    label:'Chimp tracking',         icon:'fa-leaf', style:'gorilla' },
    { key:'balloon',   label:'Hot-air balloon',        icon:'fa-cloud-sun' },
    { key:'walking',   label:'Walking safari',         icon:'fa-person-hiking' },
    { key:'culture',   label:'Local culture',          icon:'fa-people-group' },
    { key:'beach',     label:'Beach days',             icon:'fa-umbrella-beach', style:'beach' },
    { key:'climb',     label:'Climb Kilimanjaro',      icon:'fa-mountain', style:'trek' },
    { key:'birds',     label:'Birdwatching',           icon:'fa-dove' },
    { key:'photo',     label:'Photography',            icon:'fa-camera' },
    { key:'kids',      label:'Kid-friendly',           icon:'fa-children', style:'family' }
  ];
  const OCCASIONS = ['Honeymoon', 'Family holiday', 'Anniversary or birthday', 'Solo trip', 'Friends', 'Just because'];
  const LEVELS = [
    { key:'budget',  label:'Budget camping',     sign:'$',   text:'Dome tents at park campsites, camp cook, shared showers', match:t => t.styles.includes('camping') },
    { key:'comfort', label:'Comfortable lodges', sign:'$$',  text:'En-suite rooms, a restaurant, often a pool and park views', match:t => !t.styles.some(s => ['camping', 'luxury', 'gorilla', 'trek'].includes(s)) },
    { key:'luxury',  label:'Luxury camps',       sign:'$$$', text:'Small, exclusive camps with private decks and fine dining', match:t => t.styles.includes('luxury') && !t.styles.includes('gorilla') }
  ];
  const VEHICLES = [['shared', 'Small group, shared vehicle'], ['private', 'Private 4x4 & guide']];

  // Per-day rate for each level: the median of our own trips' price ÷ days
  const median = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };
  const RATE = Object.fromEntries(LEVELS.map(l => [l.key, Math.round(median(TRIPS.filter(l.match).map(t => t.price / t.days))) || 300]));

  // Each place, with the trips that visit it and whether it's a beach or a climb
  const PLACE_LIST = PLACES.map(p => {
    const re = new RegExp(p.match, 'i');
    const trips = TRIPS.filter(t => re.test(`${t.title} ${t.route || ''}`));
    const kind = /Zanzibar|Diani|Lamu|Watamu|Victoria/i.test(p.name) ? 'beach' : /Kilimanjaro|Mount Kenya|Meru|Rwenzori/i.test(p.name) ? 'climb' : 'default';
    return { ...p, re, trips:trips.length, kind };
  }).sort((a, b) => b.trips - a.trips);
  const placeByName = n => PLACE_LIST.find(p => p.name === n);

  /* ---------- State (saved as a draft in this browser, so a reload doesn't lose it) ---------- */
  const blank = () => ({ route:[], unsure:false, exp:[], month:'', adults:2, children:0, occasion:'', level:'comfort', vehicle:'shared' });
  let state = Object.assign(blank(), SN.store.get('planDraft') || {});
  state.route = (state.route || []).filter(s => placeByName(s.name));
  const save = () => SN.store.set('planDraft', state);
  let country = '';

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

  /* ---------- Arriving from a trip or a place link ---------- */
  const notice = $('#plNotice');
  const tripId = SN.params.get('trip'), fromTrip = tripId && TRIPS.find(t => t.id === tripId);
  if(fromTrip){
    const stops = PLACE_LIST.filter(p => p.re.test(fromTrip.route || fromTrip.title))
      .sort((a, b) => (fromTrip.route || '').search(a.re) - (fromTrip.route || '').search(b.re)).slice(0, PLAN_RULES.maxStops);
    if(stops.length){
      const per = Math.max(1, Math.round((fromTrip.days - 1) / stops.length));
      state = Object.assign(blank(), { route: stops.map(p => ({ name:p.name, nights:per })), exp: EXPERIENCES.filter(e => e.style && fromTrip.styles.includes(e.style)).map(e => e.key),
        level: fromTrip.styles.includes('luxury') ? 'luxury' : fromTrip.styles.includes('camping') ? 'budget' : 'comfort' });
    }
    notice.hidden = false;
    notice.innerHTML = `<i class="fa-solid fa-route"></i> Starting from <b>${esc(fromTrip.title)}</b>. Change anything you like.`;
  }
  const placeParam = SN.params.get('place');
  if(placeParam && !fromTrip){
    placeParam.split(',').map(n => PLACE_LIST.find(p => p.name.toLowerCase() === n.trim().toLowerCase())).filter(Boolean)
      .forEach(p => { if(!state.route.some(s => s.name === p.name)) state.route.push({ name:p.name, nights:PLAN_RULES.nights[p.kind] }); });
  }

  /* ---------- 1. Places ---------- */
  const COUNTRIES = [['', 'All'], ...['kenya', 'tanzania', 'uganda', 'rwanda'].map(c => [c, COUNTRY_NAMES[c]])];
  function renderCountries(){
    $('#plCountries').innerHTML = COUNTRIES.map(([k, n]) => `<button type="button" role="tab" aria-selected="${k === country}" class="tab${k === country ? ' active' : ''}" data-country="${k}">${n}</button>`).join('');
  }
  $('#plCountries').addEventListener('click', e => { const b = e.target.closest('[data-country]'); if(b){ country = b.dataset.country; renderCountries(); renderPlaces(); } });

  function renderPlaces(){
    $('#plPlaces').innerHTML = PLACE_LIST.filter(p => !country || p.country === country).map(p => {
      const on = state.route.some(s => s.name === p.name);
      return `<button type="button" class="pl-place${on ? ' on' : ''}" data-place="${esc(p.name)}" aria-pressed="${on}">
        <img src="${p.img}" alt="" loading="lazy">
        <span class="pl-place-body"><b>${esc(p.name)}</b><small>${COUNTRY_NAMES[p.country]}${p.trips ? ` · ${p.trips} trip${p.trips === 1 ? '' : 's'}` : ''}</small></span>
        <i class="fa-solid ${on ? 'fa-check' : 'fa-plus'} pl-place-tick" aria-hidden="true"></i>
      </button>`;
    }).join('');
  }
  $('#plPlaces').addEventListener('click', e => { const b = e.target.closest('[data-place]'); if(b) togglePlace(b.dataset.place); });

  function togglePlace(name){
    const i = state.route.findIndex(s => s.name === name);
    if(i >= 0) state.route.splice(i, 1);
    else if(state.route.length >= PLAN_RULES.maxStops){ SN.toast(`Up to ${PLAN_RULES.maxStops} stops. Tell us about more in the notes.`); return; }
    else { state.route.push({ name, nights:PLAN_RULES.nights[placeByName(name).kind] }); state.unsure = false; }
    update();
  }
  $('#plUnsure').addEventListener('change', e => { state.unsure = e.target.checked; update(); });

  /* ---------- 2. Route ---------- */
  function renderRoute(){
    const list = $('#plRoute');
    $('#plRouteHint').hidden = state.route.length > 0;
    list.innerHTML = state.route.map((s, i) => {
      const p = placeByName(s.name);
      return `<li class="pl-stop" data-i="${i}">
        <span class="pl-stop-n">${i + 1}</span>
        <img src="${p.img}" alt="" loading="lazy">
        <span class="pl-stop-name"><b>${esc(s.name)}</b><small>${COUNTRY_NAMES[p.country]}</small></span>
        <span class="pl-stepper small" aria-label="Nights in ${esc(s.name)}"><button type="button" data-act="less" aria-label="One night fewer"${s.nights <= 1 ? ' disabled' : ''}><i class="fa-solid fa-minus"></i></button><output>${s.nights}</output><button type="button" data-act="more" aria-label="One night more"${s.nights >= 14 ? ' disabled' : ''}><i class="fa-solid fa-plus"></i></button></span>
        <span class="pl-stop-nights">night${s.nights === 1 ? '' : 's'}</span>
        <span class="pl-stop-move">
          <button type="button" data-act="up" aria-label="Move earlier"${i === 0 ? ' disabled' : ''}><i class="fa-solid fa-arrow-up"></i></button>
          <button type="button" data-act="down" aria-label="Move later"${i === state.route.length - 1 ? ' disabled' : ''}><i class="fa-solid fa-arrow-down"></i></button>
          <button type="button" data-act="remove" aria-label="Remove ${esc(s.name)}"><i class="fa-solid fa-xmark"></i></button>
        </span>
      </li>`;
    }).join('') + (state.route.length ? `<li class="pl-route-total">${nights()} nights · ${nights() + 1} days</li>` : '');
  }
  $('#plRoute').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if(!b) return;
    const i = +b.closest('.pl-stop').dataset.i, r = state.route;
    ({ less:() => r[i].nights--, more:() => r[i].nights++, remove:() => r.splice(i, 1),
       up:() => r.splice(i - 1, 0, r.splice(i, 1)[0]), down:() => r.splice(i + 1, 0, r.splice(i, 1)[0]) })[b.dataset.act]();
    update();
  });
  const nights = () => state.route.reduce((n, s) => n + s.nights, 0);

  /* ---------- 3. Experiences + smart tips ---------- */
  function renderExperiences(){
    $('#plExperiences').innerHTML = EXPERIENCES.map(x => {
      const on = state.exp.includes(x.key);
      return `<button type="button" class="pl-chip${on ? ' on' : ''}" data-exp="${x.key}" aria-pressed="${on}"><i class="fa-solid ${x.icon}" aria-hidden="true"></i> ${x.label}</button>`;
    }).join('');
  }
  $('#plExperiences').addEventListener('click', e => {
    const b = e.target.closest('[data-exp]'); if(!b) return;
    const k = b.dataset.exp, i = state.exp.indexOf(k);
    i >= 0 ? state.exp.splice(i, 1) : state.exp.push(k);
    update();
  });

  // Helpful nudges when a wish doesn't match the route yet (one click adds the place)
  function renderTips(){
    const has = re => state.route.some(s => re.test(s.name));
    const add = names => names.filter(n => placeByName(n) && !state.route.some(s => s.name === n))
      .map(n => `<button type="button" class="pl-tip-add" data-add="${esc(n)}"><i class="fa-solid fa-plus"></i> ${esc(n)}</button>`).join('');
    const tips = [];
    if((state.exp.includes('gorilla') || state.exp.includes('chimps')) && !state.route.some(s => ['uganda', 'rwanda'].includes(placeByName(s.name).country)))
      tips.push(['fa-tree', 'Gorillas and chimps live in the forests of Uganda and Rwanda.', add(['Bwindi', 'Volcanoes', 'Kibale'])]);
    if(state.exp.includes('beach') && !has(/Zanzibar|Diani|Lamu|Watamu/))
      tips.push(['fa-umbrella-beach', 'End on the coast with a few beach days.', add(['Zanzibar', 'Diani & Watamu'])]);
    if(state.exp.includes('climb') && !has(/Kilimanjaro|Mount Kenya|Meru/))
      tips.push(['fa-mountain', 'Kilimanjaro takes 6 to 8 nights on the mountain.', add(['Kilimanjaro'])]);
    if(state.exp.includes('migration')){
      const m = state.month ? +state.month.split('-')[1] : 0;
      const where = !m ? null : m >= 7 && m <= 10 ? ['the Maasai Mara', ['Maasai Mara', 'Serengeti']] : (m === 12 || m <= 3) ? ['the southern Serengeti (calving season)', ['Serengeti', 'Ngorongoro Crater']] : ['the central and western Serengeti', ['Serengeti']];
      tips.push(['fa-water', where ? `In ${MONTH_NAMES[m - 1]} the herds are usually in ${where[0]}.` : 'The herds move all year: pick a month and we\'ll show where they are.', where ? add(where[1]) : '']);
    }
    $('#plTips').innerHTML = tips.map(([i, t, btns]) => `<div class="pl-tip"><i class="fa-solid ${i}" aria-hidden="true"></i><span>${t}</span>${btns ? `<span class="pl-tip-btns">${btns}</span>` : ''}</div>`).join('');
  }
  $('#plTips').addEventListener('click', e => { const b = e.target.closest('[data-add]'); if(b) togglePlace(b.dataset.add); });

  /* ---------- 4. Month (the next 12 months, or flexible) ---------- */
  function renderMonths(){
    const now = new Date(), opts = [['', 'Flexible']];
    for(let i = 0; i < 12; i++){
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1), m = d.getMonth() + 1;
      opts.push([`${d.getFullYear()}-${String(m).padStart(2, '0')}`, `${MONTH_NAMES[m - 1]}<small>${d.getFullYear()}</small>`, (PLAN_RULES.season[m] || 1) > 1 ? 'peak' : (PLAN_RULES.season[m] || 1) < 1 ? 'value' : '']);
    }
    $('#plMonths').innerHTML = opts.map(([v, l, tag]) => `<button type="button" class="pl-month${state.month === v ? ' on' : ''}${tag ? ' ' + tag : ''}" data-month="${v}" aria-pressed="${state.month === v}">${l}${tag === 'peak' ? '<em>Peak</em>' : tag === 'value' ? '<em>Best value</em>' : ''}</button>`).join('');
  }
  $('#plMonths').addEventListener('click', e => { const b = e.target.closest('[data-month]'); if(b){ state.month = b.dataset.month; update(); } });

  /* ---------- 5. Travellers + occasion ---------- */
  function renderPax(){
    $$('.pl-pax .pl-stepper').forEach(s => {
      const k = s.dataset.pax, min = k === 'adults' ? 1 : 0;
      $('output', s).textContent = state[k];
      $('[data-step="-1"]', s).disabled = state[k] <= min;
      $('[data-step="1"]', s).disabled = state[k] >= 20;
    });
    $('#plOccasion').innerHTML = OCCASIONS.map(o => `<button type="button" class="pl-chip${state.occasion === o ? ' on' : ''}" data-occ="${o}" aria-pressed="${state.occasion === o}">${o}</button>`).join('');
  }
  $$('.pl-pax .pl-stepper button').forEach(b => b.addEventListener('click', () => { const k = b.closest('.pl-stepper').dataset.pax; state[k] += +b.dataset.step; update(); }));
  $('#plOccasion').addEventListener('click', e => { const b = e.target.closest('[data-occ]'); if(b){ state.occasion = state.occasion === b.dataset.occ ? '' : b.dataset.occ; update(); } });

  /* ---------- 6. Comfort + vehicle ---------- */
  function renderComfort(){
    $('#plLevels').innerHTML = LEVELS.map(l => `<button type="button" class="pl-level${state.level === l.key ? ' on' : ''}" data-level="${l.key}" aria-pressed="${state.level === l.key}">
      <span class="pl-level-sign" translate="no">${l.sign}</span><b>${l.label}</b><small>${l.text}</small><span class="pl-level-rate">about <b data-usd="${RATE[l.key]}"></b> a day</span></button>`).join('');
    $('#plVehicle').innerHTML = VEHICLES.map(([k, l]) => `<button type="button" class="${state.vehicle === k ? 'on' : ''}" data-vehicle="${k}" aria-pressed="${state.vehicle === k}">${l}</button>`).join('');
  }
  $('#plLevels').addEventListener('click', e => { const b = e.target.closest('[data-level]'); if(b){ state.level = b.dataset.level; update(); } });
  $('#plVehicle').addEventListener('click', e => { const b = e.target.closest('[data-vehicle]'); if(b){ state.vehicle = b.dataset.vehicle; update(); } });

  /* ---------- Estimate ---------- */
  function estimate(){
    const n = nights();
    if(!n) return null;
    const m = state.month ? +state.month.split('-')[1] : 0;
    let pp = RATE[state.level] * (n + 1) * (PLAN_RULES.season[m] || 1) * (state.vehicle === 'private' ? 1 + PLAN_RULES.privateUplift : 1);
    const extras = [];
    if(state.exp.includes('gorilla')){
      const inRwanda = state.route.some(s => placeByName(s.name).country === 'rwanda');
      const inUganda = state.route.some(s => placeByName(s.name).country === 'uganda');
      const permit = inUganda || !inRwanda ? PLAN_RULES.permits.uganda : PLAN_RULES.permits.rwanda;
      pp += permit;
      extras.push(`Gorilla permit included (<b data-usd="${permit}"></b>)`);
    }
    if(state.exp.includes('balloon')) extras.push('Balloon flight priced in your quote');
    const round = v => Math.round(v / 50) * 50;
    const low = round(pp * PLAN_RULES.range[0]), high = round(pp * PLAN_RULES.range[1]);
    const people = state.adults + state.children * BOOKING.childRate;
    return { low, high, totalLow: round(low * people), totalHigh: round(high * people), extras };
  }

  /* ---------- Summary ---------- */
  function renderSummary(){
    const e = estimate(), n = nights();
    $('#sumRoute').innerHTML = state.route.length ? state.route.map(s => `<span>${esc(s.name)}</span>`).join('<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>')
      : state.unsure ? 'Our planners will suggest a route' : 'No places yet';
    const level = LEVELS.find(l => l.key === state.level);
    const rows = [
      ['Length', n ? `${n} nights · ${n + 1} days` : '–'],
      ['When', state.month ? `${MONTH_NAMES[+state.month.split('-')[1] - 1]} ${state.month.split('-')[0]}` : 'Flexible'],
      ['Travellers', `${state.adults} adult${state.adults > 1 ? 's' : ''}${state.children ? `, ${state.children} child${state.children > 1 ? 'ren' : ''}` : ''}`],
      ['Style', `${level.label}, ${state.vehicle === 'private' ? 'private guide' : 'small group'}`]
    ];
    if(state.exp.length) rows.push(['Wishes', state.exp.map(k => EXPERIENCES.find(x => x.key === k).label).join(', ')]);
    $('#sumList').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
    const price = e ? `<b data-usd="${e.low}"></b>–<b data-usd="${e.high}"></b>` : '–';
    $('#sumPrice').innerHTML = price;
    $('#barPrice').innerHTML = price;
    $('#sumTotal').innerHTML = e ? [`<span><b data-usd="${e.totalLow}"></b>–<b data-usd="${e.totalHigh}"></b> for your group</span>`, ...e.extras.map(x => `<span>${x}</span>`)].join('')
      : state.unsure ? 'We\'ll price the route we suggest' : 'Add places to see a price';
    $('#plBar').classList.toggle('show', !!e);
  }

  /* ---------- Ready-made trips that match (an easy alternative) ---------- */
  function renderSimilar(){
    const styles = EXPERIENCES.filter(x => x.style && state.exp.includes(x.key)).map(x => x.style);
    const n = nights() + 1;
    const scored = TRIPS.map(t => {
      const text = `${t.title} ${t.route || ''}`;
      let s = state.route.reduce((a, r) => a + (placeByName(r.name).re.test(text) ? 2 : 0), 0) + styles.filter(x => t.styles.includes(x)).length;
      if(s && n > 1) s -= Math.abs(t.days - n) / 5;
      return [t, s];
    }).filter(([, s]) => s > 1).sort((a, b) => b[1] - a[1]).slice(0, 3);
    $('#plSimilar').hidden = !scored.length;
    $('#plSimilarList').innerHTML = scored.map(([t]) => `<a class="pl-sim" href="book.html?trip=${t.id}">
      <img src="${t.img}" alt="" loading="lazy"><span><b>${esc(t.title)}</b><small>${t.days} days · from <b data-usd="${t.price}"></b></small></span></a>`).join('');
  }

  /* ---------- Draw everything ---------- */
  function update(){
    $('#plUnsure').checked = state.unsure;
    renderPlaces(); renderRoute(); renderExperiences(); renderTips(); renderMonths(); renderPax(); renderComfort(); renderSummary(); renderSimilar();
    SN.refresh();          // fills in every data-usd price in the chosen currency
    save();
    saveProgress();
  }

  /* ---------- Follow-up: once there's an email or phone, the team can see this trip in admin
     ("Unfinished") and help if the traveller leaves before sending it ---------- */
  const lead = SN.lead('custom', 'plan');
  function saveProgress(){
    const d = Object.fromEntries(new FormData(form).entries());
    const n = nights(), level = LEVELS.find(l => l.key === state.level);
    lead.save({
      step: !state.route.length && !state.unsure ? 'Choosing places' : !(d.name || '').trim() || !SN.emailOk((d.email || '').trim()) ? 'Building the trip' : 'Filled in, not sent',
      resume: state.route.length ? `plan.html?place=${encodeURIComponent(state.route.map(r => r.name).join(','))}` : 'plan.html',
      fields: {
        Name: d.name, Email: (d.email || '').trim(), Phone: d.phone, 'Reply by': d.reply,
        Route: state.route.map(r => `${r.name} (${r.nights}n)`).join(' → ') || (state.unsure ? 'Wants a suggested route' : ''),
        Length: n ? `${n} nights` : '', 'Travel month': state.month || 'Flexible',
        Travellers: `${state.adults} adults, ${state.children} children`, Comfort: level ? level.label : '',
        Wishes: state.exp.map(k => (EXPERIENCES.find(x => x.key === k) || {}).label).filter(Boolean).join(', '), Notes: d.notes
      }
    });
  }
  form.addEventListener('input', () => saveProgress());
  renderCountries();
  update();

  /* ---------- Send ---------- */
  const status = $('#plStatus');
  const setStatus = (msg, err) => { status.textContent = msg; status.classList.add('show'); status.classList.toggle('error', !!err); };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    if(!state.route.length && !state.unsure){ setStatus('Add at least one place, or tick "Suggest a route for me".', true); $('#stepWhere').scrollIntoView({ behavior:'smooth' }); return; }
    if(!d.name.trim() || !d.email.trim()){ setStatus('Please add your name and email so we can send your quote.', true); return; }
    if(!SN.emailOk(d.email.trim())){ setStatus('Please enter a valid email address.', true); return; }

    const est = estimate(), level = LEVELS.find(l => l.key === state.level);
    const route = state.route.length ? state.route.map((s, i) => `${i + 1}. ${s.name} (${COUNTRY_NAMES[placeByName(s.name).country]}): ${s.nights} night${s.nights > 1 ? 's' : ''}`).join('\n') : 'Please suggest a route';
    const fields = {
      Name: d.name, Email: d.email, Phone: d.phone, 'Reply by': d.reply,
      Route: route,
      Length: nights() ? `${nights()} nights / ${nights() + 1} days` : 'To suggest',
      'Travel month': state.month || 'Flexible',
      Travellers: `${state.adults} adult${state.adults > 1 ? 's' : ''}${state.children ? `, ${state.children} child${state.children > 1 ? 'ren' : ''} (age 5–15)` : ''}`,
      Occasion: state.occasion,
      Comfort: level.label,
      Vehicle: VEHICLES.find(v => v[0] === state.vehicle)[1],
      Experiences: state.exp.map(k => EXPERIENCES.find(x => x.key === k).label).join(', '),
      'Estimate shown': est ? `$${est.low.toLocaleString('en-US')}–$${est.high.toLocaleString('en-US')} per person (USD)` : '',
      'Started from': fromTrip ? fromTrip.title : '',
      Message: `Custom trip: ${state.route.map(s => s.name).join(' → ') || 'route to suggest'}${d.notes ? `\n\n${d.notes}` : ''}`
    };
    const btn = $('.pl-send'); btn.disabled = true;
    try{
      await SN.sendEnquiry('Custom trip', fields, { draft: lead.draft });
      lead.done();
      setStatus('Thank you! Your trip is with our planners. Your tailored quote arrives within 24 hours.');
      SN.store.set('planDraft', null);
      form.reset();
    }catch(err){
      if(err.message !== 'offline' && err.message !== 'failed' && !/fetch/i.test(err.message)){ setStatus(err.message, true); btn.disabled = false; return; }
      const body = Object.entries(fields).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
      location.href = `mailto:${SITE.email}?subject=${encodeURIComponent('Custom trip quote')}&body=${encodeURIComponent(body)}`;
      setStatus('Your email app is opening with your trip. Just hit send and we\'ll reply within 24 hours.');
    }
    btn.disabled = false;
  });
})();
