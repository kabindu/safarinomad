/* =========================================================
   SafariNomad: booking page (book.html)
   ---------------------------------------------------------
   book.html?trip=great-migration            opens that trip
   book.html?trip=great-migration&date=2026-11-14   and that date

   Departure dates come from BookingRules in js/data.js.
   Seats already taken come from the server (/api/availability),
   which also re-checks everything when the booking is sent.
   Opened without the server (file://), the request is sent
   by email instead.
   ========================================================= */

(function(){
  const { $, $$, params, money } = SN;
  const R = BookingRules;
  const form = $('#bookForm');
  if(!form) return;

  const ONLINE = /^https?:/.test(location.protocol);
  const ALL = [...TRIPS, ...LAST_MINUTE];
  // Most text is written in English and translated by js/i18n.js as it appears.
  // Parts that mix in local date formats are marked translate="no" and use T() directly.
  const T = s => (typeof SNI18N !== 'undefined' ? SNI18N.t(s) : s);
  const locale = () => ({ fr:'fr-FR', es:'es-ES', de:'de-DE' }[SNI18N.lang] || 'en-GB');
  const fmt = (iso, opts) => new Intl.DateTimeFormat(locale(), Object.assign({ timeZone:'UTC' }, opts)).format(R.parse(iso));
  const long = iso => fmt(iso, { weekday:'short', day:'numeric', month:'short', year:'numeric' });

  const state = {
    trip: null, info: null, date: null, private: false,
    adults: 2, children: 0, booked: {}, live: false,
    month: null                                   // first day of the month on screen (ISO)
  };

  /* ---------- Trip picker ---------- */
  const sel = $('#bkTrip');
  sel.innerHTML =
    `<optgroup label="Small-group & private safaris">${TRIPS.map(t => `<option value="${t.id}">${t.title} · ${t.days} days</option>`).join('')}</optgroup>` +
    `<optgroup label="Last-minute departures">${LAST_MINUTE.map(t => `<option value="${t.id}">${t.title} · ${t.departs}</option>`).join('')}</optgroup>`;
  sel.addEventListener('change', () => { setTrip(sel.value); history.replaceState(null, '', `?trip=${sel.value}`); });

  function setTrip(id, date){
    const info = R.find(id) || R.find(TRIPS[0].id);
    state.trip = info.trip; state.info = info; state.date = null; state.private = false;
    if(TRIPS.includes(info.trip)) SN.store.set('recentTrips', [info.trip.id, ...(SN.store.get('recentTrips') || []).filter(x => x !== info.trip.id)].slice(0, 8));
    sel.value = info.trip.id;
    $('#bkPrivate').checked = false;
    $('#privateWrap').hidden = info.kind !== 'group';
    $('#childNote').textContent = (info.trip.styles || []).includes('family') ? '5–15 · 50% off' : '5–15';
    // Start the calendar on the first month with a departure
    const first = upcoming(1)[0];
    state.month = (date && R.isDeparture(info.trip.id, date, info.kind === 'private') ? date : first || R.iso(R.today())).slice(0, 8) + '01';
    if(date && R.isDeparture(info.trip.id, date, info.kind === 'private')) state.date = date;
    state.booked = {};
    render();
    loadAvailability();
  }

  /* ---------- Availability from the server ---------- */
  async function loadAvailability(){
    const id = state.trip.id;
    if(!ONLINE){ state.live = false; return render(); }
    try{
      const r = await fetch(`/api/availability?trip=${encodeURIComponent(id)}`, { cache:'no-store' });
      if(!r.ok) throw new Error(r.status);
      const data = await r.json();
      if(state.trip.id !== id) return;          // visitor switched trip meanwhile
      state.booked = data.booked || {};
      state.live = true;
    }catch(e){ state.live = false; }
    if(state.date && seatsLeft(state.date) <= 0) state.date = null;
    render();
  }

  const isPrivate = () => state.info.kind === 'private' || state.private;
  const capacity = () => isPrivate() ? 12 : state.info.capacity;
  const seatsLeft = iso => isPrivate() ? 12 : state.info.capacity - (state.booked[iso] || 0);
  const party = () => state.adults + state.children;

  // The next n departures that still have seats
  function upcoming(n, from){
    const out = [];
    let d = from || R.iso(R.today());
    const end = R.addDays(R.iso(R.today()), 400);
    while(out.length < n && d <= end){
      if(R.isDeparture(state.trip.id, d, isPrivate()) && seatsLeft(d) > 0) out.push(d);
      d = R.addDays(d, 1);
    }
    return out;
  }

  /* ---------- Calendar ---------- */
  // First and last bookable months (1st of the month, ISO): this month … BOOKING.monthsAhead
  function monthRange(){
    const max = R.today(); max.setUTCMonth(max.getUTCMonth() + BOOKING.monthsAhead);
    return { minM: R.iso(R.today()).slice(0, 8) + '01', maxM: R.iso(max).slice(0, 8) + '01' };
  }
  function renderCalendar(){
    const m = R.parse(state.month);
    // Month and year pickers: jump straight to any month that can be booked
    const { minM, maxM } = monthRange();
    const y = state.month.slice(0, 4);
    const years = [];
    for(let yr = +minM.slice(0, 4); yr <= +maxM.slice(0, 4); yr++) years.push(yr);
    $('#calYear').innerHTML = years.map(yr => `<option value="${yr}" ${String(yr) === y ? 'selected' : ''}>${yr}</option>`).join('');
    $('#calMonth').innerHTML = [...Array(12)].map((_, i) => {
      const iso = `${y}-${String(i + 1).padStart(2, '0')}-01`;
      return `<option value="${i + 1}" ${iso === state.month ? 'selected' : ''} ${iso < minM || iso > maxM ? 'disabled' : ''}>${fmt(iso, { month:'long' })}</option>`;
    }).join('');
    // Weekday names, Monday first
    $('#calDow').innerHTML = [...Array(7)].map((_, i) => `<span>${fmt(R.addDays('2024-01-01', i), { weekday:'short' })}</span>`).join('');

    const offset = (m.getUTCDay() + 6) % 7;      // blank cells before the 1st
    const daysIn = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 0)).getUTCDate();
    const today = R.iso(R.today());
    const end = state.date ? R.addDays(state.date, state.trip.days - 1) : null;
    let html = '<span class="cal-blank"></span>'.repeat(offset);
    for(let i = 1; i <= daysIn; i++){
      const iso = state.month.slice(0, 8) + String(i).padStart(2, '0');
      const ok = R.isDeparture(state.trip.id, iso, isPrivate());
      const left = ok ? seatsLeft(iso) : 0;
      const cls = ['cal-day'];
      if(iso === today) cls.push('today');
      if(iso < today) cls.push('past');
      if(state.date && iso >= state.date && iso <= end) cls.push(iso === state.date ? 'sel' : 'in-trip');
      if(ok && left <= 0) cls.push('full');
      else if(ok) cls.push(left <= 3 && !isPrivate() ? 'few' : 'open');
      const label = `${long(iso)}${ok ? `, ${left <= 0 ? T('sold out') : isPrivate() ? T('available') : T(`${left} seats left`)}` : ''}`;
      html += ok && left > 0
        ? `<button type="button" class="${cls.join(' ')}" data-date="${iso}" aria-label="${label}" aria-pressed="${iso === state.date}">${i}</button>`
        : `<span class="${cls.join(' ')}" aria-label="${label}">${i}</span>`;
    }
    $('#calDays').innerHTML = html;

    // Month arrows: stay within the bookable range
    $('#calPrev').disabled = state.month <= minM;
    $('#calNext').disabled = state.month >= maxM;
  }
  function moveMonth(d){
    const m = R.parse(state.month);
    m.setUTCMonth(m.getUTCMonth() + d);
    state.month = R.iso(m);
    renderCalendar();
  }
  // Picking a month or year from the lists (kept within the bookable range)
  function jumpTo(year, month){
    const { minM, maxM } = monthRange();
    let iso = `${year}-${String(month).padStart(2, '0')}-01`;
    if(iso < minM) iso = minM;
    if(iso > maxM) iso = maxM;
    state.month = iso;
    renderCalendar();
  }
  $('#calMonth').addEventListener('change', e => jumpTo(state.month.slice(0, 4), +e.target.value));
  $('#calYear').addEventListener('change', e => jumpTo(e.target.value, +state.month.slice(5, 7)));
  $('#calPrev').addEventListener('click', () => moveMonth(-1));
  $('#calNext').addEventListener('click', () => moveMonth(1));
  $('#calDays').addEventListener('click', e => { const b = e.target.closest('[data-date]'); if(b) pickDate(b.dataset.date); });

  function pickDate(iso){
    state.date = iso;
    const max = Math.max(1, seatsLeft(iso));
    if(party() > max){ state.children = Math.max(0, Math.min(state.children, max - 1)); state.adults = Math.max(1, Math.min(state.adults, max - state.children)); }
    render();
    if(window.innerWidth < 900) $('#stepPeople').scrollIntoView({ behavior:'smooth', block:'start' });
  }
  $('#bkPrivate').addEventListener('change', e => { state.private = e.target.checked; if(state.date && !R.isDeparture(state.trip.id, state.date, isPrivate())) state.date = null; render(); });

  /* ---------- Travellers ---------- */
  $$('[data-step-for]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.stepFor, d = +b.dataset.d;
    const max = state.date ? seatsLeft(state.date) : capacity();
    const next = state[k] + d;
    if(next < (k === 'adults' ? 1 : 0)) return;
    if(d > 0 && party() >= max){ SN.toast(`Only ${max} seats are left on that date.`); return; }
    state[k] = next;
    render();
  }));

  /* ---------- Draw everything ---------- */
  function render(){
    const t = state.trip, info = state.info;
    renderCalendar();

    // Travellers
    $('#adults').textContent = state.adults;
    $('#children').textContent = state.children;

    // Summary
    $('#sumImg').src = t.img; $('#sumImg').alt = t.alt || '';
    $('#sumDays').textContent = `${t.days} days`;
    $('#sumTitle').textContent = t.title;
    const end = state.date && R.addDays(state.date, t.days - 1);
    $('#sumDates').textContent = state.date ? shortRange(state.date, end) : '–';
    $('#sumPeople').textContent = peopleText();
    $('#sumPP').textContent = money(info.price);
    const total = R.price(t.id, state.adults, state.children);
    $('#sumTotal').textContent = money(total) + (isPrivate() && info.kind === 'group' ? '*' : '');
    $('#sumDeposit').textContent = money(R.deposit(t.id, state.adults, state.children));
    $('#bookBtn').disabled = !state.date;
    discountUi();

    $('#barTotal').textContent = $('#sumTotal').textContent;
    $('#barDates').textContent = state.date ? shortRange(state.date, end) : T('Choose a date');
    if(typeof saveProgress === 'function') saveProgress();
  }
  form.addEventListener('input', () => render());

  /* ---------- Discount request ---------- */
  function discountUi(){
    const party = state.adults + state.children, tiers = BOOKING.discountTiers || [], pct = R.tier(party), next = tiers.find(x => x.min > party), want = $('#wantDiscount').checked;
    const fill = (text, v) => SNI18N.t(text, v);
    $('#discountHint').textContent = pct ? fill('Groups of {n} or more can ask for up to {pct}% off. A planner confirms the final price.', { n: tiers.filter(x => x.pct === pct)[0].min, pct })
      : next ? fill('Groups of {n} or more can ask for up to {pct}% off. You can still ask for your trip.', { n: next.min, pct: next.pct }) : T('A planner will look at your request and confirm the final price.');
    $('#discountFields').hidden = !want;
    $('#sumDiscount').hidden = !want;
  }

  /* ---------- Visa & flights (step 5) ---------- */
  const VISA = { help:'Wants help with visa / eTA', own:'Arranging own visa', none:'No visa needed (East African citizen)' };
  const FLIGHTS = { help:'Wants us to find flights', booked:'Flights already booked', later:'Will decide on flights later' };
  function showFlightFields(){
    const v = (form.querySelector('input[name=flights]:checked') || {}).value;
    $('#flyHelp').hidden = v !== 'help';
    $('#flyBooked').hidden = v !== 'booked';
  }
  form.addEventListener('change', e => { if(e.target.name === 'flights') showFlightFields(); });
  showFlightFields();

  /* ---------- Follow-up: save progress so a planner can help if the traveller leaves ---------- */
  const lead = SN.lead('booking', 'book');
  function saveProgress(){
    if(!state.trip) return;
    const d = Object.fromEntries(new FormData(form).entries());
    const step = !state.date ? 'Picking a date' : !(d.name || '').trim() || !SN.emailOk((d.email || '').trim()) ? 'Entering details' : 'Filled in, booking not sent';
    lead.save({
      step,
      resume: `book.html?trip=${state.trip.id}${state.date ? `&date=${state.date}` : ''}`,
      fields: {
        Name: d.name, Email: (d.email || '').trim(), Phone: d.phone, Country: d.country,
        Trip: state.trip.title, Date: state.date || '', Travellers: `${state.adults} adults, ${state.children} children`,
        Nationality: d.nationality, Visa: VISA[d.visa], Flights: FLIGHTS[d.flights],
        'Flying from': d.flights === 'help' ? d.flyFrom : '', 'Arrival flight': d.flights === 'booked' ? [d.flightNo, d.arrival].filter(Boolean).join(' · ') : '',
        Notes: d.notes
      }
    });
  }

  const shortRange = (a, b) => `${fmt(a, { day:'numeric', month:'short' })} – ${fmt(b, { day:'numeric', month:'short', year:'numeric' })}`;

  function peopleText(){
    const ppl = [T(`${state.adults} ${state.adults === 1 ? 'adult' : 'adults'}`)];
    if(state.children) ppl.push(T(`${state.children} ${state.children === 1 ? 'child' : 'children'}`));
    return ppl.join(', ') + (isPrivate() && state.info.kind === 'group' ? ' · ' + T('Private') : '');
  }

  /* ---------- Send ---------- */
  const status = $('#bookStatus');
  const say = (msg, err) => { status.innerHTML = msg; status.classList.add('show'); status.classList.toggle('error', !!err); status.scrollIntoView({ behavior:'smooth', block:'center' }); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if(!state.date){ say('Please choose a start date on the calendar.', true); $('#stepDate').scrollIntoView({ behavior:'smooth' }); return; }
    const d = Object.fromEntries(new FormData(form).entries());
    if(!d.name.trim()){ say('Please enter your full name.', true); $('#bkName').focus(); return; }
    if(!SN.emailOk(d.email.trim())){ say('Please enter a valid email address.', true); $('#bkEmail').focus(); return; }
    if(!$('#bkAgree').checked){ say('Please accept the booking terms.', true); return; }

    const payload = { trip:state.trip.id, date:state.date, private:isPrivate(), adults:state.adults, children:state.children,
      name:d.name.trim(), email:d.email.trim(), phone:(d.phone || '').trim(), country:(d.country || '').trim(), notes:(d.notes || '').trim(),
      nationality:(d.nationality || '').trim(), visa:d.visa || '', flights:d.flights || '',
      flyFrom:d.flights === 'help' ? (d.flyFrom || '').trim() : '', flightNo:d.flights === 'booked' ? (d.flightNo || '').trim() : '', arrival:d.flights === 'booked' ? (d.arrival || '') : '',
      lang:SNI18N.lang, currency:(SN.store.get('currency') || 'USD'), draft:lead.draft,
      discount:$('#wantDiscount').checked ? { reason:$('#discountReason').value, message:$('#discountMessage').value.trim() } : null };

    if(!ONLINE) return emailFallback(payload);
    const buttons = [$('#bookBtn'), $('#barBtn')];
    buttons.forEach(b => { b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…'; });
    try{
      const r = await fetch('/api/bookings', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(payload) });
      const data = await r.json().catch(() => ({}));
      if(r.ok){ lead.done(); return showDone(data.ref, payload); }
      if(r.status === 409 || r.status === 400){ say(data.error || 'That date is no longer available. Please pick another.', true); loadAvailability(); }
      else throw new Error(data.error || r.status);
    }catch(err){
      say('We couldn\'t reach our booking system. Please try again, or <a href="#" id="mailFallback">send it by email</a>.', true);
      const a = $('#mailFallback'); if(a) a.addEventListener('click', ev => { ev.preventDefault(); emailFallback(payload); });
    }finally{
      buttons.forEach(b => { b.innerHTML = 'Request booking'; b.disabled = false; });
      $('#bookBtn').disabled = !state.date;
    }
  });

  function bookingText(p, ref){
    return [
      ref ? 'Booking reference: ' + ref : '',
      'Trip: ' + state.trip.title,
      'Dates: ' + p.date + ' to ' + R.addDays(p.date, state.trip.days - 1) + (p.private ? ' (private)' : ''),
      'Travellers: ' + p.adults + ' adults, ' + p.children + ' children',
      'Total: $' + R.price(p.trip, p.adults, p.children).toLocaleString('en-US') + ' (deposit $' + R.deposit(p.trip, p.adults, p.children).toLocaleString('en-US') + ')',
      'Name: ' + p.name, 'Email: ' + p.email, 'Phone: ' + (p.phone || '-'), 'Country: ' + (p.country || '-'),
      'Nationality: ' + (p.nationality || '-'), 'Visa: ' + (VISA[p.visa] || '-'), 'Flights: ' + (FLIGHTS[p.flights] || '-'),
      p.flyFrom ? 'Flying from: ' + p.flyFrom : '', p.flightNo || p.arrival ? 'Arrival: ' + [p.flightNo, p.arrival].filter(Boolean).join(' · ') : '',
      p.discount ? 'Discount requested: ' + p.discount.reason + (p.discount.message ? ' (' + p.discount.message + ')' : '') : '',
      p.notes ? '\nNotes:\n' + p.notes : ''
    ].filter(Boolean).join('\n');
  }
  function emailFallback(p){
    location.href = `mailto:${SITE.email}?subject=${encodeURIComponent('Booking request: ' + state.trip.title + ' on ' + p.date)}&body=${encodeURIComponent(bookingText(p))}`;
    say('Your email app is opening with your booking. Just hit send and we\'ll confirm within 24 hours.');
  }

  /* ---------- Confirmation ---------- */
  function showDone(ref, p){
    const end = R.addDays(p.date, state.trip.days - 1);
    $('#doneCard').setAttribute('translate', 'no');
    const line = (k, v) => `<div><dt>${T(k)}</dt><dd>${v}</dd></div>`;
    $('#doneCard').innerHTML = `
      <dl class="rc-list">
        ${line('Reference', `<b class="bk-ref">${ref}</b>`)}
        ${line('Trip', state.trip.title)}
        ${line('Dates', shortRange(p.date, end))}
        ${line('Travellers', peopleText())}
      </dl>
      <div class="rc-total"><span>${T('Total')}</span><strong>${$('#sumTotal').textContent}</strong></div>
      <div class="rc-small"><span>${T('Deposit after confirmation')}</span><b>${$('#sumDeposit').textContent}</b></div>
      ${p.discount ? `<p class="rc-discount"><i class="fa-solid fa-tag"></i> ${T('Discount requested. A planner will confirm your final price.')}</p>` : ''}`;
    form.hidden = true; $('#summary').hidden = true; $('#bkBar').hidden = true; $('#done').hidden = false;
    window.scrollTo({ top:0, behavior:'smooth' });

    // Calendar file (.ics) for the trip
    $('#icsBtn').onclick = () => {
      const day = s => s.replace(/-/g, '');
      const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SafariNomad//Booking//EN', 'BEGIN:VEVENT',
        'UID:' + ref + '@safarinomad.com', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]|\.\d+/g, ''),
        'DTSTART;VALUE=DATE:' + day(p.date), 'DTEND;VALUE=DATE:' + day(R.addDays(end, 1)),
        'SUMMARY:SafariNomad: ' + state.trip.title, 'DESCRIPTION:Booking ' + ref + ' (awaiting confirmation)',
        'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type:'text/calendar' }));
      a.download = `safarinomad-${ref}.ics`;
      a.click();
    };
  }

  /* ---------- Start ---------- */
  document.addEventListener('langchange', () => state.trip && render());
  document.addEventListener('currencychange', () => state.trip && render());
  setTrip(params.get('trip') || TRIPS[0].id, params.get('date') || (R.find(params.get('trip')) || {}).date);
})();
