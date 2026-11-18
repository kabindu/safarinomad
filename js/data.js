/* =========================================================
   SafariNomad: site data
   ---------------------------------------------------------
   This is the ONE place to edit trips, prices and contact
   details. Every page reads from here.

   Trip fields
     id          unique, no spaces (used in links)
     title       trip name
     countries   text shown above the title
     country     kenya | tanzania | uganda | rwanda | multi | world
                 (world = holidays outside Africa)
     styles      any of: wildlife, gorilla, beach, trek,
                 camping, family, luxury, adventure, abroad
     days, group (max group size), stay (accommodation)
     price       current price in USD, per person
     was         old price in USD (leave out if not on sale)
     badge       small label on the photo (optional)
     badgeType   best | sale | new  (colour of the badge)
     img, alt    photo in /images and its description
     featured    true = shown on the home page
     route       the journey, shown on the card (use → between stops)
     months      best months to travel, 1 = Jan … 12 = Dec
                 (used by the "When?" search)

   Pricing (November 2026): set against Lindberg Safaris'
   published prices (lindbergsafaris.com), converted at
   KES 129 = $1.
     · Lindberg's own packages (end of TRIPS) use their price.
     · Beach-only trips: × 0.395, from Lindberg's Mombasa
       ($70/day) and Lamu ($101/day) against ours.
     · All other trips: × 0.645, from Lindberg's Iten trip
       ($191/day) against our median Kenya lodge safari.
     · Gorilla permits ($800 Uganda, $1,500 Rwanda) are fixed
       government fees and were left out of the discount.
   ========================================================= */

const SITE = {
  name: 'SafariNomad',
  phone: '+254 707 511 622',
  phoneLink: '+254707511622',
  whatsapp: '254707511622',
  email: 'hello@safarinomad.com',
  address: 'Westlands, Nairobi, Kenya',
  hoursText: 'Mon–Sat, 8am–6pm EAT',
  social: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    tiktok: 'https://tiktok.com',
    x: 'https://x.com'
  },
  promo: { text: 'The Big Safari Sale: save up to 25% on selected safaris', link: 'services.html#flash-deals', cta: 'See flash deals', endsAt: '2026-10-31T23:59:59+03:00' },
  hours: { open: 8, close: 18, days: [1,2,3,4,5,6] }   // office hours in Nairobi time (EAT), Mon–Sat
};

/* Licences and travel partners, shown in the scrolling strip
   (any page: <div data-partners></div>). Only list what we
   really hold. Add a licence number in `no` to show it. */
const PARTNERS = {
  licences: [
    { name:'TRA licensed',     sub:'Tourism Regulatory Authority, Kenya',     icon:'fa-certificate', no:'' },
    { name:'KATO member',      sub:'Kenya Association of Tour Operators',     icon:'fa-handshake',   no:'' },
    { name:'KATA member',      sub:'Kenya Association of Travel Agents',      icon:'fa-suitcase-rolling', no:'' },
    { name:'IATA accredited',  sub:'International Air Transport Association', icon:'fa-globe',       no:'' },
    { name:'Magical Kenya',    sub:'Kenya Tourism Board partner',             icon:'fa-star',        no:'' },
    { name:'KWS registered',   sub:'Kenya Wildlife Service',                  icon:'fa-paw',         no:'' }
  ],
  travel: [
    { name:'Kenya Airways',     sub:'International & domestic flights', icon:'fa-plane-departure' },
    { name:'Madaraka Express',  sub:'SGR train, Nairobi to Mombasa',    icon:'fa-train' },
    { name:'Safarilink',        sub:'Flights into the parks',           icon:'fa-plane' },
    { name:'AirKenya',          sub:'Flights into the parks',           icon:'fa-plane-up' },
    { name:'M-Pesa',            sub:'Pay by mobile money',              icon:'fa-mobile-screen' },
    { name:'Visa',              sub:'Card payments',                    brand:'fa-cc-visa' },
    { name:'Mastercard',        sub:'Card payments',                    brand:'fa-cc-mastercard' }
  ]
};

