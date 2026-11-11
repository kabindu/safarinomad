/* =========================================================
   SafariNomad: search engine pages and tags
   ---------------------------------------------------------
   Builds real, indexable pages from the live package data, so
   admin edits (prices, new or hidden packages) show up here too:
     /kenya-safari-packages   topic pages people search for (HUBS)
     /tour-great-migration    one page per package
     /guide-packing           one page per blog article
     /sitemap.xml, /robots.txt
   Also adds canonical links, absolute share links and structured
   data (schema.org) to the normal pages.

   Everything stated comes from the site's data. Ratings and
   review counts are deliberately NOT marked up: search engines
   only allow genuine reviews, and penalise anything else.
   Set SITE_URL to the real address when hosting.
   ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const COUNTRY = { kenya:'Kenya', tanzania:'Tanzania', uganda:'Uganda', rwanda:'Rwanda', multi:'East Africa', world:'Beyond Africa' };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const usd = n => '$' + Math.round(n).toLocaleString('en-US');
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const txt = t => `${t.title} ${t.route || ''}`;
const has = s => t => t.styles.includes(s);
const isIn = c => t => t.country === c;
const named = re => t => re.test(txt(t));
// Each general question appears on one topic page only: repeating the same answers across pages is duplicate content
const OWN_FAQ = { 'gorilla-trekking-tours':4, 'great-migration-safari-tours':5, 'kilimanjaro-climbing-tours':9, 'honeymoon-safari-packages':11, 'family-safari-packages':12, 'luxury-safari-packages':13, 'safari-and-beach-holidays':10, 'east-africa-safari-tours':14 };

/* The searches each topic page answers. {n} = packages, {from} = lowest price, {year} = this year. */
const HUBS = [
  { slug:'kenya-safari-packages', crumb:'Kenya safaris', filter:isIn('kenya'), name:'a Kenya safari', title:'Kenya Safari Packages {year}: Affordable & Best Tours', h1:'Kenya safari packages',
    desc:'Compare {n} Kenya safari packages from {from}: Maasai Mara, Amboseli, Samburu, Tsavo and the coast. Small groups, local guides, free quotes.', kw:'Kenya safari packages, best Kenya safaris, affordable Kenya safari, Kenya tours from Nairobi, Maasai Mara safari',
    intro:['Kenya is where safari began, and it is still one of the easiest places in Africa to see big game. Most trips start in Nairobi and head for the Maasai Mara, Amboseli under Kilimanjaro, the Rift Valley lakes, Samburu or Tsavo, and many finish on the Indian Ocean coast.','We have {n} Kenya packages, from short breaks to full circuits, starting at {from} per person.'] },
  { slug:'tanzania-safari-packages', crumb:'Tanzania safaris', filter:isIn('tanzania'), name:'a Tanzania safari', title:'Tanzania Safari Packages {year}: Serengeti & Zanzibar Tours', h1:'Tanzania safari packages',
    desc:'{n} Tanzania safari packages from {from}: Serengeti, Ngorongoro Crater, Tarangire, Kilimanjaro climbs and Zanzibar beach extensions.', kw:'Tanzania safari packages, Serengeti tours, Ngorongoro safari, best Tanzania safaris, affordable Tanzania safari',
    intro:['Tanzania has some of the largest wild places in Africa. The northern circuit links Tarangire, Ngorongoro Crater and the Serengeti from Arusha, and it pairs naturally with a climb of Kilimanjaro or a few days on Zanzibar.','Choose from {n} Tanzania packages starting at {from} per person.'] },
  { slug:'uganda-safari-tours', crumb:'Uganda safaris', filter:isIn('uganda'), name:'a Uganda safari', title:'Uganda Safari Tours {year}: Gorillas, Chimps & Wildlife', h1:'Uganda safari tours',
    desc:'{n} Uganda safari tours from {from}: gorilla trekking in Bwindi, chimpanzees in Kibale, Queen Elizabeth and Murchison Falls.', kw:'Uganda safari tours, Uganda gorilla trekking, Bwindi tours, Kibale chimpanzee trekking, Murchison Falls safari',
    intro:['Uganda combines primates and savannah in one trip. Track mountain gorillas in Bwindi, follow chimpanzees in Kibale, then look for wildlife in Queen Elizabeth or along the Nile at Murchison Falls.','We offer {n} Uganda tours starting at {from} per person.'] },
  { slug:'rwanda-safari-tours', crumb:'Rwanda tours', filter:isIn('rwanda'), name:'a Rwanda tour', title:'Rwanda Tours {year}: Gorilla Trekking, Akagera & Lake Kivu', h1:'Rwanda safari tours',
    desc:'{n} Rwanda tours from {from}: mountain gorillas in Volcanoes National Park, Big Five in Akagera, Nyungwe and Lake Kivu.', kw:'Rwanda tours, Rwanda gorilla trekking, Volcanoes National Park tours, Akagera safari, Lake Kivu',
    intro:['Rwanda is compact, so you spend your time seeing it rather than driving through it. Trek mountain gorillas in Volcanoes National Park, look for the Big Five in Akagera and rest beside Lake Kivu.','Choose from {n} Rwanda tours starting at {from} per person.'] },
  { slug:'east-africa-safari-tours', crumb:'Multi-country safaris', filter:isIn('multi'), name:'a multi-country East Africa safari', title:'East Africa Safari Tours {year}: Multi-Country Packages', h1:'Multi-country East Africa safaris',
    desc:'{n} multi-country East Africa safari tours from {from}, combining Kenya, Tanzania, Uganda and Rwanda in one trip.', kw:'East Africa safari tours, multi-country safari, Kenya and Tanzania safari, East Africa tour packages',
    intro:['One trip can cover more than one country. Our multi-country routes cross borders for you, joining parks in Kenya and Tanzania or adding gorillas in Uganda and Rwanda.','We have {n} multi-country routes starting at {from} per person.'] },
  { slug:'affordable-safari-packages', crumb:'Affordable safaris', filter:t => t.price <= 1000, name:'an affordable safari', title:'Affordable Safari Packages {year}: Budget Tours Under $1,000', h1:'Affordable safari packages',
    desc:'{n} affordable East Africa safari packages under $1,000, from {from} per person. Budget tours in Kenya, Tanzania, Uganda and Rwanda.', kw:'affordable safari packages, budget safari, cheap safari Kenya, safari under $1000, low cost East Africa tours',
    intro:['A safari does not have to be a once-in-a-lifetime expense. These are our packages at $1,000 per person or less, sorted from the lowest price, including day trips, short park breaks and camping safaris.','There are {n} to choose from, starting at {from}. Travelling in April to early June, in the long rains, is often the cheapest time to go.'] },
  { slug:'luxury-safari-packages', crumb:'Luxury safaris', filter:has('luxury'), name:'a luxury safari', title:'Luxury Safari Packages {year}: Best Lodges & Tented Camps', h1:'Luxury safari packages',
    desc:'{n} luxury safari packages from {from}: fine lodges and tented camps across Kenya, Tanzania, Uganda and Rwanda.', kw:'luxury safari packages, luxury lodges East Africa, tented camp safari, private safari, high-end Kenya safari',
    intro:['These trips put you in the most comfortable lodges and tented camps we work with, in the best-placed parts of each park.','We have {n} luxury packages starting at {from} per person, and any of them can be made private.'] },
  { slug:'family-safari-packages', crumb:'Family safaris', filter:has('family'), name:'a family safari', title:'Family Safari Packages {year}: Kid-Friendly Tours', h1:'Family safari packages',
    desc:'{n} family safari packages from {from}, with family-friendly lodges, shorter drives and child rates on selected trips.', kw:'family safari packages, safari with kids, kid friendly safari Kenya, family holidays East Africa',
    intro:['Safari is one of the best family holidays there is, if it is planned around children. These trips use family-friendly lodges with pools and family tents, and keep the drives shorter.','Choose from {n} family packages starting at {from} per person.'] },
  { slug:'honeymoon-safari-packages', crumb:'Honeymoon safaris', filter:t => /Honeymoon/i.test(txt(t)) || (t.styles.includes('luxury') && t.styles.includes('beach')), name:'a honeymoon safari', title:'Honeymoon Safari Packages {year}: Safari & Beach Romance', h1:'Honeymoon safari packages',
    desc:'{n} honeymoon safari packages from {from}, pairing private game drives with beach time on Zanzibar and the Indian Ocean.', kw:'honeymoon safari packages, safari and beach honeymoon, Zanzibar honeymoon, romantic safari Kenya Tanzania',
    intro:['Bush first, then beach: that is the classic East African honeymoon. These trips pair game drives with quiet days on the Indian Ocean.','We have {n} honeymoon packages starting at {from} per person.'] },
  { slug:'maasai-mara-safari-packages', crumb:'Maasai Mara', filter:named(/Mara/), name:'a Maasai Mara safari', title:'Maasai Mara Safari Packages {year}: Best Tours from Nairobi', h1:'Maasai Mara safari packages',
    desc:'{n} Maasai Mara safari packages from {from}: big cats, river crossings and conservancy stays, with road or flight options from Nairobi.', kw:'Maasai Mara safari packages, Masai Mara tours from Nairobi, Mara safari cost, Maasai Mara migration',
    intro:['The Maasai Mara is Kenya\'s best-known reserve, famous for big cats and for the wildebeest river crossings, which are most likely from late July to October.','We have {n} packages that include the Mara, starting at {from} per person.'] },
  { slug:'serengeti-safari-packages', crumb:'Serengeti', filter:named(/Serengeti/), name:'a Serengeti safari', title:'Serengeti Safari Packages {year}: Best Tours from Arusha', h1:'Serengeti safari packages',
    desc:'{n} Serengeti safari packages from {from}: the Great Migration, big cats and the northern circuit from Arusha.', kw:'Serengeti safari packages, Serengeti tours from Arusha, Serengeti migration safari, northern circuit Tanzania',
    intro:['The Serengeti is one vast plain with resident wildlife all year and the migrating herds moving through it in a yearly loop. Most trips reach it from Arusha, often by way of Tarangire and Ngorongoro.','We have {n} packages that include the Serengeti, starting at {from} per person.'] },
  { slug:'ngorongoro-crater-tours', crumb:'Ngorongoro', filter:named(/Ngorongoro/), name:'a Ngorongoro tour', title:'Ngorongoro Crater Tours {year}: Safari Packages from Arusha', h1:'Ngorongoro Crater tours',
    desc:'{n} Ngorongoro Crater tours from {from}, on Tanzania\'s northern circuit with Tarangire, Lake Manyara and the Serengeti.', kw:'Ngorongoro Crater tours, Ngorongoro safari packages, northern circuit safari, Tanzania crater safari',
    intro:['Ngorongoro is a huge volcanic caldera with a permanent population of wildlife on its floor, which makes it one of the most reliable game drives in Tanzania.','We have {n} packages that visit the crater, starting at {from} per person.'] },
  { slug:'amboseli-safari-tours', crumb:'Amboseli', filter:named(/Amboseli/), name:'an Amboseli safari', title:'Amboseli Safari Tours {year}: Elephants Under Kilimanjaro', h1:'Amboseli safari tours',
    desc:'Amboseli safari tours from {from}: large elephant herds with views of Kilimanjaro, from Nairobi.', kw:'Amboseli safari tours, Amboseli National Park packages, elephants Kilimanjaro view, Amboseli from Nairobi',
    intro:['Amboseli is known for its big elephant herds and, on clear mornings, Kilimanjaro rising straight behind them.','We have {n} packages that include Amboseli, starting at {from} per person.'] },
  { slug:'great-migration-safari-tours', crumb:'Great Migration', filter:named(/Migration|Calving/i), name:'a Great Migration safari', title:'Great Migration Safari Tours {year}: Mara & Serengeti', h1:'Great Migration safari tours',
    desc:'Great Migration safari tours from {from}, timed for the herds in the Maasai Mara and Serengeti.', kw:'Great Migration safari tours, wildebeest migration, Mara river crossing safari, best time Great Migration',
    intro:['The wildebeest move in a continuous loop between Tanzania and Kenya, so the best place to be depends on the month. River crossings are most likely from late July to October, and calving on the southern Serengeti is early in the year.','We have {n} migration trips starting at {from} per person.'] },
  { slug:'gorilla-trekking-tours', crumb:'Gorilla trekking', filter:has('gorilla'), name:'a gorilla trek', title:'Gorilla Trekking Tours {year}: Uganda & Rwanda Packages', h1:'Gorilla trekking tours',
    desc:'{n} gorilla trekking tours from {from} in Uganda and Rwanda, with permits arranged. Bwindi, Volcanoes National Park and chimpanzee add-ons.', kw:'gorilla trekking tours, Uganda gorilla trekking packages, Rwanda gorilla permit, Bwindi gorilla tour, cost of gorilla trekking',
    intro:['Sitting near a family of mountain gorillas is one of the great wildlife encounters. Treks run in Bwindi and Mgahinga in Uganda and in Volcanoes National Park in Rwanda, and permits are limited, so book early.','We have {n} primate tours starting at {from} per person. The minimum age for gorilla trekking is 15.'] },
  { slug:'kilimanjaro-climbing-tours', crumb:'Kilimanjaro', filter:t => /Kilimanjaro/.test(t.title), name:'a Kilimanjaro climb', title:'Kilimanjaro Climbing Tours {year}: Machame & Lemosho Routes', h1:'Kilimanjaro climbing tours',
    desc:'Kilimanjaro climbing tours from {from}, with guided routes to Africa\'s highest peak from Tanzania.', kw:'Kilimanjaro climbing tours, Machame route, Lemosho route, climb Kilimanjaro cost, Kilimanjaro trek packages',
    intro:['Kilimanjaro is the highest mountain in Africa, and you can walk to the top with no technical climbing. Longer routes give your body more time to adjust to the altitude.','We have {n} Kilimanjaro trips starting at {from} per person.'] },
  { slug:'hiking-and-trekking-tours', crumb:'Hiking & trekking', filter:has('trek'), name:'a trekking tour', title:'Hiking & Trekking Tours East Africa {year}: Mount Kenya & More', h1:'Hiking and trekking tours',
    desc:'{n} hiking and trekking tours from {from}: Kilimanjaro, Mount Kenya and more across East Africa.', kw:'hiking tours Kenya, trekking East Africa, Mount Kenya climb, guided hikes Tanzania, adventure tours',
    intro:['East Africa is as good on foot as from a vehicle, from day hikes to multi-day climbs of Kilimanjaro and Mount Kenya.','We have {n} hiking and trekking trips starting at {from} per person.'] },
  { slug:'zanzibar-holiday-packages', crumb:'Zanzibar', filter:named(/Zanzibar/), name:'a Zanzibar holiday', title:'Zanzibar Holiday Packages {year}: Beach & Safari Deals', h1:'Zanzibar holiday packages',
    desc:'Zanzibar holiday packages from {from}: white-sand beaches and Stone Town, on their own or after a safari.', kw:'Zanzibar holiday packages, Zanzibar beach holidays, safari and Zanzibar, Stone Town tours',
    intro:['Zanzibar is the easy way to end a safari: white sand, warm water and the old lanes of Stone Town, a short flight from the mainland parks.','We have {n} packages that include Zanzibar, starting at {from} per person.'] },
  { slug:'kenya-beach-holidays', crumb:'Kenya coast', filter:named(/Diani|Mombasa|Watamu|Malindi/), name:'a Kenya beach holiday', title:'Kenya Beach Holidays {year}: Diani, Mombasa & Watamu', h1:'Kenya beach holidays',
    desc:'Kenya beach holiday packages from {from}: Diani, Mombasa, Watamu and Malindi, including trips by the SGR train.', kw:'Kenya beach holidays, Diani beach packages, Mombasa holiday deals, Watamu Malindi tours, SGR Mombasa',
    intro:['Kenya\'s Indian Ocean coast has long white beaches, warm water and an easy link to the parks by flight or on the SGR train.','We have {n} coast packages starting at {from} per person.'] },
  { slug:'safari-and-beach-holidays', crumb:'Safari & beach', filter:has('beach'), name:'a safari and beach holiday', title:'Safari & Beach Holidays {year}: Bush and Indian Ocean', h1:'Safari and beach holidays',
    desc:'{n} safari and beach holidays from {from}: game drives followed by Zanzibar or the Kenyan coast.', kw:'safari and beach holidays, bush and beach packages, Kenya safari and Zanzibar, safari beach combo',
    intro:['Why choose? These trips start with game drives and finish on the Indian Ocean, with the connections arranged for you.','We have {n} safari and beach trips starting at {from} per person.'] },
  { slug:'camping-safari-tours', crumb:'Camping safaris', filter:has('camping'), name:'a camping safari', title:'Camping Safari Tours {year}: Budget Trips Under Canvas', h1:'Camping safari tours',
    desc:'Camping safari tours from {from}: nights under canvas inside East Africa\'s parks, the most affordable way to go on safari.', kw:'camping safari tours, budget camping safari Kenya, Tanzania camping safari, overland safari',
    intro:['Nothing is closer to the bush than a tent. Camping safaris put you inside the parks at night, and they are one of the most affordable ways to travel.','We have {n} camping trips starting at {from} per person.'] },
  { slug:'short-safaris-from-nairobi', crumb:'Short safaris', filter:t => t.days <= 4 && /^Nairobi/.test(t.route || ''), name:'a short safari from Nairobi', title:'Short Safaris from Nairobi {year}: Day Trips & Weekend Tours', h1:'Short safaris from Nairobi',
    desc:'{n} day trips and weekend safaris from Nairobi, from {from}. Maasai Mara, Naivasha, Amboseli and more in 4 days or less.', kw:'short safaris from Nairobi, weekend safari Kenya, Nairobi day tours, 3 day Maasai Mara safari',
    intro:['Only have a few days? These trips start in Nairobi and take four days or less, so they fit around work or a longer journey.','We have {n} short trips starting at {from} per person.'] }
];

