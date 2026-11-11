/* =========================================================
   SafariNomad: price estimates
   ---------------------------------------------------------
   Works out what each package costs to run and what it should
   sell for, per person sharing, for international visitors.

     cost     = vehicle + nights + flights/activities + park fees
     floor    = lowest safe price (a discount can never go below it)
     proposed = cost plus margin, and at least the low end of what
                other operators charge for that kind of trip

   These are ESTIMATES. They become real only when someone
   publishes them in admin → Prices. Update the numbers below when
   suppliers or parks change their rates.

   Sources checked November 2026: published park and permit
   tariffs (mostly through operator sites), operator price
   guides, and listings on SafariBookings and TourRadar.
   ========================================================= */

// Per person, per day: fixed by parks and governments (no margin is earned on these)
const PARKS = [
  [/Mara\b/, 200],                         // Jul-Dec rate ($100 Jan-Jun): the published price has to hold all year
  [/Amboseli/, 90], [/Nakuru/, 90], [/Tsavo|Chyulu/, 80], [/Nairobi National Park/, 80], [/Samburu/, 70], [/Ol Pejeta|Laikipia/, 100],
  [/Meru National Park/, 70], [/Aberdare/, 60], [/Hell's Gate/, 30], [/Longonot/, 30], [/Bogoria|Baringo/, 40], [/Kakamega/, 25],
  [/Serengeti|Ndutu/, 154],                // $83 entry + $71 camp/lodge concession
  [/Ngorongoro/, 141],                     // $71 entry + about $70 each for the crater vehicle fee
  [/Tarangire|Manyara|Ruaha/, 59], [/Nyerere|Rufiji/, 83], [/Mikumi|Katavi|Rubondo/, 40], [/Natron|Lengai/, 40], [/Gombe|Mahale/, 100], [/Usambara/, 15], [/Mafia/, 30],
  [/Murchison|Queen Elizabeth|Ishasha|Kazinga|Kidepo|Mburo|Kibale/, 45],
  [/Akagera/, 100], [/Nyungwe/, 100]
];
// Paid once per trip
const PERMITS = [
  [t => /Bwindi|Mgahinga/.test(t.text) && t.styles.includes('gorilla'), 800, 'Uganda gorilla permit'],
  [t => /Volcanoes/.test(t.text) && t.styles.includes('gorilla') && !/Golden Monkeys & Dian/.test(t.title), 1500, 'Rwanda gorilla permit'],
  [t => /Kibale/.test(t.text) && t.styles.includes('gorilla'), 300, 'Kibale chimp permit (2027 rate)'],
  [t => /Nyungwe|Gishwati/.test(t.text) && t.styles.includes('gorilla'), 100, 'Chimp trek'],
  [t => /Golden Monkeys/.test(t.title), 100, 'Golden monkey permit'],
  [t => /Bisoke/.test(t.title), 75, 'Bisoke hike permit'],
  [t => /Karisimbi/.test(t.title), 400, 'Karisimbi permit']
];
const GATEWAYS = /^(Nairobi|Arusha|Entebbe|Kigali|Kampala|Moshi|Mombasa|Dar es Salaam|Kisoro|Kabale|Kasese|Nanyuki|Mwanza|Kigoma|Rubavu|Musanze|Zanzibar|Stone Town)$/;
// Vehicle, driver-guide and fuel per person per day, with 4 people sharing
const VEHICLE = { kenya:75, tanzania:90, uganda:70, rwanda:75, multi:85, world:0 };
// Full board per person per night, sharing
const NIGHT = {
  budget:  { kenya:50,  tanzania:60,  uganda:50,  rwanda:60,  multi:55 },
  mid:     { kenya:150, tanzania:190, uganda:130, rwanda:200, multi:170 },
  premium: { kenya:300, tanzania:320, uganda:280, rwanda:380, multi:320 },
  luxury:  { kenya:520, tanzania:620, uganda:480, rwanda:750, multi:600 }
};
// What other operators charge per person per day, excluding one-off permits
const MARKET = {
  budget:  { kenya:[150,300], tanzania:[180,400], uganda:[130,260], rwanda:[150,280], multi:[180,350] },
  mid:     { kenya:[300,600], tanzania:[400,800], uganda:[200,450], rwanda:[250,500], multi:[320,650] },
  premium: { kenya:[400,850], tanzania:[500,900], uganda:[350,700], rwanda:[400,800], multi:[450,900] },
  luxury:  { kenya:[600,1500], tanzania:[850,1500], uganda:[700,1500], rwanda:[800,1800], multi:[800,1500] }
};
const BEACH_MARKET = { budget:[80,200], mid:[100,300], premium:[200,450], luxury:[350,900] };
const MARGIN = 1.30, FEE_MARGIN = 1.05, FLOOR_MARGIN = 1.08;
// Lindberg's own published packages stay at their price
const FIXED = new Set(['mombasa-sgr-escape', 'lamu-dhow-escape', 'iten-altitude-camp', 'sagana-rafting-day', 'caribbean-cruise', 'algarve-festival']);
// Priced directly from published market rates for that exact trip
const BENCHMARK = {
  'kilimanjaro-machame':  { price:1990, floor:1560, range:[1985,2800], why:'Published 7-day Machame rates' },
  'kilimanjaro-lemosho':  { price:2350, floor:1860, range:[2350,3150], why:'Published 8-day Lemosho rates' },
  'kilimanjaro-marangu':  { price:1700, floor:1320, range:[1695,2200], why:'Published 6-day Marangu rates' },
  'kilimanjaro-rongai':   { price:1990, floor:1560, range:[1950,2800], why:'In line with 7-day Machame' },
  'mount-kenya-climb':    { price:1000, floor:760,  range:[775,1290],  why:'Published 5-day Sirimon listings' }
};
// Flights and paid activities a route includes
const EXTRAS = {
  'mara-balloon':480, 'serengeti-fly-in':650, 'katavi':1300, 'mahale':1500, 'lamu-island':260, 'mara-diani':190, 'zanzibar-honeymoon':60, 'pemba-island':220, 'mafia-whale-sharks':320,
  'serengeti-zanzibar':290, 'luxury-honeymoon':290, 'nyerere-zanzibar':290, 'kenya-tanzania-zanzibar':350, 'grand-journey':900, 'east-africa-highlights':500, 'primate-explorer':80,
  'jinja-nile':150, 'congo-nile-trail':120, 'rwenzori-trek':780, 'mount-meru':330, 'lake-natron':60, 'gombe-chimps':350, 'rubondo-island':180, 'usambara-hike':40, 'rufiji-river':60, 'southern-tanzania':520, 'ssese-islands':30
};
const LOW = /Mount Meru|Samburu|Ol Pejeta|Laikipia|Meru National|Aberdare|Bogoria|Kakamega|Akagera|Nyungwe|Gishwati|Mikumi|Katavi|Rubondo|Gombe|Mahale|Natron|Usambara|Rwenzori|Karisimbi|Bisoke|Kidepo|Mafia|Pemba/;

function tierOf(t){
  if(t.styles.includes('camping') || /camp(site|ing)|Budget|banda|hut|guesthouse/i.test(t.stay || '')) return 'budget';
  if(/luxury|villa/i.test(`${t.title} ${t.stay || ''}`)) return 'luxury';
  if(t.styles.includes('luxury')) return 'premium';
  return 'mid';
}
const up10 = n => Math.ceil(n / 10) * 10;

export function estimate(trip){
  const t = { ...trip, text: `${trip.title} ${trip.route || ''}`, styles: trip.styles || [] };
  if(FIXED.has(t.id)) return { id:t.id, current:t.price, proposed:t.price, floor:Math.round(t.price * 0.92), fixed:true, confidence:'high', why:'Lindberg\'s published price', fees:0, cost:null, range:null };
  const b = BENCHMARK[t.id];
  if(b) return { id:t.id, current:t.price, proposed:b.price, floor:b.floor, range:b.range, confidence:'high', why:b.why, fees:null, cost:null };

  const c = t.country in VEHICLE ? t.country : 'kenya', tier = tierOf(t), nights = Math.max(t.days - 1, 0);
  const stops = (t.route || '').split(/\s*→\s*/).filter(s => s && !GATEWAYS.test(s));
  const hasPark = stops.some(s => PARKS.some(([re]) => re.test(s) && !/Mafia/.test(s)));
  const beachOnly = t.styles.includes('beach') && !hasPark && !t.styles.some(s => ['wildlife', 'gorilla'].includes(s));
  // Days in parks, shared evenly across the stops on the route
  const parkDays = Math.max(nights, 1), each = stops.length ? parkDays / stops.length : 0;
  let fees = 0;
  stops.forEach(s => { const p = PARKS.find(([re]) => re.test(s)); if(p) fees += p[1] * each; });
  const permits = PERMITS.filter(([test]) => test(t));
  const permitCost = permits.reduce((n, p) => n + p[1], 0);
  fees = Math.round(fees) + permitCost;
  // Private trips are two to a vehicle; gorilla trips run smaller groups on long roads
  const privateTrip = t.group <= 2, smallGroup = t.styles.includes('gorilla');
  const vehicleRate = beachOnly ? 20 : VEHICLE[c] * (privateTrip ? 2 : smallGroup ? 1.4 : tier === 'budget' ? 0.75 : 1);
  const night = (beachOnly ? { budget:60, mid:90, premium:180, luxury:330 }[tier] : NIGHT[tier][c]);
  const extras = EXTRAS[t.id] || 0;
  const ops = vehicleRate * t.days + night * nights + extras;
  const cost = Math.round(ops + fees);
  const [lo, hi] = beachOnly ? BEACH_MARKET[tier] : MARKET[tier][c];
  const market = [lo * t.days + permitCost + extras, hi * t.days + permitCost + extras];
  const costPlus = ops * MARGIN + fees * FEE_MARGIN;
  // The market minimum applies to real safaris; a short trip or hike with low park fees is priced on its own cost
  const parkFeesPerDay = (fees - permitCost) / t.days;
  const safari = t.styles.some(s => ['wildlife', 'gorilla'].includes(s)) && t.days >= 3 && (parkFeesPerDay >= 50 || permitCost > 0);
  const proposed = up10(safari || beachOnly ? Math.max(costPlus, market[0]) : costPlus);
  const floor = up10(ops * FLOOR_MARGIN + fees);
  return { id:t.id, current:t.price, proposed, floor, cost, fees, tier, range:market.map(up10),
    confidence: LOW.test(t.text) ? 'low' : 'medium',
    why: `${tier} tier: vehicle, ${nights} night${nights === 1 ? '' : 's'}${extras ? ', flights/activities' : ''}${fees ? `, $${fees.toLocaleString('en-US')} park fees and permits` : ''}` };
}

export const estimateAll = trips => trips.map(estimate);
