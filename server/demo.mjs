/* =========================================================
   SafariNomad: demo data for presenting the admin dashboard
   ---------------------------------------------------------
   makeDemo() builds believable, clearly fictional records
   (example.com emails, +44 7700 900… drama-range phones) so
   Today, Bookings, Unfinished and Insights aren't empty in a
   demo. Every record carries demo:true, so "Clear demo data"
   removes exactly these and never touches real customers.
   Demo bookings never take seats on the public site.
   ========================================================= */

// Small seeded random generator, so every load looks the same
function rng(seed = 7){ return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }

const PEOPLE = [
  ['Sarah Mitchell', 'United Kingdom', 'en'], ['Jonas Weber', 'Germany', 'de'], ['Emily Carter', 'United States', 'en'],
  ['Lukas Hoffmann', 'Germany', 'de'], ['Sophie van Dijk', 'Netherlands', 'en'], ['James O\'Connor', 'Ireland', 'en'],
  ['Grace Wanjiru', 'Kenya', 'en'], ['Claire Dubois', 'France', 'fr'], ['Michael Brown', 'United States', 'en'],
  ['Anna Schneider', 'Austria', 'de'], ['David Okafor', 'United Kingdom', 'en'], ['Laura Rossi', 'Italy', 'en'],
  ['Peter Kamau', 'Kenya', 'en'], ['Hannah Fischer', 'Switzerland', 'de'], ['Olivia Turner', 'Australia', 'en'],
  ['Thomas Becker', 'Germany', 'de'], ['Rachel Green', 'Canada', 'en'], ['Mark Lindqvist', 'Sweden', 'en']
];
const email = n => n.toLowerCase().replace(/[^a-z ]/g, '').replace(/ /g, '.') + '@example.com';
const phone = i => `+44 7700 900${String(100 + i * 37).slice(-3)}`;

const QUESTIONS = [
  ['When is the best time to see the Great Migration river crossings?', 'River crossings in the Maasai Mara are most likely from late July to October, peaking in August and September.'],
  ['Do I need a visa for Kenya with a German passport?', 'Yes. Kenya uses an online Electronic Travel Authorisation (eTA). Apply at etakenya.go.ke at least 2 weeks before you fly.'],
  ['Is Zanzibar safe for a family with young children?', 'Yes, Zanzibar is popular with families. The north and east coast beaches are calm, and many resorts have kids\' clubs.'],
  ['How fit do I need to be for gorilla trekking?', 'A moderate level of fitness is enough. Treks take 1 to 6 hours over steep, muddy ground, and porters can help carry your bag.'],
  ['Can we combine a safari with Diani beach?', 'Easily. A short flight from the Mara or Amboseli takes you to Diani, or you can take the SGR train from Nairobi to Mombasa.'],
  ['What vaccinations do I need for Tanzania?', 'Yellow fever proof is needed if you arrive from a risk country. Typhoid, hepatitis A and malaria tablets are commonly advised; check with your doctor.'],
  ['How much should I tip our safari guide?', 'A common guide is $10 to $20 per guest per day for your guide, plus a little for camp staff.'],
  ['Wie viel kostet eine Safari in der Masai Mara?', 'Eine 3-tägige Gruppensafari beginnt bei etwa 590 USD pro Person, private Safaris kosten mehr.'],
  ['What should I pack for Kilimanjaro?', 'Layers: thermal base, fleece, down jacket, waterproof shell, warm gloves, hat, good boots and a 4-season sleeping bag.'],
  ['Can I see the Big Five in Nairobi National Park?', 'You can see four of the Big Five there (lion, buffalo, rhino, leopard). Elephants are best seen in Amboseli or Tsavo.'],
  ['Are flights from Frankfurt to Nairobi direct?', 'Condor flies direct seasonally. Otherwise one-stop options via Amsterdam, Doha, Dubai or Addis Ababa are common.'],
  ['What is the cheapest month for a Kenya safari?', 'April to early June (the long rains) has the lowest prices, with lush scenery and fewer vehicles.']
];
const SEARCHES = ['maasai mara', 'zanzibar', 'gorilla', 'kilimanjaro', 'amboseli', 'diani', 'serengeti', 'family safari', 'honeymoon', 'migration', 'naivasha', 'budget safari'];
const REFS = [['Direct / typed', 30], ['google.com', 34], ['instagram.com', 12], ['facebook.com', 8], ['tripadvisor.com', 7], ['safaribookings.com', 5], ['bing.com', 2], ['tiktok.com', 2]];
const TZS = [['Europe/London', 22], ['Europe/Berlin', 20], ['America/New_York', 12], ['Africa/Nairobi', 14], ['Europe/Amsterdam', 6], ['Europe/Paris', 5], ['Europe/Zurich', 4], ['Europe/Vienna', 4], ['America/Los_Angeles', 4], ['Australia/Sydney', 3], ['Europe/Stockholm', 2]];
const LANGS = [['en-GB', 30], ['de-DE', 26], ['en-US', 22], ['nl-NL', 5], ['fr-FR', 5], ['de-CH', 4], ['de-AT', 4], ['sv-SE', 2], ['it-IT', 2]];
const PAGES = [['index.html', 30], ['trips.html', 20], ['book.html', 9], ['destinations.html', 9], ['plan.html', 6], ['flights.html', 7], ['services.html', 5], ['about.html', 5], ['contact.html', 4], ['blog.html', 3], ['groups.html', 2]];