const TRIPS = [
  { id:'great-migration', route:'Nairobi → Maasai Mara → Serengeti → Arusha', months:[7,8,9,10], title:'Great Migration Safari: Maasai Mara & Serengeti', countries:'Kenya · Tanzania', country:'multi',
    styles:['wildlife'], days:9, group:12, stay:'Lodges & camps', price:2220, was:2550,
    badge:'Best Seller', badgeType:'best', img:'images/packages/great-migration.jpg', alt:'Zebras with the wildebeest herd in the Maasai Mara', featured:true },

  { id:'classic-kenya', route:'Nairobi → Maasai Mara → Lake Nakuru → Amboseli', months:[1,2,6,7,8,9,10,12], title:'Classic Kenya: Maasai Mara, Nakuru & Amboseli', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:7, group:12, stay:'Lodges', price:1220, was:1390,
    badge:'Save 12%', badgeType:'sale', img:'images/packages/classic-kenya.jpg', alt:'Lion family resting in the Maasai Mara', featured:true },

  { id:'northern-circuit', route:'Arusha → Tarangire → Ngorongoro → Serengeti', months:[1,2,6,7,8,9,10], title:'Northern Circuit: Tarangire, Ngorongoro & Serengeti', countries:'Tanzania', country:'tanzania',
    styles:['wildlife','luxury'], days:8, group:10, stay:'Tented camps', price:1730,
    badge:'New for 2027', badgeType:'new', img:'images/packages/northern-circuit.jpg', alt:'Elephant beside safari vehicles in Ngorongoro', featured:true },

  { id:'uganda-primates', route:'Entebbe → Kibale → Queen Elizabeth → Bwindi', months:[1,2,6,7,8,9,12], title:'Gorillas & Chimps: Bwindi, Kibale & Queen Elizabeth', countries:'Uganda', country:'uganda',
    styles:['gorilla'], days:6, group:8, stay:'Forest lodges', price:2210,
    badge:'Permit included', img:'images/packages/uganda-primates.jpg', alt:'Chimpanzee in Kibale Forest', featured:true },

  { id:'rwanda-gorillas', route:'Kigali → Volcanoes NP → Lake Kivu', months:[1,2,6,7,8,9,12], title:'Rwanda: Gorillas, Golden Monkeys & Lake Kivu', countries:'Rwanda', country:'rwanda',
    styles:['gorilla','luxury'], days:5, group:8, stay:'Boutique lodges', price:3010,
    badge:'Permit included', img:'images/packages/rwanda-gorillas.jpg', alt:'Mountain gorilla among the leaves', featured:true },

  { id:'serengeti-zanzibar', route:'Arusha → Serengeti → Ngorongoro → Zanzibar', months:[1,2,6,7,8,9,10], title:'Serengeti & Zanzibar: Safari and Sand', countries:'Tanzania · Zanzibar', country:'tanzania',
    styles:['wildlife','beach'], days:10, group:12, stay:'Camps & beach resort', price:2010, was:2240,
    badge:'Save 10%', badgeType:'sale', img:'images/packages/serengeti-zanzibar.jpg', alt:'Lions resting on the Serengeti plains', featured:true },

  { id:'kilimanjaro-machame', route:'Moshi → Machame Gate → Uhuru Peak', months:[1,2,3,6,7,8,9,10], title:'Kilimanjaro Climb: Machame Route', countries:'Tanzania', country:'tanzania',
    styles:['trek'], days:7, group:10, stay:'Mountain camps', price:1440,
    badge:'93% summit rate', img:'images/packages/kilimanjaro-machame.jpg', alt:'Kilimanjaro\'s peak from the Barranco Wall', featured:true },

  { id:'amboseli-tsavo', route:'Nairobi → Amboseli → Tsavo West', months:[1,2,6,7,8,9,10], title:'Amboseli & Tsavo: Land of Giants', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:4, group:12, stay:'Lodges', price:630, was:700,
    badge:'Save 10%', badgeType:'sale', img:'images/packages/amboseli-tsavo.jpg', alt:'Red-dusted elephants on the move', featured:true },

  { id:'grand-journey', route:'Nairobi → Mara → Bwindi → Kigali → Serengeti → Zanzibar', months:[6,7,8,9], title:'East Africa Grand Journey: 4 Countries', countries:'Kenya · Uganda · Rwanda · Tanzania', country:'multi',
    styles:['wildlife','gorilla','beach','luxury'], days:16, group:10, stay:'Lodges & camps', price:4800,
    badge:'Signature', badgeType:'new', img:'images/packages/grand-journey.jpg', alt:'Elephant family walking through the Maasai Mara', featured:true },

  { id:'serengeti-camping', route:'Arusha → Serengeti → Ngorongoro', months:[1,2,6,7,8,9,10], title:'Serengeti Under Canvas: Camping Safari', countries:'Tanzania', country:'tanzania',
    styles:['camping','wildlife'], days:5, group:12, stay:'Public campsites', price:810,
    badge:'Budget pick', img:'images/packages/serengeti-camping.jpg', alt:'Male lion prowling in the Serengeti', featured:true },

  { id:'kenya-family', route:'Nairobi → Naivasha → Maasai Mara', months:[3,4,7,8,12], title:'Kenya Family Safari: Junior Rangers Edition', countries:'Kenya', country:'kenya',
    styles:['wildlife','family'], days:8, group:12, stay:'Family lodges', price:1670,
    badge:'Kids from 50% off', badgeType:'new', img:'images/packages/kenya-family.jpg', alt:'Three giraffes beside an acacia' },

  { id:'mara-diani', route:'Nairobi → Maasai Mara → Diani Beach', months:[1,2,7,8,9,10,12], title:'Maasai Mara & Diani Beach', countries:'Kenya', country:'kenya',
    styles:['wildlife','beach'], days:9, group:12, stay:'Lodge & beach resort', price:1850,
    img:'images/packages/mara-diani.jpg', alt:'Cheetah stretching in the Maasai Mara' },

  { id:'uganda-classic', route:'Entebbe → Murchison Falls → Queen Elizabeth', months:[1,2,6,7,8,9,12], title:'Uganda Wildlife Classic: Murchison & Queen Elizabeth', countries:'Uganda', country:'uganda',
    styles:['wildlife'], days:7, group:10, stay:'Lodges', price:1390,
    img:'images/packages/uganda-classic.jpg', alt:'Elephant in the Ugandan savannah' },

  { id:'luxury-honeymoon', route:'Arusha → Serengeti → Zanzibar', months:[1,2,6,7,8,9,10,12], title:'Luxury Honeymoon: Serengeti & Zanzibar', countries:'Tanzania · Zanzibar', country:'tanzania',
    styles:['beach','luxury'], days:10, group:2, stay:'Luxury camps & villa', price:4440,
    badge:'Private', img:'images/packages/luxury-honeymoon.jpg', alt:'Cheetah close-up in the Serengeti' },

  /* ---- More packages ---- */
  { id:'mara-short-break', route:'Nairobi → Maasai Mara', months:[1,2,6,7,8,9,10,12], title:'Maasai Mara Short Break', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:3, group:12, stay:'Tented camps', price:570,
    img:'images/packages/mara-short-break.jpg', alt:'Elephant on the Maasai Mara grassland' },

  { id:'naivasha-hells-gate', route:'Nairobi → Lake Naivasha → Hell\'s Gate', months:[1,2,3,6,7,8,9,10,11,12], title:'Lake Naivasha & Hell\'s Gate Adventure', countries:'Kenya', country:'kenya',
    styles:['wildlife','family'], days:3, group:12, stay:'Lakeside lodge', price:410,
    img:'images/packages/naivasha-hells-gate.jpg', alt:'Hippos grazing on the shore of Lake Naivasha' },

  { id:'ol-pejeta-mount-kenya', route:'Nairobi → Ol Pejeta → Mount Kenya', months:[1,2,6,7,8,9,10,12], title:'Ol Pejeta & Mount Kenya Rhino Safari', countries:'Kenya', country:'kenya',
    styles:['wildlife','family'], days:5, group:10, stay:'Conservancy camps', price:1150,
    img:'images/packages/ol-pejeta-mount-kenya.jpg', alt:'White rhino grazing at Ol Pejeta' },

  { id:'manyara-ngorongoro', route:'Arusha → Lake Manyara → Ngorongoro', months:[1,2,6,7,8,9,10,12], title:'Lake Manyara & Ngorongoro Crater', countries:'Tanzania', country:'tanzania',
    styles:['wildlife','family'], days:3, group:12, stay:'Crater-rim lodge', price:630,
    img:'images/packages/manyara-ngorongoro.jpg', alt:'Zebras and wildebeest at Lake Manyara' },

  { id:'zanzibar-spice', route:'Stone Town → Spice farms → Nungwi', months:[1,2,6,7,8,9,10,12], title:'Zanzibar Spice Island & Stone Town', countries:'Zanzibar', country:'tanzania',
    styles:['beach'], days:5, group:12, stay:'Beach resort', price:350,
    img:'images/packages/zanzibar-spice.jpg', alt:'Stone Town waterfront in Zanzibar' },

  { id:'kilimanjaro-marangu', route:'Moshi → Marangu Gate → Uhuru Peak', months:[1,2,3,6,7,8,9,10], title:'Kilimanjaro Climb: Marangu Route', countries:'Tanzania', country:'tanzania',
    styles:['trek'], days:6, group:10, stay:'Mountain huts', price:1280,
    img:'images/packages/kilimanjaro-marangu.jpg', alt:'Glacier near Kilimanjaro\'s summit' },

  { id:'bwindi-gorilla-express', route:'Entebbe → Bwindi', months:[1,2,6,7,8,9,12], title:'Bwindi Gorilla Express', countries:'Uganda', country:'uganda',
    styles:['gorilla'], days:3, group:8, stay:'Forest lodge', price:1500,
    badge:'Permit included', img:'images/packages/bwindi-gorilla-express.jpg', alt:'Young mountain gorilla in Bwindi' },

  { id:'akagera-big-five', route:'Kigali → Akagera', months:[1,2,6,7,8,9,12], title:'Akagera Big Five Safari', countries:'Rwanda', country:'rwanda',
    styles:['wildlife','family'], days:3, group:8, stay:'Lakeside lodge', price:640,
    img:'images/packages/akagera-big-five.jpg', alt:'Leopard resting in a tree' },

  { id:'kenya-tanzania-zanzibar', route:'Nairobi → Maasai Mara → Serengeti → Ngorongoro → Zanzibar', months:[1,2,6,7,8,9,10], title:'Kenya, Tanzania & Zanzibar Explorer', countries:'Kenya · Tanzania · Zanzibar', country:'multi',
    styles:['wildlife','beach'], days:12, group:12, stay:'Lodges, camps & beach resort', price:3410,
    img:'images/packages/kenya-tanzania-zanzibar.jpg', alt:'Grant\'s gazelle in the Serengeti' },

  /* ---- Even more packages ---- */

  { id:'samburu-special-five', route:'Nairobi → Samburu', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Samburu Special Five Safari', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:4, group:10, stay:'Riverside lodge', price:830,
    img:'images/packages/samburu-special-five.jpg', alt:'Ostrich on the open plains' },

  { id:'mara-balloon', route:'Nairobi → Maasai Mara', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Maasai Mara Balloon Safari', countries:'Kenya', country:'kenya',
    styles:['wildlife', 'luxury'], days:4, group:8, stay:'Luxury tented camp', price:1410,
    img:'images/packages/mara-balloon.jpg', alt:'Sunrise over the Mara River seen from the air' },

  { id:'rift-valley-lakes', route:'Nairobi → Lake Nakuru → Lake Bogoria → Lake Naivasha', months:[1, 2, 3, 6, 7, 8, 9, 10, 11, 12], title:'Rift Valley Lakes: Nakuru, Bogoria & Naivasha', countries:'Kenya', country:'kenya',
    styles:['wildlife', 'family'], days:5, group:12, stay:'Lodges', price:760,
    img:'images/packages/rift-valley-lakes.jpg', alt:'Flamingos on Lake Bogoria' },

  { id:'diani-escape', route:'Mombasa → Diani Beach', months:[1, 2, 3, 7, 8, 9, 10, 11, 12], title:'Diani Beach Escape', countries:'Kenya', country:'kenya',
    styles:['beach', 'family'], days:5, group:12, stay:'Beach resort', price:320,
    img:'images/packages/diani-escape.jpg', alt:'Palm trees over Diani Beach' },

  { id:'kenya-budget-camping', route:'Nairobi → Maasai Mara → Lake Nakuru', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Kenya Budget Camping: Mara & Nakuru', countries:'Kenya', country:'kenya',
    styles:['camping', 'wildlife'], days:4, group:12, stay:'Public campsites', price:440,
    img:'images/packages/kenya-budget-camping.jpg', alt:'Lake Nakuru from the hills above' },

  { id:'kenya-in-depth', route:'Nairobi → Samburu → Ol Pejeta → Lake Nakuru → Maasai Mara', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Kenya in Depth: 10 Days', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:10, group:12, stay:'Lodges & camps', price:2830,
    img:'images/packages/kenya-in-depth.jpg', alt:'Male lion yawning on the plains' },

  { id:'mount-kenya-climb', route:'Nanyuki → Sirimon Gate → Point Lenana', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Mount Kenya Climb: Sirimon Route', countries:'Kenya', country:'kenya',
    styles:['trek'], days:5, group:10, stay:'Mountain huts', price:900,
    img:'images/packages/mount-kenya-climb.jpg', alt:'The peaks of Mount Kenya' },

  { id:'serengeti-fly-in', route:'Arusha → Serengeti', months:[1, 2, 6, 7, 8, 9, 10], title:'Serengeti Fly-In Safari', countries:'Tanzania', country:'tanzania',
    styles:['wildlife', 'luxury'], days:4, group:8, stay:'Tented camps', price:1710,
    img:'images/packages/serengeti-fly-in.jpg', alt:'Male lion in the Serengeti grass' },

  { id:'calving-season', route:'Arusha → Ndutu → Ngorongoro', months:[1, 2, 3], title:'Serengeti Calving Season Safari', countries:'Tanzania', country:'tanzania',
    styles:['wildlife'], days:6, group:10, stay:'Tented camps', price:1860,
    img:'images/packages/calving-season.jpg', alt:'Wildebeest with starlings in the Serengeti' },

  { id:'zanzibar-honeymoon', route:'Stone Town → Nungwi → Mnemba Atoll', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Zanzibar Honeymoon Villas', countries:'Zanzibar', country:'tanzania',
    styles:['beach', 'luxury'], days:6, group:2, stay:'Beach villa', price:850,
    img:'images/packages/zanzibar-honeymoon.jpg', alt:'Palm-lined beach in Zanzibar' },

  { id:'rwanda-gorilla-express', route:'Kigali → Volcanoes', months:[1, 2, 6, 7, 8, 9, 12], title:'Rwanda Gorilla Express', countries:'Rwanda', country:'rwanda',
    styles:['gorilla', 'luxury'], days:3, group:8, stay:'Boutique lodge', price:2270,
    img:'images/packages/rwanda-gorilla-express.jpg', alt:'Mountain gorilla feeding' },

  { id:'gorilla-double', route:'Entebbe → Bwindi → Volcanoes → Kigali', months:[1, 2, 6, 7, 8, 9, 12], title:'Uganda & Rwanda Gorilla Double', countries:'Uganda · Rwanda', country:'multi',
    styles:['gorilla'], days:7, group:8, stay:'Forest lodges', price:3910,
    img:'images/packages/gorilla-double.jpg', alt:'Gorilla family in the forest' },

  /* ---- Lakes, coast, mountains, rivers & forests ---- */
  { id:'nairobi-national-park', route:'Nairobi → Nairobi National Park → Giraffe Centre', months:[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], title:'Nairobi National Park & Giraffe Centre', countries:'Kenya', country:'kenya',
    styles:['wildlife', 'family'], days:2, group:12, stay:'City hotel', price:220,
    img:'images/packages/nairobi-national-park.jpg', alt:'Buffalo with the Nairobi skyline behind' },

  { id:'malindi-watamu', route:'Mombasa → Malindi → Watamu', months:[1, 2, 3, 7, 8, 9, 10, 11, 12], title:'Malindi & Watamu Marine Park', countries:'Kenya', country:'kenya',
    styles:['beach', 'family'], days:5, group:12, stay:'Beach resort', price:300,
    img:'images/packages/malindi-watamu.jpg', alt:'Watamu Beach on the Kenyan coast' },

  { id:'longonot-hike', route:'Nairobi → Mount Longonot → Hell\'s Gate', months:[1, 2, 3, 6, 7, 8, 9, 10, 11, 12], title:'Mount Longonot & Hell\'s Gate Hike', countries:'Kenya', country:'kenya',
    styles:['trek', 'family'], days:2, group:12, stay:'Lakeside lodge', price:190,
    img:'images/packages/longonot-hike.jpg', alt:'The crater of Mount Longonot' },

  { id:'jinja-nile', route:'Kampala → Jinja → Source of the Nile', months:[1, 2, 3, 6, 7, 8, 9, 10, 11, 12], title:'Jinja: Source of the Nile Rafting', countries:'Uganda', country:'uganda',
    styles:['family'], days:2, group:12, stay:'Riverside lodge', price:270,
    img:'images/packages/jinja-nile.jpg', alt:'White water on the Nile at Jinja' },

  /* ---- Packages sold by Lindberg Safaris, at their published prices (KES ÷ 129) ---- */
  { id:'mombasa-sgr-escape', route:'Nairobi → SGR train → Mombasa North Coast', months:[1,2,3,6,7,8,9,10,11,12], title:'Mombasa North Coast Escape by SGR', countries:'Kenya', country:'kenya',
    styles:['beach'], days:4, group:12, stay:'North Coast resort, full board', price:280,
    badge:'Train & meals included', badgeType:'new', img:'images/packages/mombasa-sgr-escape.jpg', alt:'Madaraka Express train to Mombasa' },

  { id:'lamu-dhow-escape', route:'Nairobi → Lamu Island', months:[1,2,3,7,8,9,10,11,12], title:'Lamu Island: Old Town & Dhow Escape', countries:'Kenya', country:'kenya',
    styles:['beach'], days:4, group:12, stay:'Island hotel, sharing', price:405,
    badge:'From 2 travellers', img:'images/packages/lamu-dhow-escape.jpg', alt:'Dhow off Lamu town' },

  { id:'iten-altitude-camp', route:'Nairobi → Eldoret → Iten → Lake Nakuru', months:[1,2,3,4,5,6,7,8,9,10,11,12], title:'Iten High-Altitude Training Camp', countries:'Kenya', country:'kenya',
    styles:['adventure'], days:8, group:12, stay:'Nairobi hotel & training centre, full board', price:1530,
    badge:'Train with champions', badgeType:'new', img:'images/packages/iten-altitude-camp.jpg', alt:'Runners training in Iten' },

  { id:'sagana-rafting-day', route:'Nairobi → Sagana River → Nairobi', months:[1,2,3,4,5,6,7,8,9,10,11,12], title:'Sagana White-Water Rafting Day', countries:'Kenya', country:'kenya',
    styles:['adventure'], days:1, group:20, stay:'Day trip', price:74,
    badge:'Day trip', img:'images/packages/sagana-rafting-day.jpg', alt:'Rafting through white water' },

  { id:'caribbean-cruise', route:'Nairobi → Caribbean cruise, 13 nights → Nairobi', months:[1,2,3,4,5,6,7,8,9,10,11,12], title:'Caribbean Island Cruise from Nairobi', countries:'Caribbean', country:'world',
    styles:['abroad'], days:14, group:20, stay:'Cruise ship, all-inclusive', price:4969,
    badge:'From 2 travellers', img:'images/packages/caribbean-cruise.jpg', alt:'Turquoise Caribbean beach' },

];

