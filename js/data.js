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
  phone: '+254 700 123 456',
  phoneLink: '+254700123456',
  whatsapp: '254700123456',
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
    badge:'Best Seller', badgeType:'best', img:'images/packages/great-migration.jpg', alt:'Wildebeest herd crossing the Mara River', featured:true },

  { id:'classic-kenya', route:'Nairobi → Maasai Mara → Lake Nakuru → Amboseli', months:[1,2,6,7,8,9,10,12], title:'Classic Kenya: Maasai Mara, Nakuru & Amboseli', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:7, group:12, stay:'Lodges', price:1220, was:1390,
    badge:'Save 12%', badgeType:'sale', img:'images/packages/classic-kenya.jpg', alt:'Male lion yawning in the Maasai Mara', featured:true },

  { id:'northern-circuit', route:'Arusha → Tarangire → Ngorongoro → Serengeti', months:[1,2,6,7,8,9,10], title:'Northern Circuit: Tarangire, Ngorongoro & Serengeti', countries:'Tanzania', country:'tanzania',
    styles:['wildlife','luxury'], days:8, group:10, stay:'Tented camps', price:1730,
    badge:'New for 2027', badgeType:'new', img:'images/packages/northern-circuit.jpg', alt:'View over the Ngorongoro Crater', featured:true },

  { id:'uganda-primates', route:'Entebbe → Kibale → Queen Elizabeth → Bwindi', months:[1,2,6,7,8,9,12], title:'Gorillas & Chimps: Bwindi, Kibale & Queen Elizabeth', countries:'Uganda', country:'uganda',
    styles:['gorilla'], days:6, group:8, stay:'Forest lodges', price:2210,
    badge:'Permit included', img:'images/forest-canopy-walk.jpg', alt:'Trekker on a rainforest canopy walk', featured:true },

  { id:'rwanda-gorillas', route:'Kigali → Volcanoes NP → Lake Kivu', months:[1,2,6,7,8,9,12], title:'Rwanda: Gorillas, Golden Monkeys & Lake Kivu', countries:'Rwanda', country:'rwanda',
    styles:['gorilla','luxury'], days:5, group:8, stay:'Boutique lodges', price:3010,
    badge:'Permit included', img:'images/lake-kivu-sunset.jpg', alt:'Sunset over Lake Kivu', featured:true },

  { id:'serengeti-zanzibar', route:'Arusha → Serengeti → Ngorongoro → Zanzibar', months:[1,2,6,7,8,9,10], title:'Serengeti & Zanzibar: Safari and Sand', countries:'Tanzania · Zanzibar', country:'tanzania',
    styles:['wildlife','beach'], days:10, group:12, stay:'Camps & beach resort', price:2010, was:2240,
    badge:'Save 10%', badgeType:'sale', img:'images/packages/serengeti-zanzibar.jpg', alt:'Zebra walking in the Serengeti', featured:true },

  { id:'kilimanjaro-machame', route:'Moshi → Machame Gate → Uhuru Peak', months:[1,2,3,6,7,8,9,10], title:'Kilimanjaro Climb: Machame Route', countries:'Tanzania', country:'tanzania',
    styles:['trek'], days:7, group:10, stay:'Mountain camps', price:1440,
    badge:'93% summit rate', img:'images/kilimanjaro.jpg', alt:'Snow-capped Mount Kilimanjaro', featured:true },

  { id:'amboseli-tsavo', route:'Nairobi → Amboseli → Tsavo West', months:[1,2,6,7,8,9,10], title:'Amboseli & Tsavo: Land of Giants', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:4, group:12, stay:'Lodges', price:630, was:700,
    badge:'Save 10%', badgeType:'sale', img:'images/packages/amboseli-tsavo.jpg', alt:'Red-dusted elephant in Tsavo', featured:true },

  { id:'grand-journey', route:'Nairobi → Mara → Bwindi → Kigali → Serengeti → Zanzibar', months:[6,7,8,9], title:'East Africa Grand Journey: 4 Countries', countries:'Kenya · Uganda · Rwanda · Tanzania', country:'multi',
    styles:['wildlife','gorilla','beach','luxury'], days:16, group:10, stay:'Lodges & camps', price:4800,
    badge:'Signature', badgeType:'new', img:'images/packages/grand-journey.jpg', alt:'Lone acacia on the Serengeti plains', featured:true },

  { id:'serengeti-camping', route:'Arusha → Serengeti → Ngorongoro', months:[1,2,6,7,8,9,10], title:'Serengeti Under Canvas: Camping Safari', countries:'Tanzania', country:'tanzania',
    styles:['camping','wildlife'], days:5, group:12, stay:'Public campsites', price:810,
    badge:'Budget pick', img:'images/packages/serengeti-camping.jpg', alt:'Tented camp deck overlooking the Serengeti', featured:true },

  { id:'northern-kenya', route:'Nairobi → Samburu → Laikipia', months:[1,2,6,7,8,9,10], title:'Samburu & Laikipia: Northern Kenya Wildlife', countries:'Kenya', country:'kenya',
    styles:['wildlife','luxury'], days:6, group:10, stay:'Conservancy camps', price:1510,
    img:'images/packages/northern-kenya.jpg', alt:'Elephants in Samburu National Reserve' },

  { id:'kenya-family', route:'Nairobi → Naivasha → Maasai Mara', months:[3,4,7,8,12], title:'Kenya Family Safari: Junior Rangers Edition', countries:'Kenya', country:'kenya',
    styles:['wildlife','family'], days:8, group:12, stay:'Family lodges', price:1670,
    badge:'Kids from 50% off', badgeType:'new', img:'images/packages/kenya-family.jpg', alt:'Giraffe browsing by Lake Naivasha' },

  { id:'mara-diani', route:'Nairobi → Maasai Mara → Diani Beach', months:[1,2,7,8,9,10,12], title:'Maasai Mara & Diani Beach', countries:'Kenya', country:'kenya',
    styles:['wildlife','beach'], days:9, group:12, stay:'Lodge & beach resort', price:1850,
    img:'images/packages/mara-diani.jpg', alt:'Cheetah in the Maasai Mara grass' },

  { id:'primate-explorer', route:'Kigali → Volcanoes → Bwindi → Kibale → Entebbe', months:[1,2,6,7,8,9,12], title:'Primate Explorer: Rwanda & Uganda', countries:'Rwanda · Uganda', country:'multi',
    styles:['gorilla'], days:9, group:8, stay:'Forest lodges', price:4480,
    badge:'2 gorilla treks', img:'images/forest-elephant.jpg', alt:'Forest elephant among the trees' },

  { id:'kilimanjaro-lemosho', route:'Moshi → Lemosho Gate → Uhuru Peak', months:[1,2,3,6,7,8,9,10], title:'Kilimanjaro Climb: Lemosho Route', countries:'Tanzania', country:'tanzania',
    styles:['trek'], days:8, group:10, stay:'Mountain camps', price:1790,
    badge:'Best views', img:'images/hiker-summit.jpg', alt:'Hiker celebrating on a mountain summit' },

  { id:'uganda-classic', route:'Entebbe → Murchison Falls → Queen Elizabeth', months:[1,2,6,7,8,9,12], title:'Uganda Wildlife Classic: Murchison & Queen Elizabeth', countries:'Uganda', country:'uganda',
    styles:['wildlife'], days:7, group:10, stay:'Lodges', price:1390,
    img:'images/packages/uganda-classic.jpg', alt:'Giraffe in Murchison Falls National Park' },

  { id:'luxury-honeymoon', route:'Arusha → Serengeti → Zanzibar', months:[1,2,6,7,8,9,10,12], title:'Luxury Honeymoon: Serengeti & Zanzibar', countries:'Tanzania · Zanzibar', country:'tanzania',
    styles:['beach','luxury'], days:10, group:2, stay:'Luxury camps & villa', price:4440,
    badge:'Private', img:'images/packages/luxury-honeymoon.jpg', alt:'Sunrise over the Serengeti' },

  /* ---- More packages ---- */
  { id:'mara-short-break', route:'Nairobi → Maasai Mara', months:[1,2,6,7,8,9,10,12], title:'Maasai Mara Short Break', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:3, group:12, stay:'Tented camps', price:570,
    img:'images/packages/mara-short-break.jpg', alt:'Elephant feeding on the Maasai Mara plains' },

  { id:'naivasha-hells-gate', route:'Nairobi → Lake Naivasha → Hell\'s Gate', months:[1,2,3,6,7,8,9,10,11,12], title:'Lake Naivasha & Hell\'s Gate Adventure', countries:'Kenya', country:'kenya',
    styles:['wildlife','family'], days:3, group:12, stay:'Lakeside lodge', price:410,
    img:'images/flamingo.jpg', alt:'Flamingo wading in a lake' },

  { id:'ol-pejeta-mount-kenya', route:'Nairobi → Ol Pejeta → Mount Kenya', months:[1,2,6,7,8,9,10,12], title:'Ol Pejeta & Mount Kenya Rhino Safari', countries:'Kenya', country:'kenya',
    styles:['wildlife','family'], days:5, group:10, stay:'Conservancy camps', price:1150,
    img:'images/packages/ol-pejeta-mount-kenya.jpg', alt:'White rhino grazing at Ol Pejeta' },

  { id:'lamu-island', route:'Nairobi → Lamu Island → Shela', months:[1,2,3,7,8,9,10,11,12], title:'Lamu Island Getaway', countries:'Kenya', country:'kenya',
    styles:['beach','luxury'], days:4, group:2, stay:'Boutique beach hotel', price:450,
    img:'images/resort-pool.jpg', alt:'Resort pool by the Indian Ocean' },

  { id:'tsavo-watamu', route:'Mombasa → Tsavo East → Watamu', months:[1,2,6,7,8,9,10,12], title:'Tsavo East & Watamu Beach', countries:'Kenya', country:'kenya',
    styles:['wildlife','beach','family'], days:6, group:12, stay:'Lodge & beach resort', price:1060,
    img:'images/packages/tsavo-watamu.jpg', alt:'Leopard on the rocks in Tsavo East' },

  { id:'southern-tanzania', route:'Dar es Salaam → Nyerere → Ruaha', months:[6,7,8,9,10], title:'Southern Tanzania: Nyerere & Ruaha', countries:'Tanzania', country:'tanzania',
    styles:['wildlife','luxury'], days:8, group:8, stay:'Remote tented camps', price:2740,
    img:'images/packages/southern-tanzania.jpg', alt:'Ruaha River winding through the park' },

  { id:'manyara-ngorongoro', route:'Arusha → Lake Manyara → Ngorongoro', months:[1,2,6,7,8,9,10,12], title:'Lake Manyara & Ngorongoro Crater', countries:'Tanzania', country:'tanzania',
    styles:['wildlife','family'], days:3, group:12, stay:'Crater-rim lodge', price:630,
    img:'images/packages/manyara-ngorongoro.jpg', alt:'Zebras and wildebeest at Lake Manyara' },

  { id:'zanzibar-spice', route:'Stone Town → Spice farms → Nungwi', months:[1,2,6,7,8,9,10,12], title:'Zanzibar Spice Island & Stone Town', countries:'Zanzibar', country:'tanzania',
    styles:['beach'], days:5, group:12, stay:'Beach resort', price:350,
    img:'images/zanzibar-palms.jpg', alt:'Palm trees over a white-sand beach' },

  { id:'kilimanjaro-marangu', route:'Moshi → Marangu Gate → Uhuru Peak', months:[1,2,3,6,7,8,9,10], title:'Kilimanjaro Climb: Marangu Route', countries:'Tanzania', country:'tanzania',
    styles:['trek'], days:6, group:10, stay:'Mountain huts', price:1280,
    img:'images/kilimanjaro.jpg', alt:'Snow-capped Mount Kilimanjaro' },

  { id:'bwindi-gorilla-express', route:'Entebbe → Bwindi', months:[1,2,6,7,8,9,12], title:'Bwindi Gorilla Express', countries:'Uganda', country:'uganda',
    styles:['gorilla'], days:3, group:8, stay:'Forest lodge', price:1500,
    badge:'Permit included', img:'images/forest-canopy-walk.jpg', alt:'Trekker on a rainforest canopy walk' },

  { id:'murchison-ziwa', route:'Kampala → Ziwa Rhino Sanctuary → Murchison Falls', months:[1,2,6,7,8,9,12], title:'Murchison Falls & Ziwa Rhinos', countries:'Uganda', country:'uganda',
    styles:['wildlife'], days:4, group:10, stay:'Riverside lodge', price:800,
    img:'images/packages/murchison-ziwa.jpg', alt:'Rhinos grazing at Ziwa Sanctuary' },

  { id:'akagera-big-five', route:'Kigali → Akagera', months:[1,2,6,7,8,9,12], title:'Akagera Big Five Safari', countries:'Rwanda', country:'rwanda',
    styles:['wildlife','family'], days:3, group:8, stay:'Lakeside lodge', price:640,
    img:'images/packages/akagera-big-five.jpg', alt:'Buffalo standing in tall grass' },

  { id:'nyungwe-chimps', route:'Kigali → Nyungwe → Lake Kivu', months:[1,2,6,7,8,9,12], title:'Nyungwe Canopy Walk & Chimps', countries:'Rwanda', country:'rwanda',
    styles:['gorilla'], days:4, group:8, stay:'Forest lodge', price:1010,
    img:'images/forest-elephant.jpg', alt:'Forest elephant among the trees' },

  { id:'kenya-tanzania-zanzibar', route:'Nairobi → Maasai Mara → Serengeti → Ngorongoro → Zanzibar', months:[1,2,6,7,8,9,10], title:'Kenya, Tanzania & Zanzibar Explorer', countries:'Kenya · Tanzania · Zanzibar', country:'multi',
    styles:['wildlife','beach'], days:12, group:12, stay:'Lodges, camps & beach resort', price:3410,
    img:'images/packages/kenya-tanzania-zanzibar.jpg', alt:'Wildebeest with starlings in the Serengeti' },

  /* ---- Even more packages ---- */
  { id:'amboseli-kili-views', route:'Nairobi → Amboseli', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Amboseli: Kilimanjaro Views', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:3, group:12, stay:'Lodges', price:490,
    img:'images/packages/amboseli-kili-views.jpg', alt:'Elephants in Amboseli below Kilimanjaro' },

  { id:'samburu-special-five', route:'Nairobi → Samburu', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Samburu Special Five Safari', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:4, group:10, stay:'Riverside lodge', price:830,
    img:'images/packages/samburu-special-five.jpg', alt:'Grevy\'s zebras in Samburu' },

  { id:'mara-balloon', route:'Nairobi → Maasai Mara', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Maasai Mara Balloon Safari', countries:'Kenya', country:'kenya',
    styles:['wildlife', 'luxury'], days:4, group:8, stay:'Luxury tented camp', price:1410,
    img:'images/packages/mara-balloon.jpg', alt:'Hot-air balloon over the Maasai Mara' },

  { id:'rift-valley-lakes', route:'Nairobi → Lake Nakuru → Lake Bogoria → Lake Naivasha', months:[1, 2, 3, 6, 7, 8, 9, 10, 11, 12], title:'Rift Valley Lakes: Nakuru, Bogoria & Naivasha', countries:'Kenya', country:'kenya',
    styles:['wildlife', 'family'], days:5, group:12, stay:'Lodges', price:760,
    img:'images/flamingo.jpg', alt:'Flamingo in a soda lake' },

  { id:'diani-escape', route:'Mombasa → Diani Beach', months:[1, 2, 3, 7, 8, 9, 10, 11, 12], title:'Diani Beach Escape', countries:'Kenya', country:'kenya',
    styles:['beach', 'family'], days:5, group:12, stay:'Beach resort', price:320,
    img:'images/coast-resort.jpg', alt:'Beach resort by the ocean' },

  { id:'laikipia-walking', route:'Nairobi → Laikipia', months:[1, 2, 6, 7, 8, 9, 10], title:'Laikipia Walking Safari', countries:'Kenya', country:'kenya',
    styles:['wildlife', 'trek'], days:5, group:8, stay:'Conservancy camps', price:1600,
    img:'images/packages/laikipia-walking.jpg', alt:'Elephant and calf in Laikipia' },

  { id:'kenya-budget-camping', route:'Nairobi → Maasai Mara → Lake Nakuru', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Kenya Budget Camping: Mara & Nakuru', countries:'Kenya', country:'kenya',
    styles:['camping', 'wildlife'], days:4, group:12, stay:'Public campsites', price:440,
    img:'images/packages/kenya-budget-camping.jpg', alt:'Flamingos on Lake Nakuru' },

  { id:'kenya-in-depth', route:'Nairobi → Samburu → Ol Pejeta → Lake Nakuru → Maasai Mara', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Kenya in Depth: 10 Days', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:10, group:12, stay:'Lodges & camps', price:2830,
    img:'images/packages/kenya-in-depth.jpg', alt:'Male leopard in the Maasai Mara' },

  { id:'mount-kenya-climb', route:'Nanyuki → Sirimon Gate → Point Lenana', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Mount Kenya Climb: Sirimon Route', countries:'Kenya', country:'kenya',
    styles:['trek'], days:5, group:10, stay:'Mountain huts', price:900,
    img:'images/hiker-summit.jpg', alt:'Hiker on a mountain summit' },

  { id:'serengeti-fly-in', route:'Arusha → Serengeti', months:[1, 2, 6, 7, 8, 9, 10], title:'Serengeti Fly-In Safari', countries:'Tanzania', country:'tanzania',
    styles:['wildlife', 'luxury'], days:4, group:8, stay:'Tented camps', price:1710,
    img:'images/packages/serengeti-fly-in.jpg', alt:'Male lion on a Serengeti rock' },

  { id:'tarangire-manyara', route:'Arusha → Tarangire → Lake Manyara', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Tarangire & Lake Manyara', countries:'Tanzania', country:'tanzania',
    styles:['wildlife', 'family'], days:3, group:12, stay:'Lodges', price:550,
    img:'images/packages/tarangire-manyara.jpg', alt:'Elephant herd under baobabs in Tarangire' },

  { id:'calving-season', route:'Arusha → Ndutu → Ngorongoro', months:[1, 2, 3], title:'Serengeti Calving Season Safari', countries:'Tanzania', country:'tanzania',
    styles:['wildlife'], days:6, group:10, stay:'Tented camps', price:1860,
    img:'images/packages/calving-season.jpg', alt:'Young wildebeest in the bush' },

  { id:'tanzania-family', route:'Arusha → Tarangire → Ngorongoro → Serengeti', months:[3, 4, 7, 8, 12], title:'Tanzania Family Safari', countries:'Tanzania', country:'tanzania',
    styles:['wildlife', 'family'], days:7, group:12, stay:'Family lodges', price:1800,
    img:'images/packages/tanzania-family.jpg', alt:'Elephant beside a large tree in Tarangire' },

  { id:'tanzania-camping-7', route:'Arusha → Tarangire → Serengeti → Ngorongoro', months:[1, 2, 6, 7, 8, 9, 10], title:'Tanzania Budget Camping: 7 Days', countries:'Tanzania', country:'tanzania',
    styles:['camping', 'wildlife'], days:7, group:12, stay:'Public campsites', price:1090,
    img:'images/packages/tanzania-camping-7.jpg', alt:'Cheetah close-up in the Serengeti' },

  { id:'zanzibar-honeymoon', route:'Stone Town → Nungwi → Mnemba Atoll', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Zanzibar Honeymoon Villas', countries:'Zanzibar', country:'tanzania',
    styles:['beach', 'luxury'], days:6, group:2, stay:'Beach villa', price:850,
    img:'images/overwater-villas.jpg', alt:'Villas over turquoise water' },

  { id:'kilimanjaro-rongai', route:'Moshi → Rongai Gate → Uhuru Peak', months:[1, 2, 3, 6, 7, 8, 9, 10], title:'Kilimanjaro Climb: Rongai Route', countries:'Tanzania', country:'tanzania',
    styles:['trek'], days:7, group:10, stay:'Mountain camps', price:1540,
    img:'images/kilimanjaro.jpg', alt:'Snow-capped Kilimanjaro' },

  { id:'mount-meru', route:'Arusha → Momella Gate → Socialist Peak', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Mount Meru Climb', countries:'Tanzania', country:'tanzania',
    styles:['trek'], days:4, group:10, stay:'Mountain huts', price:770,
    img:'images/misty-acacia.jpg', alt:'Acacia trees in the mist' },

  { id:'nyerere-zanzibar', route:'Dar es Salaam → Nyerere → Zanzibar', months:[6, 7, 8, 9, 10], title:'Nyerere & Zanzibar', countries:'Tanzania · Zanzibar', country:'tanzania',
    styles:['wildlife', 'beach'], days:7, group:10, stay:'Camps & beach resort', price:2030,
    img:'images/packages/nyerere-zanzibar.jpg', alt:'Lake and dead trees in Nyerere' },

  { id:'uganda-in-depth', route:'Entebbe → Murchison Falls → Kibale → Queen Elizabeth → Bwindi', months:[1, 2, 6, 7, 8, 9, 12], title:'Uganda in Depth: Gorillas, Chimps & Big Game', countries:'Uganda', country:'uganda',
    styles:['gorilla', 'wildlife'], days:10, group:8, stay:'Lodges', price:3440,
    img:'images/packages/uganda-in-depth.jpg', alt:'Elephant facing the camera in Queen Elizabeth' },

  { id:'mburo-bwindi', route:'Entebbe → Lake Mburo → Bwindi', months:[1, 2, 6, 7, 8, 9, 12], title:'Lake Mburo & Bwindi Gorillas', countries:'Uganda', country:'uganda',
    styles:['gorilla'], days:5, group:8, stay:'Lodges', price:1830,
    img:'images/zebra.jpg', alt:'Zebra close-up' },

  { id:'kibale-chimps', route:'Entebbe → Kibale', months:[1, 2, 6, 7, 8, 9, 12], title:'Kibale Chimpanzee Trek', countries:'Uganda', country:'uganda',
    styles:['gorilla'], days:3, group:8, stay:'Forest lodge', price:640,
    img:'images/forest-canopy-walk.jpg', alt:'Rainforest canopy walk' },

  { id:'ishasha-lions', route:'Entebbe → Queen Elizabeth → Ishasha', months:[1, 2, 6, 7, 8, 9, 12], title:'Queen Elizabeth Tree-Climbing Lions', countries:'Uganda', country:'uganda',
    styles:['wildlife'], days:4, group:10, stay:'Lodges', price:830,
    img:'images/packages/ishasha-lions.jpg', alt:'Lions resting in a fig tree in Ishasha' },

  { id:'rwenzori-trek', route:'Kasese → Rwenzori → Margherita Peak', months:[1, 2, 6, 7, 8, 12], title:'Rwenzori Mountains Trek', countries:'Uganda', country:'uganda',
    styles:['trek'], days:8, group:8, stay:'Mountain huts', price:1710,
    img:'images/hiker-summit.jpg', alt:'Hiker celebrating on a summit' },

  { id:'rwanda-gorilla-express', route:'Kigali → Volcanoes', months:[1, 2, 6, 7, 8, 9, 12], title:'Rwanda Gorilla Express', countries:'Rwanda', country:'rwanda',
    styles:['gorilla', 'luxury'], days:3, group:8, stay:'Boutique lodge', price:2270,
    img:'images/forest-canopy-walk.jpg', alt:'Rainforest canopy walk' },

  { id:'rwanda-complete', route:'Kigali → Volcanoes → Lake Kivu → Nyungwe → Akagera', months:[1, 2, 6, 7, 8, 9, 12], title:'Rwanda Complete: Gorillas, Chimps & Big Five', countries:'Rwanda', country:'rwanda',
    styles:['gorilla', 'wildlife'], days:9, group:8, stay:'Lodges', price:4070,
    img:'images/camp-at-night.jpg', alt:'Camp at night' },

  { id:'lake-kivu-retreat', route:'Kigali → Lake Kivu', months:[1, 2, 3, 6, 7, 8, 9, 10, 11, 12], title:'Lake Kivu Retreat', countries:'Rwanda', country:'rwanda',
    styles:['beach'], days:3, group:12, stay:'Lakeside lodge', price:270,
    img:'images/lake-kivu-sunset.jpg', alt:'Sunset over Lake Kivu' },

  { id:'golden-monkeys', route:'Kigali → Volcanoes', months:[1, 2, 6, 7, 8, 9, 12], title:'Golden Monkeys & Dian Fossey Hike', countries:'Rwanda', country:'rwanda',
    styles:['gorilla', 'trek'], days:3, group:8, stay:'Lodges', price:770,
    img:'images/forest-elephant.jpg', alt:'Forest at the foot of the volcanoes' },

  { id:'migration-crossing', route:'Nairobi → Maasai Mara → Serengeti → Arusha', months:[7, 8, 9, 10], title:'Mara–Serengeti Migration Crossing', countries:'Kenya · Tanzania', country:'multi',
    styles:['wildlife'], days:8, group:12, stay:'Tented camps', price:2570,
    img:'images/packages/migration-crossing.jpg', alt:'Wildebeest swimming across the Mara River' },

  { id:'gorilla-double', route:'Entebbe → Bwindi → Volcanoes → Kigali', months:[1, 2, 6, 7, 8, 9, 12], title:'Uganda & Rwanda Gorilla Double', countries:'Uganda · Rwanda', country:'multi',
    styles:['gorilla'], days:7, group:8, stay:'Forest lodges', price:3910,
    img:'images/forest-canopy-walk.jpg', alt:'Rainforest canopy walk' },

  { id:'kenya-uganda-overland', route:'Nairobi → Lake Naivasha → Jinja → Murchison Falls → Kampala', months:[1, 2, 6, 7, 8, 9, 12], title:'Kenya & Uganda Overland Adventure', countries:'Kenya · Uganda', country:'multi',
    styles:['camping', 'wildlife'], days:9, group:12, stay:'Camps & lodges', price:1410,
    img:'images/safari-vehicle.jpg', alt:'Safari vehicle at sunset' },

  { id:'east-africa-highlights', route:'Nairobi → Maasai Mara → Serengeti → Ngorongoro → Kigali → Volcanoes', months:[6, 7, 8, 9, 10], title:'East Africa Highlights: 14 Days', countries:'Kenya · Tanzania · Rwanda', country:'multi',
    styles:['wildlife', 'gorilla', 'luxury'], days:14, group:10, stay:'Lodges & camps', price:4440,
    img:'images/packages/east-africa-highlights.jpg', alt:'Topi antelope in the Maasai Mara grass' },

  /* ---- Lakes, coast, mountains, rivers & forests ---- */
  { id:'nairobi-national-park', route:'Nairobi → Nairobi National Park → Giraffe Centre', months:[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], title:'Nairobi National Park & Giraffe Centre', countries:'Kenya', country:'kenya',
    styles:['wildlife', 'family'], days:2, group:12, stay:'City hotel', price:220,
    img:'images/packages/nairobi-national-park.jpg', alt:'Buffalo with the Nairobi skyline behind' },

  { id:'meru-national-park', route:'Nairobi → Meru National Park', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Meru National Park: Born Free Country', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:4, group:10, stay:'Riverside lodge', price:800,
    img:'images/packages/meru-national-park.jpg', alt:'Track through Meru National Park' },

  { id:'tsavo-west-chyulu', route:'Nairobi → Tsavo West → Chyulu Hills', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Tsavo West & Chyulu Hills', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:4, group:12, stay:'Lodges', price:770,
    img:'images/packages/tsavo-west-chyulu.jpg', alt:'Tsavo River in Tsavo West' },

  { id:'baringo-bogoria', route:'Nairobi → Lake Baringo → Lake Bogoria', months:[1, 2, 3, 6, 7, 8, 9, 10, 11, 12], title:'Lake Baringo & Bogoria Birding', countries:'Kenya', country:'kenya',
    styles:['wildlife'], days:3, group:10, stay:'Lakeside lodge', price:440,
    img:'images/flamingo.jpg', alt:'Flamingo in a soda lake' },

  { id:'kisumu-kakamega', route:'Nairobi → Kisumu → Lake Victoria → Kakamega Forest', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Lake Victoria & Kakamega Forest', countries:'Kenya', country:'kenya',
    styles:['wildlife', 'trek'], days:4, group:10, stay:'Lodges', price:630,
    img:'images/forest-canopy-walk.jpg', alt:'Rainforest canopy' },

  { id:'malindi-watamu', route:'Mombasa → Malindi → Watamu', months:[1, 2, 3, 7, 8, 9, 10, 11, 12], title:'Malindi & Watamu Marine Park', countries:'Kenya', country:'kenya',
    styles:['beach', 'family'], days:5, group:12, stay:'Beach resort', price:300,
    img:'images/coast-resort.jpg', alt:'Resort by the Indian Ocean' },

  { id:'mombasa-kilifi', route:'Mombasa → Fort Jesus → Kilifi Creek', months:[1, 2, 3, 7, 8, 9, 10, 11, 12], title:'Mombasa Old Town & Kilifi Creek', countries:'Kenya', country:'kenya',
    styles:['beach'], days:4, group:12, stay:'Beach hotel', price:250,
    img:'images/resort-pool.jpg', alt:'Pool by the sea' },

  { id:'longonot-hike', route:'Nairobi → Mount Longonot → Hell\'s Gate', months:[1, 2, 3, 6, 7, 8, 9, 10, 11, 12], title:'Mount Longonot & Hell\'s Gate Hike', countries:'Kenya', country:'kenya',
    styles:['trek', 'family'], days:2, group:12, stay:'Lakeside lodge', price:190,
    img:'images/hiker-summit.jpg', alt:'Hiker on a summit' },

  { id:'aberdare-treetops', route:'Nairobi → Aberdare Mountains → Karuru Falls', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Aberdare Mountains & Waterfalls', countries:'Kenya', country:'kenya',
    styles:['wildlife', 'trek'], days:3, group:10, stay:'Tree lodge', price:570,
    img:'images/misty-acacia.jpg', alt:'Misty highland forest' },

  { id:'sipi-falls-elgon', route:'Kampala → Sipi Falls → Mount Elgon', months:[1, 2, 6, 7, 8, 9, 12], title:'Sipi Falls & Mount Elgon', countries:'Uganda', country:'uganda',
    styles:['trek'], days:3, group:10, stay:'Mountain lodge', price:380,
    img:'images/hiker-summit.jpg', alt:'Hiker above the falls' },

  { id:'jinja-nile', route:'Kampala → Jinja → Source of the Nile', months:[1, 2, 3, 6, 7, 8, 9, 10, 11, 12], title:'Jinja: Source of the Nile Rafting', countries:'Uganda', country:'uganda',
    styles:['family'], days:2, group:12, stay:'Riverside lodge', price:270,
    img:'images/lake-kivu-sunset.jpg', alt:'Sunset over the water' },

  { id:'murchison-boat', route:'Kampala → Murchison Falls → Nile Delta', months:[1, 2, 6, 7, 8, 9, 12], title:'Murchison Falls Boat Safari', countries:'Uganda', country:'uganda',
    styles:['wildlife'], days:3, group:10, stay:'Riverside lodge', price:570,
    img:'images/packages/murchison-boat.jpg', alt:'Murchison Falls on the Nile' },

  { id:'lake-bunyonyi', route:'Kabale → Lake Bunyonyi', months:[1, 2, 3, 6, 7, 8, 9, 10, 11, 12], title:'Lake Bunyonyi Island Escape', countries:'Uganda', country:'uganda',
    styles:['family'], days:3, group:12, stay:'Island eco-lodge', price:360,
    img:'images/lake-kivu-sunset.jpg', alt:'Lake at sunset' },

  { id:'kidepo-valley', route:'Kampala → Kidepo Valley', months:[1, 2, 6, 7, 8, 9, 12], title:'Kidepo Valley Wilderness', countries:'Uganda', country:'uganda',
    styles:['wildlife', 'luxury'], days:4, group:8, stay:'Safari lodge', price:1220,
    img:'images/packages/kidepo-valley.jpg', alt:'Antelope on the green plains of Kidepo Valley' },

  { id:'ssese-islands', route:'Entebbe → Lake Victoria → Ssese Islands', months:[1, 2, 6, 7, 8, 9, 12], title:'Ssese Islands & Lake Victoria', countries:'Uganda', country:'uganda',
    styles:['beach'], days:3, group:12, stay:'Beach lodge', price:210,
    img:'images/zanzibar-palms.jpg', alt:'Palms on a lake beach' },

  { id:'mgahinga-gorillas', route:'Kisoro → Mgahinga', months:[1, 2, 6, 7, 8, 9, 12], title:'Mgahinga Gorillas & Golden Monkeys', countries:'Uganda', country:'uganda',
    styles:['gorilla', 'trek'], days:3, group:8, stay:'Forest lodge', price:1120,
    img:'images/forest-elephant.jpg', alt:'Forest at the foot of the volcanoes' },

  { id:'crater-lakes-kazinga', route:'Kampala → Fort Portal Crater Lakes → Kazinga Channel', months:[1, 2, 6, 7, 8, 9, 12], title:'Crater Lakes & Kazinga Channel', countries:'Uganda', country:'uganda',
    styles:['wildlife'], days:4, group:10, stay:'Lodges', price:700,
    img:'images/safari-vehicle.jpg', alt:'Safari vehicle at dusk' },

  { id:'lake-natron', route:'Arusha → Lake Natron → Ol Doinyo Lengai', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Lake Natron & Ol Doinyo Lengai', countries:'Tanzania', country:'tanzania',
    styles:['trek'], days:3, group:10, stay:'Tented camp', price:570,
    img:'images/flamingo.jpg', alt:'Flamingos on Lake Natron' },

  { id:'mikumi', route:'Dar es Salaam → Mikumi', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Mikumi National Park Safari', countries:'Tanzania', country:'tanzania',
    styles:['wildlife', 'family'], days:3, group:12, stay:'Lodges', price:510,
    img:'images/packages/mikumi.jpg', alt:'Giraffe in Mikumi National Park' },

  { id:'katavi', route:'Arusha → Katavi', months:[6, 7, 8, 9, 10], title:'Katavi Wilderness Fly-In', countries:'Tanzania', country:'tanzania',
    styles:['wildlife', 'luxury'], days:5, group:6, stay:'Remote tented camps', price:3350,
    img:'images/packages/katavi.jpg', alt:'River and woodland in Katavi' },

  { id:'gombe-chimps', route:'Kigoma → Gombe Stream → Lake Tanganyika', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Gombe Stream Chimps & Lake Tanganyika', countries:'Tanzania', country:'tanzania',
    styles:['gorilla'], days:3, group:8, stay:'Lakeside camp', price:930,
    img:'images/forest-canopy-walk.jpg', alt:'Forest canopy' },

  { id:'mahale', route:'Arusha → Mahale Mountains → Lake Tanganyika', months:[6, 7, 8, 9, 10], title:'Mahale Mountains Chimpanzee Safari', countries:'Tanzania', country:'tanzania',
    styles:['gorilla', 'luxury'], days:5, group:6, stay:'Beach tented camp', price:3020,
    img:'images/camp-at-night.jpg', alt:'Camp at night by the lake' },

  { id:'pemba-island', route:'Zanzibar → Pemba Island', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Pemba Island Diving Escape', countries:'Zanzibar', country:'tanzania',
    styles:['beach', 'luxury'], days:5, group:8, stay:'Eco beach lodge', price:550,
    img:'images/overwater-villas.jpg', alt:'Villas over turquoise water' },

  { id:'mafia-whale-sharks', route:'Dar es Salaam → Mafia Island', months:[1, 2, 10, 11, 12], title:'Mafia Island Whale Sharks', countries:'Tanzania', country:'tanzania',
    styles:['beach'], days:4, group:10, stay:'Beach lodge', price:470,
    img:'images/resort-pool.jpg', alt:'Island resort pool' },

  { id:'usambara-hike', route:'Moshi → Lushoto → Usambara Mountains', months:[1, 2, 6, 7, 8, 9, 10, 12], title:'Usambara Mountains Hiking', countries:'Tanzania', country:'tanzania',
    styles:['trek'], days:4, group:12, stay:'Mountain guesthouse', price:380,
    img:'images/misty-acacia.jpg', alt:'Misty hills' },

  { id:'rubondo-island', route:'Mwanza → Lake Victoria → Rubondo Island', months:[6, 7, 8, 9, 10, 12], title:'Rubondo Island & Lake Victoria', countries:'Tanzania', country:'tanzania',
    styles:['wildlife'], days:3, group:8, stay:'Island camp', price:830,
    img:'images/lake-kivu-sunset.jpg', alt:'Island lake at sunset' },

  { id:'mount-bisoke', route:'Kigali → Volcanoes → Mount Bisoke', months:[1, 2, 6, 7, 8, 9, 12], title:'Mount Bisoke Crater Lake Hike', countries:'Rwanda', country:'rwanda',
    styles:['trek'], days:2, group:10, stay:'Lodges', price:440,
    img:'images/hiker-summit.jpg', alt:'Hiker on the volcano' },

  { id:'mount-karisimbi', route:'Kigali → Volcanoes → Mount Karisimbi', months:[1, 2, 6, 7, 8, 9, 12], title:'Mount Karisimbi Summit Trek', countries:'Rwanda', country:'rwanda',
    styles:['trek'], days:3, group:8, stay:'Mountain camp', price:640,
    img:'images/kilimanjaro.jpg', alt:'Volcano summit' },

  { id:'congo-nile-trail', route:'Rubavu → Congo Nile Trail → Karongi → Lake Kivu', months:[1, 2, 6, 7, 8, 9, 12], title:'Congo Nile Trail: Lake Kivu by Bike', countries:'Rwanda', country:'rwanda',
    styles:['trek'], days:5, group:10, stay:'Lakeside guesthouses', price:700,
    img:'images/lake-kivu-sunset.jpg', alt:'Lake Kivu at sunset' },

  { id:'gishwati-chimps', route:'Kigali → Gishwati-Mukura', months:[1, 2, 6, 7, 8, 9, 12], title:'Gishwati-Mukura Forest Chimps', countries:'Rwanda', country:'rwanda',
    styles:['gorilla'], days:2, group:8, stay:'Eco lodge', price:410,
    img:'images/forest-elephant.jpg', alt:'Rainforest' },

  { id:'twin-lakes', route:'Kigali → Musanze → Twin Lakes Burera & Ruhondo', months:[1, 2, 3, 6, 7, 8, 9, 10, 11, 12], title:'Twin Lakes Burera & Ruhondo', countries:'Rwanda', country:'rwanda',
    styles:['family'], days:2, group:12, stay:'Lakeside lodge', price:250,
    img:'images/lake-kivu-sunset.jpg', alt:'Lake view' },

  { id:'akagera-camping', route:'Kigali → Akagera → Lake Ihema', months:[1, 2, 6, 7, 8, 9, 12], title:'Akagera Camping & Lake Ihema Boat Trip', countries:'Rwanda', country:'rwanda',
    styles:['camping', 'wildlife'], days:3, group:12, stay:'Public campsites', price:380,
    img:'images/packages/akagera-camping.jpg', alt:'Giraffes on the golden plains of Akagera' },

  { id:'rufiji-river', route:'Dar es Salaam → Nyerere → Rufiji River', months:[6,7,8,9,10], title:'Nyerere: Rufiji River Boat Safari', countries:'Tanzania', country:'tanzania',
    styles:['wildlife'], days:4, group:8, stay:'Riverside tented camp', price:1090,
    img:'images/packages/rufiji-river.jpg', alt:'Crocodile on a sandbank in Nyerere' },

  /* ---- Packages sold by Lindberg Safaris, at their published prices (KES ÷ 129) ---- */
  { id:'mombasa-sgr-escape', route:'Nairobi → SGR train → Mombasa North Coast', months:[1,2,3,6,7,8,9,10,11,12], title:'Mombasa North Coast Escape by SGR', countries:'Kenya', country:'kenya',
    styles:['beach'], days:4, group:12, stay:'North Coast resort, full board', price:280,
    badge:'Train & meals included', badgeType:'new', img:'images/coast-resort.jpg', alt:'Beach resort pool beside the Indian Ocean' },

  { id:'lamu-dhow-escape', route:'Nairobi → Lamu Island', months:[1,2,3,7,8,9,10,11,12], title:'Lamu Island: Old Town & Dhow Escape', countries:'Kenya', country:'kenya',
    styles:['beach'], days:4, group:12, stay:'Island hotel, sharing', price:405,
    badge:'From 2 travellers', img:'images/hero/hero-zanzibar-dhow-hd.jpg', alt:'Traditional dhow on the Swahili coast' },

  { id:'iten-altitude-camp', route:'Nairobi → Eldoret → Iten → Lake Nakuru', months:[1,2,3,4,5,6,7,8,9,10,11,12], title:'Iten High-Altitude Training Camp', countries:'Kenya', country:'kenya',
    styles:['adventure'], days:8, group:12, stay:'Nairobi hotel & training centre, full board', price:1530,
    badge:'Train with champions', badgeType:'new', img:'images/hiker-summit.jpg', alt:'Runner on a highland ridge at dawn' },

  { id:'sagana-rafting-day', route:'Nairobi → Sagana River → Nairobi', months:[1,2,3,4,5,6,7,8,9,10,11,12], title:'Sagana White-Water Rafting Day', countries:'Kenya', country:'kenya',
    styles:['adventure'], days:1, group:20, stay:'Day trip', price:74,
    badge:'Day trip', img:'images/misty-acacia.jpg', alt:'Morning mist over the Kenyan highlands' },

  { id:'caribbean-cruise', route:'Nairobi → Caribbean cruise, 13 nights → Nairobi', months:[1,2,3,4,5,6,7,8,9,10,11,12], title:'Caribbean Island Cruise from Nairobi', countries:'Caribbean', country:'world',
    styles:['abroad'], days:14, group:20, stay:'Cruise ship, all-inclusive', price:4969,
    badge:'From 2 travellers', img:'images/overwater-villas.jpg', alt:'Turquoise sea and island villas' },

  { id:'algarve-festival', route:'Nairobi → Algarve, Portugal → Nairobi', months:[], title:'Afrobeats Festival Week in the Algarve', countries:'Portugal', country:'world',
    styles:['abroad'], days:11, group:20, stay:'Beach hotel', price:3997,
    badge:'Festival', img:'images/resort-pool.jpg', alt:'Resort pool under palm trees' }
];

