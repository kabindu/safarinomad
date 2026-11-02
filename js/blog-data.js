/* =========================================================
   SafariNomad: blog content
   Add or edit articles here. Each article needs an id, cat,
   title, date, readTime, cover (image in /images), author,
   excerpt and body (HTML).
   ========================================================= */

const AUTHORS = {
  john: {name:'John Kariuki', role:'Lead Guide · Maasai Mara Expert', bio:'John has been guiding in the Maasai Mara for 14 years. Born in Narok County on the edge of the reserve, he tracked his first lion family at age 19. He holds a KPSGA guiding certificate and leads SafariNomad\'s premium wildlife drives.'},
  aisha: {name:'Aisha Nakato', role:'Gorilla Trek Specialist · Uganda', bio:'Aisha grew up in Kisoro, the town at the foot of the Virungas. She began her career as a Uganda Wildlife Authority ranger before joining SafariNomad. She holds a UWA gorilla tracking permit and has completed over 400 gorilla treks.'},
  david: {name:'David Mwangi', role:'Tanzania Circuit Expert', bio:'David has been working in the Serengeti and Ngorongoro ecosystems for over a decade. A self-taught ornithologist, he has identified 620 bird species across Tanzania and leads SafariNomad\'s birding add-on expeditions.'},
  grace: {name:'Grace Uwimana', role:'Rwanda & Conservation Lead', bio:'Grace is SafariNomad\'s Rwanda programme director and a founding member of Kigali\'s sustainable tourism board. She has led over 300 gorilla treks in Volcanoes National Park and speaks English, French, Kinyarwanda, and Swahili.'},
  team: {name:'SafariNomad Editorial', role:'Travel Research & Writing Team', bio:'The SafariNomad editorial team comprises guides, naturalists, and travel writers based across East Africa. All content is reviewed by a local expert before publication.'},
};