export function createSeo({ siteUrl, root, load, stamp }){
  const base = siteUrl.replace(/\/+$/, '');
  const abs = p => `${base}/${String(p).replace(/^\/+/, '')}`;
  const year = () => new Date().getFullYear();
  const fill = (s, n, from) => s.replace(/\{n\}/g, n).replace(/\{from\}/g, from).replace(/\{year\}/g, year());
  // Google shows about 60-70 characters of a title: use the fullest version that fits
  const fit = (...options) => options.find(o => o.length <= 70) || options[options.length - 1];
  const clip = (s, max = 160) => { if(s.length <= max) return s; const c = s.slice(0, max - 1); return c.slice(0, c.lastIndexOf(' ')).replace(/[,:;.]$/, '') + '…'; };
  const cleanAnswer = a => a.replace(/\s*(Start with|See)\b[^.]*\.html\.?/g, '').trim();

  let articles = { mtime:0, list:[] };
  function getArticles(){
    const file = path.join(root, 'js', 'blog-data.js'), mtime = fs.statSync(file).mtimeMs;
    if(mtime !== articles.mtime) articles = { mtime, list: new vm.Script(fs.readFileSync(file, 'utf8') + '\n;ARTICLES').runInNewContext({}) };
    return articles.list;
  }
  const hubList = d => HUBS.map(h => ({ h, list: d.TRIPS.filter(h.filter).sort((a, b) => a.price - b.price) })).filter(x => x.list.length >= 3);

  // Only real details go in structured data: never the placeholder phone, email or bare social homepages
  function organization(d){
    const s = d.SITE, sameAs = Object.values(s.social || {}).filter(u => /^https?:\/\/[^/]+\/.+/.test(u));
    return { '@context':'https://schema.org', '@type':'TravelAgency', '@id':abs('#organization'), name:s.name, url:abs(''), logo:abs('images/favicon.svg'), image:abs('images/hero/hero-lion-family-hd.jpg'),
      description:'Safari and tour operator based in Nairobi, running small-group and tailor-made trips across Kenya, Tanzania, Uganda and Rwanda.',
      address:{ '@type':'PostalAddress', addressLocality:'Nairobi', addressCountry:'KE' }, areaServed:['Kenya', 'Tanzania', 'Uganda', 'Rwanda'], priceRange:'$$',
      ...(/700\s?123\s?456/.test(s.phone) ? {} : { telephone:s.phone }), ...(sameAs.length ? { sameAs } : {}) };
  }
  const crumbsLd = items => ({ '@context':'https://schema.org', '@type':'BreadcrumbList', itemListElement: items.map(([name, url], i) => ({ '@type':'ListItem', position:i + 1, name, item:abs(url) })) });

  function shell({ url, title, desc, kw, img, type = 'website', schema = [], crumbs, heroTitle, heroText, heroCta = '', body, css = 'pages', alt = '' }){
    const trail = crumbs.map(([n, u], i) => i === crumbs.length - 1 ? `<span>${esc(n)}</span>` : `<a href="${u || 'index.html'}">${esc(n)}</a><i class="fa-solid fa-chevron-right"></i>`).join('');
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${kw ? `<meta name="keywords" content="${esc(kw)}">` : ''}
<link rel="canonical" href="${abs(url)}">
<link rel="icon" href="images/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#0B1F3A">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="SafariNomad">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${abs(url)}">
<meta property="og:image" content="${abs(img)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/layout.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/pages.css">
${css === 'blog' ? '<link rel="stylesheet" href="css/blog.css">' : ''}
${schema.map(ld).join('\n')}
</head>
<body data-page="trips">
<div id="site-header"></div>
<main>
<section class="page-hero">
  <div class="bg"><img src="${esc(img)}" alt="${esc(alt)}" fetchpriority="high"></div>
  <div class="wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb">${trail}</nav>
    <h1>${esc(heroTitle)}</h1>
    ${heroText ? `<p>${esc(heroText)}</p>` : ''}
    ${heroCta}
  </div>
</section>
${body}
</main>
<div id="site-footer"></div>
<script src="js/data.js"></script>
<script src="js/content.js"></script>
<script src="js/i18n.js"></script>
<script src="js/layout.js"></script>
<script src="js/main.js"></script>
<script src="js/search.js"></script>
<script src="js/assistant.js"></script>
</body>
</html>`;
  }

  const card = t => `
    <article class="trip-card" data-country="${esc(t.country)}">
      <a class="trip-img" href="tour-${esc(t.id)}" tabindex="-1"><img src="${esc(t.img)}" alt="${esc(t.alt)}" loading="lazy"><span class="dur">${t.days} days</span></a>
      <div class="trip-body"><h3><a href="tour-${esc(t.id)}">${esc(t.title)}</a></h3><p class="trip-desc">${esc(t.route || t.countries)}</p></div>
      <div class="trip-foot">
        <div class="trip-price"><small>From</small><span class="price-now" data-usd="${t.price}">${usd(t.price)}</span><small>per person</small></div>
        <a class="btn btn-sm" href="book.html?trip=${esc(t.id)}">View dates</a>
      </div>
    </article>`;
  const faqHtml = list => `<div class="faq-list">${list.map(({ q, a }, i) => `<details class="faq"${i === 0 ? ' open' : ''}><summary>${esc(q)} <i class="fa-solid fa-plus"></i></summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  const linkRow = (title, links) => links.length ? `<section class="pt-0"><div class="wrap"><div class="sec-head"><div><h2>${esc(title)}</h2></div></div><div class="seo-links">${links.map(([href, label]) => `<a href="${esc(href)}">${esc(label)}</a>`).join('')}</div></div></section>` : '';

  function hubPage({ h, list }, d){
    const from = usd(list[0].price), n = list.length, top = list[list.length - 1];
    const qa = [{ q:`How much does ${h.name} cost?`, a:`Our prices for ${h.name} start at ${from} per person for ${list[0].days === 1 ? 'a day trip' : `${list[0].days} days`} and go up to ${usd(top.price)} for ${top.days} days. The price depends on the length of the trip, the accommodation and the season. Your quote confirms the final price.` },
      ...[d.KNOWLEDGE[OWN_FAQ[h.slug]]].filter(Boolean).map(k => ({ q:k.q, a:cleanAnswer(k.a) }))];
    const hero = list.find(t => t.featured) || list[0], url = h.slug;
    const crumbs = [['Home', ''], ['Packages', 'trips.html'], [h.crumb, url]];
    const others = hubList(d).filter(x => x.h !== h).slice(0, 40).map(x => [x.h.slug, x.h.h1]);
    return shell({ url, title:fit(`${fill(h.title, n, from)} | SafariNomad`, fill(h.title, n, from)), desc:clip(fill(h.desc, n, from)), kw:h.kw, img:hero.img, alt:hero.alt, crumbs, heroTitle:h.h1, heroText:fill(h.intro[1], n, from),
      schema:[crumbsLd(crumbs.map(([a, b]) => [a, b])), { '@context':'https://schema.org', '@type':'ItemList', name:h.h1, numberOfItems:n, itemListElement:list.map((t, i) => ({ '@type':'ListItem', position:i + 1, url:abs('tour-' + t.id), name:t.title })) }],
      body:`<section><div class="wrap">
        <p class="seo-intro">${esc(fill(h.intro[0], n, from))}</p>
        <div class="sec-head"><div><h2>${esc(h.h1)}, lowest price first</h2></div></div>
        <div class="card-grid">${list.map(card).join('')}</div>
      </div></section>
      <section class="pt-0"><div class="wrap"><div class="sec-head"><div><h2>Questions about ${esc(h.name.replace(/^an? /, ''))}</h2></div></div>${faqHtml(qa)}<p class="seo-more"><a href="about.html#faqs">More answers: visas, deposits, insurance and what's included</a></p></div></section>
      ${linkRow('Explore more trips', others)}` });
  }

  const wordFor = t => t.styles.includes('trek') ? 'Trek' : t.styles.includes('abroad') ? 'Holiday' : t.styles.includes('gorilla') ? 'Tour' : t.styles.includes('beach') && !t.styles.includes('wildlife') ? 'Holiday' : 'Safari';
  const listJoin = a => a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;

  function tourPage(t, d){
    const stops = (t.route || '').split(/\s*→\s*/).filter(Boolean), word = wordFor(t), price = usd(t.price), where = t.countries || COUNTRY[t.country] || 'East Africa';
    const months = (t.months || []).map(m => MONTHS[m - 1]), isPrivate = t.group <= 2;
    const lead = `${t.title} is a ${t.days}-day ${word.toLowerCase()} in ${where.replace(/\s*·\s*/g, ' and ')}${isPrivate ? ', run privately for you' : `, in a small group of up to ${t.group} travellers`}.`;
    const route = stops.length > 1 ? ` The route starts in ${stops[0]}${stops.length > 2 ? `, visits ${listJoin(stops.slice(1, -1))},` : ''} and ends in ${stops[stops.length - 1]}.` : '';
    const stay = t.stay ? ` You stay in ${t.stay.toLowerCase()}.` : '';
    const when = months.length && months.length < 12 ? ` The best months for this trip are ${listJoin(months)}.` : '';
    const hubs = hubList(d).filter(x => x.h.filter(t)).map(x => [x.h.slug, x.h.h1]);
    const related = d.TRIPS.filter(x => x.id !== t.id && x.country === t.country).sort((a, b) => Math.abs(a.price - t.price) - Math.abs(b.price - t.price)).slice(0, 3);
    const desc = `${t.days}-day ${word.toLowerCase()} in ${where.replace(/\s*·\s*/g, ' & ')} from ${price} per person: ${(t.route || t.title)}. Check dates and book online.`;
    const crumbs = [['Home', ''], ['Packages', 'trips.html'], [t.title, 'tour-' + t.id]];
    const incl = 'Your guide and 4x4 vehicle, accommodation, park and conservancy fees, most meals, airport transfers and drinking water on game drives.';
    const fact = (icon, k, v) => v ? `<div class="seo-fact"><i class="fa-solid ${icon}" aria-hidden="true"></i><div><small>${k}</small><b>${v}</b></div></div>` : '';
    return shell({ url:'tour-' + t.id, type:'article', title:fit(`${t.title}: ${t.days}-Day ${word} from ${price} | SafariNomad`, `${t.title}: ${t.days}-Day ${word} from ${price}`, `${t.title} from ${price}`, t.title), desc:clip(desc), img:t.img, alt:t.alt, crumbs, heroTitle:t.title, heroText:t.route || where,
      kw:[`${t.days} day ${word.toLowerCase()}`, ...stops.map(s => `${s} ${word.toLowerCase()}`), `${where.replace(/\s*·\s*/g, ' ')} tour packages`].join(', '),
      heroCta:`<div class="hero-ctas" style="margin-top:22px;"><a class="btn" href="book.html?trip=${esc(t.id)}">Check dates and book</a></div>`,
      schema:[crumbsLd(crumbs), { '@context':'https://schema.org', '@type':'TouristTrip', name:t.title, description:lead + route + stay + when, url:abs('tour-' + t.id), image:abs(t.img), touristType:t.styles,
        ...(stops.length ? { itinerary:{ '@type':'ItemList', itemListElement:stops.map((s, i) => ({ '@type':'ListItem', position:i + 1, item:{ '@type':'Place', name:s } })) } } : {}),
        provider:{ '@id':abs('#organization'), '@type':'TravelAgency', name:d.SITE.name, url:abs('') },
        offers:{ '@type':'Offer', price:t.price, priceCurrency:'USD', url:abs('book.html?trip=' + t.id) } }],
      body:`<section><div class="wrap seo-trip">
        <div class="seo-facts">
          ${fact('fa-calendar-days', 'Length', `${t.days} day${t.days === 1 ? '' : 's'}`)}${fact('fa-location-dot', 'Where', esc(where))}${fact('fa-bed', 'Stay', esc(t.stay))}
          ${fact('fa-users', 'Group', isPrivate ? 'Private' : `Up to ${t.group}`)}${fact('fa-tag', 'From', `<span data-usd="${t.price}">${price}</span> per person`)}
        </div>
        <h2>About this ${word.toLowerCase()}</h2>
        <p class="seo-intro">${esc(lead + route + stay + when)}</p>
        ${stops.length > 1 ? `<h2>The route</h2><ol class="seo-route">${stops.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
        <h2>What's included</h2>
        <p class="seo-intro">${esc(incl)} International flights, visas, travel insurance and tips are not included.</p>
        <p class="seo-intro">A deposit secures your place and the balance is due ${d.BOOKING.balanceDays} days before you travel. See our <a href="terms.html">booking terms</a>.</p>
        <a class="btn" href="book.html?trip=${esc(t.id)}">Check dates and book</a>
      </div></section>
      ${related.length ? `<section class="pt-0"><div class="wrap"><div class="sec-head"><div><h2>Similar trips</h2></div></div><div class="card-grid">${related.map(card).join('')}</div></div></section>` : ''}
      ${linkRow('More like this', hubs)}` });
  }

  function guidePage(a, d){
    const url = 'guide-' + a.id, crumbs = [['Home', ''], ['Blog', 'blog.html'], [a.title, url]];
    const others = getArticles().filter(x => x.id !== a.id).slice(0, 12).map(x => ['guide-' + x.id, x.title]);
    return shell({ url, type:'article', css:'blog', title:fit(`${a.title} | SafariNomad`, a.title), desc:clip(a.excerpt), img:a.cover, alt:a.title, crumbs, heroTitle:a.title, heroText:a.readTime,
      schema:[crumbsLd(crumbs), { '@context':'https://schema.org', '@type':'Article', headline:a.title, description:a.excerpt, image:abs(a.cover), mainEntityOfPage:abs(url), publisher:{ '@id':abs('#organization'), '@type':'Organization', name:d.SITE.name } }],
      body:`<section><div class="wrap"><article class="article-body-wrap">${a.body}</article></div></section>${linkRow('More travel guides', others)}` });
  }

  /* /kenya-safari-packages, /tour-…, /guide-… → the page, or null */
  function page(url){
    const slug = url.replace(/^\//, ''), d = load();
    if(slug.startsWith('tour-')){ const t = d.TRIPS.find(x => x.id === slug.slice(5)); return t ? tourPage(t, d) : null; }
    if(slug.startsWith('guide-')){ const a = getArticles().find(x => x.id === slug.slice(6)); return a ? guidePage(a, d) : null; }
    const hub = hubList(d).find(x => x.h.slug === slug);
    return hub ? hubPage(hub, d) : null;
  }

  // The normal pages: canonical link, full share links and, on the home page, who we are
  function injectHead(file, html){
    const name = path.basename(file);
    if(!name.endsWith('.html') || ['404.html', 'admin.html', 'guides.html', 'deals.html'].includes(name)) return html;
    const url = name === 'index.html' ? '' : name;
    let extra = `<link rel="canonical" href="${abs(url)}">\n<meta property="og:url" content="${abs(url)}">`;
    if(name === 'index.html'){
      const d = load();
      extra += '\n' + ld(organization(d)) + '\n' + ld({ '@context':'https://schema.org', '@type':'WebSite', name:d.SITE.name, url:abs(''), publisher:{ '@id':abs('#organization') } });
    }
    return html.replace(/<meta property="og:image" content="(?!https?:)([^"]+)">/, (m, p) => `<meta property="og:image" content="${abs(p)}">`).replace('</head>', extra + '\n</head>');
  }

  const STATIC = ['', 'trips.html', 'destinations.html', 'flights.html', 'services.html', 'plan.html', 'groups.html', 'blog.html', 'about.html', 'contact.html'];
  function urls(){ const d = load(); return [...STATIC, ...hubList(d).map(x => x.h.slug), ...d.TRIPS.map(t => 'tour-' + t.id), ...getArticles().map(a => 'guide-' + a.id)]; }
  function sitemap(){
    const lastmod = new Date(stamp()).toISOString().slice(0, 10);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls().map(u => `  <url><loc>${esc(abs(u))}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  }
  const robots = () => `User-agent: *\nDisallow: /admin.html\nDisallow: /api/\n\nSitemap: ${abs('sitemap.xml')}\n`;

  return { page, sitemap, robots, injectHead, urls, isPage: url => /^\/(tour-[\w-]+|guide-[\w-]+|[a-z]+(-[a-z]+)+)$/.test(url) };
}