/* Last-minute departures (shown on the home and deals pages) */
const LAST_MINUTE = [
  { id:'lm-mara', title:'Maasai Mara Fly-In Safari', countries:'Kenya', days:3, extra:'Flights incl.', extraIcon:'fa-plane',
    departs:'12 Oct 2026', spaces:4, price:770, was:900, img:'images/packages/lm-mara.jpg', alt:'Acacia tree and dirt track in the Maasai Mara' },
  { id:'lm-serengeti', title:'Serengeti & Ngorongoro Camping', countries:'Tanzania', days:5, extra:'Camping', extraIcon:'fa-campground',
    departs:'19 Oct 2026', spaces:3, price:810, was:950, img:'images/packages/lm-serengeti.jpg', alt:'Klipspringer on a Serengeti kopje' },
  { id:'lm-nakuru', title:'Lake Nakuru & Naivasha Weekend', countries:'Kenya', days:2, extra:'Lodge', extraIcon:'fa-hotel',
    departs:'25 Oct 2026', spaces:6, price:240, was:280, img:'images/packages/lm-nakuru.jpg', alt:'Male lion in Lake Nakuru National Park' },
  { id:'lm-zanzibar', title:'Zanzibar Beach & Stone Town', countries:'Zanzibar', days:5, extra:'Beachfront', extraIcon:'fa-umbrella-beach',
    departs:'2 Nov 2026', spaces:2, price:270, was:320, img:'images/coast-resort.jpg', alt:'Resort pool overlooking the ocean' }
];


