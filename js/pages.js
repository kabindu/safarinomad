/* =========================================================
   SafariNomad: small helpers for the destinations, deals
   and about pages. Fills any of these placeholders:

     <div data-trips-sale></div>              every trip with a "was" price
     <div data-last-minute></div>             last-minute departures

   Also: filter tabs on the flights & guides pages, and any
   <form data-mailto="Subject"> is saved on the server (admin.html),
   or sent as an email when the server isn't running.
   ========================================================= */

(function(){
  const { $$ } = SN;


  $$('[data-trips-sale]').forEach(el => {
    el.innerHTML = TRIPS.filter(t => t.was).map(SN.tripCard).join('');
  });

  $$('[data-flash-deals]').forEach(el => {
    el.innerHTML = TRIPS.filter(t => t.flash || t.was > t.price).sort((a, b) => !!b.flash - !!a.flash).map(t => SN.tripCard(t, true)).join('');
  });

  $$('[data-flash-sales]').forEach(el => {
    const list = TRIPS.filter(t => t.flash);
    el.innerHTML = list.map(SN.tripCard).join('');
    const sec = el.closest('section'); if(sec) sec.hidden = !list.length;
  });

  $$('[data-last-minute]').forEach(el => {
    el.innerHTML = LAST_MINUTE.map(SN.lastMinuteCard).join('');
  });

  /* ---------- Flight routes (flights page) and hotels (services page), from js/data.js ---------- */
  const stopsLabel = n => n ? '1 stop' : 'Direct';
  $$('[data-flights]').forEach(el => {
    el.innerHTML = FLIGHTS.map(f => `
      <a class="route-card" data-type="${f.region}" href="#flightSearch" data-from="${f.from}" data-to="${f.to}">
        <span class="fl-from"><b translate="no">${f.from}</b><small>${AIRPORTS[f.from]}</small></span>
        <i class="fa-solid fa-plane fl-plane"></i>
        <span class="fl-to"><b translate="no">${f.to}</b><small>${AIRPORTS[f.to]}</small></span>
        <span class="fl-time" translate="no">~${f.time}</span>
        <span class="fl-stops${f.stops ? '' : ' direct'}">${stopsLabel(f.stops)}</span>
        <span class="fl-go"><i class="fa-solid fa-magnifying-glass"></i></span>
      </a>`).join('');
  });

  $$('[data-hotels]').forEach(el => {
    el.innerHTML = HOTELS.map(h => `
      <article class="hotel-card" data-region="${h.city}">
        <div class="hc-img"><img src="images/${h.img}.jpg" alt="" loading="lazy"><span class="hc-type">${h.type}</span></div>
        <h3 translate="no">${h.name}</h3>
        <span class="hc-area"><i class="fa-solid fa-location-dot"></i> ${h.area}</span>
        <a class="btn btn-sm" href="contact.html?hotel=${encodeURIComponent(h.name)}">Request a room</a>
      </article>`).join('');
  });

  /* ---------- Filter tabs (flights: data-route, guides: data-region) ---------- */
  function tabFilter(tabsId, attr, cards){
    const tabs = document.getElementById(tabsId);
    if(!tabs) return;
    tabs.addEventListener('click', e => {
      const t = e.target.closest('.tab');
      if(!t) return;
      $$('.tab', tabs).forEach(x => x.classList.toggle('active', x === t));
      const v = t.dataset[attr];
      $$(cards).forEach(c => c.hidden = !!v && c.dataset[attr === 'route' ? 'type' : 'region'] !== v);
    });
  }
  tabFilter('routeTabs', 'route', '.route-card');
  tabFilter('guideTabs', 'region', '.guide-card');
  tabFilter('hotelTabs', 'region', '.hotel-card');


  /* ---------- <form data-mailto="Subject"> → opens an email ---------- */
  $$('form[data-mailto]').forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault();
    const status = form.querySelector('.contact-status');
    const say = (msg, err) => { status.textContent = msg; status.classList.add('show'); status.classList.toggle('error', !!err); };
    const missing = [...form.querySelectorAll('[required]')].find(i => !i.value.trim());
    if(missing){ say('Please fill in: ' + (form.querySelector(`label[for="${missing.id}"]`) || {}).textContent, true); missing.focus(); return; }
    const email = form.querySelector('input[type=email]');
    if(email && !SN.emailOk(email.value.trim())){ say('Please enter a valid email address.', true); email.focus(); return; }
    const entries = [...new FormData(form).entries()].filter(([, v]) => String(v).trim());
    const body = entries.map(([k, v]) => `${k}: ${v}`).join('\n');
    const first = (form.querySelector('[name="Route"]') || {}).value;
    try{
      await SN.sendEnquiry(form.dataset.mailto, Object.fromEntries(entries));
      say('Thank you! Your request is with our planners. We\'ll reply within 24 hours.');
    }catch(err){
      location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(form.dataset.mailto + (first ? ': ' + first : ''))}&body=${encodeURIComponent(body)}`;
      say('Your email app is opening with your request. Just hit send and we\'ll reply within 24 hours.');
    }
    form.reset();
  }));
})();