/* Last-minute departures (shown on the home and deals pages) */
const LAST_MINUTE = [
  { id:'lm-mara', title:'Maasai Mara Fly-In Safari', countries:'Kenya', days:3, extra:'Flights incl.', extraIcon:'fa-plane',
    departs:'12 Oct 2026', spaces:4, price:770, was:900, img:'images/packages/lm-mara.jpg', alt:'Lone tree on the Maasai Mara plains' },
  { id:'lm-serengeti', title:'Serengeti & Ngorongoro Camping', countries:'Tanzania', days:5, extra:'Camping', extraIcon:'fa-campground',
    departs:'19 Oct 2026', spaces:3, price:810, was:950, img:'images/packages/lm-serengeti.jpg', alt:'Lion lying on a branch above the Serengeti plains' },
  { id:'lm-nakuru', title:'Lake Nakuru & Naivasha Weekend', countries:'Kenya', days:2, extra:'Lodge', extraIcon:'fa-hotel',
    departs:'25 Oct 2026', spaces:6, price:240, was:280, img:'images/packages/lm-nakuru.jpg', alt:'Buffalo in Lake Nakuru National Park' },
  { id:'lm-zanzibar', title:'Zanzibar Beach & Stone Town', countries:'Zanzibar', days:5, extra:'Beachfront', extraIcon:'fa-umbrella-beach',
    departs:'2 Nov 2026', spaces:2, price:270, was:320, img:'images/coast-resort.jpg', alt:'Resort pool overlooking the ocean' }
];


/* Parks, islands and peaks. Shown as "place" cards on the home and
   destinations pages; the number of trips and the lowest price are
   worked out from TRIPS (any trip whose title or route mentions `match`). */