/* Parks, islands and peaks. Shown as "place" cards on the home and
   destinations pages; the number of trips and the lowest price are
   worked out from TRIPS (any trip whose title or route mentions `match`). */
const PLACES = [
  { name:'Maasai Mara',       country:'kenya',    img:'images/lion-walking.jpg',       match:'Maasai Mara|Mara' },
  { name:'Amboseli',          country:'kenya',    img:'images/elephant-amboseli.jpg',  match:'Amboseli' },
  { name:'Samburu',           country:'kenya',    img:'images/lioness.jpg',            match:'Samburu' },
  { name:'Lake Nakuru',       country:'kenya',    img:'images/flamingo.jpg',           match:'Nakuru|Naivasha' },
  { name:'Ol Pejeta',         country:'kenya',    img:'images/rhinos.jpg',             match:'Ol Pejeta|Laikipia' },
  { name:'Tsavo',             country:'kenya',    img:'images/elephants-grassland.jpg',match:'Tsavo' },
  { name:'Diani & Watamu',    country:'kenya',    img:'images/coast-resort.jpg',       match:'Diani|Watamu' },
  { name:'Lamu',              country:'kenya',    img:'images/resort-pool.jpg',        match:'Lamu' },
  { name:'Serengeti',         country:'tanzania', img:'images/serengeti-acacia.jpg',   match:'Serengeti' },
  { name:'Ngorongoro Crater', country:'tanzania', img:'images/misty-acacia.jpg',       match:'Ngorongoro' },
  { name:'Tarangire',         country:'tanzania', img:'images/elephant-savannah.jpg',  match:'Tarangire' },
  { name:'Kilimanjaro',       country:'tanzania', img:'images/kilimanjaro.jpg',        match:'Kilimanjaro|Uhuru' },
  { name:'Zanzibar',          country:'tanzania', img:'images/zanzibar-palms.jpg',     match:'Zanzibar|Stone Town' },
  { name:'Ruaha & Nyerere',   country:'tanzania', img:'images/leopard.jpg',            match:'Ruaha|Nyerere' },
  { name:'Bwindi',            country:'uganda',   img:'images/forest-canopy-walk.jpg', match:'Bwindi' },
  { name:'Kibale',            country:'uganda',   img:'images/forest-elephant.jpg',    match:'Kibale' },
  { name:'Queen Elizabeth',   country:'uganda',   img:'images/elephant-walking.jpg',   match:'Queen Elizabeth' },
  { name:'Murchison Falls',   country:'uganda',   img:'images/rhino-and-calf.jpg',     match:'Murchison' },
  { name:'Volcanoes',         country:'rwanda',   img:'images/hiker-summit.jpg',       match:'Volcanoes|Bwindi → Kigali' },
  { name:'Akagera',           country:'rwanda',   img:'images/zebra.jpg',              match:'Akagera' },
  { name:'Nyungwe',           country:'rwanda',   img:'images/camp-at-night.jpg',      match:'Nyungwe' },
  { name:'Lake Kivu',         country:'rwanda',   img:'images/lake-kivu-sunset.jpg',   match:'Kivu' },
  { name:'Mount Kenya',       country:'kenya',    img:'images/hiker-summit.jpg',       match:'Mount Kenya|Sirimon|Lenana' },
  { name:'Mount Meru',        country:'tanzania', img:'images/misty-acacia.jpg',       match:'Meru|Momella' },
  { name:'Lake Mburo',        country:'uganda',   img:'images/zebra.jpg',              match:'Mburo' },
  { name:'Rwenzori',          country:'uganda',   img:'images/hiker-summit.jpg',       match:'Rwenzori' },
  { name:'Lake Victoria',     country:'uganda',   img:'images/zanzibar-palms.jpg',     match:'Lake Victoria|Ssese' },
  { name:'Jinja & the Nile',  country:'uganda',   img:'images/lake-kivu-sunset.jpg',   match:'Jinja|Nile' },
  { name:'Sipi Falls',        country:'uganda',   img:'images/hiker-summit.jpg',       match:'Sipi' },
  { name:'Lake Bunyonyi',     country:'uganda',   img:'images/lake-kivu-sunset.jpg',   match:'Bunyonyi' },
  { name:'Kidepo Valley',     country:'uganda',   img:'images/lioness.jpg',            match:'Kidepo' },
  { name:'Meru National Park',country:'kenya',    img:'images/lion-portrait.jpg',      match:'Meru National Park' },
  { name:'Malindi & Watamu',  country:'kenya',    img:'images/coast-resort.jpg',       match:'Malindi|Watamu' },
  { name:'Aberdares',         country:'kenya',    img:'images/misty-acacia.jpg',       match:'Aberdare' },
  { name:'Lake Natron',       country:'tanzania', img:'images/flamingo.jpg',           match:'Natron' },
  { name:'Lake Tanganyika',   country:'tanzania', img:'images/camp-at-night.jpg',      match:'Tanganyika' },
  { name:'Pemba & Mafia',     country:'tanzania', img:'images/overwater-villas.jpg',   match:'Pemba|Mafia' },
  { name:'Mount Bisoke',      country:'rwanda',   img:'images/hiker-summit.jpg',       match:'Bisoke|Karisimbi' },
  { name:'Twin Lakes',        country:'rwanda',   img:'images/lake-kivu-sunset.jpg',   match:'Twin Lakes' }
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
    match:'Murchison|Nile|Jinja|Sipi|Falls|Kazinga|Rufiji|Hell\'s Gate' },
  { key:'forests',   label:'Forests & primates', icon:'fa-tree',
    match:'Bwindi|Kibale|Nyungwe|Volcanoes|Gorilla|Chimp|Kakamega|Gombe|Mahale|Gishwati|Mgahinga|Primate' }
];