const ARTICLES = [
  {
    id:'migration', cat:'Wildlife', tag:'tag-wildlife', catLabel:'Wildlife',
    title:'When to See the Great Migration: A Month-by-Month Guide',
    date:'26 August, 2026', readTime:'8 min read',
    cover:'images/lion-and-cub.jpg', author:'john', views:'14.2k',
    excerpt:'1.5 million wildebeest moving in a continuous loop between Tanzania and Kenya — the greatest wildlife spectacle on earth. Here\'s the exact month-by-month breakdown.',
    body:`
      <p>The Great Migration is one of the most extraordinary natural events on earth — and it doesn't happen in one place or at one time. Understanding the movement cycle is the key to being in the right place at the right moment.</p>
      <img src="images/zebra.jpg" alt="Wildebeest herd" class="article-img">
      <h2>What Is the Great Migration?</h2>
      <p>Every year, roughly 1.5 million wildebeest, 200,000 zebra, and 500,000 Thomson's gazelle make a circular journey across the Serengeti-Mara ecosystem — a 1,800 km loop that follows the rains and the grass they bring. The journey has no fixed start or end. The herds are always moving.</p>
      <blockquote><p>"There is no single 'best month' for the migration. There is only the best month for what you want to see." — John Kariuki, SafariNomad Lead Guide</p></blockquote>
      <h2>Month-by-Month Breakdown</h2>
      <h3>January – March: Calving Season (Southern Serengeti)</h3>
      <p>The short-grass plains of the southern Serengeti and Ndutu area receive the herds. Over 500,000 calves are born in just six weeks — one of the fastest birthing rates of any large mammal. Predators follow closely: cheetahs, lions, hyenas, and wild dog packs all converge. This is arguably the best time for big cat action.</p>
      <div class="info-box">
        <h5><i class="fa-solid fa-circle-info"></i> Best camps for Calving Season</h5>
        <ul>
          <li>Ndutu Safari Lodge — at the centre of the action</li>
          <li>Serengeti Under Canvas (Ndutu camp)</li>
          <li>Kusini Camp (southern Serengeti)</li>
        </ul>
      </div>
      <h3>April – June: The Long Rains & Northward Push</h3>
      <p>April is shoulder season — wet, dramatic skies, green landscapes, and far fewer tourist vehicles. The herds move northwest through the central Serengeti (Seronera). It's a beautiful time for photography. Roads can be muddy but game drives are quieter and more intimate.</p>
      <h3>July – October: The Mara River Crossings</h3>
      <p>This is the headline event. The herds reach the Mara River — which they must cross to reach the Maasai Mara — and what follows is one of nature's most dramatic spectacles. Thousands of wildebeest hurl themselves into a river full of enormous Nile crocodiles. Some make it. Some don't. The chaos, noise, and raw drama are unlike anything else in the wildlife world.</p>
      <img src="images/acacia-sunset.jpg" alt="River crossing" class="article-img">
      <p>Crossings don't happen on a schedule. Herds can hesitate for days before a trigger sends them into the water. The best approach: book 5 or more nights at a Mara camp and spend each morning at the river.</p>
      <div class="info-box">
        <h5><i class="fa-solid fa-triangle-exclamation"></i> Book 12 months ahead for July–October</h5>
        <ul>
          <li>Peak season fills camps before Christmas the previous year</li>
          <li>Private conservancy camps offer better game density and off-road driving</li>
          <li>Avoid the Mara Triangle road during heavy rains — use 4x4 vehicles only</li>
        </ul>
      </div>
      <h3>November – December: Return South</h3>
      <p>With the short rains, the herds turn south through the eastern Serengeti. The landscape turns luminously green. This is a great time for photographers — dramatic skies, good light, and fewer vehicles. The Loliondo corridor and northern Serengeti (Lobo) are excellent now.</p>
      <h2>Where to Stay</h2>
      <p>Our recommendation varies by month. Contact us for a personalised camp suggestion based on your travel window — we update our camp recommendations monthly based on herd tracking data from our network of Mara and Serengeti guides.</p>
    `
  },
  {
    id:'gorilla', cat:'Trekking', tag:'tag-trekking', catLabel:'Trekking',
    title:'Gorilla Permits Explained: Uganda vs Rwanda',
    date:'20 August, 2026', readTime:'6 min read',
    cover:'images/forest-canopy-walk.jpg', author:'aisha', views:'9.8k',
    excerpt:'Two countries, two very different experiences, two price points. Here is every detail you need to make the right gorilla trekking decision.',
    body:`
      <p>Mountain gorillas exist in one place on earth: the Virunga Massif and the Bwindi-Sarambwe ecosystem spanning Uganda, Rwanda, and the Democratic Republic of Congo. If you want to see them, you need a permit — and the permit you choose shapes your entire trip.</p>
      <img src="images/forest-canopy-walk.jpg" alt="Gorilla in forest" class="article-img">
      <h2>Uganda: Bwindi Impenetrable Forest</h2>
      <p>Uganda's gorilla permit costs <strong>$700 USD per person</strong> and covers a single hour with a habituated gorilla family. Bwindi is home to roughly half the world's mountain gorilla population across four trekking sectors: Buhoma, Ruhija, Nkuringo, and Rushaga.</p>
      <h3>What the Trek Is Like</h3>
      <p>Honest answer: it's hard. Bwindi's terrain is steep, muddy, and heavily vegetated — the name 'impenetrable' is apt. Treks can take anywhere from 1 hour to 8 hours depending on where the gorillas have moved. The reward for the physical effort is an encounter that feels genuinely wild.</p>
      <div class="info-box">
        <h5><i class="fa-solid fa-circle-info"></i> Uganda Fast Facts</h5>
        <ul>
          <li>Permit cost: $700 USD (UWEC fee, included in our pricing)</li>
          <li>Group size: Max 8 trekkers per gorilla family</li>
          <li>Time with gorillas: 1 hour</li>
          <li>Best sectors: Buhoma (most accessible), Nkuringo (most dramatic scenery)</li>
          <li>Nearest airport: Kigali (2.5 hr drive) or Entebbe (6 hr drive)</li>
        </ul>
      </div>
      <h2>Rwanda: Volcanoes National Park</h2>
      <p>Rwanda's gorilla permit costs <strong>$1,500 USD per person</strong> — more than double Uganda's. In return, you get Rwanda's famously well-maintained trails, a polished luxury lodge ecosystem, and a government that has invested heavily in the entire gorilla tourism experience.</p>
      <img src="images/hiker-summit.jpg" alt="Volcanoes National Park Rwanda" class="article-img">
      <h3>What the Trek Is Like</h3>
      <p>Rwanda's treks tend to be shorter — many gorilla families have been pushed to more accessible elevations by habituators. Trails are maintained and guides are exceptionally professional. The experience feels more curated, which some travelers love and others find slightly over-managed.</p>
      <div class="info-box">
        <h5><i class="fa-solid fa-circle-info"></i> Rwanda Fast Facts</h5>
        <ul>
          <li>Permit cost: $1,500 USD</li>
          <li>Group size: Max 8 trekkers per gorilla family</li>
          <li>Time with gorillas: 1 hour</li>
          <li>12 habituated gorilla families available for tourism</li>
          <li>Can be combined with golden monkey trek ($100 permit)</li>
        </ul>
      </div>
      <h2>Which Should You Choose?</h2>
      <p><strong>Choose Uganda if:</strong> you're on a tighter budget, you want the rawer experience, or you're combining with other Uganda parks (Queen Elizabeth, Murchison Falls).</p>
      <p><strong>Choose Rwanda if:</strong> time is limited (easier international connections via Kigali), luxury accommodation is important, or you want to combine with a Kigali city visit.</p>
      <p><strong>Ideal answer:</strong> do both. A combined Uganda-Rwanda gorilla itinerary over 7–10 days is one of the best possible East Africa trips. Contact us — we build this regularly.</p>
      <blockquote><p>"The gorilla you encounter in Bwindi has never seen a camera flash. That wildness you feel — it's real. In Rwanda the experience is polished but no less moving." — Aisha Nakato, Gorilla Trek Specialist</p></blockquote>
    `
  },
  {
    id:'packing', cat:'Travel Tips', tag:'tag-tips', catLabel:'Travel Tips',
    title:'The Only Packing List You Need for an East Africa Safari',
    date:'14 August, 2026', readTime:'5 min read',
    cover:'images/tent-view.jpg', author:'team', views:'22.1k',
    excerpt:'Over-packing ruins safaris. Under-packing ruins safaris differently. This list, refined over 12 years, gets it exactly right.',
    body:`
      <p>We've watched thousands of travelers arrive at Nairobi's JKIA with rolling suitcases, laptop bags, and a bewildering number of shoes. We've also watched people shiver through game drives because they didn't bring a jacket. After 12 years and tens of thousands of safari days, here's what actually matters.</p>
      <h2>The Core Principle: Neutral, Layered, Light</h2>
      <p>Safari packing is governed by three rules. <strong>Neutral colours</strong> (khaki, olive, tan, grey) — not because animals care, but because dust shows less on neutral fabrics and you blend into the landscape for photography. <strong>Layers</strong> — East Africa has cold mornings, hot afternoons, and unpredictable afternoon showers. <strong>Light</strong> — most bush flights have 15kg baggage limits.</p>
      <img src="images/tent-view.jpg" alt="Safari packing" class="article-img">
      <h2>Clothing Checklist</h2>
      <ul>
        <li>3–4 lightweight long-sleeve shirts (sun protection and insect deterrent)</li>
        <li>2 pairs of convertible trousers (zip-off legs are genuinely useful)</li>
        <li>1 pair of shorts for relaxed afternoons at camp</li>
        <li>1 fleece or light down jacket — essential for early morning drives</li>
        <li>1 waterproof shell (packable)</li>
        <li>Wide-brim hat (non-negotiable at equatorial altitude)</li>
        <li>Buff or neck gaiter for dust on game drives</li>
        <li>Swimwear (many lodges have pools)</li>
      </ul>
      <h2>Footwear</h2>
      <p>One pair of solid walking shoes or lightweight hiking boots (waterproof if you're doing gorilla trekking). One pair of sandals for camp. That's it. Two pairs of shoes. Commit to it.</p>
      <div class="info-box">
        <h5><i class="fa-solid fa-shoe-prints"></i> Gorilla trekking feet note</h5>
        <ul>
          <li>Waterproof hiking boots are mandatory — trails are muddy year-round</li>
          <li>Gaiters prevent ants and debris from entering your boots</li>
          <li>Rent walking sticks at the park gate — they are worth using</li>
        </ul>
      </div>
      <h2>Camera & Electronics</h2>
      <p>Your camera is the most important equipment decision. Minimum useful wildlife zoom is 300mm. A 100–400mm zoom covers most scenarios. Bring twice as many memory cards as you think you'll need and a dust bag — Maasai Mara red dust destroys unprotected cameras.</p>
      <ul>
        <li>Camera body + 100–400mm zoom lens (or 150–600mm for serious wildlife photography)</li>
        <li>Dust bags for all camera equipment</li>
        <li>High-capacity power bank (lodges often charge 4–6 hours per day)</li>
        <li>Universal power adapter</li>
        <li>Headlamp with red-light mode (for navigating camps after dark)</li>
      </ul>
      <img src="images/safari-vehicle.jpg" alt="Camera gear for safari" class="article-img">
      <h2>Health & Documents</h2>
      <ul>
        <li>Yellow fever vaccination certificate (mandatory for Uganda and Rwanda, recommended for Kenya and Tanzania)</li>
        <li>Anti-malarial medication (consult your doctor — options vary)</li>
        <li>High-SPF sunscreen (SPF 50+ minimum — equatorial sun at altitude is intense)</li>
        <li>Insect repellent with DEET</li>
        <li>Personal prescription medication (bring extra supply)</li>
        <li>E-visa printouts for each country</li>
        <li>Travel insurance documents (print and store digitally)</li>
        <li>Gorilla permit copies (keep a digital backup)</li>
      </ul>
      <blockquote><p>"The best packing list is the one that fits in a 40-litre soft bag. If it doesn't fit, you don't need it." — SafariNomad logistics team</p></blockquote>
      <h2>What to Leave Home</h2>
      <p>Hard-sided suitcases (they don't fit in bush planes or Land Cruiser storage). White clothing. Excessive jewellery. More than two pairs of shoes. A hairdryer. Your laptop (your phone will do everything you need and more).</p>
    `
  },
  {
    id:'maasai', cat:'Culture', tag:'tag-culture', catLabel:'Culture',
    title:'A Day with the Maasai: What to Expect on a Cultural Visit',
    date:'8 August, 2026', readTime:'7 min read',
    cover:'images/misty-acacia.jpg', author:'john', views:'7.4k',
    excerpt:'Most visitors see the Maasai at craft stalls. A real cultural visit is something else entirely — here\'s what to expect and how to approach it with respect.',
    body:`
      <p>The Maasai are one of East Africa's most recognisable peoples, and one of the most misrepresented. If your image of a Maasai cultural visit is a rushed photo opportunity at a roadside craft stall, this article is for you.</p>
      <img src="images/misty-acacia.jpg" alt="Maasai village visit" class="article-img">
      <h2>Choosing the Right Visit</h2>
      <p>There are broadly two types of Maasai cultural experiences. The first — the roadside stop — is transactional and often demeaning for both sides. The second is a proper manyatta (village) visit arranged through a community-based tourism organisation, where income goes directly to the family or community you visit.</p>
      <p>SafariNomad works exclusively with the Koiyaki Guiding School and the Maasai Mara Wildlife Conservancy community trust. Our visits are pre-arranged, fair-pay, and designed to be genuinely informative rather than a performance.</p>
      <h2>Arrival: The Adamu Welcome</h2>
      <p>You'll be welcomed with song and jumping. The adamu — the traditional Maasai jumping dance — is performed by warriors who compete to jump highest. It's joyful and energetic, and your participation (however ungraceful) is encouraged and appreciated.</p>
      <blockquote><p>"Don't try to jump as high as them. Just jump. They will respect the effort." — John Kariuki</p></blockquote>
      <h2>Inside the Enkiama (Home)</h2>
      <p>Maasai homes (enkiama) are built by women from a mixture of mud, acacia branches, cow dung, and ash. They are more sophisticated than they appear: insulated against both cold nights and hot afternoons, with a central fire, sleeping platforms, and a small pen for young calves.</p>
      <img src="images/safari-lodge.jpg" alt="Inside Maasai home" class="article-img">
      <h2>Fire Starting</h2>
      <p>The demonstration of traditional fire-starting using two sticks will humble you completely. Warriors can produce a flame in under 30 seconds. Most visitors take 5 minutes and produce smoke. Try anyway — the warriors are patient and genuinely delighted by the effort.</p>
      <h2>Purchasing Crafts Respectfully</h2>
      <p>Beadwork, knives, gourds, and carvings are sold at every manyatta visit. Prices are fixed (no haggling — it's disrespectful in this context) and all proceeds go to the women's craft cooperative. Buy something. It matters more than you might think to the household economy.</p>
      <div class="info-box">
        <h5><i class="fa-solid fa-hands-holding-circle"></i> Responsible visiting guidelines</h5>
        <ul>
          <li>Always ask before photographing individuals — and accept a no gracefully</li>
          <li>Don't give sweets or money directly to children</li>
          <li>Remove shoes before entering a home if asked</li>
          <li>Book through community-accredited operators only</li>
          <li>A visit fee of $20–30 per person is standard and should be paid without negotiation</li>
        </ul>
      </div>
    `
  },
  {
    id:'chimps', cat:'Trekking', tag:'tag-trekking', catLabel:'Trekking',
    title:'Chimpanzee Trekking in Kibale Forest: Everything You Need to Know',
    date:'2 August, 2026', readTime:'6 min read',
    cover:'images/forest-elephant.jpg', author:'aisha', views:'6.2k',
    excerpt:'Uganda\'s Kibale Forest is the world\'s best place to see chimpanzees. Here is the complete guide to planning your trek.',
    body:`
      <p>Uganda's Kibale National Park is home to roughly 1,500 chimpanzees across 795 km² of rainforest, making it the highest-density chimpanzee habitat in East Africa. It's also one of the best places in the world to see them face to face.</p>
      <img src="images/forest-elephant.jpg" alt="Chimpanzee in Kibale Forest" class="article-img">
      <h2>The Kibale Chimp Trek Experience</h2>
      <p>Trekking groups are limited to six people, led by a UWA ranger and a tracker. The chimps move quickly through the canopy — trekking with them means a lot of looking up and moving fast through dense vegetation. Encounters can last anywhere from 30 minutes to several hours, and the permit allows you to remain with the group for up to one hour once located.</p>
      <h2>Permit and Costs</h2>
      <p>A chimp trekking permit in Kibale costs <strong>$200 USD</strong> per person — significantly less than a gorilla permit but no less rewarding. Chimp habituation experience permits (which allow a full day with a chimp family, including non-tourist researchers) cost $250 and offer a much more intimate and scientifically-minded experience.</p>
      <div class="info-box">
        <h5><i class="fa-solid fa-calendar-check"></i> Booking your permit</h5>
        <ul>
          <li>Book through UWA (Uganda Wildlife Authority) or your tour operator</li>
          <li>Kibale permits are available year-round but book 2–4 weeks ahead in peak season</li>
          <li>Morning treks (starting 8am) are recommended — chimps are most active before noon</li>
          <li>The Kanyanchu Visitor Centre is the main trekking departure point</li>
        </ul>
      </div>
      <h2>Best Time to Visit</h2>
      <p>Chimps are visible year-round in Kibale, but easier to track during the dry seasons (June–August and December–February) when they spend more time in fruiting trees at lower elevations. The wet season brings denser forest and muddier trails, but also spectacular green scenery and a quieter park.</p>
      <h2>Combining Kibale with Bwindi</h2>
      <p>The most popular Uganda itinerary combines Kibale chimp trekking with Bwindi gorilla trekking. The two parks are roughly 4 hours apart through beautiful countryside — tea plantations, volcanic hills, small market towns, and the Queen Elizabeth plains. Many travellers add a night game drive at Queen Elizabeth en route.</p>
      <img src="images/lake-kivu-sunset.jpg" alt="Uganda countryside between parks" class="article-img">
      <blockquote><p>"The chimps in Kibale have been habituated for decades. They completely ignore you. That indifference is the most thrilling thing about it." — Aisha Nakato</p></blockquote>
    `
  },
  {
    id:'tenthings', cat:'Travel Tips', tag:'tag-tips', catLabel:'Travel Tips',
    title:'Your First Safari: 10 Things No One Tells You',
    date:'28 July, 2026', readTime:'9 min read',
    cover:'images/safari-vehicle.jpg', author:'team', views:'31.5k',
    excerpt:'You\'ve booked. You\'re excited. Here is the unfiltered truth about what your first safari will actually be like.',
    body:`
      <p>You've seen the photographs. You've watched the documentaries. You've booked the flight. Your first safari is going to be extraordinary — and it's also going to surprise you in ways no brochure mentions. Here are ten things we wish every first-time safari traveller knew before they arrived.</p>
      <img src="images/safari-vehicle.jpg" alt="First safari experience" class="article-img">
      <h2>1. The Waiting Is Part of It</h2>
      <p>A skilled safari guide might sit at the same water hole for 45 minutes without seeing anything dramatic. That's not failure — that's strategy. A lioness approaches a water hole the same way every time; a guide who knows her knows where to park. The patience pays off in ways that feel like magic.</p>
      <h2>2. 4am Sounds Impossible Until It Isn't</h2>
      <p>You will not want to get out of bed at 4am on your second morning. The first morning you'll manage on adrenaline. Then you'll watch a cheetah make a kill at first light and you will never complain about early starts again for the rest of your life.</p>
      <h2>3. The Dust Is Everywhere and It's Beautiful</h2>
      <p>The Maasai Mara's famous red dust gets into everything. Your camera bag. Your sunglasses. Your dental floss. Accept it. The ochre dust against the golden grass is part of the visual landscape that makes the Mara photographs so recognisable.</p>
      <div class="info-box">
        <h5><i class="fa-solid fa-camera"></i> Protect your camera from dust</h5>
        <ul>
          <li>Always use a dust bag when not actively shooting</li>
          <li>Cover your lens when the vehicle is moving — especially in the dry season</li>
          <li>Bring a blower brush for daily lens cleaning</li>
          <li>Never change lenses in the vehicle — wait until you're at camp</li>
        </ul>
      </div>
      <h2>4. It's Colder Than You Expect at Dawn</h2>
      <p>The Maasai Mara sits at 1,500 metres elevation. On an open-topped vehicle at 5:30am in July, it is properly cold. A fleece, a scarf, and fingerless gloves are not excessive — they are necessary. Lodges often provide blankets for game drives. Use them without embarrassment.</p>
      <h2>5. You Don't Need to See the Big Five on Day One</h2>
      <p>First-time safari anxiety often centres on a mental checklist. Relax. The Big Five (lion, elephant, buffalo, leopard, rhino) take time. Some take patience and specific locations. A safari is not a scavenger hunt — the unexpected is the point.</p>
      <img src="images/leopard.jpg" alt="Leopard in tree" class="article-img">
      <h2>6. The Smaller Stuff Is Just as Good</h2>
      <p>Dung beetles rolling spheres of elephant dung at dawn. A lilac-breasted roller sitting on a termite mound. A hyena clan at a kill. The safari conversation almost always starts with lions and ends with a passionate argument about whether the dung beetle or the banded mongoose won the afternoon.</p>
      <h2>7. Lodges Vary Enormously</h2>
      <p>A tented camp is not a tent in a field. Most of East Africa's tented camps are permanent structures with solid floors, proper beds, en-suite bathrooms, and electricity. Don't let the word 'tent' put you off — some of the world's most extraordinary hotel rooms happen to have canvas walls.</p>
      <h2>8. Fellow Guests Make the Experience</h2>
      <p>The shared game drive vehicle, the dinner table that seats twelve, the collective gasp when a leopard drops from a tree — safari is surprisingly social. Most travellers find that some of their best conversations happen at the dinner table with strangers who just watched the same sunset over the same Serengeti plain.</p>
      <h2>9. You'll Come Back</h2>
      <p>In our 12 years of running safaris, over 60% of our travelers have returned for a second trip. We're not saying this as a sales pitch — we're saying it so you book your first trip without over-planning. Africa has a way of answering questions you didn't know you had.</p>
      <h2>10. Trust Your Guide</h2>
      <p>Your guide has spent years in this ecosystem. When they stop the vehicle and go quiet, stop talking. When they say drive closer, hold your camera steady. When they say stay in the vehicle, stay in the vehicle. The guides who work for SafariNomad were born near these parks and have spent their lives learning to read them. Trust that knowledge absolutely.</p>
      <blockquote><p>"The best thing a first-time safari traveller can do is forget everything they think they know and just look." — SafariNomad Guide Team</p></blockquote>
    `
  },
  {
    id:'zanzibar', cat:'Destinations', tag:'tag-destinations', catLabel:'Destinations',
    title:'Zanzibar Beyond the Beach: A Complete Island Guide',
    date:'22 July, 2026', readTime:'7 min read',
    cover:'images/zanzibar-palms.jpg', author:'david', views:'8.9k',
    excerpt:'Zanzibar is more than white sand and turquoise water. It\'s a spice island with a complex history, a UNESCO-listed old city, and some of the best seafood in the Indian Ocean.',
    body:`
      <p>Most safari itineraries include Zanzibar as a 3-day add-on after the Serengeti. And while the beaches are genuinely as beautiful as the photographs suggest, limiting yourself to the beach means missing an island with extraordinary depth.</p>
      <img src="images/coast-resort.jpg" alt="Stone Town Zanzibar" class="article-img">
      <h2>Stone Town: The Heart of Zanzibar</h2>
      <p>Stone Town is Zanzibar's old quarter and a UNESCO World Heritage Site. It's a labyrinth of narrow lanes, carved wooden doors, mosques, Arab-influenced architecture, and covered bazaars that have barely changed in 200 years. Get lost in it — that's the point.</p>
      <p>Key sights include: the House of Wonders (Beit el-Ajaib), the Old Fort, the site of the former slave market (now an Anglican cathedral), Freddie Mercury's birth house, and the Darajani Market where spices are sold in quantities that make the air hum.</p>
      <h2>The Spice Tour</h2>
      <p>Zanzibar earned its historical name 'The Spice Island' through clove, nutmeg, cinnamon, and vanilla plantations that supplied most of the Indian Ocean trade. The spice farm tour — a half-day visit to a working plantation — is one of the most sensory experiences the island offers. You'll identify spices by touch, taste, and smell before you see the label.</p>
      <div class="info-box">
        <h5><i class="fa-solid fa-leaf"></i> What you'll taste on the spice tour</h5>
        <ul>
          <li>Fresh vanilla pods (far more complex than anything in a jar)</li>
          <li>Cardamom, cloves, and black pepper straight off the vine</li>
          <li>Lemongrass, turmeric root, and jackfruit</li>
          <li>Coconut in five forms — including coconut wine</li>
        </ul>
      </div>
      <img src="images/zanzibar-palms.jpg" alt="Zanzibar beach at sunset" class="article-img">
      <h2>The Beaches</h2>
      <p>Zanzibar's beaches vary dramatically by location and tide. The east coast (Paje, Jambiani, Matemwe) has the finest sand and the most consistent snorkelling. The north coast (Nungwi, Kendwa) stays swimmable at low tide — the east coast can shallow out significantly. The west coast (near Stone Town) has muddy tidal flats and is not recommended for beach days.</p>
      <h2>Mnemba Atoll</h2>
      <p>One of East Africa's best dive and snorkelling sites sits just off Matemwe on Zanzibar's northeast coast. Mnemba Atoll's protected coral reef hosts dolphins, sea turtles, parrotfish, and on lucky days, whale sharks. Access is by dhow from Matemwe beach — we arrange this as part of our Zanzibar packages.</p>
      <blockquote><p>"The dhow sunset cruise is obligatory. Do it on your last evening — it's a perfect final image of East Africa to carry home." — David Mwangi</p></blockquote>
    `
  },
  {
    id:'cameras', cat:'Gear', tag:'tag-gear', catLabel:'Gear',
    title:'Best Cameras for Safari in 2026: A Guide for Every Budget',
    date:'15 July, 2026', readTime:'10 min read',
    cover:'images/lion-portrait.jpg', author:'team', views:'18.7k',
    excerpt:'From mirrorless flagships to smartphone tips, here is the honest guide to safari photography equipment at every price point.',
    body:`
      <p>Safari photography separates itself from almost all other forms of travel photography in one key way: the subjects move fast, are often far away, and the light is frequently either too bright or too dim. Here's what works, at every budget.</p>
      <img src="images/lion-portrait.jpg" alt="Camera setup for safari" class="article-img">
      <h2>What Makes Safari Photography Different</h2>
      <p>You're shooting from a moving vehicle, often with engine vibration. You need fast autofocus (animals don't hold still), long reach (100+ metres is common), and high ISO capability (dawn light is beautiful but technically challenging). The camera system that wins on a safari is different to the one that wins in a city or a studio.</p>
      <h2>Mirrorless (Best Overall)</h2>
      <p>Modern mirrorless cameras — Sony A9 III, Canon R6 Mark II, Nikon Z8 — offer the best combination of speed, tracking autofocus, and weight for safari. Their subject-tracking AF will lock onto a running cheetah or a diving eagle and stay with it through bursts of 20+ frames per second. If budget allows, this is the category to be in.</p>
      <div class="info-box">
        <h5><i class="fa-solid fa-star"></i> Our top mirrorless picks for safari</h5>
        <ul>
          <li><strong>Best overall:</strong> Sony A9 III + 200–600mm G lens</li>
          <li><strong>Best value:</strong> Canon R7 (crop sensor, APS-C, excellent reach) + 100–400mm</li>
          <li><strong>Best portability:</strong> Sony A7C II + 70–200mm f2.8</li>
        </ul>
      </div>
      <h2>DSLR (Still Excellent)</h2>
      <p>The Canon 7D Mark II and Nikon D500 remain outstanding safari cameras despite being older designs. Their optical viewfinders, weather sealing, and long battery life make them reliable workhorses. If you already own one, there is no compelling reason to upgrade before your safari.</p>
      <img src="images/lioness.jpg" alt="Long lens on safari vehicle" class="article-img">
      <h2>Smartphone Photography Tips</h2>
      <p>If your phone is your camera, the most important investment is a small tripod or bean bag to stabilise against the vehicle. The second is a clip-on telephoto lens — not a great solution for fast wildlife, but useful for landscapes and static subjects. Use burst mode and edit in Lightroom Mobile afterwards.</p>
      <h2>Lens Choice: The Most Important Decision</h2>
      <p>A budget camera with a long lens will outperform a flagship body with a short lens every single time on safari. If you have to choose between upgrading your body or adding reach, add reach.</p>
      <ul>
        <li>Minimum useful focal length: 300mm (full frame equivalent)</li>
        <li>Ideal range: 100–500mm variable zoom</li>
        <li>For birds: 600mm or more</li>
        <li>Bring a wide-angle lens too — for landscape and vehicle-interior shots</li>
      </ul>
      <blockquote><p>"The best camera is the one you've learned. Spend the month before your safari shooting birds in your local park. The muscle memory will be there when the cheetah runs." — SafariNomad photography guide</p></blockquote>
    `
  },
  {
    id:'planning', cat:'Planning', tag:'tag-planning', catLabel:'Planning',
    title:'How to Plan a Two-Week East Africa Safari from Scratch',
    date:'5 July, 2026', readTime:'11 min read',
    cover:'images/serengeti-acacia.jpg', author:'grace', views:'12.3k',
    excerpt:'Two weeks is the sweet spot for East Africa. Here is the step-by-step planning framework our guides use to build the perfect itinerary.',
    body:`
      <p>Two weeks is the ideal length for an East Africa safari. Long enough to cover multiple ecosystems and countries, short enough that it remains focused and manageable. Here's how to build it from scratch.</p>
      <img src="images/serengeti-acacia.jpg" alt="Safari planning map" class="article-img">
      <h2>Step 1: Decide What You Most Want to See</h2>
      <p>Every good itinerary starts with a core experience. Are you primarily here for the Great Migration? Gorilla trekking? The Serengeti plains? Zanzibar's beaches? The answer to this question drives everything else — timing, country selection, park choice, and accommodation type.</p>
      <h2>Step 2: Choose Your Country Combination</h2>
      <p>The most popular two-week combination is <strong>Kenya + Tanzania</strong> (classic wildlife) or <strong>Uganda + Rwanda</strong> (primate-focused). For a broader experience, <strong>Kenya + Tanzania + Zanzibar</strong> in 14 days is very achievable. The Uganda + Rwanda gorilla combination can be done in 10 days and supplemented with Kenya for a 14-day trip.</p>
      <div class="info-box">
        <h5><i class="fa-solid fa-route"></i> Two-week sample itineraries</h5>
        <ul>
          <li><strong>Classic East Africa:</strong> Nairobi (1) → Maasai Mara (3) → Serengeti (3) → Ngorongoro (2) → Zanzibar (4) → Depart</li>
          <li><strong>Primate Focus:</strong> Entebbe (1) → Kibale Chimps (2) → Bwindi Gorillas (2) → Kigali (1) → Volcanoes Gorillas (2) → Lake Kivu (2) → Depart</li>
          <li><strong>Kenya Depth:</strong> Nairobi (1) → Amboseli (2) → Tsavo (2) → Diani Beach (3) → Maasai Mara (4) → Nairobi (1) → Depart</li>
        </ul>
      </div>
      <h2>Step 3: Time It Right</h2>
      <p>East Africa's seasons matter. The dry season (July–October and January–February) gives the best game viewing — thinner vegetation, animals congregating at water sources, and drier roads. The green season (April–June) is beautiful, cheaper, and uncrowded, but some roads become impassable.</p>
      <h2>Step 4: Accommodation Tiers</h2>
      <p>East Africa's lodging vocabulary is confusing. Here's the quick guide:</p>
      <ul>
        <li><strong>Tented camp:</strong> Canvas walls, solid floor, en-suite bathroom — often the most atmospheric option</li>
        <li><strong>Permanent lodge:</strong> Conventional hotel-style rooms within a park or conservancy</li>
        <li><strong>Fly camp:</strong> Temporary, mobile setup for remote areas — maximum immersion</li>
        <li><strong>Community conservancy camp:</strong> Private land adjacent to national parks — more exclusive, often better game</li>
      </ul>
      <img src="images/tent-view.jpg" alt="Luxury tented camp interior" class="article-img">
      <h2>Step 5: Budget Realistically</h2>
      <p>East Africa safari costs break down into: flights, park fees, accommodation, and guide/transport. Park fees alone can add $100–$200 per day per person in Kenya and Tanzania. Rwanda's gorilla permit is $1,500. Budget these before selecting accommodation — the park fees are fixed, the accommodation is flexible.</p>
      <blockquote><p>"The biggest planning mistake is booking accommodation before calculating park fees and permits. Know your fixed costs first, then fit the accommodation around your budget." — Grace Uwimana, Rwanda & Planning Lead</p></blockquote>
    `
  },
  {
    id:'birds', cat:'Wildlife', tag:'tag-wildlife', catLabel:'Wildlife',
    title:'East Africa Birding: A Beginner\'s Guide to 50 Must-See Species',
    date:'28 June, 2026', readTime:'8 min read',
    cover:'images/flamingo.jpg', author:'david', views:'5.6k',
    excerpt:'East Africa is one of the world\'s great birding destinations. Over 1,400 species across the four countries — here\'s where to start.',
    body:`
      <p>Most first-time safari travellers don't consider themselves birders. Most of them change their minds by day two, usually because of a lilac-breasted roller sitting on a dead acacia in golden afternoon light. East Africa's birdlife is impossible to ignore once you start looking.</p>
      <img src="images/giraffe-sunset.jpg" alt="Lilac-breasted roller bird" class="article-img">
      <h2>Why East Africa for Birding?</h2>
      <p>Kenya alone has over 1,100 recorded bird species — roughly 10% of all the world's birds. Tanzania has 1,080. Uganda's Bwindi Forest is home to 347 species including 23 Albertine Rift endemics. The diversity of habitats — from Rift Valley lakes to montane forest to open savannah — creates an extraordinary range of bird communities.</p>
      <h2>10 Birds You'll Almost Certainly See</h2>
      <ul>
        <li><strong>Lilac-breasted roller</strong> — the unofficial bird of East Africa; iridescent purple, turquoise, and green</li>
        <li><strong>Superb starling</strong> — a riot of metallic colour on every lodge lawn</li>
        <li><strong>Kori bustard</strong> — Africa's heaviest flying bird; stalks the plains like a small dinosaur</li>
        <li><strong>Secretary bird</strong> — hunts snakes on foot; looks like a hawk wearing gaiters</li>
        <li><strong>Grey-crowned crane</strong> — Uganda's national bird; gold and white plumage</li>
        <li><strong>African fish eagle</strong> — its call is the sound of Africa; hunts from Rift Valley lake shorelines</li>
        <li><strong>Marabou stork</strong> — ancient, hunched, and oddly compelling at roost sites</li>
        <li><strong>Lesser flamingo</strong> — 1 million birds on Lake Nakuru at peak season</li>
        <li><strong>Shoebill stork</strong> — prehistoric-looking; found in Uganda's Mabamba Swamp</li>
        <li><strong>African crowned eagle</strong> — the apex avian predator; capable of killing a small antelope</li>
      </ul>
      <div class="info-box">
        <h5><i class="fa-solid fa-binoculars"></i> Best birding locations by country</h5>
        <ul>
          <li><strong>Kenya:</strong> Lake Nakuru (flamingos), Kakamega Forest (endemics), Amboseli (raptors)</li>
          <li><strong>Tanzania:</strong> Lake Manyara (400+ species), Ngorongoro Crater (diverse raptors), Arusha NP</li>
          <li><strong>Uganda:</strong> Bwindi (Albertine endemics), Mabamba Swamp (shoebill), Murchison Falls</li>
          <li><strong>Rwanda:</strong> Nyungwe Forest (29 Albertine endemics), Akagera (papyrus specialties)</li>
        </ul>
      </div>
      <img src="images/flamingo.jpg" alt="Flamingos at Lake Nakuru" class="article-img">
      <h2>Recommended Field Guides</h2>
      <p>Stevenson & Fanshawe's <em>Birds of East Africa</em> is the authoritative reference. For digital birding, eBird (with the East Africa checklists) and Merlin Bird ID (audio-based identification) are excellent companions. Many SafariNomad vehicles carry a physical field guide — ask your guide to point out species as you encounter them.</p>
      <blockquote><p>"Non-birders always say they don't care about birds. Then a martial eagle drops out of the sky onto a hare forty metres from the vehicle and suddenly everyone is asking what it is." — David Mwangi, Birding Guide</p></blockquote>
    `
  },
  {
    id:'budget', cat:'Planning', tag:'tag-planning', catLabel:'Planning',
    title:'East Africa on a Budget: How to Safari Without Spending a Fortune',
    date:'20 June, 2026', readTime:'8 min read',
    cover:'images/camp-at-night.jpg', author:'team', views:'24.8k',
    excerpt:'A safari doesn\'t have to cost $1,000 a day. Here are the genuine strategies our team uses to bring costs down without compromising the experience.',
    body:`
      <p>The word "safari" carries an association with luxury that makes many travellers assume it's out of reach. It isn't — but budget safari planning requires knowing where the costs are fixed (and can't be reduced) versus where they're flexible (and can be dramatically cut).</p>
      <img src="images/safari-vehicle.jpg" alt="Safari game drive vehicle" class="article-img">
      <h2>Understanding What Costs What</h2>
      <p>East Africa safari costs have three components: fixed costs (flights, park fees, permits), semi-fixed costs (transport and guiding), and flexible costs (accommodation). Most people try to cut accommodation — which is the right instinct — but they often don't realise how much can also be saved on transport by joining a shared group departure rather than a private safari.</p>
      <h2>The Single Best Budget Strategy: Join a Group Departure</h2>
      <p>A private 5-day Maasai Mara safari for two people costs roughly $800–$1,200 per person (depending on camp). The same itinerary as a shared group departure (6–8 people in one vehicle) costs $380–$580 per person. The game viewing is identical. The camp is often the same. The difference is purely the vehicle cost, divided by more people.</p>
      <div class="info-box">
        <h5><i class="fa-solid fa-piggy-bank"></i> Top budget strategies that actually work</h5>
        <ul>
          <li>Join a shared group departure instead of booking private</li>
          <li>Travel in green/shoulder season (April–June, November) — 20–30% cheaper</li>
          <li>Stay in bandas or public campsites within national parks</li>
          <li>Fly into Nairobi and use overland transport to the Mara</li>
          <li>Do Uganda instead of Rwanda for gorilla trekking (half the permit price)</li>
          <li>Combine your own flights rather than booking a full package</li>
        </ul>
      </div>
      <h2>Where NOT to Cut Costs</h2>
      <p>Park fees are non-negotiable — there's no legal way around them. Guide quality should never be compromised: a poor guide will ruin even the most spectacular location. Vehicle quality matters too — a well-maintained 4x4 with a functioning radio and a pop-top roof is the difference between a real game drive and a frustrating one.</p>
      <img src="images/camp-at-night.jpg" alt="Budget campsite Maasai Mara" class="article-img">
      <h2>Realistic Minimum Budgets</h2>
      <ul>
        <li><strong>Budget (shared group, bandas):</strong> $200–$350 per person per day in-country</li>
        <li><strong>Mid-range (small group, mid-tier lodges):</strong> $400–$700 per person per day</li>
        <li><strong>Luxury (private, top camps):</strong> $700–$2,000+ per person per day</li>
      </ul>
      <p>All of these figures include park fees, guide, vehicle, full board at camp, and scheduled game drives. They do not include international flights (typically $700–$1,400 from Europe or North America) or travel insurance.</p>
      <blockquote><p>"The best value safari I've ever seen was two friends in a shared group vehicle, staying in public bandas, cooking their own breakfast. They saw exactly the same lions as the people paying three times as much." — SafariNomad team</p></blockquote>
    `
  },
];
