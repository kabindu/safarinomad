/* =========================================================
   SafariNomad: flight search (flights.html)
   ---------------------------------------------------------
   No made-up fares. A search gives the traveller:
     1. Live prices on trusted comparison sites (Google Flights,
        Skyscanner, Kayak), opened with their route, dates,
        travellers and cabin already filled in.
     2. The airlines that serve the route, each linking to its
        OFFICIAL website to book direct.
     3. "Let us book it": hands the search to a planner.
   Direct routes come from DIRECT below; connecting airlines
   from HUB_AIRLINES. Routes change, so the comparison sites
   are the source of truth for who flies on a given date.
   To show live fares on this page itself, connect a flight-data
   API (Amadeus, Duffel, Travelpayouts…) on the server.
   ========================================================= */

(function(){
  const form = document.getElementById('flightSearch');
  if(!form) return;
  const { $, $$ } = SN;
  const locale = () => ({ fr:'fr-FR', es:'es-ES', de:'de-DE' }[(typeof SNI18N !== 'undefined' && SNI18N.lang) || 'en'] || 'en-GB');

  /* ---------- Airports and airlines ---------- */
  const EAST_AFRICA = ['NBO', 'MBA', 'KIS', 'JRO', 'ARK', 'DAR', 'ZNZ', 'EBB', 'KGL'];
  const isEA = c => EAST_AFRICA.includes(c);
  // AIRLINES (names, hubs, official sites) lives in js/data.js, shared with the flight-status tracker
  // Airlines that usually fly a route non-stop (either direction)
  const DIRECT = {
    'LHR-NBO':['KQ','BA'], 'LGW-EBB':['UR'], 'AMS-NBO':['KL','KQ'], 'AMS-JRO':['KL'], 'CDG-NBO':['AF','KQ'], 'BRU-KGL':['SN','WB'],
    'FRA-JRO':['DE'], 'FRA-ZNZ':['DE'], 'IST-NBO':['TK'], 'IST-ZNZ':['TK'], 'DXB-NBO':['EK','KQ'], 'DOH-NBO':['QR'], 'CAI-NBO':['MS'],
    'ADD-NBO':['ET','KQ'], 'JNB-NBO':['KQ'],
    'NBO-KGL':['KQ','WB'], 'NBO-EBB':['KQ','UR'], 'NBO-DAR':['KQ','PW'], 'NBO-JRO':['KQ','PW'], 'NBO-ZNZ':['KQ','JM'], 'NBO-MBA':['KQ','JM'],
    'NBO-KIS':['KQ','JM'], 'MBA-ZNZ':['JM'], 'EBB-KGL':['UR','WB'], 'EBB-DAR':['UR'], 'KGL-DAR':['WB'], 'JRO-ZNZ':['PW','TC'],
    'ARK-ZNZ':['PW'], 'DAR-ZNZ':['TC','PW'], 'DAR-JRO':['TC','PW']
  };
  const directFor = (a, b) => DIRECT[`${a}-${b}`] || DIRECT[`${b}-${a}`] || [];
  // Airlines that connect the rest of the world with East Africa through their hub
  const HUB_LONG = ['KQ', 'EK', 'QR', 'ET', 'TK', 'MS', 'KL'];
  const HUB_SHORT = ['KQ', 'WB', 'UR', 'TC', 'ET'];
  const HUB_CODE = { KQ:'NBO', EK:'DXB', QR:'DOH', ET:'ADD', TK:'IST', MS:'CAI', KL:'AMS', WB:'KGL', UR:'EBB', TC:'DAR' };

  // Typical flying time, when the route is in FLIGHTS (js/data.js)
  const timeFor = (a, b) => (FLIGHTS.find(f => f.from === a && f.to === b || f.from === b && f.to === a) || {}).time || '';

  /* ---------- Search form ---------- */
  const fromSel = $('#fsFrom'), toSel = $('#fsTo'), depIn = $('#fsDepart'), retIn = $('#fsReturn'), cabin = $('#fsCabin');
  const codes = Object.keys(AIRPORTS);
  const opt = c => `<option value="${c}">${AIRPORTS[c]} (${c})</option>`;
  const group = (label, list) => `<optgroup label="${label}">${list.map(opt).join('')}</optgroup>`;
  fromSel.innerHTML = group('Fly from', codes.filter(c => !isEA(c))) + group('East Africa', codes.filter(isEA));
  // From outside East Africa you can fly to East Africa; within East Africa, anywhere
  const fillTo = () => {
    const keep = toSel.value, from = fromSel.value;
    const list = codes.filter(c => c !== from && (isEA(from) || isEA(c)));
    toSel.innerHTML = isEA(from) ? group('East Africa', list.filter(isEA)) + group('Abroad', list.filter(c => !isEA(c))) : group('East Africa', list);
    if([...toSel.options].some(o => o.value === keep)) toSel.value = keep;
  };
  const iso = d => d.toISOString().slice(0, 10);
  const addDays = (s, n) => iso(new Date(new Date(s + 'T12:00:00Z').getTime() + n * 864e5));
  const today = iso(new Date());
  depIn.min = retIn.min = today;
  fromSel.value = 'FRA'; fillTo(); toSel.value = 'NBO';
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

  /* ---------- Links to live prices (filled in with the search) ---------- */
  const CABIN = {
    economy:  { text:'economy',         sky:'economy',        kayak:'' },
    premium:  { text:'premium economy', sky:'premiumeconomy', kayak:'premium' },
    business: { text:'business class',  sky:'business',       kayak:'business' },
    first:    { text:'first class',     sky:'first',          kayak:'first' }
  };
  function compareLinks(a, b, d, r, o = { cabin: cabin.value, adults: pax.adults, children: pax.children }){
    const c = CABIN[o.cabin], n = o.adults, k = o.children, kids = Array(k).fill(8);   // children's ages: the sites ask for one; 8 is a neutral default
    const who = `${n} adult${n > 1 ? 's' : ''}${k ? ` ${k} child${k > 1 ? 'ren' : ''}` : ''}`;
    const cur = (SN.store.get('currency') || 'USD') === 'EUR' ? 'EUR' : 'USD';
    const yymmdd = s => s.slice(2).replace(/-/g, '');
    return [
      { name:'Google Flights', icon:'fa-brands fa-google', note:'All airlines, price graph',
        url:`https://www.google.com/travel/flights?q=${encodeURIComponent(`${r ? '' : 'one way '}flights from ${a} to ${b} on ${d}${r ? ` through ${r}` : ''} ${who} ${c.text}`)}&curr=${cur}&hl=en` },
      { name:'Skyscanner', icon:'fa-solid fa-magnifying-glass-dollar', note:'Cheapest month view',
        url:`https://www.skyscanner.net/transport/flights/${a.toLowerCase()}/${b.toLowerCase()}/${yymmdd(d)}/${r ? yymmdd(r) + '/' : ''}?adultsv2=${n}${k ? `&childrenv2=${kids.join('%7C')}` : ''}&cabinclass=${c.sky}&rtn=${r ? 1 : 0}` },
      { name:'Kayak', icon:'fa-solid fa-plane-circle-check', note:'Compares booking sites',
        url:`https://www.kayak.com/flights/${a}-${b}/${d}${r ? '/' + r : ''}${c.kayak ? '/' + c.kayak : ''}/${n}adults${k ? '/children-' + kids.join('-') : ''}?sort=price_a` }
    ];
  }

  /* ---------- Results ---------- */
  const dayFmt = s => new Intl.DateTimeFormat(locale(), { timeZone:'UTC', weekday:'short', day:'numeric', month:'short' }).format(new Date(s + 'T12:00:00Z'));
  const ext = '<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>';
  function run(){
    const a = fromSel.value, b = toSel.value, d = depIn.value, r = trip === 'return' ? retIn.value : null;
    $('#fsSummary').innerHTML = `<b translate="no">${AIRPORTS[a]} → ${AIRPORTS[b]}</b><span translate="no">${dayFmt(d)}${r ? ' – ' + dayFmt(r) : ''}</span>`;

    $('#fsCompare').innerHTML = compareLinks(a, b, d, r).map(s => `
      <a class="fs-site" href="${s.url}" target="_blank" rel="noopener">
        <i class="${s.icon} fs-site-ico" aria-hidden="true"></i>
        <span><b translate="no">${s.name}</b><small>${s.note}</small></span>
        <span class="fs-site-go">See prices ${ext}</span>
      </a>`).join('');

    // Airlines: those flying it direct first, then airlines that connect through their hub
    const direct = directFor(a, b);
    const longHaul = !isEA(a) || !isEA(b);
    const pool = (longHaul ? HUB_LONG : HUB_SHORT).filter(c => !direct.includes(c));
    // The home airline of either city (e.g. Emirates from Dubai, EgyptAir from Cairo), then airlines connecting elsewhere
    const home = pool.filter(c => HUB_CODE[c] === a || HUB_CODE[c] === b);
    const via = pool.filter(c => !home.includes(c));
    const t = timeFor(a, b);
    $('#fsRouteInfo').innerHTML = direct.length
      ? `Non-stop on this route: <b translate="no">${direct.map(c => AIRLINES[c].name).join(', ')}</b>${t ? ` · about <span translate="no">${t}</span>` : ''}. Connecting flights below.`
      : 'No regular non-stop flight listed for this route. These airlines fly it with one change:';
    const card = (c, kind) => `
      <a class="fs-air" href="${AIRLINES[c].url}" target="_blank" rel="noopener">
        <span class="fs-logo" translate="no">${c}</span>
        <span class="fs-air-txt"><b translate="no">${AIRLINES[c].name}</b><small>${kind === 'direct' ? 'Non-stop'
          : kind === 'home' ? `Home airline of <span translate="no">${AIRLINES[c].hub}</span>` : `Connects via <span translate="no">${AIRLINES[c].hub}</span>`}</small></span>
        <span class="fs-air-go">Official site ${ext}</span>
      </a>`;
    $('#fsAirList').innerHTML = direct.map(c => card(c, 'direct')).join('') + home.map(c => card(c, 'home')).join('') + via.map(c => card(c, 'via')).join('');
    $('#fsResults').hidden = false;
    SN.refresh();
  }
  form.addEventListener('submit', e => { e.preventDefault(); run(); $('#fsResults').scrollIntoView({ behavior:'smooth', block:'start' }); });

  // "Let us book it": fill the request form with this search
  $('#fsAskUs').addEventListener('click', () => {
    $('#fRoute').value = `${AIRPORTS[fromSel.value]} (${fromSel.value}) → ${AIRPORTS[toSel.value]} (${toSel.value})`;
    $('#fDate').value = depIn.value;
    const n = Math.min(pax.adults + pax.children, 4);
    [...$('#fPax').options].forEach(o => { o.selected = o.text.trim().startsWith(String(n)); });
    $('#fType').selectedIndex = isEA(fromSel.value) && isEA(toSel.value) ? 1 : 0;
    $('#fNotes').value = `${trip === 'return' ? `Return on ${retIn.value}. ` : 'One way. '}${pax.adults} adult(s), ${pax.children} child(ren), ${cabin.selectedOptions[0].text}. Please find me the best fare.`;
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

  // Used by "My flights" (js/flight-plan.js)
  window.SNFlights = {
    current: () => ({ from: fromSel.value, to: toSel.value, fromName: AIRPORTS[fromSel.value], toName: AIRPORTS[toSel.value], depart: depIn.value,
      ret: trip === 'return' ? retIn.value : '', adults: pax.adults, children: pax.children, cabin: cabin.value, cabinName: cabin.selectedOptions[0].text }),
    links: o => compareLinks(o.from, o.to, o.depart, o.ret || null, o)
  };

  document.addEventListener('currencychange', () => { if(!$('#fsResults').hidden) run(); });
  run();
})();