/* Flights we can book: from Europe to East Africa, and between East African cities.
   time is approximate; stops: 0 = direct. The photo shows the arrival city. */
const AIRPORTS = {
  // Where travellers fly from (Europe, Middle East, Africa, Americas, Asia)
  LHR:'London Heathrow', LGW:'London Gatwick', AMS:'Amsterdam', CDG:'Paris', BRU:'Brussels', FRA:'Frankfurt', MUC:'Munich',
  ZRH:'Zurich', FCO:'Rome', MAD:'Madrid', IST:'Istanbul', DXB:'Dubai', DOH:'Doha', CAI:'Cairo', ADD:'Addis Ababa',
  JNB:'Johannesburg', JFK:'New York', BOM:'Mumbai',
  // East Africa
  NBO:'Nairobi', MBA:'Mombasa', KIS:'Kisumu', JRO:'Kilimanjaro', ARK:'Arusha', DAR:'Dar es Salaam', ZNZ:'Zanzibar',
  EBB:'Entebbe', KGL:'Kigali'
};
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

/* City, beach and lake hotels we book (name, area, city group, type, photo) */
const HOTEL_CITIES = { nairobi:'Nairobi', coast:'Mombasa & Diani', arusha:'Arusha', dar:'Dar es Salaam & Zanzibar', kampala:'Kampala & Entebbe', kigali:'Kigali' };
const HOTELS = [
  { name:'Ngong Hills Hotel', area:'Ngong Road', city:'nairobi', type:'City hotel', img:'resort-pool' },
  { name:'Sarova Stanley', area:'City Centre', city:'nairobi', type:'Historic hotel', img:'safari-lodge' },
  { name:'Hemingways Nairobi', area:'Karen', city:'nairobi', type:'Boutique hotel', img:'safari-lodge' },
  { name:'Giraffe Manor', area:'Karen', city:'nairobi', type:'Boutique hotel', img:'giraffe-sunset' },
  { name:'Tribe Hotel', area:'Gigiri', city:'nairobi', type:'Design hotel', img:'resort-pool' },
  { name:'Radisson Blu Upper Hill', area:'Upper Hill', city:'nairobi', type:'Business hotel', img:'resort-pool' },
  { name:'Fairview Hotel', area:'Upper Hill', city:'nairobi', type:'Garden hotel', img:'safari-lodge' },
  { name:'Eka Hotel', area:'Mombasa Road', city:'nairobi', type:'Business hotel', img:'resort-pool' },
  { name:'Ole Sereni', area:'Mombasa Road', city:'nairobi', type:'Park-view hotel', img:'elephant-savannah' },
  { name:'The Boma Nairobi', area:'South C', city:'nairobi', type:'City hotel', img:'resort-pool' },
  { name:'Serena Beach Resort & Spa', area:'Shanzu', city:'coast', type:'Beach resort', img:'coast-resort' },
  { name:'Sarova Whitesands', area:'Bamburi', city:'coast', type:'Beach resort', img:'coast-resort' },
  { name:'Voyager Beach Resort', area:'Nyali', city:'coast', type:'Beach resort', img:'resort-pool' },
  { name:'PrideInn Paradise', area:'Shanzu', city:'coast', type:'Beach resort', img:'coast-resort' },
  { name:'Leopard Beach Resort', area:'Diani', city:'coast', type:'Beach resort', img:'zanzibar-palms' },
  { name:'Baobab Beach Resort', area:'Diani', city:'coast', type:'Beach resort', img:'coast-resort' },
  { name:'Arusha Coffee Lodge', area:'Burka coffee estate', city:'arusha', type:'Boutique hotel', img:'safari-lodge' },
  { name:'Mount Meru Hotel', area:'Arusha town', city:'arusha', type:'City hotel', img:'resort-pool' },
  { name:'Gran Meliá Arusha', area:'Arusha', city:'arusha', type:'Luxury hotel', img:'misty-acacia' },
  { name:'Four Points by Sheraton Arusha', area:'Arusha town', city:'arusha', type:'City hotel', img:'resort-pool' },
  { name:'Hyatt Regency Dar es Salaam', area:'City Centre', city:'dar', type:'City hotel', img:'coast-resort' },
  { name:'Dar es Salaam Serena', area:'City Centre', city:'dar', type:'City hotel', img:'resort-pool' },
  { name:'Park Hyatt Zanzibar', area:'Stone Town', city:'dar', type:'Luxury hotel', img:'zanzibar-palms' },
  { name:'Emerson Spice', area:'Stone Town', city:'dar', type:'Boutique hotel', img:'overwater-villas' },
  { name:'Zuri Zanzibar', area:'Kendwa', city:'dar', type:'Beach resort', img:'overwater-villas' },
  { name:'Kampala Serena', area:'City Centre', city:'kampala', type:'City hotel', img:'resort-pool' },
  { name:'Sheraton Kampala', area:'City Centre', city:'kampala', type:'City hotel', img:'safari-lodge' },
  { name:'Speke Resort Munyonyo', area:'Munyonyo, Lake Victoria', city:'kampala', type:'Lake resort', img:'lake-kivu-sunset' },
  { name:'Protea Hotel Entebbe', area:'Entebbe', city:'kampala', type:'Lakeside hotel', img:'lake-kivu-sunset' },
  { name:'Lake Victoria Serena', area:'Kigo', city:'kampala', type:'Lake resort', img:'lake-kivu-sunset' },
  { name:'Kigali Marriott', area:'Kiyovu', city:'kigali', type:'City hotel', img:'resort-pool' },
  { name:'Radisson Blu Kigali', area:'Kimihurura', city:'kigali', type:'Business hotel', img:'resort-pool' },
  { name:'Kigali Serena', area:'City Centre', city:'kigali', type:'City hotel', img:'safari-lodge' },
  { name:'Hôtel des Mille Collines', area:'Kiyovu', city:'kigali', type:'Historic hotel', img:'lake-kivu-sunset' }
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
