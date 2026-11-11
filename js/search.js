/* =========================================================
   SafariNomad: site-wide instant search
   ---------------------------------------------------------
   The search box in the header (or "/" / Ctrl+K anywhere).
   Suggests searches and shows top results while you type, from:
   trips, last-minute deals, destinations & parks, deals,
   FAQs, blog articles and pages.

   It forgives typos ("serengti", "gorila") and understands
   related words ("monkeys" → chimps & gorillas, "cheap" →
   budget trips). Add words to SYNONYMS below to teach it more.

   Also used by trips.html?q=… to filter trips by text.
   ========================================================= */

const SNSearch = (function(){

  /* ---------- Related words ---------- */
  const SYNONYMS = {
    gorilla:['gorillas','primate','bwindi','volcanoes','silverback'],
    monkey:['monkeys','chimp','chimpanzee','primate','gorilla','golden'],
    chimp:['chimpanzee','chimps','kibale','primate'],
    ape:['gorilla','chimp','primate'],
    beach:['zanzibar','coast','diani','watamu','island','sand','ocean'],
    sea:['beach','zanzibar','coast'],
    island:['zanzibar','beach'],
    mountain:['kilimanjaro','trek','climb','hike','volcanoes'],
    climb:['kilimanjaro','trek','summit'],
    hike:['trek','kilimanjaro','walking'],
    hiking:['trek','kilimanjaro','walking'],
    kili:['kilimanjaro'],
    cheap:['budget','camping','deal','save','sale','value'],
    budget:['camping','deal','save','value'],
    affordable:['budget','camping','deal'],
    deal:['deals','save','offer','sale','discount'],
    discount:['deal','save','offer'],
    offer:['deal','save'],
    honeymoon:['luxury','couple','romantic','private'],
    romantic:['honeymoon','luxury'],
    couple:['honeymoon','luxury'],
    luxury:['honeymoon','lodge','private'],
    kids:['family','children'],
    children:['family','kids'],
    family:['kids','children'],
    migration:['wildebeest','mara','serengeti','crossing'],
    wildebeest:['migration','mara','serengeti'],
    lion:['wildlife','safari','mara','big five','cats'],
    lions:['lion'],
    leopard:['wildlife','safari','big five'],
    elephant:['wildlife','amboseli','tsavo'],
    elephants:['elephant'],
    rhino:['wildlife','nakuru','ngorongoro','samburu'],
    flamingo:['nakuru','birds','lake'],
    bird:['birding','birds','flamingo'],
    safari:['wildlife','game drive'],
    animals:['wildlife','safari'],
    camping:['camp','tent','budget'],
    tent:['camping','camp'],
    visa:['visas','entry','eta','faq'],
    vaccine:['vaccination','vaccinations','yellow fever','malaria','faq'],
    vaccination:['vaccine','yellow fever','faq'],
    permit:['permits','gorilla','faq'],
    insurance:['faq'],
    deposit:['booking','payment','faq'],
    pay:['payment','deposit','booking'],
    book:['booking','quote','contact'],
    contact:['quote','phone','email','whatsapp'],
    quote:['contact','price'],
    weather:['when','season','month','rain'],
    when:['season','month','best time'],
    tanzania:['tz','serengeti','zanzibar','kilimanjaro'],
    kenya:['ke','mara','nairobi'],
    uganda:['ug','bwindi'],
    rwanda:['rw','kigali']
  };

  /* ---------- Helpers ---------- */
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9$ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = s => norm(s).split(' ').filter(t => t && t.length > 1 || /\d/.test(t));
  const escHTML = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // Small edit-distance check, stops early once it's too far apart
  function lev(a, b, max){
    if(Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({length:b.length + 1}, (_, i) => i);
    for(let i = 1; i <= a.length; i++){
      const cur = [i];
      let best = i;
      for(let j = 1; j <= b.length; j++){
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        best = Math.min(best, cur[j]);
      }
      if(best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }
  const typoLimit = t => t.length >= 7 ? 2 : t.length >= 4 ? 1 : 0;

  /* Score one query word against an item (0 = no match) */
  // A typo match against the whole word, or against its start (for half-typed words)
  function typoMatch(q, w){
    const lim = typoLimit(q);
    if(!lim) return false;
    return lev(q, w, lim) <= lim || (w.length > q.length && lev(q, w.slice(0, q.length), lim) <= lim);
  }
  function wordScore(q, item){
    let best = 0;
    for(const w of item.titleTokens){
      if(w === q) best = Math.max(best, 6);
      else if(w.startsWith(q)) best = Math.max(best, 5);
      else if(q.length >= 4 && w.includes(q)) best = Math.max(best, 3.5);
      else if(typoMatch(q, w)) best = Math.max(best, 3.5);
    }
    if(best >= 5) return best;
    for(const w of item.tokens){
      if(w === q) best = Math.max(best, 4);
      else if(w.startsWith(q)) best = Math.max(best, 3);
      else if(q.length >= 4 && w.includes(q)) best = Math.max(best, 2);
      else if(typoMatch(q, w)) best = Math.max(best, 2);
    }
    return best;
  }

  /* Expand a query word with related words */
  function expand(q){
    const list = [q];
    const add = k => (SYNONYMS[k] || []).forEach(s => tokens(s).forEach(t => { if(!list.includes(t)) list.push(t); }));
    add(q);
    // also catch typos of the synonym keys, e.g. "gorila" → gorilla
    if(q.length >= 4) Object.keys(SYNONYMS).forEach(k => { if(k !== q && lev(q, k, typoLimit(q)) <= typoLimit(q)) { list.push(k); add(k); } });
    return list;
  }

  /* Score an item for the whole query */
  function score(item, query, relaxed){
    const qs = tokens(query);
    if(!qs.length) return 0;
    let total = 0, matched = 0;
    for(const q of qs){
      let s = wordScore(q, item);
      if(s < 3){
        for(const alt of expand(q).slice(1)){
          s = Math.max(s, wordScore(alt, item) * 0.5);
        }
      }
      if(s > 0) matched++;
      total += s;
    }
    if(matched < (relaxed ? 1 : Math.ceil(qs.length * 0.6))) return 0;
    return total * (matched / qs.length) + (item.boost || 0);
  }

  /* ---------- Build the index ---------- */
  const IMG_DEFAULT = 'images/serengeti-acacia.jpg';
  let INDEX = null;
  // Text in the visitor's language (js/i18n.js); English when no translation exists
  // Lists (arrays) are translated item by item; long text is translated first, then shortened
  const L = s => Array.isArray(s) ? s.map(L).join(', ') : (typeof SNI18N !== 'undefined' && s ? SNI18N.t(s) : s || '');
  const clip = (s, n) => s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
  function item(o){
    const tTitle = L(o.title), tSub = L(o.sub);
    o.titleTokens = tokens(o.title + ' ' + (tTitle !== o.title ? tTitle : ''));
    o.tokens = tokens([o.title, o.sub, o.keywords, tTitle, tSub].join(' '));
    return o;
  }
  function buildIndex(){
    const out = [];

    TRIPS.forEach(t => out.push(item({
      type:'Trips', icon:'fa-binoculars', title:t.title, url:`book.html?trip=${t.id}`, img:t.img,
      sub:`${t.countries} · ${t.days} days · ${t.stay}`, price:t.price, rating:t.rating,
      keywords:[t.country, COUNTRY_NAMES[t.country], ...t.styles, ...t.styles.map(s => STYLE_NAMES[s]), t.stay, t.badge, t.alt, t.days + ' days'].join(' '),
      boost:1, trip:t
    })));
    LAST_MINUTE.forEach(t => out.push(item({
      type:'Deals', icon:'fa-fire', title:t.title, url:`book.html?trip=${t.id}`, img:t.img,
      sub:`${t.countries} · Departs ${t.departs} · ${t.spaces} spaces left`, price:t.price, save:Math.round((1 - t.price / t.was) * 100),
      keywords:`${t.countries} last minute deal sale save discount ${t.extra}`, boost:.5
    })));

    // Countries and the parks in each (search only)
    [
      ['Kenya', 'kenya', 'images/rhino-and-calf.jpg', ['Maasai Mara','Amboseli','Samburu & Laikipia','Lake Nakuru & Naivasha','Tsavo','Diani & Watamu coast']],
      ['Tanzania & Zanzibar', 'tanzania', 'images/giraffe-sunset.jpg', ['Serengeti','Ngorongoro Crater','Tarangire','Mount Kilimanjaro','Zanzibar']],
      ['Uganda', 'uganda', 'images/forest-elephant.jpg', ['Bwindi Impenetrable Forest','Kibale Forest','Queen Elizabeth NP','Murchison Falls']],
      ['Rwanda', 'rwanda', 'images/lake-kivu-sunset.jpg', ['Volcanoes NP','Nyungwe Forest','Akagera NP','Lake Kivu','Kigali']]
    ].forEach(([country, key, img, parks]) => {
      out.push(item({ type:'Destinations', icon:'fa-location-dot', title:country, url:`destinations.html#${key}`, img, sub:parks.slice(0, 4), keywords:parks.join(' '), boost:1.5 }));
      parks.forEach(p => out.push(item({ type:'Destinations', icon:'fa-map-pin', title:p, url:`destinations.html#${key}`, img, sub:country, keywords:country })));
    });
    if(typeof MENU !== 'undefined') MENU.filter(m => m.key !== 'destinations' && m.key !== 'trips').forEach(m => m.links.forEach(([title, url]) =>
      out.push(item({ type: m.key === 'deals' ? 'Deals' : 'Pages', icon: m.key === 'deals' ? 'fa-tag' : 'fa-file-lines', title, url, sub:m.label, keywords:m.label }))));

    [
      ['Home','index.html','fa-house','safarinomad homepage start'],
      ['All trips','trips.html','fa-list','tours itineraries browse find safari all'],
      ['Destination guides','destinations.html','fa-map','where to go countries parks guide'],
      ['Flash deals','services.html#flash-deals','fa-bolt','deal deals flash save discount sale offer last minute'],
      ['About us','about.html','fa-circle-info','story company team who we are'],
      ['Safari vehicles, accommodation & guides','services.html','fa-user-tie','guides guide team staff experts private guide hire photography birding tracker'],
      ['Safari flights & transfers','flights.html','fa-plane','flight flights fly plane bush flight airstrip transfer airport international luggage'],
      ['Traveller reviews','about.html#reviews','fa-star','reviews testimonials ratings feedback'],
      ['Book your safari dates','book.html','fa-calendar-check','book booking dates calendar availability departure seats reserve'],
      ['Request a free quote','contact.html','fa-envelope','contact quote enquiry email phone whatsapp book booking price'],
      ['Saved trips','trips.html?saved=1','fa-heart','wishlist favourites saved hearts'],
      ['Safari blog','blog.html','fa-newspaper','articles blog stories news tips']
    ].forEach(([t, u, i, k]) => out.push(item({ type:'Pages', icon:i, title:t, url:u, sub:'Page', keywords:k })));

    // FAQs come from the shared KNOWLEDGE list in js/data.js
    KNOWLEDGE.forEach(k => out.push(item({ type:'FAQs', icon:'fa-circle-question', title:k.q, url:'about.html#faqs', sub:k.a, clip:90, keywords:k.tags })));

    if(typeof ARTICLES !== 'undefined') ARTICLES.forEach(a => out.push(item({
      type:'Articles', icon:'fa-newspaper', title:a.title, url:`blog.html#${a.id}`, img:a.cover,
      sub:`${a.cat} · ${a.readTime}`, keywords:`${a.cat} ${a.excerpt}`
    })));
    return out;
  }
  function getIndex(){ return INDEX || (INDEX = buildIndex()); }

  // Blog articles live in their own file; load it the first time search opens
  function loadArticles(){
    // Wait until the page has finished parsing: the blog page includes blog-data.js itself
    // further down, and loading it twice throws "AUTHORS has already been declared"
    if(document.readyState === 'loading') return document.addEventListener('DOMContentLoaded', loadArticles, { once:true });
    if(typeof ARTICLES !== 'undefined' || document.querySelector('#blogDataScript, script[src$="blog-data.js"]')) return;
    const s = document.createElement('script');
    s.src = 'js/blog-data.js'; s.id = 'blogDataScript';
    s.onload = () => { INDEX = null; if(input && input.value) render(input.value); };
    document.head.appendChild(s);
  }

  /* ---------- Search ---------- */
  /* Best matches first; weak matches far below the best one are dropped.
     If nothing matches every word, fall back to the closest partial matches. */
  let lastRelaxed = false;
  function search(query, limit = 40){
    const run = relaxed => {
      const scored = getIndex().map(it => ({ it, s:score(it, query, relaxed) })).filter(r => r.s > 0).sort((a, b) => b.s - a.s);
      const top = scored.length ? scored[0].s : 0;
      return scored.filter(r => r.s >= top * 0.35).slice(0, limit).map(r => r.it);
    };
    let list = run(false);
    lastRelaxed = false;
    if(!list.length && tokens(query).length > 1){ list = run(true); lastRelaxed = list.length > 0; }
    return list;
  }

  /* "Did you mean…" from every word we know */
  function suggest(query){
    const vocab = new Set();
    getIndex().forEach(it => it.tokens.forEach(t => t.length > 3 && !/\d/.test(t) && vocab.add(t)));
    Object.keys(SYNONYMS).forEach(k => vocab.add(k));
    const fixed = tokens(query).map(q => {
      const max = q.length >= 6 ? 3 : 2;
      if(vocab.has(q)) return q;
      // closest word wins; ties go to words that start the same way
      const prefix = v => { let i = 0; while(i < q.length && q[i] === v[i]) i++; return i; };
      let best = q, rank = Infinity;
      vocab.forEach(v => {
        const x = lev(q, v, max);
        if(x > max) return;
        const r = x - prefix(v) * 0.5 + Math.abs(v.length - q.length) * 0.2;
        if(r < rank){ rank = r; best = v; }
      });
      return best;
    }).join(' ');
    return fixed !== norm(query) ? fixed : '';
  }

  /* Used by trips.js for trips.html?q=… */
  let tripCache = { q:null, ids:null };
  function tripMatches(trip, query){
    if(tripCache.q !== query){
      tripCache = { q:query, ids:new Set(search(query, 200).filter(x => x.trip).map(x => x.trip.id)) };
    }
    return tripCache.ids.has(trip.id);
  }

  /* ---------- Search box UI (YouTube style) ----------
     A pill-shaped box in the header with a grey search button. Suggestions
     drop down underneath while you type: recent searches (clock icon, with
     "Remove"), suggested searches (the typed part plain, the completion bold)
     and a few top results with thumbnails. On phones the search icon turns
     the header into a full-width search bar with a back arrow. */
  const POPULAR = ['Gorilla trekking','Great Migration','Zanzibar','Kilimanjaro','Maasai Mara','Family safari','Honeymoon','Serengeti'];
  const recent = {
    get: () => SN.store.get('recentSearches') || [],
    add(q){ SN.store.set('recentSearches', [q, ...this.get().filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 8)); },
    remove(q){ SN.store.set('recentSearches', this.get().filter(x => x !== q)); }
  };
  const money = usd => (typeof SN !== 'undefined' ? SN.money(usd) : '$' + usd.toLocaleString('en-US'));

  // Phrases we can suggest: popular searches, places, landscapes, travel styles and short trip names
  let PHRASES = null;
  function phrases(){
    if(PHRASES) return PHRASES;
    const set = new Map();
    const add = p => { if(p && !set.has(norm(p))) set.set(norm(p), p); };
    POPULAR.forEach(add);
    if(typeof PLACES !== 'undefined') PLACES.forEach(p => add(p.name));
    if(typeof LANDSCAPES !== 'undefined') LANDSCAPES.forEach(l => add(l.label));
    if(typeof STYLE_NAMES !== 'undefined') Object.values(STYLE_NAMES).forEach(add);
    ['Kenya','Tanzania','Uganda','Rwanda','Flights to Nairobi','Flights to Kigali','Flash deals','Visa','Last-minute safari'].forEach(add);
    TRIPS.forEach(t => add(t.title.split(':')[0].trim()));
    return (PHRASES = [...set.values()]);
  }
  function textSuggestions(q){
    const nq = norm(q), last = nq.split(' ').pop();
    if(!nq) return [];
    const ranked = phrases().map(p => {
      const np = norm(p);
      const r = np.startsWith(nq) ? 0 : np.split(' ').some(w => w.startsWith(last)) && np.includes(nq.slice(0, -last.length).trim()) ? 1 : np.includes(nq) ? 2 : 9;
      return { p, r, len: p.length };
    }).filter(x => x.r < 9).sort((a, b) => a.r - b.r || a.len - b.len).map(x => x.p);
    if(!ranked.length){ const fix = suggest(q); if(fix) ranked.push(fix); }
    return ranked.slice(0, 7);
  }
  // YouTube look: what you typed stays plain, the rest of the suggestion is bold
  function boldRest(text, q){
    const i = text.toLowerCase().indexOf(q.trim().toLowerCase());
    if(i < 0 || !q.trim()) return `<b>${escHTML(text)}</b>`;
    const j = i + q.trim().length;
    return `<b>${escHTML(text.slice(0, i))}</b>${escHTML(text.slice(i, j))}<b>${escHTML(text.slice(j))}</b>`;
  }

  let form, input, box, rows = [], active = -1, typed = '';

  function rowHTML(r, i){
    const id = `yt-opt-${i}`;
    if(r.kind === 'ask') return `<div class="yt-row yt-ask" id="${id}" role="option" data-i="${i}" data-ask>
      <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
      <span class="yt-rich-text"><span>Ask Nomad, our AI travel expert</span><small translate="no">${escHTML(r.text)}</small></span>
      <i class="fa-solid fa-arrow-right yt-ask-go" aria-hidden="true"></i>
    </div>`;
    if(r.kind === 'rich'){
      const it = r.item;
      const thumb = it.img ? `<img src="${it.img}" alt="" loading="lazy">` : `<i class="fa-solid ${it.icon}"></i>`;
      return `<a class="yt-row rich" id="${id}" role="option" href="${it.url}" data-i="${i}">
        <span class="yt-thumb${it.img ? '' : ' icon'}">${thumb}</span>
        <span class="yt-rich-text" translate="no"><span>${escHTML(L(it.title))}</span><small>${escHTML(L(it.sub || it.type))}</small></span>
        ${it.price ? `<span class="yt-price" translate="no">${money(it.price)}</span>` : ''}
      </a>`;
    }
    return `<div class="yt-row" id="${id}" role="option" data-i="${i}" data-q="${escHTML(r.text)}">
      <i class="fa-solid ${r.kind === 'recent' ? 'fa-clock-rotate-left' : r.kind === 'trend' ? 'fa-arrow-trend-up' : 'fa-magnifying-glass'}"></i>
      <span class="yt-text" translate="no">${r.kind === 'suggest' ? boldRest(r.text, typed) : escHTML(r.text)}</span>
      ${r.kind === 'recent' ? `<button type="button" class="yt-remove" data-remove="${escHTML(r.text)}">Remove</button>` : ''}
    </div>`;
  }

  function render(){
    const q = input.value.trim();
    typed = input.value;
    rows = [];
    let none = false;
    if(!q){
      recent.get().slice(0, 6).forEach(t => rows.push({ kind:'recent', text:t }));
      POPULAR.filter(p => !rows.some(r => r.text.toLowerCase() === p.toLowerCase())).slice(0, 8 - rows.length).forEach(t => rows.push({ kind:'trend', text:t }));
    } else {
      const r = recent.get().filter(t => norm(t).startsWith(norm(q))).slice(0, 2);
      r.forEach(t => rows.push({ kind:'recent', text:t }));
      textSuggestions(q).filter(t => !r.includes(t)).forEach(t => rows.push({ kind:'suggest', text:t }));
      const hits = search(q, 4);
      hits.forEach(item => rows.push({ kind:'rich', item }));
      // Nothing on the site: say so and offer Nomad. Only a loose match (some of the words): offer Nomad after it.
      none = q.length >= 2 && !hits.length;
      if(none) rows.unshift({ kind:'ask', text:q });
      else if(q.length >= 2 && lastRelaxed) rows.push({ kind:'ask', text:q });
    }
    active = -1;
    const firstRich = rows.findIndex(r => r.kind === 'rich');
    const askAt = rows.findIndex(r => r.kind === 'ask');
    box.innerHTML = (none ? `<div class="yt-none"><b>Nothing found for <span translate="no">“${escHTML(q)}”</span></b><span>No trip, place or guide on our site matches that.</span></div>` : '') +
      rows.map((r, i) => (((i === firstRich && i > 0) || (i === askAt && i > 0) || (none && i === 1)) ? '<div class="yt-sep"></div>' : '') + rowHTML(r, i)).join('');
    box.hidden = !rows.length;
    input.setAttribute('aria-expanded', String(!box.hidden));
    form.classList.toggle('has-text', !!input.value);
  }

  function askNomad(q){
    close();
    if(window.NomadAssistant) NomadAssistant.askAbout(q);
  }

  function go(q){
    q = (q || '').trim();
    if(!q) return;
    recent.add(q);
    if(SN.track) SN.track('search', { q });          // counted for admin → Insights (what people look for)
    const hits = search(q, 20);
    // Trips first (the trips page filters by this text); otherwise the best page, FAQ or article
    location.href = hits.some(x => x.trip) ? 'trips.html?q=' + encodeURIComponent(q) : hits.length ? hits[0].url : 'trips.html?q=' + encodeURIComponent(q);
  }

  function highlightRow(n){
    const els = [...box.querySelectorAll('.yt-row')];
    if(!els.length) return;
    active = (n + els.length) % els.length;
    els.forEach((el, i) => el.classList.toggle('active', i === active));
    input.setAttribute('aria-activedescendant', els[active].id);
    const r = rows[active];
    if(r.kind !== 'rich' && r.kind !== 'ask') input.value = r.text;          // like YouTube: arrows put the suggestion in the box
    els[active].scrollIntoView({ block:'nearest' });
  }

  function build(){
    form = document.getElementById('ytSearch');
    if(!form) return;
    input = form.querySelector('input');
    loadArticles();
    box = form.querySelector('.yt-sugg');
    input.addEventListener('focus', () => { form.classList.add('focus'); render(); });
    input.addEventListener('input', render);
    input.addEventListener('keydown', e => {
      if(e.key === 'ArrowDown'){ e.preventDefault(); highlightRow(active + 1); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); highlightRow(active - 1); }
      else if(e.key === 'Escape'){ if(!box.hidden){ box.hidden = true; input.value = typed; } else close(); }
      else if(e.key === 'Enter' && active >= 0 && rows[active].kind === 'ask'){ e.preventDefault(); askNomad(rows[active].text); }
      else if(e.key === 'Enter' && active >= 0 && rows[active].kind === 'rich'){ e.preventDefault(); recent.add(typed.trim() || L(rows[active].item.title)); location.href = rows[active].item.url; }
    });
    form.addEventListener('submit', e => { e.preventDefault(); go(input.value); });
    form.querySelector('.yt-clear').addEventListener('click', () => { input.value = ''; render(); input.focus(); });
    form.querySelector('.yt-back').addEventListener('click', close);
    box.addEventListener('mousedown', e => e.preventDefault());       // keep focus in the box while clicking
    box.addEventListener('click', e => {
      const rm = e.target.closest('[data-remove]');
      if(rm){ recent.remove(rm.dataset.remove); render(); return; }
      const row = e.target.closest('.yt-row');
      if(!row) return;
      if(row.dataset.ask !== undefined){ e.stopPropagation(); askNomad(rows[+row.dataset.i].text); return; }   // stop: a click outside the chat closes it
      if(row.dataset.q !== undefined){ input.value = row.dataset.q; go(row.dataset.q); }
      else if(typed.trim()) recent.add(typed.trim());
    });
    document.addEventListener('click', e => { if(!form.contains(e.target) && !e.target.closest('[data-open-search]')){ box.hidden = true; form.classList.remove('focus'); } });
  }

  // Phones/tablets: the header becomes a search bar; desktop: just focus the box
  function open(prefill){
    if(!form) build();
    if(!form) return;
    document.getElementById('siteHeader').classList.add('search-open');
    if(prefill !== undefined) input.value = prefill;
    input.focus();
    render();
  }
  function close(){
    if(!form) return;
    document.getElementById('siteHeader').classList.remove('search-open');
    box.hidden = true; form.classList.remove('focus');
    input.blur();
  }

  /* ---------- Triggers ---------- */
  build();
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-open-search]');
    if(btn){ e.preventDefault(); open(); }
  });
  document.addEventListener('keydown', e => {
    const typing = /input|textarea|select/i.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)){ e.preventDefault(); open(); }
  });

  // Rebuild the index in the new language
  document.addEventListener('langchange', () => { INDEX = null; PHRASES = null; });

  return { open, close, search, score, tripMatches, norm, suggest };
})();