export function makeDemo({ TRIPS, PLACES, BookingRules, BOOKING }){
  const r = rng(), pick = a => a[Math.floor(r() * a.length)], int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const now = Date.now(), H = 3600_000, D = 24 * H;
  const ago = ms => new Date(now - ms).toISOString();
  const today = BookingRules.iso(BookingRules.today());
  const listed = TRIPS.filter(t => !t.hidden);
  const popular = listed.filter(t => t.featured).concat(listed).slice(0, 14);
  // A start date the trip really offers, about `days` from today
  const departure = (t, days) => {
    for(let i = 0; i < 14; i++){ const d = BookingRules.addDays(today, days + i); if(BookingRules.isDeparture(t.id, d, t.group <= 2)) return d; }
    return BookingRules.addDays(today, days);
  };

  /* Bookings: a few waiting to be confirmed, most confirmed, some past */
  const STATUSES = ['pending', 'pending', 'pending', 'confirmed', 'confirmed', 'confirmed', 'confirmed', 'confirmed', 'confirmed', 'completed', 'completed', 'cancelled', 'confirmed', 'pending'];
  const bookings = STATUSES.map((status, i) => {
    const t = popular[i % popular.length], [name, country, lang] = PEOPLE[i];
    const adults = int(1, 4), children = t.styles && t.styles.includes('family') ? int(0, 2) : 0;
    const past = status === 'completed';
    const date = past ? BookingRules.addDays(today, -int(10, 40)) : departure(t, int(9, 110));
    const total = BookingRules.price(t.id, adults, children);
    return {
      id: 'demo-b' + i, ref: 'SN-D' + (1000 + i * 73).toString(16).toUpperCase().slice(-4), demo: true,
      created: ago(past ? int(50, 90) * D : int(1, 50 * 24) * H), status,
      trip: t.id, tripTitle: t.title, days: t.days, date, endDate: BookingRules.addDays(date, t.days - 1), private: t.group <= 2,
      adults, children, total, deposit: BookingRules.deposit(t.id, adults, children), balanceDue: BookingRules.addDays(date, -BOOKING.balanceDays),
      name, email: email(name), phone: phone(i), country, notes: i % 4 === 0 ? 'Vegetarian meals for one traveller, please.' : '',
      lang, currency: lang === 'de' ? 'EUR' : 'USD', note: status === 'confirmed' ? 'Deposit received.' : '',
      nationality: country, visa: pick(['Help me apply', 'I have it', 'Not needed']), flights: pick(['Already booked', 'Help me find flights', 'Book them for me']),
      flightNo: i % 3 === 0 ? 'KQ 117' : '', arrival: '', flyFrom: ''
    };
  });

  // Two of the waiting bookings have asked for a discount
  bookings.filter(b => b.status === 'pending').slice(0, 2).forEach((b, i) => { b.discount = { status:'requested', reason: i ? 'Returning traveller' : 'Group size', message:'', suggestedPct: BookingRules.tier(b.adults + b.children), requestedAt: b.created }; });

  /* Enquiries: a mix of what the site's forms send */
  const route = n => PLACES.slice(n, n + 3).map(p => p.name).join(' → ');
  const enquiries = [
    ['Quote request', { Message: 'We are a couple looking at 8 to 10 days in Kenya and Zanzibar in August. Mid-range lodges.' }],
    ['Custom trip', { Route: route(0), Days: '9', Travellers: '2 adults', Style: 'Mid-range', Message: 'Honeymoon, would love a balloon safari.' }],
    ['Group trip', { 'Group type': 'School or university', Organisation: 'Demo International School', 'Group size': '42', Ages: 'Students (under 18)', Days: '3', Message: 'Biology field trip to Lake Nakuru and Naivasha for 38 students and 4 teachers.' }],
    ['Custom trip', { Route: route(3), Days: '12', Travellers: '2 adults, 2 children', Style: 'Comfort', Message: 'Family trip with kids aged 8 and 11.' }],
    ['Group trip', { 'Group type': 'Company or organisation', Organisation: 'Demo Holdings Ltd', 'Group size': '25', Ages: 'Adults', Days: '2', Message: 'End-of-year team retreat in Naivasha with a meeting room.' }],
    ['Quote request', { Message: 'Gorilla trekking in Uganda for 3 people in March. How far ahead do we need permits?' }],
    ['Flash deal alerts', {}],
    ['Newsletter / brochure', {}]
  ].map(([type, f], i) => {
    const [name] = PEOPLE[i + 6];
    return { id: 'demo-e' + i, demo: true, created: ago(int(2, 6 * 24) * H + i * 7 * H), status: i < 4 ? 'new' : pick(['replied', 'closed']), type,
      page: ({ 'Custom trip':'plan.html', 'Group trip':'groups.html', 'Flash deal alerts':'index.html' })[type] || 'contact.html',
      fields: Object.keys(f).length ? { Name: name, Email: email(name), Phone: phone(i + 20), ...f } : { Email: email(name) }, note: '' };
  });

  /* Unfinished: people who stopped halfway */
  const leads = [
    ['Booking', 'Step 3 · Your details', popular[0]], ['Booking', 'Step 5 · Visas & flights', popular[2]],
    ['Custom trip', 'Choosing places', null], ['Group trip', 'Filling in the group form', null], ['Booking', 'Step 4 · Travellers', popular[4]]
  ].map(([source, step, t], i) => {
    const [name] = PEOPLE[i + 12];
    const fields = { Name: name, Email: email(name), Phone: phone(i + 40) };
    if(t){ fields.Trip = t.title; fields.Date = departure(t, int(20, 80)); }
    if(source === 'Custom trip') fields.Route = route(1);
    if(source === 'Group trip'){ fields['Group size'] = '18'; fields['Group type'] = 'Church, charity or community'; }
    return { id: 'demo-l' + i, demo: true, draft: 'demo-draft-' + i, created: ago((i + 1) * 9 * H), updated: ago((i + 1) * 8 * H),
      status: i < 4 ? 'open' : 'contacted', note: '', source, page: source === 'Custom trip' ? 'plan.html' : source === 'Group trip' ? 'groups.html' : 'book.html',
      step, resume: t ? `book.html?trip=${t.id}` : source === 'Group trip' ? 'groups.html#group-form' : 'plan.html', name, email: fields.Email, phone: fields.Phone, fields };
  });

  /* A traveller comparing flights, and one who sent them to a planner */
  const flightOpts = [
    { from:'FRA', to:'NBO', fromName:'Frankfurt', toName:'Nairobi', depart: BookingRules.addDays(today, 40), ret: BookingRules.addDays(today, 52), adults:2, children:0, cabinName:'Economy', airline:'Ethiopian Airlines', price:1180, cur:'EUR' },
    { from:'FRA', to:'NBO', fromName:'Frankfurt', toName:'Nairobi', depart: BookingRules.addDays(today, 42), ret: BookingRules.addDays(today, 54), adults:2, children:0, cabinName:'Economy', airline:'Emirates', price:1320, cur:'EUR' }
  ];
  const [flyName] = PEOPLE[16], [leadName] = PEOPLE[17];
  enquiries.push({ id:'demo-e-fly', demo:true, created: ago(5 * H), status:'new', type:'Flight plan', page:'flights.html', flights: flightOpts, note:'',
    fields: { Name: flyName, Email: email(flyName), Phone: phone(70), Route:'Frankfurt → Nairobi; Frankfurt → Nairobi', Message:'Comparing 2 flight options' } });
  leads.push({ id:'demo-l-fly', demo:true, draft:'demo-draft-fly', created: ago(30 * H), updated: ago(28 * H), status:'open', note:'', source:'Flights', page:'flights.html', step:'Comparing flights', resume:'flights.html#myFlights',
    name: leadName, email: email(leadName), phone:'', flights: flightOpts.slice(0, 1), fields: { Name: leadName, Email: email(leadName), Route:'Frankfurt → Nairobi' } });

  /* Chat questions */
  const questions = QUESTIONS.map(([q, a], i) => ({ id: 'demo-q' + i, demo: true, created: ago(int(1, 10 * 24) * H), status: i < 5 ? 'new' : 'reviewed',
    session: 'demo', page: pick(['index.html', 'trips.html', 'book.html', 'flights.html']), lang: /[äöüß]|Wie /.test(q) ? 'de' : 'en', question: q, answer: a }));

  /* Visits: the last 90 days, busier at weekends and growing a little */
  const spread = (pairs, total) => { const sum = pairs.reduce((s, [, w]) => s + w, 0), o = {}; pairs.forEach(([k, w]) => { const n = Math.round(total * w / sum * (0.7 + r() * 0.6)); if(n) o[k] = n; }); return o; };
  const days = {};
  for(let i = 89; i >= 0; i--){
    const day = BookingRules.addDays(today, -i), dow = new Date(day + 'T00:00:00Z').getUTCDay();
    const sessions = Math.round((70 + (89 - i) * 0.5) * (dow === 0 || dow === 6 ? 1.35 : 1) * (0.8 + r() * 0.4));
    const views = Math.round(sessions * (2.8 + r()));
    days[day] = { sessions, views, pages: spread(PAGES, views), refs: spread(REFS, sessions), tz: spread(TZS, sessions), lang: spread(LANGS, sessions),
      trips: spread(popular.map((t, k) => [t.id, 14 - k]), Math.round(views * 0.08)),
      searches: spread(SEARCHES.map((s, k) => [s, 12 - k]), Math.round(sessions * 0.15)),
      interests: spread([['country:kenya', 10], ['country:tanzania', 7], ['country:uganda', 3], ['country:rwanda', 2], ['style:wildlife', 8], ['style:beach', 5], ['style:gorilla', 3], ['style:family', 3],
        ...PLACES.slice(0, 6).map((p, k) => ['place:' + p.name, 6 - k])], Math.round(sessions * 0.3)) };
  }
  /* Team: two demo staff (they can't sign in) with credit for some of the work, and their activity */
  const staff = [
    { id: 'demo-u1', username: 'amina.demo', name: 'Amina Otieno', role: 'agent', created: ago(80 * D), createdBy: 'Demo', logins: 41, lastLogin: ago(3 * H), lastSeen: ago(40 * 60_000) },
    { id: 'demo-u2', username: 'brian.demo', name: 'Brian Mwangi', role: 'manager', created: ago(120 * D), createdBy: 'Demo', logins: 63, lastLogin: ago(26 * H), lastSeen: ago(20 * H) }
  ];
  const activity = [];
  const act = (u, at, action, detail, kind, ref) => activity.push({ id: 'demo-a' + activity.length, at, uid: u.id, name: u.name, action, detail, kind, ref });
  staff.forEach(u => { for(let i = 0; i < 12; i++) act(u, ago(int(1, 30) * D + int(0, 9) * H), 'Signed in', 'from 41.90.x.x'); });
  bookings.forEach((b, i) => {
    if(!['confirmed', 'completed'].includes(b.status)) return;
    const u = staff[i % 2], at = new Date(Date.parse(b.created) + int(2, 20) * H).toISOString();
    Object.assign(b, { confirmedBy: u.id, statusBy: u.id, statusAt: at, assignedTo: u.id });
    act(u, at, 'Marked confirmed', `booking ${b.ref} (${b.name})`, 'bookings', b.id);
  });
  enquiries.forEach((e, i) => {
    if(e.status !== 'replied') return;
    const u = staff[i % 2], at = new Date(Date.parse(e.created) + int(1, 8) * H).toISOString();
    Object.assign(e, { repliedBy: u.id, statusBy: u.id, statusAt: at });
    act(u, at, 'Marked replied', `${e.type.toLowerCase()} from ${e.fields.Name || e.fields.Email}`, 'enquiries', e.id);
  });
  leads.forEach(l => {
    if(l.status !== 'contacted') return;
    const u = staff[0], at = new Date(Date.parse(l.updated) + 2 * H).toISOString();
    Object.assign(l, { handledBy: u.id, statusBy: u.id, statusAt: at });
    act(u, at, 'Marked contacted', `follow-up ${l.name}`, 'leads', l.id);
  });
  act(staff[1], ago(5 * D), 'Edited the website', 'flash sales');
  act(staff[1], ago(9 * D), 'Downloaded CSV', 'bookings (all)');

  return { bookings, enquiries, leads, questions, staff, activity, analytics: { since: BookingRules.addDays(today, -89), days } };
}
