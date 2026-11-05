/* =========================================================
   SafariNomad: shared header & footer
   ---------------------------------------------------------
   The header, dropdown menus, mobile drawer and footer are
   built ONCE here and inserted into every page.

   ► To change a menu, edit the MENU list just below.
     Each top item has:
       label, href   the header link (clicking it opens that page)
       links         [[text, url], …] the short list shown on hover

   Each page only needs:
     <body data-page="home">      (home, trips, destinations,
                                    deals, about, contact, blog)
     <div id="site-header"></div>
     <div id="site-footer"></div>
   ========================================================= */

// Main menu. Each item opens a full-width panel: columns of links on the left, one
// highlighted card on the right. Numbers (trip counts, from-prices, ratings, flight
// times) are worked out from js/data.js, so the menu stays right when trips change.
// Each link is [text, url, note, icon]; note and icon are optional.
// (The phone drawer and site search use the same links, flattened to [text, url].)
const MENU_FACTS = (function(){
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const from = list => list.length ? Math.min(...list.map(t => t.price)) : 0;
  const price = usd => `<b data-usd="${usd}"></b>`;
  const score = t => (t.rating || 0) * Math.log10((t.reviews || 0) + 10);
  const month = new Date().getMonth() + 1;
  const reviews = TRIPS.reduce((n, t) => n + (t.reviews || 0), 0);
  const rating = reviews ? TRIPS.reduce((n, t) => n + (t.rating || 0) * (t.reviews || 0), 0) / reviews : 0;
  const onSale = TRIPS.filter(t => t.was > t.price);
  const mins = s => { const m = /(\d+)h\s*(\d+)?/.exec(s || ''); return m ? +m[1] * 60 + (+m[2] || 0) : 1e9; };
  const direct = FLIGHTS.filter(f => f.region === 'europe' && !f.stops).sort((a, b) => mins(a.time) - mins(b.time));
  return {
    plural, price, month: MONTH_NAMES[month - 1],
    trips: TRIPS.length,
    country: c => { const l = TRIPS.filter(t => t.country === c); return l.length ? `${plural(l.length, 'trip')} · from ${price(from(l))}` : ''; },
    style: s => TRIPS.filter(t => t.styles.includes(s)).length,
    // The busiest parks in a country, with how many trips visit each
    places: c => PLACES.filter(p => p.country === c).map(p => {
      const re = new RegExp(p.match, 'i');
      return [p.name, `trips.html?q=${encodeURIComponent(p.match.split('|')[0])}`, TRIPS.filter(t => re.test(`${t.title} ${t.route || ''}`)).length];
    }).filter(p => p[2]).sort((a, b) => b[2] - a[2]).slice(0, 6),
    bestNow: TRIPS.filter(t => (t.months || []).includes(month) && t.days >= 5).sort((a, b) => score(b) - score(a)).slice(0, 3),
    onSale: onSale.length,
    topDeals: onSale.slice().sort((a, b) => b.was / b.price - a.was / a.price).slice(0, 3),
    topPicks: TRIPS.filter(t => t.featured).sort((a, b) => score(b) - score(a)).slice(0, 4),
    lengths: Object.entries(DURATIONS).map(([k, d]) => [d.label, `trips.html?len=${k}`, TRIPS.filter(t => d.fits(t.days)).length]),
    under: max => TRIPS.filter(t => t.price <= max).length,
    lastMinute: LAST_MINUTE.length,
    rating: rating.toFixed(1), reviews: (Math.floor(reviews / 100) * 100).toLocaleString('en-US') + '+',
    direct: direct.length, fastest: direct[0]
  };
})();

