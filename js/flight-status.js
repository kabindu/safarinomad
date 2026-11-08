/* =========================================================
   SafariNomad: live flight status (flights.html → "Flight status")
   ---------------------------------------------------------
   Three searches, like an airport flight tracker:
     · By flight   KQ 117 on a date
     · By route    NBO → ZNZ in a 6-hour window
     · Airport     departures or arrivals board
   The browser only talks to our server (/api/flight-status),
   which fetches licensed live data and caches it (server/flights.mjs).
   Every result also links to the airline's and airport's own
   official sites; with no data key set, those links are the answer.
   ========================================================= */

(function(){
  const panel = document.getElementById('statusPanel');
  if(!panel) return;
  const { $, $$ } = SN;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const ONLINE = /^https?:/.test(location.protocol);

  /* ---------- Book flights / Flight status switch ---------- */
  const bookParts = ['#flightSearch', '#fsResults', '.fs-popular', '#routeTabs', '#routeGrid'].map(s => $(s)).filter(Boolean);
  const keepHidden = new WeakMap();          // results stay hidden if they were before switching
  function setMode(mode){
    $$('[data-mode]').forEach(b => { const on = b.dataset.mode === mode; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    panel.hidden = mode !== 'status';
    bookParts.forEach(el => {
      if(mode === 'status'){ keepHidden.set(el, el.hidden); el.hidden = true; }
      else el.hidden = keepHidden.has(el) ? keepHidden.get(el) : el.hidden;
    });
  }
  $$('[data-mode]').forEach(b => b.addEventListener('click', () => { setMode(b.dataset.mode); history.replaceState(null, '', b.dataset.mode === 'status' ? '#status' : location.pathname); }));
  document.addEventListener('click', e => { const a = e.target.closest('a[href="#status"]'); if(a){ e.preventDefault(); setMode('status'); $('#routes').scrollIntoView({ behavior:'smooth' }); } });
  if(location.hash === '#status') setMode('status');

  /* ---------- Form ---------- */
  const codes = Object.keys(AIRPORTS);
  const opt = c => `<option value="${c}">${AIRPORTS[c]} (${c})</option>`;
  const EA = ['NBO', 'MBA', 'KIS', 'JRO', 'ARK', 'DAR', 'ZNZ', 'EBB', 'KGL'];
  const grouped = `<optgroup label="East Africa">${EA.filter(c => AIRPORTS[c]).map(opt).join('')}</optgroup><optgroup label="Abroad">${codes.filter(c => !EA.includes(c)).map(opt).join('')}</optgroup>`;
  ['#stFrom', '#stTo', '#stAirport'].forEach(s => { $(s).innerHTML = grouped; });
  $('#stFrom').value = 'NBO'; $('#stTo').value = 'ZNZ'; $('#stAirport').value = 'NBO';

  // Dates: yesterday to the day after tomorrow, in Nairobi time
  const nairobi = () => new Date(Date.now() + 3 * 3600e3);
  const dayIso = n => new Date(nairobi().getTime() + n * 864e5).toISOString().slice(0, 10);
  const dayName = n => n === -1 ? 'Yesterday' : n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : new Date(dayIso(n) + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'short', timeZone:'UTC' });
  $('#stDate').innerHTML = [-1, 0, 1, 2].map(n => `<option value="${dayIso(n)}"${n === 0 ? ' selected' : ''}>${dayName(n)}</option>`).join('');
  $('#stSlot').value = String(Math.floor(nairobi().getUTCHours() / 6));

  let tab = 'flight';
  function setTab(t){
    tab = t;
    $$('[data-st]').forEach(b => { const on = b.dataset.st === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $$('.st-fields').forEach(f => { f.hidden = f.dataset.for !== t; });
    $('#stSlotField').hidden = t === 'flight';
  }
  $$('[data-st]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.st)));
  $('#stSwap').addEventListener('click', () => { const a = $('#stFrom').value; $('#stFrom').value = $('#stTo').value; $('#stTo').value = a; });

  /* ---------- Showing results ---------- */
  const STATUS = {
    Expected:['Scheduled', 'ok'], CheckIn:['Check-in open', 'ok'], Boarding:['Boarding', 'ok'], GateClosed:['Gate closed', 'ok'],
    Departed:['Departed', 'air'], EnRoute:['In the air', 'air'], Approaching:['Landing soon', 'air'], Arrived:['Landed', 'done'],
    Delayed:['Delayed', 'late'], Diverted:['Diverted', 'bad'], Canceled:['Cancelled', 'bad'], CanceledUncertain:['Likely cancelled', 'bad'], Unknown:['No update yet', 'unk']
  };
  const pill = s => { const [label, tone] = STATUS[s] || STATUS.Unknown; return `<span class="st-pill ${tone}">${label}</span>`; };
  const hhmm = t => (t && t.length >= 16) ? t.slice(11, 16) : '';
  const mins = t => t ? Date.parse(t.replace(' ', 'T')) : NaN;
  // The best time we have: actual (runway) > revised > predicted > scheduled, and how late that is
  function timing(m){
    if(!m) return { main:'', note:'' };
    const best = m.actual || m.revised || m.predicted || '';
    const late = best && m.scheduled ? Math.round((mins(best) - mins(m.scheduled)) / 60000) : 0;
    const label = m.actual ? 'actual' : m.revised ? 'expected' : m.predicted ? 'estimated' : '';
    return {
      main: hhmm(best || m.scheduled),
      sched: best && hhmm(best) !== hhmm(m.scheduled) ? hhmm(m.scheduled) : '',
      note: label ? `${label}${late > 4 ? ` · ${late} min late` : late < -4 ? ` · ${-late} min early` : ''}` : 'scheduled',
      late: late > 14
    };
  }
  const place = m => m ? `<b translate="no">${esc(m.iata)}</b><span>${esc(m.city || m.name)}</span>` : '<b>?</b>';
  const facts = (m, arr) => m ? [m.terminal && `Terminal ${esc(m.terminal)}`, m.gate && `Gate ${esc(m.gate)}`, !arr && m.checkIn && `Check-in ${esc(m.checkIn)}`, arr && m.baggage && `Baggage belt ${esc(m.baggage)}`].filter(Boolean).join(' · ') : '';

  function flightCard(f){
    const d = timing(f.dep), a = timing(f.arr);
    return `<article class="st-card">
      <header><span class="fs-logo" translate="no">${esc(f.airline.iata || f.number.slice(0, 2))}</span>
        <div><b translate="no">${esc(f.number)}</b><small>${esc(f.airline.name)}${f.aircraft ? ` · ${esc(f.aircraft)}` : ''}</small></div>${pill(f.status)}</header>
      <div class="st-legs">
        <div class="st-end"><small>Departs</small><div class="st-place">${place(f.dep)}</div>
          <div class="st-time${d.late ? ' late' : ''}"><b translate="no">${d.main || '–'}</b>${d.sched ? `<s translate="no">${d.sched}</s>` : ''}<span>${d.note}</span></div>
          <p>${facts(f.dep, false)}</p></div>
        <i class="fa-solid fa-plane st-arrow" aria-hidden="true"></i>
        <div class="st-end"><small>Arrives</small><div class="st-place">${place(f.arr)}</div>
          <div class="st-time${a.late ? ' late' : ''}"><b translate="no">${a.main || '–'}</b>${a.sched ? `<s translate="no">${a.sched}</s>` : ''}<span>${a.note}</span></div>
          <p>${facts(f.arr, true)}</p></div>
      </div>
    </article>`;
  }
  function boardTable(list, dir){
    const own = f => dir === 'arr' ? f.arr : f.dep, other = f => dir === 'arr' ? f.dep : f.arr;
    const rows = list.slice().sort((x, y) => (own(x)?.scheduled || '').localeCompare(own(y)?.scheduled || '')).map(f => {
      const t = timing(own(f)), o = other(f) || {};
      return `<tr>
        <td data-l="Time" translate="no"><b>${hhmm(own(f)?.scheduled) || '–'}</b>${t.sched || (t.main && t.main !== hhmm(own(f)?.scheduled)) ? `<small class="${t.late ? 'late' : ''}">${t.main}</small>` : ''}</td>
        <td data-l="Flight"><button type="button" class="st-link" data-track="${esc(f.number)}" translate="no">${esc(f.number)}</button><small>${esc(f.airline.name)}</small></td>
        <td data-l="${dir === 'arr' ? 'From' : 'To'}"><b translate="no">${esc(o.iata || '')}</b> ${esc(o.city || o.name || '')}</td>
        <td data-l="Terminal / gate">${[own(f)?.terminal && 'T' + esc(own(f).terminal), own(f)?.gate && 'Gate ' + esc(own(f).gate), dir === 'arr' && own(f)?.baggage && 'Belt ' + esc(own(f).baggage)].filter(Boolean).join(' · ') || '–'}</td>
        <td data-l="Status">${pill(f.status)}</td></tr>`;
    }).join('');
    return `<div class="table-wrap st-board"><table><thead><tr><th>Time</th><th>Flight</th><th>${dir === 'arr' ? 'From' : 'To'}</th><th>Terminal / gate</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  // Official sites to double-check (always shown; the whole answer when live data is off)
  function officialLinks(airlineCodes, airportCodes){
    const air = [...new Set(airlineCodes)].filter(c => AIRLINES[c]).map(c => `<a class="st-off" href="${AIRLINES[c].url}" target="_blank" rel="noopener"><i class="fa-solid fa-plane"></i> ${esc(AIRLINES[c].name)} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`);
    const apt = [...new Set(airportCodes)].filter(c => AIRPORT_SITES[c]).map(c => `<a class="st-off" href="${AIRPORT_SITES[c][1]}" target="_blank" rel="noopener"><i class="fa-solid fa-building"></i> ${esc(AIRPORT_SITES[c][0])} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`);
    const links = [...air, ...apt];
    return links.length ? `<div class="st-official"><span>Check with the official source:</span>${[...new Set(links)].join('')}</div>` : '';
  }

  /* ---------- Search ---------- */
  const out = $('#stResults');
  async function search(){
    const date = $('#stDate').value, slot = $('#stSlot').value;
    let params, airlines = [], airports = [], title;
    if(tab === 'flight'){
      const number = $('#stNumber').value.trim().toUpperCase().replace(/\s+/g, '');
      if(!/^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/.test(number)){ out.innerHTML = '<p class="st-msg">Please enter a flight number like <b>KQ 117</b>.</p>'; $('#stNumber').focus(); return; }
      params = { type:'flight', number, date }; airlines = [number.slice(0, 2)]; title = number;
    } else if(tab === 'route'){
      const from = $('#stFrom').value, to = $('#stTo').value;
      if(from === to){ out.innerHTML = '<p class="st-msg">Please choose two different airports.</p>'; return; }
      params = { type:'route', from, to, date, slot }; airports = [from, to]; title = `${AIRPORTS[from]} → ${AIRPORTS[to]}`;
    } else {
      const airport = $('#stAirport').value, dir = (panel.querySelector('input[name=stDir]:checked') || {}).value || 'dep';
      params = { type:'board', airport, dir, date, slot }; airports = [airport]; title = `${AIRPORTS[airport]} ${dir === 'arr' ? 'arrivals' : 'departures'}`;
    }
    out.innerHTML = '<p class="st-msg"><i class="fa-solid fa-spinner fa-spin"></i> Checking live flight data…</p>';
    let data;
    try{
      if(!ONLINE) throw new Error('offline');
      const r = await fetch('/api/flight-status?' + new URLSearchParams(params));
      data = await r.json();
      if(!r.ok) throw Object.assign(new Error(data.error || 'error'), { shown:true });
    }catch(err){
      out.innerHTML = `<p class="st-msg">${esc(err.shown ? err.message : 'Live flight status needs the website server. Please use the official sites below.')}</p>` + officialLinks(airlines, airports);
      return;
    }
    if(!data.configured){
      out.innerHTML = `<div class="st-msg"><b>Live flight status isn't switched on yet.</b> Check ${esc(title)} on the official site, or <a href="#request">ask us</a> and we'll check for you.</div>`
        + (officialLinks(airlines, airports) || officialLinks(['KQ'], ['NBO']));   // unknown airline code: the main local airline and airport
      return;
    }
    const list = data.flights || [];
    const when = new Date(data.checked).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
    list.forEach(f => { if(f.airline.iata) airlines.push(f.airline.iata); if(f.dep) airports.push(f.dep.iata); if(f.arr) airports.push(f.arr.iata); });
    if(!list.length){
      out.innerHTML = `<p class="st-msg">No flights found for ${esc(title)} on that ${tab === 'flight' ? 'day' : 'date and time'}. ${tab === 'flight' ? 'Check the flight number and date.' : 'Try another time of day.'}</p>` + officialLinks(airlines, airports);
      return;
    }
    const head = `<div class="st-head"><b>${esc(title)}</b><span>${list.length} flight${list.length === 1 ? '' : 's'} · live data checked at ${when}</span><button type="button" class="st-refresh" data-refresh><i class="fa-solid fa-rotate"></i> Refresh</button></div>`;
    out.innerHTML = head + (tab === 'flight' ? list.map(flightCard).join('') : tab === 'route' ? list.map(flightCard).join('') : boardTable(list, params.dir)) + officialLinks(airlines.slice(0, 4), airports.slice(0, 4));
  }
  $('#stForm').addEventListener('submit', e => { e.preventDefault(); search(); });
  out.addEventListener('click', e => {
    if(e.target.closest('[data-refresh]')) return search();
    const t = e.target.closest('[data-track]');
    if(t){ setTab('flight'); $('#stNumber').value = t.dataset.track; search(); panel.scrollIntoView({ behavior:'smooth' }); }
  });
})();
