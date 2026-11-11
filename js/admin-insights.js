/* =========================================================
   SafariNomad admin: Insights (admin.html → Insights)
   ---------------------------------------------------------
   Everything is worked out in the browser from the admin data:
     · visits      server/data/analytics.json (daily totals sent by
                   js/main.js; no personal data is stored)
     · bookings, enquiries, unfinished leads (their own lists)
   Interactive: pick a period, hover the charts, switch a chart to a
   table, click a package or place to open the matching records.
   ========================================================= */

const AdminInsights = (function(){
  const DAY = 864e5;
  const nairobiDay = t => new Date(new Date(t).getTime() + 3 * 3600000).toISOString().slice(0, 10);
  const today = () => nairobiDay(Date.now());
  const addDays = (iso, n) => new Date(Date.parse(iso + 'T12:00:00Z') + n * DAY).toISOString().slice(0, 10);
  const fmtNum = n => n >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'K' : Math.round(n).toLocaleString('en-US');
  const usd = n => '$' + Math.round(n).toLocaleString('en-US');
  const fmtDay = (iso, o) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', Object.assign({ timeZone:'UTC', day:'numeric', month:'short' }, o));
  const RANGES = [[7, '7 days'], [30, '30 days'], [90, '90 days'], [365, '12 months']];
  let range = 30;
  try{ range = +localStorage.getItem('adm-range') || 30; }catch(e){}

  // Rough country from the visitor's time zone (the browser reports it; no IP is used)
  const TZ_COUNTRY = {
    'Europe/London':'United Kingdom', 'Europe/Dublin':'Ireland', 'Europe/Berlin':'Germany', 'Europe/Vienna':'Austria', 'Europe/Zurich':'Switzerland',
    'Europe/Paris':'France', 'Europe/Brussels':'Belgium', 'Europe/Amsterdam':'Netherlands', 'Europe/Madrid':'Spain', 'Europe/Lisbon':'Portugal',
    'Europe/Rome':'Italy', 'Europe/Stockholm':'Sweden', 'Europe/Oslo':'Norway', 'Europe/Copenhagen':'Denmark', 'Europe/Helsinki':'Finland',
    'Europe/Warsaw':'Poland', 'Europe/Prague':'Czechia', 'Europe/Budapest':'Hungary', 'Europe/Athens':'Greece', 'Europe/Istanbul':'Türkiye',
    'Africa/Nairobi':'Kenya', 'Africa/Dar_es_Salaam':'Tanzania', 'Africa/Kampala':'Uganda', 'Africa/Kigali':'Rwanda', 'Africa/Addis_Ababa':'Ethiopia',
    'Africa/Johannesburg':'South Africa', 'Africa/Lagos':'Nigeria', 'Africa/Cairo':'Egypt', 'Africa/Accra':'Ghana',
    'Asia/Dubai':'United Arab Emirates', 'Asia/Qatar':'Qatar', 'Asia/Riyadh':'Saudi Arabia', 'Asia/Kolkata':'India', 'Asia/Calcutta':'India',
    'Asia/Shanghai':'China', 'Asia/Hong_Kong':'Hong Kong', 'Asia/Singapore':'Singapore', 'Asia/Tokyo':'Japan', 'Asia/Seoul':'South Korea',
    'Australia/Sydney':'Australia', 'Australia/Melbourne':'Australia', 'Pacific/Auckland':'New Zealand',
    'America/New_York':'United States', 'America/Chicago':'United States', 'America/Denver':'United States', 'America/Los_Angeles':'United States',
    'America/Phoenix':'United States', 'America/Toronto':'Canada', 'America/Vancouver':'Canada', 'America/Sao_Paulo':'Brazil', 'America/Mexico_City':'Mexico'
  };
  const countryOf = tz => TZ_COUNTRY[tz] || (tz && tz.includes('/') ? tz.split('/')[0].replace('America', 'Americas') + ' (other)' : 'Unknown');
  let langNames = null;
  try{ langNames = new Intl.DisplayNames(['en'], { type:'language' }); }catch(e){}
  const langOf = l => { const code = String(l || '').split('-')[0]; try{ return (langNames && code && langNames.of(code)) || l || 'Unknown'; }catch(e){ return l || 'Unknown'; } };
  const COUNTRY = { kenya:'Kenya', tanzania:'Tanzania', uganda:'Uganda', rwanda:'Rwanda', multi:'Multi-country', world:'Beyond Africa' };
  const PAGE = { 'index.html':'Home', 'trips.html':'Packages', 'book.html':'Booking page', 'plan.html':'Customise your trip', 'flights.html':'Flights',
    'services.html':'Services', 'destinations.html':'Destinations', 'about.html':'About', 'contact.html':'Contact', 'blog.html':'Blog', 'deals.html':'Deals' };

  /* ---------- Numbers for a period ---------- */
  function period(data, from, to){
    const inside = t => { const d = nairobiDay(t); return d >= from && d <= to; };
    const a = { sessions:0, views:0, pages:{}, trips:{}, searches:{}, interests:{}, refs:{}, tz:{}, lang:{} };
    const days = (data.analytics && data.analytics.days) || {};
    Object.entries(days).forEach(([day, v]) => {
      if(day < from || day > to) return;
      a.sessions += v.sessions || 0; a.views += v.views || 0;
      ['pages', 'trips', 'searches', 'interests', 'refs', 'tz', 'lang'].forEach(k => Object.entries(v[k] || {}).forEach(([key, n]) => { a[k][key] = (a[k][key] || 0) + n; }));
    });
    const bookings = data.bookings.filter(b => inside(b.created));
    return {
      a, bookings,
      live: bookings.filter(b => b.status !== 'cancelled'),
      leads: (data.leads || []).filter(l => inside(l.created)),
      enquiries: data.enquiries.filter(e => inside(e.created))
    };
  }
  const delta = (now, before, upIsGood = true) => {
    if(!before) return now ? '<span class="ins-delta new">new</span>' : '';
    const pct = Math.round((now - before) / before * 100);
    if(!pct) return '<span class="ins-delta">same as before</span>';
    const good = (pct > 0) === upIsGood;
    return `<span class="ins-delta ${good ? 'up' : 'down'}"><i class="fa-solid fa-arrow-${pct > 0 ? 'up' : 'down'}" aria-hidden="true"></i> ${Math.abs(pct)}%</span>`;
  };
  const tally = (list, keyFn, weightFn = () => 1) => {
    const m = {};
    list.forEach(x => { [].concat(keyFn(x) || []).forEach(k => { if(k) m[k] = (m[k] || 0) + weightFn(x); }); });
    return m;
  };
  const top = (map, n = 50) => Object.entries(map).sort((x, y) => y[1] - x[1]).slice(0, n);

  // Places mentioned in custom trips / unfinished leads ("Serengeti (2n) → Zanzibar (3n)" or "1. Serengeti (Tanzania): 2 nights")
  function placesIn(text, places){
    const t = String(text || '');
    return places.filter(p => t.includes(p.name)).map(p => p.name);
  }

  /* ---------- Render ---------- */
  let ctx = null, el = null;
  function render(target, context){
    el = target; ctx = context;
    const { data, esc } = ctx;
    const to = today(), from = addDays(to, -(range - 1));
    const prevTo = addDays(from, -1), prevFrom = addDays(prevTo, -(range - 1));
    const P = period(data, from, to), Q = period(data, prevFrom, prevTo);
    const trips = Object.fromEntries((data.trips || []).map(t => [t.id, t]));
    const places = data.places || [];
    const since = data.analytics && data.analytics.since;
    const conv = P.a.sessions ? P.bookings.length / P.a.sessions * 100 : 0;
    const convPrev = Q.a.sessions ? Q.bookings.length / Q.a.sessions * 100 : 0;
    const value = P.live.reduce((s, b) => s + (b.total || 0), 0), valuePrev = Q.live.reduce((s, b) => s + (b.total || 0), 0);
    const openLeads = P.leads.filter(l => l.status === 'open').length;

    // Daily (or weekly, for 12 months) series
    const step = range > 90 ? 7 : 1;
    const buckets = [];
    for(let d = from; d <= to; d = addDays(d, step)) buckets.push(d);
    const dayData = (data.analytics && data.analytics.days) || {};
    const visitsSeries = buckets.map(d => { let n = 0; for(let i = 0; i < step; i++){ const k = addDays(d, i); if(k <= to) n += (dayData[k] || {}).sessions || 0; } return { key:d, value:n }; });
    const bookSeries = buckets.map(d => { const end = addDays(d, step - 1); return { key:d, value:P.bookings.filter(b => { const x = nairobiDay(b.created); return x >= d && x <= end; }).length }; });

    // Packages: most booked (requests, travellers) and most opened
    const booked = tally(P.bookings, b => b.trip);
    const travellers = tally(P.bookings, b => b.trip, b => b.adults + b.children);
    const title = id => (trips[id] && trips[id].title) || id;
    // Destinations: bookings + unfinished leads + custom trips, by country; places from custom routes and links
    const leadTrip = l => { const t = (data.trips || []).find(x => l.fields && x.title === l.fields.Trip); return t ? t.id : null; };
    const countryRequests = {};
    const addCountry = (c, n = 1) => { if(c) countryRequests[COUNTRY[c] || c] = (countryRequests[COUNTRY[c] || c] || 0) + n; };
    P.bookings.forEach(b => addCountry((trips[b.trip] || {}).country));
    P.leads.forEach(l => { const id = leadTrip(l); if(id) addCountry(trips[id].country); placesIn(l.fields && l.fields.Route, places).forEach(n => addCountry((places.find(p => p.name === n) || {}).country)); });
    P.enquiries.filter(e => e.type === 'Custom trip').forEach(e => placesIn(e.fields.Route, places).forEach(n => addCountry((places.find(p => p.name === n) || {}).country)));
    const placeCounts = {};
    [...P.leads.map(l => l.fields && l.fields.Route), ...P.enquiries.filter(e => e.type === 'Custom trip').map(e => e.fields.Route)]
      .forEach(r => placesIn(r, places).forEach(n => { placeCounts[n] = (placeCounts[n] || 0) + 1; }));
    Object.entries(P.a.interests).forEach(([k, n]) => {
      if(k.startsWith('place:')) placeCounts[k.slice(6)] = (placeCounts[k.slice(6)] || 0) + n;
      if(k.startsWith('country:')) addCountry(k.slice(8), n);
    });
    const regions = tally(Object.entries(P.a.tz), ([tz]) => countryOf(tz), ([, n]) => n);
    const langs = tally(Object.entries(P.a.lang), ([l]) => langOf(l), ([, n]) => n);
    const startedBooking = P.leads.filter(l => !l.source || l.source === 'Booking').length + P.bookings.length;
    const opened = Object.values(P.a.trips).reduce((s, n) => s + n, 0);

    const stat = (label, val, d, go, icon) => `<button class="ins-stat" ${go ? `data-go="${go}"` : ''}><span class="ins-stat-l"><i class="fa-solid ${icon}" aria-hidden="true"></i> ${label}</span><b>${val}</b>${d}</button>`;
    const noVisits = !Object.keys(dayData).length;
    el.innerHTML = `
      <div class="ins-bar">
        <div class="seg ins-range" role="tablist" aria-label="Period">${RANGES.map(([n, l]) => `<button type="button" data-range="${n}" class="${n === range ? 'on' : ''}" aria-selected="${n === range}">${l}</button>`).join('')}</div>
        <span class="ins-since"><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${fmtDay(from, { year:'numeric' })} – ${fmtDay(to, { year:'numeric' })} · compared with the ${range} days before${since ? ` · visits counted since ${fmtDay(since, { year:'numeric' })}` : ''}</span>
      </div>
      ${noVisits ? `<p class="tip"><i class="fa-solid fa-circle-info"></i> Visit counting has just been switched on. Visits, searches and regions fill in as people use the website; bookings and leads below already use your saved records.</p>` : ''}
      <div class="ins-stats">
        ${stat('Visits', fmtNum(P.a.sessions), delta(P.a.sessions, Q.a.sessions), '', 'fa-user-group')}
        ${stat('Page views', fmtNum(P.a.views), delta(P.a.views, Q.a.views), '', 'fa-eye')}
        ${stat('Booking requests', fmtNum(P.bookings.length), delta(P.bookings.length, Q.bookings.length), 'bookings:all', 'fa-calendar-check')}
        ${stat('Visits that booked', conv ? conv.toFixed(1) + '%' : '–', P.a.sessions && Q.a.sessions ? delta(conv, convPrev) : '', '', 'fa-percent')}
        ${stat('Requested value', usd(value), delta(value, valuePrev), 'bookings:all', 'fa-sack-dollar')}
        ${stat('Unfinished, open', fmtNum(openLeads), '', 'leads:open', 'fa-user-clock')}
      </div>
      <div class="ins-grid2">
        ${chartCard('visits', `Visits per ${step === 7 ? 'week' : 'day'}`, 'Each visit is one browsing session.', visitsSeries, 'visit')}
        ${chartCard('bookings', `Booking requests per ${step === 7 ? 'week' : 'day'}`, 'Requests sent from the booking page.', bookSeries, 'booking request')}
      </div>
      <div class="ins-card">
        <h3>From visit to booking</h3>
        <p class="ins-sub">How many visits reach each step in this period.</p>
        ${funnel([['Visits', P.a.sessions], ['Opened a package', opened], ['Started a booking', startedBooking], ['Sent a booking request', P.bookings.length]])}
      </div>
      <div class="ins-grid3">
        ${rank('Most booked packages', 'Booking requests · travellers', top(booked).map(([id, n]) => ({ label:title(id), value:n, note:`${travellers[id]} traveller${travellers[id] === 1 ? '' : 's'}`, go:'bookings:all:' + title(id) })), 'No booking requests in this period.')}
        ${rank('Most viewed packages', 'Times the booking page was opened', top(P.a.trips).map(([id, n]) => ({ label:title(id), value:n, note:booked[id] ? `${booked[id]} booked` : 'not booked yet', go:'bookings:all:' + title(id) })), 'No package views counted yet.')}
        ${rank('Most requested destinations', 'Bookings, unfinished bookings, custom trips and browsing', top(countryRequests).map(([c, n]) => ({ label:c, value:n })), 'No destination requests yet.')}
        ${rank('Places travellers ask for', 'From custom trips and park links', top(placeCounts).map(([p, n]) => ({ label:p, value:n, go:'leads:all:' + p })), 'No places requested yet.')}
        ${rank('What people search for', 'Words typed in the site search', top(P.a.searches).map(([q, n]) => ({ label:q, value:n, href:'trips.html?q=' + encodeURIComponent(q) })), 'No searches counted yet.')}
        ${rank('Where visitors are', 'From the time zone their device reports', top(regions).map(([c, n]) => ({ label:c, value:n })), 'No visits counted yet.')}
        ${rank('How they found you', 'The website they came from', top(P.a.refs).map(([r, n]) => ({ label:r, value:n })), 'No visits counted yet.')}
        ${rank('Most visited pages', 'Page views', top(P.a.pages).map(([p, n]) => ({ label:PAGE[p] || p, value:n, href:p })), 'No page views counted yet.')}
        ${rank('Languages', 'The language their browser uses', top(langs).map(([l, n]) => ({ label:l, value:n })), 'No visits counted yet.')}
      </div>`;
    drawCharts();
  }

  /* ---------- Column chart (one series, one axis) with hover and a table view ---------- */
  const series = {};
  function chartCard(id, title, sub, data, unit){
    series[id] = { data, unit };
    const total = data.reduce((s, x) => s + x.value, 0);
    return `<div class="ins-card">
      <div class="ins-card-head"><div><h3>${title}</h3><p class="ins-sub">${sub} <b>${fmtNum(total)}</b> in total.</p></div>
        <button type="button" class="ins-toggle" data-table="${id}" aria-pressed="false"><i class="fa-solid fa-table"></i> Table</button></div>
      <div class="ins-chart" id="chart-${id}" role="img" aria-label="${title}: ${fmtNum(total)} in total"></div>
      <div class="ins-table" id="table-${id}" hidden>
        <table><thead><tr><th>${data.length && range > 90 ? 'Week of' : 'Day'}</th><th>${unit[0].toUpperCase() + unit.slice(1)}s</th></tr></thead>
        <tbody>${data.slice().reverse().map(x => `<tr><td>${fmtDay(x.key, { weekday:'short' })}</td><td>${x.value}</td></tr>`).join('')}</tbody></table>
      </div>
    </div>`;
  }
  function niceMax(v){
    if(v <= 4) return 4;
    const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }
  function drawCharts(){
    Object.entries(series).forEach(([id, s]) => {
      const box = el.querySelector('#chart-' + id);
      if(!box) return;
      const W = Math.max(280, box.clientWidth), H = 190, padL = 34, padB = 24, padT = 10;
      const n = s.data.length, max = niceMax(Math.max(...s.data.map(x => x.value), 0));
      const band = (W - padL) / n, bar = Math.max(2, Math.min(24, band - 2));
      const y = v => padT + (H - padT - padB) * (1 - v / max);
      const ticks = [0, max / 2, max];
      const every = Math.ceil(n / 6);
      let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
      ticks.forEach(t => { svg += `<line x1="${padL}" x2="${W}" y1="${y(t)}" y2="${y(t)}" class="ins-grid"/><text x="${padL - 6}" y="${y(t) + 4}" text-anchor="end" class="ins-axis">${fmtNum(t)}</text>`; });
      s.data.forEach((x, i) => {
        const cx = padL + band * i + band / 2, top = y(x.value), base = y(0), r = Math.min(4, bar / 2, base - top);
        if(x.value > 0){
          // Rounded top, square at the baseline
          svg += `<path class="ins-col" d="M${cx - bar / 2},${base} V${top + r} Q${cx - bar / 2},${top} ${cx - bar / 2 + r},${top} H${cx + bar / 2 - r} Q${cx + bar / 2},${top} ${cx + bar / 2},${top + r} V${base} Z"/>`;
        }
        if(i % every === 0) svg += `<text x="${cx}" y="${H - 6}" text-anchor="middle" class="ins-axis">${fmtDay(x.key)}</text>`;
        svg += `<rect class="ins-hit" x="${padL + band * i}" y="${padT}" width="${band}" height="${H - padT - padB}" data-i="${i}"/>`;
      });
      svg += `<line x1="${padL}" x2="${W}" y1="${y(0)}" y2="${y(0)}" class="ins-base"/></svg><div class="ins-tip" hidden></div>`;
      box.innerHTML = svg;
      const tip = box.querySelector('.ins-tip');
      box.onmousemove = e => {
        const hit = e.target.closest('.ins-hit');
        box.querySelectorAll('.ins-hit.on').forEach(h => h.classList.remove('on'));
        if(!hit){ tip.hidden = true; return; }
        hit.classList.add('on');
        const x = s.data[+hit.dataset.i];
        tip.innerHTML = `<b>${x.value}</b> ${s.unit}${x.value === 1 ? '' : 's'}<small>${range > 90 ? 'Week of ' : ''}${fmtDay(x.key, { weekday:'short', year:'numeric' })}</small>`;
        tip.hidden = false;
        const bx = box.getBoundingClientRect();
        tip.style.left = Math.min(bx.width - tip.offsetWidth, Math.max(0, e.clientX - bx.left - tip.offsetWidth / 2)) + 'px';
        tip.style.top = Math.max(0, y(x.value) - tip.offsetHeight - 8) + 'px';
      };
      box.onmouseleave = () => { tip.hidden = true; box.querySelectorAll('.ins-hit.on').forEach(h => h.classList.remove('on')); };
    });
  }

  /* ---------- Funnel and ranked lists (bars with the value at the tip) ---------- */
  function funnel(steps){
    const first = steps[0][1] || Math.max(...steps.map(s => s[1]), 1);
    return `<div class="ins-funnel">${steps.map(([label, n]) => {
      const raw = first ? n / first * 100 : 0, pct = raw > 0 && raw < 1 ? raw.toFixed(1) : Math.round(raw);   // small steps keep one decimal (0.5%, not 0%)
      return `<div class="ins-f-row"><span class="ins-f-l">${label}</span><span class="ins-track"><i style="width:${Math.min(100, first ? n / first * 100 : 0)}%"></i></span><span class="ins-f-v"><b>${fmtNum(n)}</b>${steps[0][1] ? `<small>${pct}%</small>` : ''}</span></div>`;
    }).join('')}</div>`;
  }
  function rank(title, sub, rows, emptyText){
    const { esc } = ctx;
    const max = Math.max(...rows.map(r => r.value), 1);
    const row = (r, i) => {
      const inner = `<span class="ins-r-n">${i + 1}</span><span class="ins-r-main"><span class="ins-r-l">${esc(r.label)}</span><span class="ins-track"><i style="width:${r.value / max * 100}%"></i></span></span><span class="ins-r-v"><b>${fmtNum(r.value)}</b>${r.note ? `<small>${esc(r.note)}</small>` : ''}</span>`;
      if(r.go) return `<button type="button" class="ins-r" data-go="${esc(r.go)}" title="Open the matching records">${inner}</button>`;
      if(r.href) return `<a class="ins-r" href="${esc(r.href)}" target="_blank" rel="noopener" title="Open on the website">${inner}</a>`;
      return `<div class="ins-r">${inner}</div>`;
    };
    return `<div class="ins-card ins-rank">
      <h3>${title}</h3><p class="ins-sub">${sub}</p>
      ${rows.length ? `<div class="ins-rows">${rows.slice(0, 6).map(row).join('')}${rows.length > 6 ? `<div class="ins-more" hidden>${rows.slice(6).map((r, i) => row(r, i + 6)).join('')}</div><button type="button" class="ins-expand" data-n="${rows.length}">Show all ${rows.length}</button>` : ''}</div>`
        : `<p class="ins-empty">${emptyText}</p>`}
    </div>`;
  }

  /* ---------- Clicks: period, table view, show all, open records ---------- */
  document.addEventListener('click', e => {
    if(!el || !el.contains(e.target) || !el.querySelector('.ins-bar')) return;   // only while Insights is on screen
    const r = e.target.closest('[data-range]');
    if(r){ range = +r.dataset.range; try{ localStorage.setItem('adm-range', range); }catch(x){} return render(el, ctx); }
    const t = e.target.closest('[data-table]');
    if(t){
      const id = t.dataset.table, tbl = el.querySelector('#table-' + id), chart = el.querySelector('#chart-' + id);
      const show = tbl.hidden; tbl.hidden = !show; chart.hidden = show; t.setAttribute('aria-pressed', show);
      t.innerHTML = show ? '<i class="fa-solid fa-chart-column"></i> Chart' : '<i class="fa-solid fa-table"></i> Table';
      if(!show) drawCharts();
      return;
    }
    const x = e.target.closest('.ins-expand');
    if(x){ const more = x.previousElementSibling; more.hidden = !more.hidden; x.textContent = more.hidden ? `Show all ${x.dataset.n}` : 'Show fewer'; return; }
    const g = e.target.closest('[data-go]');
    if(g && ctx.go){ e.stopPropagation(); const [v, f, ...q] = g.dataset.go.split(':'); ctx.go(v, f, q.join(':')); }
  }, true);
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if(el && el.isConnected && el.querySelector('.ins-chart')) drawCharts(); }, 150); });

  return { render };
})();