const MENU = (function(f){
  // Cards on the right rotate through several items (js below); `slides` = trips, `imgs` = photos on a note card
  const best = { slides: (f.bestNow.length ? f.bestNow : TRIPS.slice(0, 3)).map(trip => ({ eyebrow:`Best in ${f.month}`, trip })) };
  const deals = f.topDeals.length ? { slides: f.topDeals.map(trip => ({ eyebrow:`Save ${Math.round((1 - trip.price / trip.was) * 100)}%`, trip })) } : best;
  return [
    { key:'trips', label:'Packages', href:'trips.html', all:[`See all ${f.trips} packages`, 'trips.html'],
      feature:{ slides: f.topPicks.map(trip => ({ eyebrow:'Top pick', trip })) },
      cols:[
        { title:'By travel style', href:'trips.html', compact:true, links:[
          ['Wildlife safaris', 'trips.html?style=wildlife', f.style('wildlife')],
          ['Gorillas & primates', 'trips.html?style=gorilla', f.style('gorilla')],
          ['Safari & beach', 'trips.html?style=beach', f.style('beach')],
          ['Kilimanjaro & treks', 'trips.html?style=trek', f.style('trek')],
          ['Family', 'trips.html?style=family', f.style('family')],
          ['Luxury & honeymoon', 'trips.html?style=luxury', f.style('luxury')],
          ['Budget camping', 'trips.html?style=camping', f.style('camping')],
          ['Adventure & sport', 'trips.html?style=adventure', f.style('adventure')],
          ['Holidays abroad', 'trips.html?style=abroad', f.style('abroad')]
        ].filter(l => l[2]) },
        { title:'By length', href:'trips.html', compact:true, links:f.lengths.filter(l => l[2]) },
        { title:'By budget', href:'trips.html', compact:true, links:[500, 1000, 2000, 3500].map(n => [`Under $${n.toLocaleString('en-US')}`, `trips.html?max=${n}`, f.under(n)]).filter(l => l[2]) },
        { title:'Ready to go', links:[
          ['Flash deals', 'services.html#flash-deals', f.onSale ? `${f.plural(f.onSale, 'package')} on sale now` : 'Time-limited offers', 'fa-bolt'],
          ['Top picks', 'index.html#packages', 'Our most-loved packages', 'fa-star'],
          ['Customise your own', 'plan.html', 'Build it and see the price', 'fa-sliders']
        ] }
      ] },
    { key:'destinations', label:'Destinations', href:'destinations.html', all:[`See all ${f.trips} trips`, 'trips.html'],
      feature:best,
      cols:[
        ...['kenya', 'tanzania', 'uganda', 'rwanda'].map(c => ({ title:COUNTRY_NAMES[c], href:`trips.html?country=${c}`, meta:f.country(c), compact:true, links:f.places(c) })),
        { title:'Ways to travel', href:'trips.html', compact:true, links:[
          ['Multi-country', 'trips.html?country=multi', TRIPS.filter(t => t.country === 'multi').length],
          ['Gorillas & primates', 'trips.html?style=gorilla', f.style('gorilla')],
          ['Safari & beach', 'trips.html?style=beach', f.style('beach')],
          ['Kilimanjaro & treks', 'trips.html?style=trek', f.style('trek')],
          ['Luxury', 'trips.html?style=luxury', f.style('luxury')],
          ['Adventure & sport', 'trips.html?style=adventure', f.style('adventure')],
          ['Beyond Africa', 'trips.html?country=world', TRIPS.filter(t => t.country === 'world').length],
          ['Customise your own package', 'plan.html', '']
        ] }
      ] },
    { key:'services', label:'Services', href:'services.html', all:['See all services', 'services.html'],
      feature:deals,
      cols:[
        { title:'Save', links:[
          ['Flash deals', 'services.html#flash-deals', f.onSale ? `${f.plural(f.onSale, 'trip')} on sale now` : 'Time-limited offers', 'fa-bolt'],
          ['Last-minute departures', 'services.html#last-minute', f.lastMinute ? `${f.plural(f.lastMinute, 'departure')} with seats left` : 'Seats released close to departure', 'fa-hourglass-half']
        ] },
        { title:'On safari', links:[
          ['Safari vehicles', 'services.html#vehicles', 'Pop-top Land Cruisers, a window seat each', 'fa-van-shuttle'],
          ['Accommodation', 'services.html#stays', 'From park campsites to luxury lodges', 'fa-bed'],
          ['City & beach hotels', 'services.html#hotels', 'Before and after your safari', 'fa-hotel']
        ] },
        { title:'Guides', links:[
          ['Tour guides', 'services.html#guides', 'Certified and born in the region', 'fa-id-badge'],
          ['Hire a private guide', 'services.html#private', 'Your own 4x4 and your own schedule', 'fa-compass'],
          ['Our standards', 'services.html#quality', 'The same promise on every trip', 'fa-shield-halved']
        ] }
      ] },
    { key:'flights', label:'Flights', href:'flights.html', all:['Search flights', 'flights.html#flightSearch'],
      feature:{ icon:'fa-plane-departure', eyebrow:'Getting here', title: f.fastest ? `${f.direct} direct routes from Europe` : 'Flights to East Africa',
        text: f.fastest ? `The fastest takes ${f.fastest.time}, ${f.fastest.from} to ${f.fastest.to}. Tell us your dates and we'll compare fares for you.` : 'Tell us your dates and we\'ll compare fares for you.',
        cta:['Request flights', 'flights.html#request'],
        imgs:['images/hero/flights-kenya-airways-hd.jpg', 'images/vehicle-bush-plane.jpg', 'images/hero/flights-wing-clouds-hd.jpg'] },
      cols:[
        { title:'Getting here', links:[
          ['Flights from Europe', 'flights.html#routes', f.direct ? `${f.direct} direct routes` : 'Direct and one-stop routes', 'fa-plane-arrival'],
          ['Search & compare', 'flights.html#flightSearch', 'Fares for your dates', 'fa-magnifying-glass']
        ] },
        { title:'Getting around', links:[
          ['Within East Africa', 'flights.html#routes', 'City, park and island hops', 'fa-route'],
          ['Light-aircraft flights', 'services.html#vehicles', 'Fly straight into the parks', 'fa-plane']
        ] },
        { title:'Before you fly', links:[
          ['Visas & passports', 'flights.html#visas', 'Entry rules for each country', 'fa-passport'],
          ['Let us book your flights', 'flights.html#request', 'We book and track them for you', 'fa-headset']
        ] }
      ] },
    { key:'about', label:'About', href:'about.html', all:['About SafariNomad', 'about.html'],
      feature:{ icon:'fa-comments', eyebrow:'Talk to a planner', title:SITE.phone, text:`${SITE.hoursText}. Our Nairobi-based specialists answer.`,
        cta:['Chat on WhatsApp', `https://wa.me/${SITE.whatsapp}`], href:`tel:${SITE.phoneLink}`,
        imgs:['images/vehicle-landcruiser.jpg', 'images/safari-lodge.jpg', 'images/safari-vehicle.jpg'] },
      cols:[
        { title:'SafariNomad', links:[
          ['Our story', 'about.html#story', 'From one Land Cruiser to 12,000 travellers', 'fa-seedling'],
          ['Traveller reviews', 'about.html#reviews', `${f.rating}/5 from ${f.reviews} reviews`, 'fa-star'],
          ['Blog', 'blog.html', 'Guides and stories from the field', 'fa-newspaper']
        ] },
        { title:'Book & ask', links:[
          ['Book your dates', 'book.html', 'Live departures and seats left', 'fa-calendar-check'],
          ['FAQ', 'about.html#faqs', 'Deposits, visas, packing and more', 'fa-circle-question'],
          ['Contact us', 'contact.html', 'A free tailored plan within 24 hours', 'fa-envelope']
        ] }
      ] }
  ];
})(MENU_FACTS);
MENU.forEach(m => { m.links = m.cols.flatMap(c => c.links.map(([t, h]) => [t, h])); });