const PLACES = [
  // In order of importance within each country: main parks, then beaches, lakes, mountains, rivers.
  // Country listings follow this order (see TripRank below). kind = park | beach | lake | mountain | river
  { name:'Maasai Mara',       country:'kenya',    img:'images/lion-walking.jpg',       match:'Maasai Mara|Mara', kind:'park' },
  { name:'Amboseli',          country:'kenya',    img:'images/elephant-amboseli.jpg',  match:'Amboseli', kind:'park' },
  { name:'Tsavo',             country:'kenya',    img:'images/elephants-grassland.jpg',match:'Tsavo', kind:'park' },
  { name:'Samburu',           country:'kenya',    img:'images/lioness.jpg',            match:'Samburu', kind:'park' },
  { name:'Ol Pejeta',         country:'kenya',    img:'images/rhinos.jpg',             match:'Ol Pejeta|Laikipia', kind:'park' },
  { name:'Diani & Watamu',    country:'kenya',    img:'images/coast-resort.jpg',       match:'Diani|Watamu', kind:'beach' },
  { name:'Malindi & Watamu',  country:'kenya',    img:'images/coast-resort.jpg',       match:'Malindi|Watamu', kind:'beach' },
  { name:'Lamu',              country:'kenya',    img:'images/resort-pool.jpg',        match:'Lamu', kind:'beach' },
  { name:'Lake Nakuru',       country:'kenya',    img:'images/flamingo.jpg',           match:'Nakuru|Naivasha', kind:'lake' },
  { name:'Mount Kenya',       country:'kenya',    img:'images/hiker-summit.jpg',       match:'Mount Kenya|Sirimon|Lenana', kind:'mountain' },
  { name:'Serengeti',         country:'tanzania', img:'images/serengeti-acacia.jpg',   match:'Serengeti', kind:'park' },
  { name:'Ngorongoro Crater', country:'tanzania', img:'images/misty-acacia.jpg',       match:'Ngorongoro', kind:'park' },
  { name:'Tarangire',         country:'tanzania', img:'images/elephant-savannah.jpg',  match:'Tarangire', kind:'park' },
  { name:'Zanzibar',          country:'tanzania', img:'images/zanzibar-palms.jpg',     match:'Zanzibar|Stone Town', kind:'beach' },
  { name:'Kilimanjaro',       country:'tanzania', img:'images/kilimanjaro.jpg',        match:'Kilimanjaro|Uhuru', kind:'mountain' },
  { name:'Bwindi',            country:'uganda',   img:'images/forest-canopy-walk.jpg', match:'Bwindi', kind:'park' },
  { name:'Queen Elizabeth',   country:'uganda',   img:'images/elephant-walking.jpg',   match:'Queen Elizabeth', kind:'park' },
  { name:'Murchison Falls',   country:'uganda',   img:'images/rhino-and-calf.jpg',     match:'Murchison', kind:'park' },
  { name:'Kibale',            country:'uganda',   img:'images/forest-elephant.jpg',    match:'Kibale', kind:'park' },
  { name:'Jinja & the Nile',  country:'uganda',   img:'images/lake-kivu-sunset.jpg',   match:'Jinja|Nile', kind:'river' },
  { name:'Volcanoes',         country:'rwanda',   img:'images/hiker-summit.jpg',       match:'Volcanoes|Bwindi → Kigali', kind:'park' },
  { name:'Akagera',           country:'rwanda',   img:'images/zebra.jpg',              match:'Akagera', kind:'park' },
  { name:'Lake Kivu',         country:'rwanda',   img:'images/lake-kivu-sunset.jpg',   match:'Kivu', kind:'lake' },
];


/* Landscapes: how packages are grouped on the destinations page.
   A trip belongs to every landscape whose `match` appears in its title or route. */
const LANDSCAPES = [
  { key:'savannah',  label:'Savannahs & national parks', icon:'fa-sun',
    match:'Mara|Serengeti|Amboseli|Tsavo|Samburu|Tarangire|Ngorongoro|Ndutu|Akagera|Queen Elizabeth|Laikipia|Ol Pejeta|Nyerere|Ruaha|Kidepo|Nairobi National Park|Meru National Park|Mikumi|Katavi|Lake Mburo|Murchison|Kazinga' },
  { key:'lakes',     label:'Lakes', icon:'fa-water',
    match:'Lake |Lakes|Naivasha|Nakuru|Kivu|Bunyonyi|Bogoria|Baringo|Manyara|Natron|Tanganyika|Ihema|Rubondo' },
  { key:'coast',     label:'Beaches & islands', icon:'fa-umbrella-beach',
    match:'Diani|Watamu|Lamu|Zanzibar|Mombasa|Malindi|Kilifi|Pemba|Mafia|Nungwi|Mnemba|Ssese|Beach' },
  { key:'mountains', label:'Mountains & hikes', icon:'fa-mountain',
    match:'Kilimanjaro|Uhuru|Mount Kenya|Mount Meru|Rwenzori|Elgon|Bisoke|Karisimbi|Longonot|Usambara|Aberdare|Mahale|Ol Doinyo|Golden Monkeys|Mgahinga|Chyulu|Hike|Trek' },
  { key:'rivers',    label:'Rivers & waterfalls', icon:'fa-droplet',
    match:'Murchison|Nile|Jinja|Sipi|Falls|Kazinga|Rufiji|Hell\'s Gate|Sagana|Rafting' },
  { key:'forests',   label:'Forests & primates', icon:'fa-tree',
    match:'Bwindi|Kibale|Nyungwe|Volcanoes|Gorilla|Chimp|Kakamega|Gombe|Mahale|Gishwati|Mgahinga|Primate' }
];


/* Flights we can book: from Europe to East Africa, and between East African cities.
   time is approximate; stops: 0 = direct. The photo shows the arrival city. */
/* Airports. Travellers pick their country first, then an airport there; they always land in East Africa.
   AIRPORT_COUNTRIES: where people fly from (country → airports). EAST_AFRICA_AIRPORTS: where they land.
   AIRPORTS (every code → name) is built from both and used across the site. */
const AIRPORT_COUNTRIES = [
  { code:'US', name:'United States', airports:{ JFK:'New York JFK', EWR:'Newark', IAD:'Washington Dulles', ATL:'Atlanta', ORD:"Chicago O'Hare", BOS:'Boston', MIA:'Miami', IAH:'Houston', DFW:'Dallas/Fort Worth', LAX:'Los Angeles', SFO:'San Francisco', SEA:'Seattle' } },
  { code:'GB', name:'United Kingdom', airports:{ LHR:'London Heathrow', LGW:'London Gatwick', MAN:'Manchester', BHX:'Birmingham', EDI:'Edinburgh', GLA:'Glasgow' } },
  { code:'NL', name:'Netherlands', airports:{ AMS:'Amsterdam Schiphol', RTM:'Rotterdam The Hague', EIN:'Eindhoven' } },
  { code:'ES', name:'Spain', airports:{ MAD:'Madrid', BCN:'Barcelona', AGP:'Málaga', PMI:'Palma de Mallorca' } },
  { code:'DE', name:'Germany', airports:{ FRA:'Frankfurt', MUC:'Munich', BER:'Berlin', DUS:'Düsseldorf', HAM:'Hamburg' } },
  { code:'FR', name:'France', airports:{ CDG:'Paris Charles de Gaulle', ORY:'Paris Orly', NCE:'Nice', LYS:'Lyon' } },
  { code:'BE', name:'Belgium', airports:{ BRU:'Brussels' } },
  { code:'CH', name:'Switzerland', airports:{ ZRH:'Zurich', GVA:'Geneva' } },
  { code:'IT', name:'Italy', airports:{ FCO:'Rome Fiumicino', MXP:'Milan Malpensa', VCE:'Venice' } },
  { code:'PT', name:'Portugal', airports:{ LIS:'Lisbon', OPO:'Porto' } },
  { code:'IE', name:'Ireland', airports:{ DUB:'Dublin' } },
  { code:'AT', name:'Austria', airports:{ VIE:'Vienna' } },
  { code:'SE', name:'Sweden', airports:{ ARN:'Stockholm Arlanda' } },
  { code:'NO', name:'Norway', airports:{ OSL:'Oslo' } },
  { code:'DK', name:'Denmark', airports:{ CPH:'Copenhagen' } },
  { code:'FI', name:'Finland', airports:{ HEL:'Helsinki' } },
  { code:'PL', name:'Poland', airports:{ WAW:'Warsaw' } },
  { code:'TR', name:'Turkey', airports:{ IST:'Istanbul' } },
  { code:'CA', name:'Canada', airports:{ YYZ:'Toronto', YUL:'Montreal', YVR:'Vancouver', YYC:'Calgary' } },
  { code:'AU', name:'Australia', airports:{ SYD:'Sydney', MEL:'Melbourne', PER:'Perth' } },
  { code:'AE', name:'United Arab Emirates', airports:{ DXB:'Dubai', AUH:'Abu Dhabi' } },
  { code:'QA', name:'Qatar', airports:{ DOH:'Doha' } },
  { code:'SA', name:'Saudi Arabia', airports:{ JED:'Jeddah', RUH:'Riyadh' } },
  { code:'IN', name:'India', airports:{ BOM:'Mumbai', DEL:'Delhi', BLR:'Bengaluru' } },
  { code:'CN', name:'China', airports:{ PEK:'Beijing Capital', PVG:'Shanghai Pudong', CAN:'Guangzhou' } },
  { code:'JP', name:'Japan', airports:{ NRT:'Tokyo Narita', HND:'Tokyo Haneda' } },
  { code:'KR', name:'South Korea', airports:{ ICN:'Seoul Incheon' } },
  { code:'SG', name:'Singapore', airports:{ SIN:'Singapore' } },
  { code:'ZA', name:'South Africa', airports:{ JNB:'Johannesburg', CPT:'Cape Town' } },
  { code:'NG', name:'Nigeria', airports:{ LOS:'Lagos', ABV:'Abuja' } },
  { code:'GH', name:'Ghana', airports:{ ACC:'Accra' } },
  { code:'EG', name:'Egypt', airports:{ CAI:'Cairo' } },
  { code:'ET', name:'Ethiopia', airports:{ ADD:'Addis Ababa' } },
  // Already in East Africa (flights between the countries)
  { code:'KE', name:'Kenya', airports:{ NBO:'Nairobi', MBA:'Mombasa', KIS:'Kisumu' } },
  { code:'TZ', name:'Tanzania', airports:{ JRO:'Kilimanjaro', ARK:'Arusha', DAR:'Dar es Salaam', ZNZ:'Zanzibar' } },
  { code:'UG', name:'Uganda', airports:{ EBB:'Entebbe' } },
  { code:'RW', name:'Rwanda', airports:{ KGL:'Kigali' } }
];
const EAST_AFRICA_AIRPORTS = { NBO:'Nairobi', MBA:'Mombasa', KIS:'Kisumu', JRO:'Kilimanjaro', ARK:'Arusha', DAR:'Dar es Salaam', ZNZ:'Zanzibar', EBB:'Entebbe', KGL:'Kigali' };
const AIRPORTS = Object.assign({}, ...AIRPORT_COUNTRIES.map(c => c.airports), EAST_AFRICA_AIRPORTS);
/* Airlines serving East Africa: name, home airport, official website (book direct, check flight status).
   Used by the flight search and the flight-status tracker on flights.html. */
