/* =========================================================
   SafariNomad: flight search (flights.html)
   ---------------------------------------------------------
   Works like a flight-comparison site: search form, a strip of
   nearby dates with the lowest fare, sortable and filterable
   results. Schedules and fares are INDICATIVE, worked out from
   FLIGHTS / AIRPORTS in js/data.js; "Select" sends the chosen
   flight to a planner, who confirms live seats and the price.
   To show live fares, connect a flight-data API (Amadeus,
   Duffel, Kiwi…) on the server and replace options() below.
   ========================================================= */

(function(){
  const form = document.getElementById('flightSearch');
  if(!form) return;
  const { $, $$ } = SN;
  const locale = () => ({ fr:'fr-FR', es:'es-ES', de:'de-DE' }[(typeof SNI18N !== 'undefined' && SNI18N.lang) || 'en'] || 'en-GB');

  /* ---------- Airports, airlines, hubs ---------- */
  const EUROPE = ['LHR', 'LGW', 'AMS', 'CDG', 'BRU', 'FRA', 'IST'];
  const TZ = { LHR:0, LGW:0, AMS:1, CDG:1, BRU:1, FRA:1, KGL:2, DXB:4 };      // hours from UTC; others are UTC+3
  const tz = c => TZ[c] ?? 3;
  const HUBS = { DXB:'Dubai', DOH:'Doha', ADD:'Addis Ababa', IST:'Istanbul', NBO:'Nairobi', KGL:'Kigali', AMS:'Amsterdam', EBB:'Entebbe', DAR:'Dar es Salaam' };
  const CARRIERS = {
    KQ:'Kenya Airways', BA:'British Airways', KL:'KLM', AF:'Air France', SN:'Brussels Airlines', WB:'RwandAir', UR:'Uganda Airlines',
    DE:'Condor', TK:'Turkish Airlines', EK:'Emirates', QR:'Qatar Airways', ET:'Ethiopian Airlines', TC:'Air Tanzania', PW:'Precision Air', JM:'Jambojet'
  };
  // Airlines that typically fly a route non-stop (either direction)
  const DIRECT = {
    'LHR-NBO':['KQ','BA'], 'LGW-EBB':['UR'], 'AMS-NBO':['KL','KQ'], 'AMS-JRO':['KL'], 'CDG-NBO':['AF','KQ'], 'BRU-KGL':['SN','WB'],
    'FRA-JRO':['DE'], 'FRA-ZNZ':['DE'], 'IST-NBO':['TK'], 'IST-ZNZ':['TK'],
    'NBO-KGL':['KQ','WB'], 'NBO-EBB':['KQ','UR'], 'NBO-DAR':['KQ','PW'], 'NBO-JRO':['KQ','PW'], 'NBO-ZNZ':['KQ','JM'], 'NBO-MBA':['KQ','JM'],
    'NBO-KIS':['KQ','JM'], 'MBA-ZNZ':['JM'], 'EBB-KGL':['UR','WB'], 'EBB-DAR':['UR'], 'KGL-DAR':['WB'], 'JRO-ZNZ':['PW','TC'],
    'ARK-ZNZ':['PW'], 'DAR-ZNZ':['TC','PW'], 'DAR-JRO':['TC','PW']
  };
  // One-stop connections: [hub, airline]
  const VIA_LONG = [['NBO','KQ'], ['IST','TK'], ['ADD','ET'], ['DOH','QR'], ['DXB','EK'], ['AMS','KL']];
  const VIA_SHORT = [['NBO','KQ'], ['KGL','WB'], ['EBB','UR'], ['DAR','TC'], ['ADD','ET']];
  const region = c => EUROPE.includes(c) ? 'eu' : (c === 'DXB' || c === 'DOH') ? 'me' : c === 'ADD' ? 'et' : 'ea';
  const directFor = (a, b) => DIRECT[`${a}-${b}`] || DIRECT[`${b}-${a}`];

  /* ---------- Flight times (minutes) ---------- */
  const parseTime = s => { const h = /(\d+)h/.exec(s), m = /(\d+)m/.exec(s); return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0); };
  function legMinutes(a, b){
    const f = FLIGHTS.find(x => x.from === a && x.to === b || x.from === b && x.to === a);
    if(f) return parseTime(f.time);
    const r = [region(a), region(b)].sort().join('-');
    if(r === 'ea-eu') return (a === 'IST' || b === 'IST') ? 420 : 540;
    return { 'eu-eu':120, 'eu-me':400, 'et-eu':470, 'ea-me':300, 'ea-et':150, 'ea-ea':100 }[r] || 540;
  }

  // Small repeatable random numbers, so the same search always shows the same results
  const rnd = s => { let h = 2166136261; for(const ch of s){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };

  /* ---------- Flight options for one direction on one date ---------- */
  function options(a, b, date){
    const out = [];
    const longHaul = region(a) === 'eu' || region(b) === 'eu';
    const set = FLIGHTS.find(x => x.fare && (x.from === a && x.to === b || x.from === b && x.to === a));
    const base = set ? set.fare : longHaul ? 520 : 70 + legMinutes(a, b) * 0.9;   // one-way economy fare, USD (admin can set it per route)
    const weekend = [5, 6, 0].includes(new Date(date + 'T12:00:00Z').getUTCDay()) ? 0.06 : 0;
    const dayFactor = 0.88 + rnd(a + b + date) * 0.3 + weekend;
    const add = (carrier, legs, layover, n) => {
      const seed = rnd(carrier + a + b + date + legs.length + n);
      const dur = legs.reduce((s, [x, y]) => s + legMinutes(x, y), 0) + layover;
      const dep = 6 * 60 + Math.round(seed * 70) * 15;                       // 06:00 to 23:30, on the quarter hour
      const arr = dep + dur + (tz(b) - tz(a)) * 60;                         // local time at arrival
      const price = Math.round(base * dayFactor * (legs.length > 1 ? 0.82 + seed * 0.12 : 1 + seed * 0.18) / 5) * 5;
      out.push({ carrier, legs, via: legs.length > 1 ? legs[0][1] : null, dep, arr, dur, stops: legs.length - 1, price });
    };
    const directs = directFor(a, b);
    (directs || []).forEach((c, i) => {
      add(c, [[a, b]], 0, 0);
      if(!longHaul && i === 0) add(c, [[a, b]], 0, 1);                      // busy short routes: a second daily flight
    });
    (longHaul ? VIA_LONG : VIA_SHORT)
      .filter(([h]) => h !== a && h !== b)
      .slice(0, directs ? 3 : 5)
      .forEach(([h, c]) => add(c, [[a, h], [h, b]], 70 + Math.round(rnd(h + date + a) * 10) * 15, 0));
    return out;
  }

  /* ---------- Search form ---------- */
  const fromSel = $('#fsFrom'), toSel = $('#fsTo'), depIn = $('#fsDepart'), retIn = $('#fsReturn'), cabin = $('#fsCabin');
  const codes = Object.keys(AIRPORTS);
  const opt = c => `<option value="${c}">${AIRPORTS[c]} (${c})</option>`;
  fromSel.innerHTML = codes.map(opt).join('');
  const fillTo = () => {
    const keep = toSel.value;
    toSel.innerHTML = codes.filter(c => c !== fromSel.value && !(EUROPE.includes(c) && EUROPE.includes(fromSel.value))).map(opt).join('');
    if([...toSel.options].some(o => o.value === keep)) toSel.value = keep;
  };
  const iso = d => d.toISOString().slice(0, 10);
  const addDays = (s, n) => iso(new Date(new Date(s + 'T12:00:00Z').getTime() + n * 864e5));
  const today = iso(new Date());
  depIn.min = retIn.min = today;
  fromSel.value = 'CDG'; fillTo(); toSel.value = 'NBO';
  depIn.value = addDays(today, 21); retIn.value = addDays(today, 31);

  let trip = 'return';
  $$('[data-trip]').forEach(b => b.addEventListener('click', () => {
    trip = b.dataset.trip;
    $$('[data-trip]').forEach(x => x.classList.toggle('on', x === b));
    retIn.closest('.fs-field').hidden = trip === 'oneway';
  }));
  fromSel.addEventListener('change', fillTo);
  $('#fsSwap').addEventListener('click', () => {
    const a = fromSel.value, b = toSel.value;
    fromSel.value = b; fillTo();
    if([...toSel.options].some(o => o.value === a)) toSel.value = a;
  });
  depIn.addEventListener('change', () => { if(retIn.value < depIn.value) retIn.value = addDays(depIn.value, 7); retIn.min = depIn.value; });

  // Travellers & cabin
  const pax = { adults: 1, children: 0 };
  const paxLabel = () => {
    const n = pax.adults + pax.children;
    $('#fsPaxLabel').textContent = `${n} ${n === 1 ? 'traveller' : 'travellers'} · ${cabin.selectedOptions[0].text}`;
  };
  $('#fsPaxBtn').addEventListener('click', () => { $('#fsPaxPanel').hidden = !$('#fsPaxPanel').hidden; });
  document.addEventListener('click', e => { if(!e.target.closest('.fs-pax')) $('#fsPaxPanel').hidden = true; });
  $$('[data-pax]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.pax;
    pax[k] = Math.max(k === 'adults' ? 1 : 0, Math.min(9, pax[k] + +b.dataset.d));
    $(`#fs-${k}`).textContent = pax[k];
    paxLabel();
  }));
  cabin.addEventListener('change', paxLabel);
  paxLabel();

  /* ---------- Results ---------- */
  const CABIN = { economy:1, premium:1.65, business:3.3, first:5.2 };
  let results = [], shown = [], sortBy = 'best';
  const hhmm = m => { const d = ((m % 1440) + 1440) % 1440; return String(Math.floor(d / 60)).padStart(2, '0') + ':' + String(d % 60).padStart(2, '0'); };
  const dur = m => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
  const dayFmt = (s, o) => new Intl.DateTimeFormat(locale(), Object.assign({ timeZone:'UTC' }, o)).format(new Date(s + 'T12:00:00Z'));
  const perPerson = o => Math.round(o.price * CABIN[cabin.value]);

  function run(){
    const a = fromSel.value, b = toSel.value, d = depIn.value, r = trip === 'return' ? retIn.value : null;
    const outs = options(a, b, d), backs = r ? options(b, a, r) : [];
    // Each outbound is paired with the same airline's return (or the cheapest return)
    results = outs.map(o => {
      const back = backs.length ? (backs.find(x => x.carrier === o.carrier && x.stops === o.stops) || backs.slice().sort((x, y) => x.price - y.price)[0]) : null;
      const pp = perPerson(o) + (back ? Math.round(perPerson(back) * 0.9) : 0);
      return { out:o, back, pp, time: o.dur + (back ? back.dur : 0) };
    });
    $('#fsSummary').innerHTML = `<b translate="no">${AIRPORTS[a]} → ${AIRPORTS[b]}</b><span translate="no">${dayFmt(d, { weekday:'short', day:'numeric', month:'short' })}${r ? ' – ' + dayFmt(r, { weekday:'short', day:'numeric', month:'short' }) : ''}</span>`;
    renderDates(a, b, d);
    renderAirlines();
    render();
    $('#fsResults').hidden = false;
  }
  form.addEventListener('submit', e => { e.preventDefault(); run(); $('#fsResults').scrollIntoView({ behavior:'smooth', block:'start' }); });

  // A week of nearby dates with the lowest fare each day
  function renderDates(a, b, d){
    $('#fsDates').innerHTML = [-3, -2, -1, 0, 1, 2, 3].map(n => {
      const day = addDays(d, n);
      if(day < today) return '';
      let low = Math.min(...options(a, b, day).map(perPerson));
      if(trip === 'return') low += Math.round(Math.min(...options(b, a, addDays(retIn.value, n)).map(perPerson)) * 0.9);   // round-trip "from" price
      return `<button type="button" class="fs-day${n === 0 ? ' on' : ''}" data-day="${day}"><span translate="no">${dayFmt(day, { weekday:'short', day:'numeric', month:'short' })}</span><b data-usd="${low}"></b></button>`;
    }).join('');
  }
  $('#fsDates').addEventListener('click', e => {
    const b = e.target.closest('[data-day]');
    if(!b) return;
    const shift = Math.round((new Date(b.dataset.day) - new Date(depIn.value)) / 864e5);
    depIn.value = b.dataset.day;
    if(trip === 'return') retIn.value = addDays(retIn.value, shift);
    run();
  });

  function renderAirlines(){
    const list = [...new Set(results.map(r => r.out.carrier))];
    $('#fsAirlines').innerHTML = list.map(c => `<label><input type="checkbox" value="${c}" checked> <span translate="no">${CARRIERS[c]}</span></label>`).join('');
  }
  $('#fsFilters').addEventListener('change', render);
  $$('[data-sort]').forEach(b => b.addEventListener('click', () => {
    sortBy = b.dataset.sort;
    $$('[data-sort]').forEach(x => x.classList.toggle('on', x === b));
    render();
  }));

  function render(){
    const stops = $$('input[name=fsStops]:checked').map(i => +i.value);
    const airlines = $$('#fsAirlines input:checked').map(i => i.value);
    const times = $$('input[name=fsTime]:checked').map(i => i.value);
    const slot = m => m < 720 ? 'morning' : m < 1080 ? 'afternoon' : 'evening';
    const minP = Math.min(...results.map(r => r.pp)), minT = Math.min(...results.map(r => r.time));
    const score = r => r.pp / minP + r.time / minT * 1.3;              // "Best": balances price and journey time
    const order = { best:(x, y) => score(x) - score(y), cheapest:(x, y) => x.pp - y.pp, fastest:(x, y) => x.time - y.time };
    shown = results.filter(r => stops.includes(r.out.stops) && airlines.includes(r.out.carrier) && times.includes(slot(r.out.dep))).sort(order[sortBy]);
    if(results.length){
      $('#fsSortBest').dataset.usd = results.slice().sort(order.best)[0].pp;
      $('#fsSortCheap').dataset.usd = results.slice().sort(order.cheapest)[0].pp;
      $('#fsSortFast').textContent = dur(results.slice().sort(order.fastest)[0].out.dur);
    }
    $('#fsCount').textContent = `${shown.length} ${shown.length === 1 ? 'result' : 'results'}`;
    $('#fsList').innerHTML = shown.length ? shown.map((r, i) => card(r, i)).join('')
      : '<div class="fs-empty">No flights match these filters.</div>';
    SN.refresh();
  }

  function leg(o){
    const a = o.legs[0][0], b = o.legs[o.legs.length - 1][1];
    const plus = Math.floor(o.arr / 1440);
    return `
      <div class="fs-leg">
        <span class="fs-logo" title="${CARRIERS[o.carrier]}" translate="no">${o.carrier}</span>
        <div class="fs-pt"><b translate="no">${hhmm(o.dep)}</b><small translate="no">${a}</small></div>
        <div class="fs-mid">
          <small translate="no">${dur(o.dur)}</small>
          <span class="fs-line${o.stops ? ' stop' : ''}"></span>
          <small class="${o.stops ? 'fs-stop' : 'fs-direct'}">${o.stops ? '1 stop' : 'Direct'}</small>
          ${o.via ? `<small class="fs-via" translate="no">${HUBS[o.via] || AIRPORTS[o.via]}</small>` : ''}
        </div>
        <div class="fs-pt"><b translate="no">${hhmm(o.arr)}${plus > 0 ? `<sup>+${plus}</sup>` : ''}</b><small translate="no">${b}</small></div>
        <span class="fs-airline" translate="no">${CARRIERS[o.carrier]}</span>
      </div>`;
  }
  const card = (r, i) => `
    <article class="fs-card">
      <div class="fs-legs">${leg(r.out)}${r.back ? leg(r.back) : ''}</div>
      <div class="fs-buy">
        <b data-usd="${r.pp}"></b>
        <small>per person</small>
        <button type="button" class="btn btn-sm" data-select="${i}">Select</button>
      </div>
    </article>`;

  // Select: hand the chosen flight to a planner through the request form
  $('#fsList').addEventListener('click', e => {
    const b = e.target.closest('[data-select]');
    const r = b && shown[+b.dataset.select];
    if(!r) return;
    const line = o => `${CARRIERS[o.carrier]} ${AIRPORTS[o.legs[0][0]]} ${hhmm(o.dep)} → ${AIRPORTS[o.legs[o.legs.length - 1][1]]} ${hhmm(o.arr)} (${o.stops ? '1 stop via ' + (HUBS[o.via] || o.via) : 'direct'})`;
    $('#fRoute').value = `${AIRPORTS[fromSel.value]} → ${AIRPORTS[toSel.value]}`;
    $('#fDate').value = depIn.value;
    const n = Math.min(pax.adults + pax.children, 4);
    [...$('#fPax').options].forEach(o => { o.selected = o.text.trim().startsWith(String(n)); });
    $('#fType').selectedIndex = EUROPE.includes(fromSel.value) || EUROPE.includes(toSel.value) ? 0 : 1;
    $('#fNotes').value = `Selected: ${line(r.out)}` + (r.back ? `\nReturn ${retIn.value}: ${line(r.back)}` : '') +
      `\n${pax.adults} adult(s), ${pax.children} child(ren), ${cabin.selectedOptions[0].text}. Shown fare about $${r.pp} per person.`;
    document.getElementById('request').scrollIntoView({ behavior:'smooth' });
    setTimeout(() => $('#fName').focus({ preventScroll:true }), 600);
  });

  // Popular routes list: clicking one runs a search for it
  $$('.route-card[data-from]').forEach(c => c.addEventListener('click', e => {
    e.preventDefault();
    fromSel.value = c.dataset.from; fillTo(); toSel.value = c.dataset.to;
    run();
    form.scrollIntoView({ behavior:'smooth' });
  }));

  document.addEventListener('currencychange', () => results.length && render());
  run();
})();
