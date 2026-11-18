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

  // Past departures are removed automatically (data.js), so this can be empty: say so instead of leaving a gap
  $$('[data-last-minute]').forEach(el => {
    if(LAST_MINUTE.length){ el.innerHTML = LAST_MINUTE.map(SN.lastMinuteCard).join(''); return; }
    el.classList.remove('card-grid');
    el.innerHTML = `<div class="empty-state show"><p><strong>No last-minute seats right now.</strong> We release them a few weeks before departure.</p>
      <p style="margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;"><a class="btn" href="trips.html">Browse all packages</a><a class="btn btn-outline" href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Ask on WhatsApp</a></p></div>`;
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

  /* ---------- Places to stay (accommodation.html): one section per setting ---------- */
  const stayBox = document.querySelector('[data-stays]');
  if(stayBox && typeof STAY_SETTINGS !== 'undefined'){
    const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const COUNTRY = { kenya:'Kenya', tanzania:'Tanzania', uganda:'Uganda', rwanda:'Rwanda' };
    const tier = n => `<span class="stay-tier" title="${['', 'Budget', 'Mid-range', 'Upper mid-range', 'Luxury'][n]}" translate="no">${'$'.repeat(n)}<i>${'$'.repeat(4 - n)}</i></span>`;
    const ask = name => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Hi SafariNomad! I'd like rates for ${name}.`)}`;
    // A stay, YouTube style: the whole card is one link (ask for rates), with a round icon for the setting,
    // the name, where it is and the budget level; WhatsApp sits on top as its own small button
    const card = (x, st) => `
      <article class="stay-card" data-country="${x.country}"${x.region ? ` data-region="${esc(x.region)}"` : ''}>
        <a class="stay-link" href="contact.html?hotel=${encodeURIComponent(x.name)}" aria-label="Ask for rates at ${esc(x.name)}"></a>
        <span class="stay-icon" aria-hidden="true"><i class="fa-solid ${st.icon}"></i></span>
        <div class="stay-text">
          <h3 translate="no">${esc(x.name)}</h3>
          <p class="stay-where">${esc(x.area)} · ${COUNTRY[x.country]}</p>
          <p class="stay-ask">${tier(x.tier)} <span class="stay-ask-go">Ask for rates <i class="fa-solid fa-arrow-right"></i></span></p>
        </div>
        <a class="stay-wa" href="${ask(x.name)}" target="_blank" rel="noopener" aria-label="Ask about ${esc(x.name)} on WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
      </article>`;
    stayBox.innerHTML = STAY_SETTINGS.map(st => {
      const list = STAYS.filter(x => x.setting === st.key);
      const regions = st.key === 'town' ? [...new Set(list.map(x => x.region))] : [];
      return `
      <section class="pt-0 stay-sec" id="${st.key}" data-setting="${st.key}">
        <div class="wrap">
          <div class="stay-banner">
            <img src="${st.img}" alt="${esc(st.imgAlt)}" loading="lazy">
            <div class="stay-banner-text">
              <span class="stay-count"><i class="fa-solid ${st.icon}"></i> ${list.length ? `${list.length} places` : 'On our camping safaris'}</span>
              <h2>${esc(st.label)}</h2>
              <p>${esc(st.intro)}</p>
              ${st.packages ? `<a class="btn" href="${st.packages}">See camping safaris</a>` : ''}
            </div>
          </div>
          ${regions.length > 1 ? `<div class="tabs stay-regions">${['', ...regions].map((r, i) => `<button class="tab${i ? '' : ' active'}" data-region="${esc(r)}">${r ? esc(r) : 'All cities'}</button>`).join('')}</div>` : ''}
          ${list.length ? `<div class="stay-grid">${list.map(x => card(x, st)).join('')}</div>` : ''}
          <p class="stay-none" hidden>None in this country yet. <a href="contact.html">Ask us</a> and we'll find one.</p>
        </div>
      </section>`;
    }).join('');
    // Jump links to each kind of stay
    const jump = document.getElementById('stayJump');
    if(jump) jump.innerHTML = STAY_SETTINGS.map(st => `<a href="#${st.key}"><i class="fa-solid ${st.icon}"></i> ${esc(st.short)}</a>`).join('');
    // Country filter (and the city tabs for town hotels)
    let country = '', region = '';
    const all = sel => Array.from(document.querySelectorAll(sel));
    const apply = () => {
      all('.stay-sec').forEach(sec => {
        const cards = Array.from(sec.querySelectorAll('.stay-card'));
        cards.forEach(c => { c.hidden = (!!country && c.dataset.country !== country) || (!!region && c.dataset.region !== undefined && c.dataset.region !== region); });
        const none = sec.querySelector('.stay-none');
        if(none) none.hidden = !cards.length || cards.some(c => !c.hidden);
      });
    };
    const ctry = document.getElementById('stayCountry');
    if(ctry) ctry.addEventListener('click', e => {
      const t = e.target.closest('.tab'); if(!t) return;
      Array.from(ctry.querySelectorAll('.tab')).forEach(x => x.classList.toggle('active', x === t));
      country = t.dataset.country; region = '';
      all('.stay-regions .tab').forEach((x, i) => x.classList.toggle('active', i === 0));
      apply();
    });
    stayBox.addEventListener('click', e => {
      const t = e.target.closest('.stay-regions .tab'); if(!t) return;
      all('.stay-regions .tab').forEach(x => x.classList.toggle('active', x === t));
      region = t.dataset.region; apply();
    });
    const wa = document.querySelector('[data-wa-stay]');
    if(wa) wa.href = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Hi SafariNomad! Can you suggest places to stay for my trip?')}`;
  }

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