const AIRLINES = {
  KQ:{ name:'Kenya Airways',      hub:'Nairobi',       url:'https://www.kenya-airways.com' },
  EK:{ name:'Emirates',           hub:'Dubai',         url:'https://www.emirates.com' },
  MS:{ name:'EgyptAir',           hub:'Cairo',         url:'https://www.egyptair.com' },
  QR:{ name:'Qatar Airways',      hub:'Doha',          url:'https://www.qatarairways.com' },
  ET:{ name:'Ethiopian Airlines', hub:'Addis Ababa',   url:'https://www.ethiopianairlines.com' },
  TK:{ name:'Turkish Airlines',   hub:'Istanbul',      url:'https://www.turkishairlines.com' },
  KL:{ name:'KLM',                hub:'Amsterdam',     url:'https://www.klm.com' },
  AF:{ name:'Air France',         hub:'Paris',         url:'https://www.airfrance.com' },
  BA:{ name:'British Airways',    hub:'London',        url:'https://www.britishairways.com' },
  SN:{ name:'Brussels Airlines',  hub:'Brussels',      url:'https://www.brusselsairlines.com' },
  DE:{ name:'Condor',             hub:'Frankfurt',     url:'https://www.condor.com' },
  WB:{ name:'RwandAir',           hub:'Kigali',        url:'https://www.rwandair.com' },
  UR:{ name:'Uganda Airlines',    hub:'Entebbe',       url:'https://www.ugandairlines.com' },
  TC:{ name:'Air Tanzania',       hub:'Dar es Salaam', url:'https://www.airtanzania.co.tz' },
  PW:{ name:'Precision Air',      hub:'Dar es Salaam', url:'https://www.precisionairtz.com' },
  JM:{ name:'Jambojet',           hub:'Nairobi',       url:'https://www.jambojet.com' }
};

/* Official airport operators (flight information on their own websites) */
const AIRPORT_SITES = {
  NBO:['Kenya Airports Authority', 'https://www.kaa.go.ke'], MBA:['Kenya Airports Authority', 'https://www.kaa.go.ke'], KIS:['Kenya Airports Authority', 'https://www.kaa.go.ke'],
  DAR:['Tanzania Airports Authority', 'https://www.taa.go.tz'], ARK:['Tanzania Airports Authority', 'https://www.taa.go.tz'],
  ZNZ:['Zanzibar Airports Authority', 'https://www.zaa.go.tz'], EBB:['Uganda Civil Aviation Authority', 'https://www.caa.go.ug'],
  KGL:['Rwanda Airports Company', 'https://www.rac.co.rw']
};
const ARRIVAL_IMG = { NBO:'giraffe-sunset', MBA:'resort-pool', KIS:'flamingo', JRO:'kilimanjaro', ARK:'misty-acacia', DAR:'coast-resort',
  ZNZ:'zanzibar-palms', EBB:'forest-canopy-walk', KGL:'lake-kivu-sunset' };
const FLIGHTS = [
  // From Europe
  { from:'LHR', to:'NBO', time:'8h 40m', stops:0, region:'europe' },
  { from:'LGW', to:'EBB', time:'8h 50m', stops:0, region:'europe' },
  { from:'AMS', to:'NBO', time:'8h 30m', stops:0, region:'europe' },
  { from:'AMS', to:'JRO', time:'9h 30m', stops:0, region:'europe' },
  { from:'AMS', to:'DAR', time:'11h 30m', stops:1, region:'europe' },
  { from:'CDG', to:'NBO', time:'8h 20m', stops:0, region:'europe' },
  { from:'CDG', to:'ZNZ', time:'11h', stops:1, region:'europe' },
  { from:'BRU', to:'KGL', time:'8h 30m', stops:0, region:'europe' },
  { from:'BRU', to:'EBB', time:'10h', stops:1, region:'europe' },
  { from:'FRA', to:'JRO', time:'9h 30m', stops:0, region:'europe' },
  { from:'FRA', to:'ZNZ', time:'9h 40m', stops:0, region:'europe' },
  { from:'FRA', to:'NBO', time:'11h', stops:1, region:'europe' },
  { from:'IST', to:'NBO', time:'6h 30m', stops:0, region:'europe' },
  { from:'IST', to:'ZNZ', time:'7h 45m', stops:0, region:'europe' },
  { from:'IST', to:'KGL', time:'8h 30m', stops:1, region:'europe' },
  // Within East Africa
  { from:'NBO', to:'KGL', time:'1h 20m', stops:0, region:'regional' },
  { from:'NBO', to:'EBB', time:'1h 10m', stops:0, region:'regional' },
  { from:'NBO', to:'DAR', time:'1h 20m', stops:0, region:'regional' },
  { from:'NBO', to:'JRO', time:'1h', stops:0, region:'regional' },
  { from:'NBO', to:'ZNZ', time:'1h 30m', stops:0, region:'regional' },
  { from:'NBO', to:'MBA', time:'1h', stops:0, region:'regional' },
  { from:'NBO', to:'KIS', time:'50m', stops:0, region:'regional' },
  { from:'MBA', to:'ZNZ', time:'45m', stops:0, region:'regional' },
  { from:'EBB', to:'KGL', time:'1h 10m', stops:0, region:'regional' },
  { from:'EBB', to:'DAR', time:'1h 50m', stops:0, region:'regional' },
  { from:'KGL', to:'DAR', time:'2h', stops:0, region:'regional' },
  { from:'JRO', to:'ZNZ', time:'1h 10m', stops:0, region:'regional' },
  { from:'ARK', to:'ZNZ', time:'1h 20m', stops:0, region:'regional' },
  { from:'DAR', to:'ZNZ', time:'20m', stops:0, region:'regional' },
  { from:'DAR', to:'JRO', time:'1h 10m', stops:0, region:'regional' }
];

/* Places to stay (accommodation.html): shown like the package cards, one card per kind of stay in one place,
   with a photo of real accommodation there (images/stays, credited in images/stays/credits.json)
   ("Beach hotel in Lamu", "Lake lodge in Naivasha"). Lindberg Safaris lists the same kinds of property
   (lodges, luxury and bush camps, resort and town hotels) but publishes no nightly rates.
   price: estimated USD per person per night, sharing, from the nightly costs in server/pricing.mjs plus
   our usual 30% margin (budget $50 → $65, mid $150 → $195, premium $300 → $390 in Kenya). The team
   confirms the real rate in the quote. options: properties we can offer there (a guide for the team). */