(function(){
  const s = SITE;
  const esc = str => String(str).replace(/&/g,'&amp;');

  const links = m => m.links.map(([txt, h]) => `<a href="${h}">${esc(txt)}</a>`).join('');
  const SOCIAL = { facebook:['Facebook','fa-facebook-f'], instagram:['Instagram','fa-instagram'], youtube:['YouTube','fa-youtube'], tiktok:['TikTok','fa-tiktok'], x:['X','fa-x-twitter'] };
  const social = keys => keys.map(k => `<a href="${s.social[k]}" target="_blank" rel="noopener" aria-label="${SOCIAL[k][0]}"><i class="fa-brands ${SOCIAL[k][1]}"></i></a>`).join('');

  // Desktop: the label is a real link; hovering (or keyboard focus) opens a full-width panel under the header
  // A compact link (place name + trip count) or a rich one (icon, name, one-line note)
  const dropLink = ([t, h, note, icon], compact) => compact
    ? `<li><a class="drop-place" href="${h}"><span>${esc(t)}</span>${note !== '' && note != null ? `<small>${note}</small>` : ''}</a></li>`
    : `<li><a class="drop-link" href="${h}">${icon ? `<i class="fa-solid ${icon}" aria-hidden="true"></i>` : ''}<span><b>${esc(t)}</b>${note ? `<small>${note}</small>` : ''}</span></a></li>`;
  const arrow = '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
  // The card on the right: trips that take turns (photo, price, link to its dates), or a short note with an
  // action and photos that take turns. Only the visible slide is focusable.
  const tripCard = (x, on) => `<a class="drop-feature df-slide${on ? ' on' : ''}" href="book.html?trip=${x.trip.id}"${on ? '' : ' tabindex="-1" aria-hidden="true"'}>
        <span class="df-img"><img src="${x.trip.img}" alt="" loading="lazy"></span>
        <span class="df-body"><span class="df-eyebrow">${esc(x.eyebrow)}</span><b>${esc(x.trip.title)}</b>
          <span class="df-meta">${x.trip.days} days · from <b data-usd="${x.trip.price}"></b>${x.trip.was > x.trip.price ? ` <s data-usd="${x.trip.was}"></s>` : ''}</span>
          <span class="df-cta">View dates ${arrow}</span></span>
      </a>`;
  const dots = n => n > 1 ? `<span class="df-dots" aria-hidden="true">${Array.from({ length:n }, (_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</span>` : '';
  const dropFeature = x => x.slides
    ? `<div class="df-stack" data-rotate>${x.slides.map((sl, i) => tripCard(sl, i === 0)).join('')}${dots(x.slides.length)}</div>`
    : `<div class="drop-feature df-note${x.imgs ? ' df-pics' : ''}">
        ${x.imgs ? `<span class="df-img df-photos" data-rotate>${x.imgs.map((src, i) => `<img src="${src}" alt="" loading="lazy"${i ? '' : ' class="on"'}>`).join('')}${dots(x.imgs.length)}</span>` : ''}
        <span class="df-note-body">
        <i class="fa-solid ${x.icon} df-icon" aria-hidden="true"></i>
        <span class="df-eyebrow">${esc(x.eyebrow)}</span>
        ${x.href ? `<a class="df-title" href="${x.href}">${esc(x.title)}</a>` : `<b class="df-title">${esc(x.title)}</b>`}
        <p>${esc(x.text)}</p>
        <a class="btn btn-sm" href="${x.cta[1]}"${/^https?:/.test(x.cta[1]) ? ' target="_blank" rel="noopener"' : ''}>${esc(x.cta[0])}</a>
        </span>
      </div>`;

  const megaPanel = m => `
      <div class="drop"><div class="drop-panel"><div class="drop-inner">
        <div class="drop-main">
          <div class="drop-cols" style="--cols:${m.cols.length}">
            ${m.cols.map(c => `
            <div class="drop-col">
              ${c.href ? `<a class="drop-head" href="${c.href}">` : '<div class="drop-head">'}<span>${esc(c.title)}</span>${c.meta ? `<small>${c.meta}</small>` : ''}${c.href ? '</a>' : '</div>'}
              <ul>${c.links.map(l => dropLink(l, c.compact)).join('')}</ul>
            </div>`).join('')}
          </div>
          <a class="drop-all" href="${m.all[1]}">${esc(m.all[0])} ${arrow}</a>
        </div>
        ${dropFeature(m.feature)}
      </div></div></div>`;

  const desktopMenu = MENU.map(m => `
    <div class="nav-item has-drop" data-nav="${m.key}">
      <a class="nav-trigger" href="${m.href}" aria-haspopup="true" aria-expanded="false"><span>${m.label}</span><i class="fa-solid fa-chevron-down chev"></i></a>
      ${megaPanel(m)}
    </div>`).join('');

  // Phone drawer: tap the name to open the page, or the arrow for the short list
  const mobileMenu = MENU.map(m => `
    <div class="d-item">
      <div class="d-row"><a href="${m.href}">${m.label}</a>${m.links ? `<button type="button" class="d-toggle" aria-expanded="false" aria-label="${m.label}"><i class="fa-solid fa-chevron-down"></i></button>` : ''}</div>
      ${m.links ? `<div class="d-sub" hidden>${links(m)}</div>` : ''}
    </div>`).join('');

  const header = `
<header class="site-header" id="siteHeader">
  <div class="util-bar">
    <div class="util-inner">
      <a href="tel:${s.phoneLink}"><i class="fa-solid fa-phone"></i> ${s.phone}</a>
      <a href="about.html#faqs">Help &amp; FAQs</a>
      <div class="util-drop">
        <button class="util-lang" aria-label="Language and currency"><i class="fa-solid fa-globe"></i> <span id="langLabel">EN</span> · <span id="curLabel">USD $</span></button>
        <div class="util-menu">
          <div class="util-title">Language</div>
          <div id="langMenu">
            <button data-lang="en" class="active">English</button>
            <button data-lang="fr">Français</button>
            <button data-lang="es">Español</button>
            <button data-lang="de">Deutsch</button>
          </div>
          <div class="util-title">Currency</div>
          <div id="curMenu">
            <button data-currency="USD" class="active">USD $</button>
            <button data-currency="EUR">EUR €</button>
          </div>
        </div>
      </div>
      <a class="util-saved" href="trips.html?saved=1"><i class="fa-regular fa-heart"></i> Saved <b id="wishCount">0</b></a>
    </div>
  </div>
  <div class="nav">
    <button class="burger" id="burger" aria-label="Open menu" aria-expanded="false"><i class="fa-solid fa-bars"></i></button>
    <a class="logo" href="index.html" aria-label="SafariNomad home"><i class="fa-solid fa-paw"></i><span>SafariNomad</span></a>

    <nav class="menu-bar" aria-label="Main">
      <div class="nav-item" data-nav="home"><a class="nav-trigger nav-home" href="index.html" title="Home"><i class="fa-solid fa-house"></i><span>Home</span></a></div>
      ${desktopMenu}
    </nav>

    <div class="nav-right">
      <form class="yt-search" id="ytSearch" role="search" action="trips.html" autocomplete="off">
        <button class="yt-back" type="button" aria-label="Close search"><i class="fa-solid fa-arrow-left"></i></button>
        <div class="yt-box">
          <i class="fa-solid fa-magnifying-glass yt-lead" aria-hidden="true"></i>
          <input type="search" name="q" placeholder="Search trips, parks, animals" aria-label="Search the site (press /)" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="ytSugg" spellcheck="false">
          <button class="yt-clear" type="button" aria-label="Clear search"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <button class="yt-go" type="submit" aria-label="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
        <div class="yt-sugg" id="ytSugg" role="listbox" hidden></div>
      </form>
      <button class="hdr-icon show-mob" type="button" data-open-search aria-label="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
      <a class="hdr-icon show-mob" href="trips.html?saved=1" aria-label="Saved trips"><i class="fa-regular fa-heart"></i></a>
      <a class="btn btn-sm hide-sm" href="plan.html"><span>Customise your trip</span></a>
    </div>
  </div>
</header>


<aside class="drawer" id="drawer" aria-label="Mobile menu">
  <div class="drawer-head">
    <a class="logo" href="index.html"><i class="fa-solid fa-paw"></i> SafariNomad</a>
    <button class="icon-btn" id="drawerClose" aria-label="Close menu"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <div class="drawer-body">
    <button class="drawer-search" type="button" data-open-search><i class="fa-solid fa-magnifying-glass"></i> Search trips, parks, articles…</button>
    <a class="plain" href="index.html"><i class="fa-solid fa-house"></i> Home</a>
    <a class="plain" href="trips.html">All packages</a>
    ${mobileMenu}
    <a class="plain" href="contact.html">Contact us</a>
    <div class="d-prefs">
      <div class="d-pref"><span>Language</span><div><button data-lang="en" class="active">EN</button><button data-lang="fr">FR</button><button data-lang="es">ES</button><button data-lang="de">DE</button></div></div>
      <div class="d-pref"><span>Currency</span><div><button data-currency="USD" class="active">USD</button><button data-currency="EUR">EUR</button></div></div>
    </div>
  </div>
  <div class="drawer-cta">
    <a class="btn" href="plan.html">Customise your trip</a>
    <a class="btn btn-outline" href="tel:${s.phoneLink}"><i class="fa-solid fa-phone"></i> ${s.phone}</a>
  </div>
</aside>
<div class="drawer-bg" id="drawerBg"></div>`;

  const footer = `
<footer class="site-footer">
  <div class="wrap">
    <div class="ft-top">
      <div class="ft-brand">
        <a class="footer-logo" href="index.html"><i class="fa-solid fa-paw"></i> SafariNomad</a>
        <p>Small-group safaris and tailor-made journeys across Kenya, Tanzania, Uganda and Rwanda, led by guides who call this home.</p>
        <div class="ft-contact">
          <a href="tel:${s.phoneLink}"><i class="fa-solid fa-phone"></i> ${s.phone}</a>
          <a href="mailto:${s.email}"><i class="fa-solid fa-envelope"></i> ${s.email}</a>
        </div>
        <div class="foot-social">
          ${social(['facebook', 'instagram', 'youtube', 'tiktok', 'x'])}
        </div>
      </div>
      <div class="ft-col">
        <h4>Ways to Go</h4>
        <a href="trips.html">All packages</a>
        <a href="destinations.html">Destinations</a>
        <a href="services.html#flash-deals">Flash deals</a>
        <a href="flights.html">Flights</a>
      </div>
      <div class="ft-col">
        <h4>Help &amp; Info</h4>
        <a href="book.html">Book your dates</a>
        <a href="contact.html">Contact us</a>
        <a href="about.html#faqs">FAQs</a>
      </div>
      <div class="ft-col">
        <h4>About SafariNomad</h4>
        <a href="about.html#story">Our story</a>
        <a href="services.html">Vehicles, stays &amp; guides</a>
        <a href="about.html#reviews">Reviews</a>
        <a href="blog.html">Blog</a>
      </div>
      <form class="news-form ft-news" id="newsletter" novalidate>
        <h4>Sign up for our newsletter</h4>
        <p>Stay up to date with our latest safari offers</p>
        <div class="pn-field">
          <label for="footNews" class="sr-only">Email address</label>
          <input id="footNews" type="email" placeholder="Your email address" required>
          <button class="btn btn-sm" type="submit">Sign up</button>
        </div>
      </form>
    </div>
    <div class="ft-bottom">
      <div><span>© 2026 SafariNomad Ltd. All rights reserved.</span><a href="about.html#faqs">Privacy Policy</a><a href="about.html#faqs">Terms of Use</a></div>
      <ul class="pay-row" aria-label="Payment methods">
        <li class="pay visa" title="Visa" translate="no"><i class="fa-brands fa-cc-visa" aria-label="Visa"></i></li>
        <li class="pay mc" title="Mastercard" translate="no"><i class="fa-brands fa-cc-mastercard" aria-label="Mastercard"></i></li>
        <li class="pay amex" title="American Express" translate="no"><i class="fa-brands fa-cc-amex" aria-label="American Express"></i></li>
        <li class="pay paypal" title="PayPal" translate="no"><i class="fa-brands fa-cc-paypal" aria-label="PayPal"></i></li>
        <li class="pay mpesa" title="M-Pesa" translate="no"><b>M</b>-PESA</li>
      </ul>
    </div>
  </div>
</footer>

<div class="chat" id="chat">
  <div class="chat-panel" id="chatPanel" role="dialog" aria-label="Chat with a safari expert">
    <div class="chat-head">
      <button type="button" class="chat-back" id="aiBack" aria-label="Back" hidden><i class="fa-solid fa-arrow-left"></i></button>
      <div class="chat-team" id="chatTeam"><span>JK</span><span>AN</span><span>GU</span></div>
      <div>
        <b id="chatTitle">Talk to a safari expert</b>
        <small class="chat-status" id="chatStatus"><i></i> <span>Checking…</span></small>
      </div>
      <button class="chat-x" id="chatClose" aria-label="Close chat"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="chat-body chat-home">
      <div class="chat-bubble">Jambo! 👋 Planning a trip? Ask Nomad, our AI travel expert, anything about safaris, visas, flights or travel anywhere, or talk to one of our Nairobi-based specialists.</div>
      <button type="button" class="chat-opt ai" id="aiOpen"><i class="fa-solid fa-wand-magic-sparkles"></i><span><b>Ask Nomad, our AI assistant</b><small>Instant answers, 24/7</small></span><i class="fa-solid fa-chevron-right go"></i></button>
      <a class="chat-opt wa" href="https://wa.me/${s.whatsapp}?text=${encodeURIComponent('Hi SafariNomad! I am planning a safari and have a question.')}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i><span><b>Chat on WhatsApp</b><small>Talk to a human expert</small></span><i class="fa-solid fa-chevron-right go"></i></a>
      <a class="chat-opt" href="tel:${s.phoneLink}"><i class="fa-solid fa-phone"></i><span><b>Call ${s.phone}</b><small>${s.hoursText}</small></span><i class="fa-solid fa-chevron-right go"></i></a>
      <a class="chat-opt" href="book.html"><i class="fa-regular fa-calendar-check"></i><span><b>Book your dates</b><small>Live departures and seats left</small></span><i class="fa-solid fa-chevron-right go"></i></a>
      <a class="chat-opt" href="contact.html"><i class="fa-regular fa-file-lines"></i><span><b>Request a free quote</b><small>Tailored itinerary within 24 hours</small></span><i class="fa-solid fa-chevron-right go"></i></a>
    </div>
    <div class="chat-ai" id="aiView" hidden>
      <div class="ai-log" id="aiLog" aria-live="polite"></div>
      <div class="ai-suggest" id="aiSuggest"></div>
      <form class="ai-form" id="aiForm" autocomplete="off">
        <label for="aiInput" class="sr-only">Ask Nomad a question</label>
        <textarea id="aiInput" rows="1" maxlength="1000" placeholder="Ask about trips, prices, visas…"></textarea>
        <button type="submit" id="aiSend" aria-label="Send"><i class="fa-solid fa-arrow-up"></i></button>
      </form>
      <div class="ai-note">Nomad is an AI and can make mistakes. Prices are confirmed in your quote.</div>
    </div>
    <div class="chat-foot">
      ${social(['instagram', 'facebook', 'youtube'])}
      <span>Follow our safaris</span>
    </div>
  </div>
  <button class="chat-launcher" id="chatLauncher" aria-expanded="false" aria-controls="chatPanel">
    <span class="chat-avatars"><span>JK</span><span>AN</span></span>
    <span class="chat-label">Chat with us</span>
    <span class="chat-dot"></span>
  </button>
</div>

<nav class="tabbar" aria-label="Quick navigation">
  <a href="index.html" data-tab="home"><i class="fa-solid fa-house"></i><span>Home</span></a>
  <a href="trips.html" data-tab="trips"><i class="fa-solid fa-compass"></i><span>Packages</span></a>
  <button type="button" data-open-search><i class="fa-solid fa-magnifying-glass"></i><span>Search</span></button>
  <a href="trips.html?saved=1" data-tab="saved"><i class="fa-regular fa-heart"></i><span>Saved</span><b class="tab-count" id="tabWishCount"></b></a>
  <button type="button" data-open-chat><i class="fa-regular fa-comments"></i><span>Chat</span></button>
</nav>

<div class="toast" id="toast" role="status"><i class="fa-solid fa-circle-check"></i> <span id="toastMsg"></span></div>`;

  document.getElementById('site-header').outerHTML = header;
  document.getElementById('site-footer').outerHTML = footer;

  // Mark the current section in the menu
  const current = document.querySelector(`.nav-item[data-nav="${document.body.dataset.page}"]`);
  if(current) current.classList.add('current');
  const saved = new URLSearchParams(location.search).get('saved') === '1';
  const tab = document.querySelector(`.tabbar [data-tab="${saved ? 'saved' : document.body.dataset.page}"]`);
  if(tab) tab.classList.add('active');

  // Phone drawer: arrows open and close each short list
  document.querySelectorAll('.d-toggle').forEach(btn => btn.addEventListener('click', () => {
    const sub = btn.closest('.d-item').querySelector('.d-sub');
    const open = sub.hidden;
    sub.hidden = !open;
    btn.setAttribute('aria-expanded', open);
  }));

  // Inner-page heroes: 3D depth. The photo tilts toward the mouse while the text moves the
  // other way, scrolling slides the photo slower than the page, and golden dust drifts across.
  // (Turned off for visitors who prefer reduced motion.)
  document.querySelectorAll('.page-hero').forEach(hero => {
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bg = hero.querySelector('.bg'), fg = hero.querySelector('.wrap');
    if(!bg || !fg) return;
    let mx = 0, my = 0, sy = 0, raf = 0;
    const apply = () => {
      raf = 0;
      bg.style.transform = `translate3d(${mx * -18}px, ${my * -12 + sy * 0.35}px, 0) rotateY(${mx * 3}deg) rotateX(${my * -3}deg) scale(1.02)`;
      fg.style.transform = `translate3d(${mx * 10}px, ${my * 6 + sy * 0.12}px, 0)`;
      fg.style.opacity = String(Math.max(0, 1 - sy / (hero.offsetHeight * 0.9)));
    };
    const queue = () => { if(!raf) raf = requestAnimationFrame(apply); };
    if(window.matchMedia('(hover: hover)').matches){
      hero.addEventListener('mousemove', e => {
        const r = hero.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; queue();
      });
      hero.addEventListener('mouseleave', () => { mx = 0; my = 0; queue(); });
    }
    window.addEventListener('scroll', () => { sy = Math.min(window.scrollY, hero.offsetHeight); queue(); }, { passive:true });

    // Dust: a few dozen soft points of light, each on its own slow, slightly 3D path
    const cv = document.createElement('canvas');
    cv.className = 'hero-dust'; cv.setAttribute('aria-hidden', 'true');
    hero.insertBefore(cv, fg);
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dots = [], running = false, looping = false;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.offsetWidth; h = hero.offsetHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(70, w / 22));
      dots = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, z: 0.3 + Math.random() * 0.7,
        vx: (Math.random() - 0.3) * 0.25, vy: -0.08 - Math.random() * 0.22, ph: Math.random() * 6.28 }));
    };
    size(); window.addEventListener('resize', size);
    // Only animate while the hero is on screen
    new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if(running && !looping){ looping = true; requestAnimationFrame(draw); }
    }).observe(hero);
    function draw(time){
      if(!running){ looping = false; return; }
      ctx.clearRect(0, 0, w, h);
      for(const d of dots){
        d.x += d.vx * d.z + mx * 0.15 * d.z; d.y += d.vy * d.z; d.ph += 0.01;
        if(d.y < -10){ d.y = h + 10; d.x = Math.random() * w; }
        if(d.x < -10) d.x = w + 10; if(d.x > w + 10) d.x = -10;
        const r = 0.6 + d.z * 2.2, a = (0.25 + 0.35 * Math.sin(d.ph + time / 1400)) * d.z;
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 3);
        g.addColorStop(0, `rgba(255,236,200,${Math.max(0, a)})`); g.addColorStop(1, 'rgba(255,236,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x, d.y, r * 3, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(draw);
    }
  });

  // Inner-page heroes with several photos (<div class="bg" data-slides>): cross-fade every 5 s,
  // loading each photo just before it is shown
  document.querySelectorAll('.page-hero .bg[data-slides]').forEach(bg => {
    const imgs = [...bg.querySelectorAll('img')];
    if(imgs.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const load = img => { if(img.dataset.src){ img.srcset = img.dataset.srcset; img.src = img.dataset.src; delete img.dataset.src; } };
    let cur = 0;
    load(imgs[1]);
    setInterval(() => {
      if(document.hidden) return;
      imgs[cur].classList.remove('on');
      cur = (cur + 1) % imgs.length;
      imgs[cur].classList.add('on');
      load(imgs[(cur + 1) % imgs.length]);
    }, 5000);
  });

  // "Call us" links anywhere: <a data-phone>…<b data-phone-number></b></a> get the number from SITE
  document.querySelectorAll('[data-phone]').forEach(a => {
    a.href = `tel:${s.phoneLink}`;
    a.querySelectorAll('[data-phone-number]').forEach(b => { b.textContent = s.phone; b.setAttribute('translate', 'no'); });
  });

  // Licences & partners strip (<div data-partners></div>): a slow, endless scroll of badges.
  // The list is drawn twice so the loop is seamless; the copy is hidden from screen readers.
  // Pauses on hover; with reduced motion it becomes a static, wrapping row.
  if(typeof PARTNERS !== 'undefined') document.querySelectorAll('[data-partners]').forEach(el => {
    const badge = p => `<li class="pt-badge">${p.brand ? `<i class="fa-brands ${p.brand}" aria-hidden="true"></i>` : `<i class="fa-solid ${p.icon}" aria-hidden="true"></i>`}<span><b>${esc(p.name)}</b><small>${esc(p.sub)}${p.no ? ` · No. ${esc(p.no)}` : ''}</small></span></li>`;
    const items = [...PARTNERS.licences, ...PARTNERS.travel].map(badge).join('');
    el.classList.add('partners');
    el.innerHTML = `
      <div class="wrap partners-head"><span>Licensed in Kenya</span><span class="dot" aria-hidden="true">·</span><span>Trusted travel partners</span></div>
      <div class="marquee" tabindex="0" aria-label="Our licences and travel partners">
        <ul class="marquee-track">${items}</ul><ul class="marquee-track" aria-hidden="true">${items}</ul>
      </div>`;
  });

  // Dropdown panels. Hover intent: a short pause before the first panel opens (so passing the
  // mouse over the menu doesn't flash it), instant switching once one is open, and a grace
  // period on leaving. Keyboard focus opens a panel too; Escape closes it.
  const dropItems = [...document.querySelectorAll('.nav-item.has-drop')];
  let openItem = null, hoverTimer = 0;
  // Cards in an open panel take turns every 3.5 s (not with reduced motion)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rotateTimer = 0;
  const rotate = item => item.querySelectorAll('[data-rotate]').forEach(box => {
    const kids = [...box.children].filter(k => k.matches('.df-slide, img'));
    if(kids.length < 2) return;
    const next = (kids.findIndex(k => k.classList.contains('on')) + 1) % kids.length;
    kids.forEach((k, i) => {
      k.classList.toggle('on', i === next);
      if(k.tagName === 'A'){ k.tabIndex = i === next ? 0 : -1; k.toggleAttribute('aria-hidden', i !== next); }
    });
    box.querySelectorAll('.df-dots i').forEach((d, i) => d.classList.toggle('on', i === next));
  });
  const setOpen = item => {
    clearInterval(rotateTimer);
    if(item && !reduceMotion) rotateTimer = setInterval(() => rotate(item), 3500);
    if(openItem === item) return;
    if(openItem){ openItem.classList.remove('open'); openItem.querySelector('.nav-trigger').setAttribute('aria-expanded', false); }
    openItem = item;
    if(item){ item.classList.remove('shut'); item.classList.add('open'); item.querySelector('.nav-trigger').setAttribute('aria-expanded', true); }
  };
  dropItems.forEach(item => {
    item.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => setOpen(item), openItem ? 0 : 90); });
    item.addEventListener('mouseleave', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => setOpen(null), 160); item.classList.remove('shut'); });
    item.addEventListener('focusin', () => { if(item.classList.contains('shut')) return; clearTimeout(hoverTimer); setOpen(item); });
    item.addEventListener('focusout', e => { if(!item.contains(e.relatedTarget)){ item.classList.remove('shut'); if(openItem === item) setOpen(null); } });
  });
  document.addEventListener('keydown', e => {
    if(e.key !== 'Escape') return;
    const item = openItem || (document.activeElement && document.activeElement.closest('.nav-item.has-drop'));
    if(!item) return;
    setOpen(null);
    item.classList.add('shut');           // stays closed while focus is still inside, until the mouse or focus leaves
    item.querySelector('.nav-trigger').focus();
  });
})();
