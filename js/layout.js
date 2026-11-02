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

// Main menu. Each item opens a full-width panel: titled columns of links and one main button.
// (The phone drawer and site search use the same links, flattened.)
const MENU_PLACE = p => [p, `trips.html?q=${encodeURIComponent(p)}`];
const MENU = [
  { key:'destinations', label:'Destinations', href:'destinations.html', cta:['See all trips','trips.html'], cols:[
    { title:'Kenya', href:'trips.html?country=kenya', links:['Maasai Mara','Amboseli','Samburu','Lake Nakuru','Naivasha','Tsavo','Diani Beach'].map(MENU_PLACE) },
    { title:'Tanzania & Zanzibar', href:'trips.html?country=tanzania', links:['Serengeti','Ngorongoro','Tarangire','Kilimanjaro','Zanzibar'].map(MENU_PLACE) },
    { title:'Uganda', href:'trips.html?country=uganda', links:['Bwindi','Kibale','Queen Elizabeth','Murchison Falls'].map(MENU_PLACE) },
    { title:'Rwanda', href:'trips.html?country=rwanda', links:['Volcanoes','Lake Kivu','Kigali'].map(MENU_PLACE) },
    { title:'Multi-country', href:'trips.html?country=multi', links:[['East Africa Grand Journey','book.html?trip=grand-journey'],['Primate Explorer','book.html?trip=primate-explorer'],['Great Migration','book.html?trip=great-migration'],['Plan a custom route','contact.html']] },
    { title:'By landscape', href:'trips.html', links:[['Savannah & plains','trips.html?land=savannah'],['Lakes','trips.html?land=lakes'],['Coast & islands','trips.html?land=coast'],['Mountains','trips.html?land=mountains'],['Rivers & waterfalls','trips.html?land=rivers'],['Forests','trips.html?land=forests']] }
  ] },
  { key:'services', label:'Services', href:'services.html', cta:['See all services','services.html'], cols:[
    { title:'Save now', links:[['Flash deals','services.html#flash-deals'],['Last-minute departures','services.html#last-minute']] },
    { title:'On safari', links:[['Safari vehicles','services.html#vehicles'],['Accommodation','services.html#stays'],['City & beach hotels','services.html#hotels']] },
    { title:'Guides', links:[['Tour guides','services.html#guides'],['Hire a private guide','services.html#private'],['Our standards','services.html#quality']] }
  ] },
  { key:'flights', label:'Flights', href:'flights.html', cta:['Search flights','flights.html#flightSearch'], cols:[
    { title:'Getting here', links:[['Flights from Europe','flights.html#routes'],['Search & compare','flights.html#flightSearch']] },
    { title:'Getting around', links:[['Within East Africa','flights.html#routes'],['Light-aircraft flights','services.html#vehicles']] },
    { title:'Need help?', links:[['Request flights','flights.html#request'],['Contact us','contact.html']] }
  ] },
  { key:'about', label:'About', href:'about.html', cta:['Learn more about us','about.html'], cols:[
    { title:'SafariNomad', links:[['Our story','about.html#story'],['Traveller reviews','about.html#reviews']] },
    { title:'Plan your trip', links:[['FAQ','about.html#faqs'],['Book your dates','book.html'],['Contact Us','contact.html']] },
    { title:'Inspiration', links:[['Blog','blog.html'],['All trips','trips.html']] }
  ] }
];
MENU.forEach(m => { m.links = m.cols.flatMap(c => c.links); });

(function(){
  const s = SITE;
  const esc = str => String(str).replace(/&/g,'&amp;');

  const links = m => m.links.map(([txt, h]) => `<a href="${h}">${esc(txt)}</a>`).join('');
  const SOCIAL = { facebook:['Facebook','fa-facebook-f'], instagram:['Instagram','fa-instagram'], youtube:['YouTube','fa-youtube'], tiktok:['TikTok','fa-tiktok'], x:['X','fa-x-twitter'] };
  const social = keys => keys.map(k => `<a href="${s.social[k]}" target="_blank" rel="noopener" aria-label="${SOCIAL[k][0]}"><i class="fa-brands ${SOCIAL[k][1]}"></i></a>`).join('');

  // Desktop: the label is a real link; hovering (or keyboard focus) opens a full-width panel under the header
  const megaPanel = m => `
      <div class="drop"><div class="drop-panel"><div class="drop-inner">
        <div class="drop-cols" style="--cols:${m.cols.length}">
          ${m.cols.map(c => `
          <div class="drop-col">
            ${c.href ? `<a class="drop-head" href="${c.href}">${esc(c.title)}</a>` : `<span class="drop-head">${esc(c.title)}</span>`}
            <ul>${c.links.map(([t, h]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('')}</ul>
          </div>`).join('')}
        </div>
        <div class="drop-cta"><a class="btn" href="${m.cta[1]}">${esc(m.cta[0])}</a></div>
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
      <a href="contact.html">Plan a group trip</a>
      <a href="book.html">Book your dates</a>
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
            <button data-currency="GBP">GBP £</button>
            <button data-currency="KES">KES</button>
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
      <a class="btn btn-sm hide-sm" href="contact.html"><span>Get a Quote</span></a>
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
    <a class="plain" href="trips.html">All trips</a>
    ${mobileMenu}
    <a class="plain" href="contact.html">Contact us</a>
    <div class="d-prefs">
      <div class="d-pref"><span>Language</span><div><button data-lang="en" class="active">EN</button><button data-lang="fr">FR</button><button data-lang="es">ES</button><button data-lang="de">DE</button></div></div>
      <div class="d-pref"><span>Currency</span><div><button data-currency="USD" class="active">USD</button><button data-currency="EUR">EUR</button><button data-currency="GBP">GBP</button><button data-currency="KES">KES</button></div></div>
    </div>
  </div>
  <div class="drawer-cta">
    <a class="btn" href="contact.html">Get a Quote</a>
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
        <a href="trips.html">All trips</a>
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
      <div class="chat-bubble">Jambo! 👋 Planning a safari? Ask Nomad, our AI assistant, for instant answers, or talk to one of our Nairobi-based specialists.</div>
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
  <a href="trips.html" data-tab="trips"><i class="fa-solid fa-compass"></i><span>Trips</span></a>
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

  // Keep aria-expanded in sync for screen readers
  document.querySelectorAll('.nav-item').forEach(item => {
    if(!item.querySelector('.drop')) return;
    const btn = item.querySelector('.nav-trigger');
    const set = v => btn.setAttribute('aria-expanded', v);
    item.addEventListener('mouseenter', () => set(true));
    item.addEventListener('mouseleave', () => set(false));
    item.addEventListener('focusin', () => set(true));
    item.addEventListener('focusout', e => { if(!item.contains(e.relatedTarget)) set(false); });
  });
})();