const STAY_SETTINGS = [
  { key:'savannah', short:'Savannah lodges',   icon:'fa-sun' },
  { key:'lake',     short:'Lake view',         icon:'fa-water' },
  { key:'beach',    short:'Beach hotels',      icon:'fa-umbrella-beach' },
  { key:'mountain', short:'Mountain & forest', icon:'fa-mountain' },
  { key:'town',     short:'Town hotels',       icon:'fa-hotel' }
];
const STAYS = [
  // Savannah: inside or beside the parks, full board
  { id:'mara-lodge', title:'Safari lodge in the Maasai Mara', place:'Maasai Mara', country:'kenya', setting:'savannah', board:'Full board', price:195,
    img:'images/stays/mara-lodge.jpg', alt:'Lodge room looking out over the Maasai Mara', options:['Pristine Mara Bay Lodge', 'Sarova Mara Game Camp', 'Mara Serena Safari Lodge'] },
  { id:'mara-luxury', title:'Luxury tented camp in the Maasai Mara', place:'Maasai Mara', country:'kenya', setting:'savannah', board:'Full board', price:680,
    img:'images/stays/mara-luxury.jpg', alt:'Inside a luxury safari tent in the Maasai Mara', options:['Angama Mara', 'Olare Mara Kempinski', "Cottar's 1920s Safari Camp"] },
  { id:'mara-bush-camp', title:'Bush camp in the Maasai Mara', place:'Maasai Mara', country:'kenya', setting:'savannah', board:'Full board', price:85,
    img:'images/stays/mara-bush-camp.jpg', alt:'Safari tents among the trees in the Maasai Mara', options:['Matira Bush Camp', 'Olive Bush Camp'] },
  { id:'amboseli-lodge', title:'Safari lodge in Amboseli', place:'Amboseli', country:'kenya', setting:'savannah', board:'Full board', price:260,
    img:'images/stays/amboseli-lodge.jpg', alt:'Ol Tukai Lodge in Amboseli, lit up at night', options:['Amboseli Serena Safari Lodge', 'Ol Tukai Lodge', 'Tawi Lodge'] },
  { id:'tsavo-lodge', title:'Safari lodge in Tsavo', place:'Tsavo East & West', country:'kenya', setting:'savannah', board:'Full board', price:195,
    img:'images/stays/tsavo-lodge.jpg', alt:'Pool at Voi Safari Lodge overlooking Tsavo', options:['Voi Safari Lodge', 'Kilaguni Serena Safari Lodge', 'Finch Hattons'] },
  { id:'samburu-camp', title:'Tented camp in Samburu', place:'Samburu', country:'kenya', setting:'savannah', board:'Full board', price:390,
    img:'images/stays/samburu-camp.jpg', alt:'Guest on a tent deck at a Samburu camp', options:['Elephant Bedroom Camp', 'Soroi Larsens Camp'] },
  { id:'ol-pejeta-camp', title:'Safari camp at Ol Pejeta & Laikipia', place:'Ol Pejeta, Laikipia', country:'kenya', setting:'savannah', board:'Full board', price:390,
    img:'images/stays/ol-pejeta-camp.jpg', alt:'Safari lodge rooms at Ol Pejeta', options:['Sweetwaters Serena Camp', 'Asilia Ol Pejeta Bush Camp', 'Beyond Sayuna Camp'] },
  { id:'serengeti-lodge', title:'Safari lodge in the Serengeti', place:'Serengeti', country:'tanzania', setting:'savannah', board:'Full board', price:415,
    img:'images/stays/serengeti-lodge.jpg', alt:'Thatched lodge cottage in the Serengeti', options:['Serengeti Serena Safari Lodge', 'Meliá Serengeti Lodge', 'Four Seasons Safari Lodge'] },
  { id:'ngorongoro-lodge', title:'Lodge on the Ngorongoro Crater rim', place:'Ngorongoro', country:'tanzania', setting:'savannah', board:'Full board', price:415,
    img:'images/stays/ngorongoro-lodge.jpg', alt:'Thatched lodge cottages near the Ngorongoro Crater', options:['Ngorongoro Serena Safari Lodge'] },
  { id:'tarangire-lodge', title:'Safari lodge in Tarangire', place:'Tarangire', country:'tanzania', setting:'savannah', board:'Full board', price:250,
    img:'images/stays/tarangire-lodge.jpg', alt:'Thatched lodge in Tarangire', options:['Tarangire Safari Lodge'] },
  { id:'bwindi-lodge', title:'Gorilla lodge in Bwindi', place:'Bwindi Forest', country:'uganda', setting:'savannah', board:'Full board', price:365,
    img:'images/stays/bwindi-lodge.jpg', alt:'Forest cabin at a lodge near Bwindi', options:['Buhoma Lodge'] },
  { id:'queen-elizabeth-lodge', title:'Safari lodge in Queen Elizabeth', place:'Queen Elizabeth National Park', country:'uganda', setting:'savannah', board:'Full board', price:170,
    img:'images/stays/queen-elizabeth-lodge.jpg', alt:'Lodge above the forest at sunset in Queen Elizabeth', options:['Mweya Safari Lodge', 'Paraa Safari Lodge (Murchison)'] },
  { id:'volcanoes-lodge', title:'Gorilla lodge in Volcanoes', place:'Volcanoes National Park', country:'rwanda', setting:'savannah', board:'Full board', price:495,
    img:'images/stays/volcanoes-lodge.jpg', alt:'Lodge lounge with a log fire', options:['Mountain Gorilla View Lodge'] },
  { id:'akagera-lodge', title:'Tented lodge in Akagera', place:'Akagera', country:'rwanda', setting:'savannah', board:'Full board', price:260,
    img:'images/stays/akagera-lodge.jpg', alt:'Safari tent at a bush lodge', options:['Ruzizi Tented Lodge'] },
  // Lake view
  { id:'naivasha-lodge', title:'Lake lodge in Naivasha', place:'Lake Naivasha', country:'kenya', setting:'lake', board:'Full board', price:195,
    img:'images/stays/naivasha-lodge.jpg', alt:'Lake Naivasha Sopa lodge among acacia trees', options:['Lake Naivasha Sopa Resort', 'Enashipai Resort & Spa', 'Hippo Point Manor House'] },
  { id:'nakuru-lodge', title:'Lodge at Lake Nakuru', place:'Lake Nakuru National Park', country:'kenya', setting:'lake', board:'Full board', price:195,
    img:'images/stays/nakuru-lodge.jpg', alt:'Lodge pool overlooking Lake Nakuru', options:['Sarova Lion Hill Game Lodge', 'Lake Nakuru Lodge'] },
  { id:'kivu-hotel', title:'Lake hotel on Lake Kivu', place:'Rubavu, Lake Kivu', country:'rwanda', setting:'lake', board:'Bed & breakfast', price:180,
    img:'images/stays/kivu-hotel.jpg', alt:'Hotel in Gisenyi on Lake Kivu', options:['Lake Kivu Serena Hotel'] },
  // Beach, half board
  { id:'lamu-hotel', title:'Beach hotel in Lamu', place:'Lamu & Shela', country:'kenya', setting:'beach', board:'Half board', price:150,
    img:'images/stays/lamu-hotel.jpg', alt:'Hotel courtyard and pool in Lamu', options:['Peponi Hotel', 'The Majlis Resort'] },
  { id:'diani-resort', title:'Beach resort in Diani', place:'Diani Beach', country:'kenya', setting:'beach', board:'Half board', price:130,
    img:'images/stays/diani-resort.jpg', alt:'Beach hotel on Diani Beach', options:['Leopard Beach Resort & Spa', 'Baobab Beach Resort & Spa', 'Diani Reef Beach Resort'] },
  { id:'mombasa-hotel', title:'Beach hotel in Mombasa', place:'Mombasa North Coast', country:'kenya', setting:'beach', board:'Half board', price:90,
    img:'images/stays/mombasa-hotel.jpg', alt:'Beach hotel rooms among the palms in Mombasa', options:['Serena Beach Resort & Spa', 'Sarova Whitesands', 'Voyager Beach Resort'] },
  { id:'watamu-hotel', title:'Beach hotel in Watamu & Malindi', place:'Watamu & Malindi', country:'kenya', setting:'beach', board:'Half board', price:110,
    img:'images/stays/watamu-hotel.jpg', alt:'Hemingways resort pool in Watamu', options:['Hemingways Watamu', 'Turtle Bay Beach Club'] },
  { id:'zanzibar-resort', title:'Beach resort in Zanzibar', place:'Zanzibar', country:'tanzania', setting:'beach', board:'Half board', price:150,
    img:'images/stays/zanzibar-resort.jpg', alt:'Resort pool among palm trees in Zanzibar', options:['Zuri Zanzibar', 'Park Hyatt Zanzibar', 'Emerson Spice'] },
  // Mountain & forest
  { id:'mount-kenya-lodge', title:'Forest lodge on Mount Kenya', place:'Mount Kenya & the Aberdares', country:'kenya', setting:'mountain', board:'Full board', price:195,
    img:'images/stays/mount-kenya-lodge.jpg', alt:'Fairmont Mount Kenya Safari Club pool with the mountain behind', options:['Serena Mountain Lodge', 'The Ark', 'Fairmont Mount Kenya Safari Club'] },
  // Town, bed & breakfast
  { id:'nairobi-hotel', title:'Town hotel in Nairobi', place:'Nairobi', country:'kenya', setting:'town', board:'Bed & breakfast', price:110,
    img:'images/stays/nairobi-hotel.jpg', alt:'Fairmont The Norfolk hotel in Nairobi', options:['Fairmont The Norfolk', 'Tribe Hotel', 'Sarova Stanley', 'JW Marriott Nairobi'] },
  { id:'arusha-hotel', title:'Town hotel in Arusha', place:'Arusha', country:'tanzania', setting:'town', board:'Bed & breakfast', price:120,
    img:'images/stays/arusha-hotel.jpg', alt:'Hotel in Arusha with mountains behind', options:['Arusha Coffee Lodge', 'Gran Meliá Arusha', 'Mount Meru Hotel'] },
  { id:'kigali-hotel', title:'Town hotel in Kigali', place:'Kigali', country:'rwanda', setting:'town', board:'Bed & breakfast', price:140,
    img:'images/stays/kigali-hotel.jpg', alt:'Garden bar at the Hôtel des Mille Collines in Kigali', options:['Kigali Serena', 'Kigali Marriott', 'Hôtel des Mille Collines'] }
];

/* Labels used by filters and search */
const COUNTRY_NAMES = { kenya:'Kenya', tanzania:'Tanzania', uganda:'Uganda', rwanda:'Rwanda', multi:'Multi-country', world:'Beyond Africa' };
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
/* Trip-length buckets used by the "How long for?" search and trip filters */
const DURATIONS = {
  '2-6':   { label:'2 to 6 days',   fits:d => d <= 6 },
  '7-10':  { label:'7 to 10 days',  fits:d => d >= 7 && d <= 10 },
  '11-14': { label:'11 to 14 days', fits:d => d >= 11 && d <= 14 },
  '15+':   { label:'15+ days',      fits:d => d >= 15 }
};
const STYLE_NAMES = { wildlife:'Wildlife safari', gorilla:'Gorilla & primates', beach:'Safari & beach', trek:'Kilimanjaro & trekking', camping:'Camping safari', family:'Family safari', luxury:'Luxury', adventure:'Adventure & sport', abroad:'Holidays abroad' };

/* Facts the AI assistant answers from (also used offline).
   Add a { q, a, tags } entry to teach it something new. */
const KNOWLEDGE = [
  { q:'What is included in the price?', tags:'included price cost fees meals transfers flights tips',
    a:'Your guide and 4x4 vehicle, accommodation, park and conservancy fees, most meals, airport transfers and drinking water on game drives. International flights, visas, travel insurance, tips and optional extras (like balloon safaris) are not included.' },
  { q:'How do I book and how much is the deposit?', tags:'book booking deposit pay payment balance',
    a:'A $250 per person deposit secures most trips, with the balance due 60 days before departure. Gorilla trips need the permit paid upfront. Date changes are free up to 60 days before you travel. Start with a free quote at contact.html.' },
  { q:'Do I need a visa?', tags:'visa eta e-visa entry passport',
    a:'Most visitors need an eTA for Kenya and an e-Visa for Tanzania and Uganda; Rwanda offers visa on arrival. The East Africa Tourist Visa covers Kenya, Uganda and Rwanda. Rules change, so always check the official government websites before travelling.' },
  { q:'Which vaccinations do I need?', tags:'vaccine vaccination yellow fever malaria health',
    a:'Yellow fever vaccination is recommended and a certificate can be required, for example when travelling between Kenya and Tanzania or Zanzibar. Malaria prevention is advised in most safari areas. See a travel clinic 6 to 8 weeks before you go.' },
  { q:'How much does a gorilla permit cost?', tags:'gorilla permit price cost uganda rwanda',
    a:'Permits are set by each government and are included in our gorilla trips. At the time of writing they are around $800 per person in Uganda and $1,500 in Rwanda; we confirm the current price when we quote.' },
  { q:'When is the best time to go?', tags:'when best time season month weather migration rain',
    a:'East Africa is year-round. The dry seasons (June to October, and January to February) are best for game viewing. The Mara River crossings are usually July to October; calving in the southern Serengeti is January to March. April and May is Green Season, with up to 25% off.' },
  { q:'How big are the groups?', tags:'group size small private solo',
    a:'Small-group trips have a maximum of 12 travellers (8 on gorilla trips), and everyone gets a guaranteed window seat in a pop-top Land Cruiser. Private trips are just you and your party.' },
  { q:'Is travel insurance required?', tags:'insurance medical evacuation',
    a:'Yes. Comprehensive travel insurance with medical evacuation cover is required. Every safari also includes flying-doctor emergency cover while you are on safari.' },
  { q:'How much luggage can I take on bush flights?', tags:'luggage baggage flight bag weight',
    a:'Light aircraft usually allow about 15 kg (33 lb) per person including hand luggage, in a soft bag with no wheels. We can store extra luggage in Nairobi, Arusha or Kigali.' },
  { q:'Is a safari safe and physically demanding?', tags:'safe safety fitness demanding hard',
    a:'Most safaris are not physically demanding: game drives are by vehicle. Gorilla treks can mean 1 to 6 hours of hiking on steep trails, and Kilimanjaro needs good fitness. Our guides are first-aid trained and our team is on call 24/7.' },
  { q:'Can I combine a safari with a beach holiday?', tags:'beach zanzibar diani combine island',
    a:'Yes, it is one of our most popular combinations. Zanzibar and Kenya\'s Diani coast are a short flight from the parks, and we can add beach nights to any itinerary.' },
  { q:'Do you do honeymoon safaris?', tags:'honeymoon honeymoons couple couples romantic anniversary wedding',
    a:'Yes, honeymoons are a speciality. Think private vehicles, sundowners, a candlelit bush dinner and a few days on a Zanzibar or Diani beach to finish. Honeymooners also get free upgrades where available.' },
  { q:'Can I travel with kids?', tags:'kids children family age',
    a:'Absolutely. We choose family-friendly lodges with pools and family tents, keep drives shorter, and children 5 to 15 can travel from 50% off on selected trips. Gorilla trekking has a minimum age of 15.' },
  { q:'Can I hire a private guide?', tags:'private guide hire specialist photography birding',
    a:'Yes. You can travel with your own guide and 4x4, choose a guide by name or language, or add a photography, birding, walking or cultural specialist. See services.html.' },
  { q:'Do you book flights?', tags:'flight flights fly international bush transfer airport',
    a:'Yes. We book bush flights between parks (for example Nairobi to the Maasai Mara in about 45 minutes), beach flights to Zanzibar and Diani, and help with international flights into Nairobi, Kilimanjaro, Entebbe and Kigali. Airport transfers are included on every safari. See flights.html.' }
];

/* =========================================================
   Booking rules: used by the booking calendar (book.html)
   AND checked again by the server, so they always agree.
   ---------------------------------------------------------
   Small-group trips leave on set weekdays (departDays, where
   0 = Sun … 6 = Sat; Saturdays if not set). Private trips
   (group of 2 or less) can start on any day. Last-minute
   trips leave on their one listed date.
   ========================================================= */
const BOOKING = {
  deposit: 250,          // USD per person to secure a booking
  balanceDays: 60,       // balance due this many days before departure
  noticeDays: 7,         // earliest start date: a week from today
  monthsAhead: 12,       // how far ahead the calendar opens
  childRate: 0.5,        // children (5 to 15) pay this share on family trips
  discountTiers: [{ min:4, pct:3 }, { min:6, pct:5 }, { min:10, pct:8 }],   // the discount a group can ask for (admin → Prices)
  departDays: { 'great-migration':[2,6], 'classic-kenya':[1,4], 'northern-circuit':[0,4], 'serengeti-zanzibar':[3,6], 'amboseli-tsavo':[1,3,5], 'kilimanjaro-machame':[0,3], 'kilimanjaro-lemosho':[2] }
};

const BookingRules = (function(){
  const DAY = 86400000;
  const iso = d => d.toISOString().slice(0, 10);
  const parse = s => { const d = new Date(String(s).slice(0, 10) + 'T00:00:00Z'); return isNaN(d) ? null : d; };
  const today = () => parse(new Date(Date.now() + 3 * 3600000).toISOString()); // Nairobi date (EAT)
  const addDays = (s, n) => iso(new Date(parse(s).getTime() + n * DAY));

  function find(id){
    const t = TRIPS.find(x => x.id === id);
    if(t) return { trip:t, kind: t.group <= 2 ? 'private' : 'group', capacity:t.group, price:t.price };
    const l = LAST_MINUTE.find(x => x.id === id);
    if(l) return { trip:l, kind:'fixed', capacity:l.spaces, price:l.price, date: iso(new Date(l.departs + ' 12:00 UTC')) };
    return null;
  }
  // Is this a start date the trip offers? (ignores seats; the server checks those)
  function isDeparture(id, date, isPrivate){
    const f = find(id), d = parse(date);
    if(!f || !d) return false;
    const first = parse(addDays(iso(today()), BOOKING.noticeDays));
    const last = new Date(today()); last.setUTCMonth(last.getUTCMonth() + BOOKING.monthsAhead);
    if(f.kind === 'fixed') return date === f.date && d >= today();
    if(d < first || d > last) return false;
    if(f.kind === 'private' || isPrivate) return true;
    return (BOOKING.departDays[id] || [6]).includes(d.getUTCDay());
  }
  function price(id, adults, children){
    const f = find(id);
    if(!f) return 0;
    const kids = f.trip.styles && f.trip.styles.includes('family') ? BOOKING.childRate : 1;
    return Math.round(f.price * adults + f.price * kids * children);
  }
  // The deposit per person, but never more than the trip itself costs (day trips, short coast breaks)
  function deposit(id, adults, children){
    return Math.min(BOOKING.deposit * (adults + children), price(id, adults, children));
  }
  // The discount a party of this size can ask for, in percent (0 if none)
  const tier = party => (BOOKING.discountTiers || []).filter(x => party >= x.min).reduce((n, x) => Math.max(n, x.pct), 0);
  return { find, isDeparture, price, deposit, tier, iso, parse, today, addDays };
})();


/* =========================================================
   Variety: wherever packages are listed side by side, avoid
   neighbours that look alike (same photo, same main park,
   same kind of trip, same country). Used by the home page,
   the packages page, deals and the "Similar trips" lists.
     TripMix.order(list)    same packages, re-ordered for variety
     TripMix.pick(list, n)  the n most varied, preferring the
                            ones near the front of the list
   ========================================================= */
const TripMix = (function(){
  // Cities where trips start or end; the park after them is what the trip is "about"
  const GATEWAY = /^(nairobi|arusha|entebbe|kigali|kampala|moshi|mombasa|dar es salaam|kasese|kabale|kisoro|nanyuki|mwanza|kigoma|rubavu|stone town|zanzibar)$/;
  const clean = s => String(s).toLowerCase().replace(/\b(national park|national reserve|np|sanctuary|gate)\b/g, '').replace(/\s+/g, ' ').trim();
  const places = t => (t.route || t.title || '').split('→').map(clean).filter(p => p && !GATEWAY.test(p));
  const info = new WeakMap();
  const facts = t => {
    if(!info.has(t)) info.set(t, { img: t.img, places: new Set(places(t)), main: places(t)[0] || '', style: (t.styles || [])[0] || '', country: t.country || '' });
    return info.get(t);
  };
  // How alike two packages look on screen (0 = nothing in common)
  function alike(a, b){
    const x = facts(a), y = facts(b);
    let n = 0;
    if(x.img && x.img === y.img) n += 4;
    if(x.main && x.main === y.main) n += 3;
    else if([...x.places].some(p => y.places.has(p))) n += 1;
    if(x.style && x.style === y.style) n += 1.5;
    if(x.country === y.country && x.country !== 'multi') n += 1;
    return n;
  }
  // Greedy: each slot takes the candidate least like the packages just before it.
  // window = how many earlier picks to compare with; look = how far down the list to search.
  function arrange(list, { window = 3, look = 12, keep = 0.08 } = {}){
    const pool = list.slice(), out = [];
    while(pool.length){
      let best = 0, bestCost = Infinity;
      const recent = out.slice(-window).reverse();
      for(let i = 0; i < Math.min(look, pool.length); i++){
        let cost = i * keep;
        recent.forEach((r, k) => { cost += alike(pool[i], r) / (k + 1); });
        if(cost < bestCost){ bestCost = cost; best = i; }
      }
      out.push(pool.splice(best, 1)[0]);
    }
    return out;
  }
  return {
    alike,
    order: list => arrange(list),
    pick: (list, n) => arrange(list, { window: n, look: list.length, keep: 0.35 }).slice(0, n)
  };
})();


/* =========================================================
   Main first: how a country's packages are ordered (country
   filter on the packages page, destinations rows, country
   pages). Main parks come first (Mara, Amboseli, Tsavo…),
   then beaches, lakes (Naivasha, Hell's Gate), mountains,
   and rivers, waterfalls and adventures last. Within a group,
   the place higher in PLACES wins, then featured and
   best-selling packages, then the order in TRIPS.
     TripRank.order(list)   sorted copy
     TripRank.group(trip)   0 park … 4 river/adventure, 5 abroad
   ========================================================= */
const TripRank = (function(){
  const KIND = { park:0, beach:1, lake:2, mountain:3, river:4 };
  const text = t => `${t.title} ${t.route || ''}`;
  const index = new Map(TRIPS.map((t, i) => [t.id, i]));
  // The most important listed place the trip visits (its own country's places; any place for multi-country trips)
  function best(t){
    let at = -1;
    PLACES.forEach((p, i) => {
      if(at >= 0 || (t.country !== 'multi' && p.country !== t.country)) return;
      if(new RegExp(p.match, 'i').test(text(t))) at = i;
    });
    return at;
  }
  // No listed place: fall back on what kind of trip it is
  function fallback(t){
    const s = t.styles || [];
    if(t.country === 'world' || s.includes('abroad')) return 5;
    if(s.includes('adventure') && !s.includes('wildlife') && !s.includes('beach')) return 4;
    if(s.includes('wildlife') || s.includes('gorilla')) return 0;
    if(s.includes('beach')) return 1;
    if(/lake/i.test(text(t))) return 2;
    if(s.includes('trek')) return 3;
    return 4;
  }
  const key = t => {
    const s = t.styles || [];
    // Activity trips (running camps, rafting) sit with the adventures, whatever lake they pass
    const i = s.includes('adventure') && !s.includes('wildlife') && !s.includes('beach') ? -1 : best(t);
    return {
      group: i >= 0 ? KIND[PLACES[i].kind] : fallback(t),
      place: i >= 0 ? i : 999,
      score: (t.featured ? 2 : 0) + (/best seller|signature/i.test(t.badge || '') ? 1 : 0)
    };
  };
  function order(list){
    const k = new Map(list.map(t => [t, key(t)]));
    return list.slice().sort((a, b) => {
      const x = k.get(a), y = k.get(b);
      return x.group - y.group || x.place - y.place || y.score - x.score || (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0);
    });
  }
  return { order, group: t => key(t).group };
})();


/* =========================================================
   Admin edits (from the dashboard's "Website content" pages)
   ---------------------------------------------------------
   The server saves them in server/data/content.json and writes
   js/content.js, which every page loads right after this file
   and which calls applyContent(...). The server applies the
   same edits, so bookings are charged the prices shown.
     trips       { id: { title, price, was, img, alt, days, route, badge, hidden, featured } }
     added       new packages (full trip objects)
     flash       [{ trip, pct, ends, label }]   time-limited sales
     lastMinute  replaces LAST_MINUTE when set
     flights     replaces FLIGHTS when set (fare = from-price, USD one way)
   ========================================================= */
function applyContent(C, now){
  if(!C || typeof C !== 'object') return;
  now = now || Date.now();
  const swap = (list, items) => { if(Array.isArray(items)){ list.length = 0; items.forEach(x => list.push(x)); } };
  (C.added || []).forEach(t => { if(t && t.id && !TRIPS.some(x => x.id === t.id)) TRIPS.push(Object.assign({ styles:['wildlife'], months:[], group:12, stay:'Lodges', countries:'', country:'kenya', route:'' }, t)); });
  Object.entries(C.trips || {}).forEach(([id, edit]) => { const t = TRIPS.find(x => x.id === id); if(t) Object.assign(t, edit); });
  for(let i = TRIPS.length - 1; i >= 0; i--) if(TRIPS[i].hidden) TRIPS.splice(i, 1);
  (C.flash || []).forEach(f => {
    const t = TRIPS.find(x => x.id === f.trip), pct = Number(f.pct);
    if(!t || !(pct > 0 && pct < 90) || (f.ends && new Date(f.ends).getTime() < now) || (f.starts && new Date(f.starts).getTime() > now)) return;
    t.was = t.price;                                   // the price before the sale
    t.price = Math.round(t.price * (1 - pct / 100));
    t.flash = { pct, ends: f.ends || '', label: f.label || 'Flash sale' };
    t.badge = `${t.flash.label} −${pct}%`; t.badgeType = 'sale';
  });
  if(Array.isArray(C.discountTiers) && C.discountTiers.length) BOOKING.discountTiers = C.discountTiers;
  if(typeof LAST_MINUTE !== 'undefined') swap(LAST_MINUTE, C.lastMinute);
  if(typeof FLIGHTS !== 'undefined') swap(FLIGHTS, C.flights);
  dropPastDepartures(now);
}

// Last-minute departures disappear from the site once their date has passed (Nairobi time)
function dropPastDepartures(now){
  const today = new Date((now || Date.now()) + 3 * 3600000).toISOString().slice(0, 10);
  for(let i = LAST_MINUTE.length - 1; i >= 0; i--){
    const d = new Date(LAST_MINUTE[i].departs + ' 12:00 UTC');
    if(!isNaN(d) && d.toISOString().slice(0, 10) < today) LAST_MINUTE.splice(i, 1);
  }
}
dropPastDepartures();
