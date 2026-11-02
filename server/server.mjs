/* =========================================================
   SafariNomad: website server + AI safari assistant
   ---------------------------------------------------------
   Serves the site and adds these endpoints:

     POST /api/chat          AI assistant (streams Server-Sent Events)
     POST /api/translate     fills gaps in the lang/*.js files
     GET  /api/availability  seats already booked on each departure
     POST /api/bookings      a booking request from book.html
     POST /api/enquiries     quote, flight and newsletter forms
     /api/admin/...          the admin dashboard (admin.html), password protected,
                             including website content (prices, images, flash sales, flights)

   Bookings, enquiries and the questions visitors ask the
   assistant are saved as JSON files in server/data/.

   The assistant is Claude, briefed with the trips, prices and
   FAQs from js/data.js, so it only quotes what's on the site.
   Your API key stays here on the server, never in the browser.

   Run:   set ANTHROPIC_API_KEY=sk-ant-...   (Windows: set / PowerShell: $env:)
          set ADMIN_PASSWORD=choose-a-password  (optional, see below)
          npm start
   Open:  http://localhost:3000              the website
          http://localhost:3000/admin.html   bookings & questions

   Admin password: ADMIN_PASSWORD if set; otherwise one is created
   on first run, saved in server/data/admin-password.txt and
   printed when the server starts.
   ========================================================= */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3000;
const MODEL = 'claude-opus-5-5';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
const LANGUAGES = { en: 'English', fr: 'French', es: 'Spanish', de: 'German' };

/* ---------- Brief the assistant from js/data.js ---------- */
const DATA_FILE = path.join(ROOT, 'js', 'data.js');
let briefing = { mtime: 0, text: '' };

// The site data with the admin's edits applied (flash sales start and end on their own,
// so the result is rebuilt at least once a minute)
let dataCache = { key: '', value: null };
function evalData(withContent){
  const code = fs.readFileSync(DATA_FILE, 'utf8');
  return new vm.Script(code + '\n;' + (withContent ? 'applyContent(__C);' : '') +
    '({ SITE, TRIPS, LAST_MINUTE, FLIGHTS, AIRPORTS, KNOWLEDGE, BOOKING, BookingRules })').runInNewContext({ __C: JSON.parse(JSON.stringify(content)) });
}
function dataKey(){ return fs.statSync(DATA_FILE).mtimeMs + '|' + contentVersion + '|' + Math.floor(Date.now() / 60_000); }
function loadData(){
  const key = dataKey();
  if(key !== dataCache.key) dataCache = { key, value: evalData(true) };
  return dataCache.value;
}

function buildSystemPrompt(){
  const { SITE, TRIPS, LAST_MINUTE, KNOWLEDGE } = loadData();
  const trips = TRIPS.map(t =>
    `- ${t.title} | id: ${t.id} | ${t.countries} | ${t.days} days | from $${t.price}${t.was ? ` (was $${t.was})` : ''} | ` +
    `styles: ${t.styles.join(', ')} | best months: ${(t.months || []).join(',')} | route: ${t.route || '-'} | ` +
    `stays: ${t.stay} | group: ${t.group <= 2 ? 'private' : 'max ' + t.group} | rating ${t.rating} (${t.reviews} reviews)`
  ).join('\n');
  const lastMinute = LAST_MINUTE.map(t =>
    `- ${t.title} | id: ${t.id} | ${t.countries} | ${t.days} days | departs ${t.departs} | ${t.spaces} spaces left | $${t.price} (was $${t.was})`
  ).join('\n');
  const facts = KNOWLEDGE.map(k => `Q: ${k.q}\nA: ${k.a}`).join('\n\n');

  return `You are Nomad, the friendly AI safari assistant on the SafariNomad website. SafariNomad is a Nairobi-based tour operator running small-group and tailor-made safaris in Kenya, Tanzania (including Zanzibar), Uganda and Rwanda.

Your job is to help visitors find the right safari and answer their questions, then guide them towards a free quote from a human safari expert.

How to answer:
- Keep replies short and warm: usually 2 to 5 sentences, or a few bullet points. Write like a knowledgeable friend who has been on these trips, not a brochure.
- Only recommend trips from the list below, and only quote prices, durations and details exactly as listed. Prices are per person in US dollars. Never invent trips, prices, dates, availability or discounts.
- When you recommend a trip, link it as a Markdown link in this exact form: [Trip title](book.html?trip=TRIP_ID). That page shows live departure dates and lets the visitor book. Recommend at most three trips at a time.
- Useful pages you can link: [all trips](trips.html), [flash deals](services.html#flash-deals), [destination guides](destinations.html), [flights](flights.html), [our services: vehicles, stays & guides](services.html), [FAQs](about.html#faqs), [free quote](contact.html).
- If you don't know something, or it depends on dates and availability, say so and suggest a free quote or contacting the team. Don't guess.
- For visas, vaccinations and health, give the general guidance below and remind people to check official sources or a travel clinic.
- You can't make bookings, take payments or see availability yourself. Visitors pick dates and book on the trip's booking page (book.html?trip=TRIP_ID) and a planner confirms within 24 hours. For anything custom, a human planner helps via the quote form, WhatsApp (+${SITE.whatsapp}), phone (${SITE.phone}) or email (${SITE.email}), ${SITE.hoursText}.
- Stay on topic: travel in East Africa and SafariNomad's trips. Politely steer anything else back to safari planning.
- Use plain text with light Markdown only (bold, bullet lists, links). No headings, tables or code.

Current offer: ${SITE.promo.text}.

TRIPS
${trips}

LAST-MINUTE DEPARTURES
${lastMinute}

FACTS AND POLICIES
${facts}`;
}

function getSystemPrompt(){
  const key = dataKey();
  if(key !== briefing.mtime) briefing = { mtime: key, text: buildSystemPrompt() };
  return briefing.text;
}

/* ---------- Simple per-visitor rate limit ---------- */
const hits = new Map();
function rateLimited(ip){
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 15; // 15 messages a minute per visitor
}

/* ---------- Validate what the browser sends ---------- */
function cleanMessages(input){
  if(!Array.isArray(input)) return null;
  const msgs = input.slice(-20)
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while(msgs.length && msgs[0].role !== 'user') msgs.shift();   // must start with the visitor
  if(!msgs.length || msgs[msgs.length - 1].role !== 'user') return null;
  return msgs;
}

function readBody(req, limit = 50_000){
  return new Promise((resolve, reject) => {
    let size = 0, chunks = [];
    req.on('data', c => { size += c.length; if(size > limit){ reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* ---------- POST /api/chat ---------- */
async function handleChat(req, res){
  const ip = req.socket.remoteAddress || 'unknown';
  if(rateLimited(ip)) return sendJSON(res, 429, { error: 'Too many messages. Please wait a minute.' });

  let messages, lang = 'en', body;
  try {
    body = JSON.parse(await readBody(req));
    messages = cleanMessages(body.messages);
    if(LANGUAGES[body.lang]) lang = body.lang;
  }
  catch { return sendJSON(res, 400, { error: 'Bad request' }); }
  if(!messages) return sendJSON(res, 400, { error: 'Bad request' });

  // Keep a record of what visitors ask, for the admin dashboard
  const question = {
    id: newId(), created: new Date().toISOString(), status: 'new',
    session: clean(body.session, 40), page: clean(body.page, 120), lang,
    question: messages[messages.length - 1].content, answer: ''
  };
  db.questions.push(question);
  if(db.questions.length > 5000) db.questions.splice(0, db.questions.length - 5000);
  save('questions');

  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
  const send = obj => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  // No API key: the browser shows its offline answer (the question is still recorded)
  if(!process.env.ANTHROPIC_API_KEY){
    question.offline = true;
    save('questions');
    send({ error: 'The AI assistant is not configured yet (no API key).', fallback: true });
    return res.end();
  }

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: 'low' },                 // quick, conversational replies
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',                             // if a reply is declined, Anthropic retries on a suitable model
      system: [
        { type: 'text', text: getSystemPrompt(), cache_control: { type: 'ephemeral' } },
        { type: 'text', text: `The visitor is browsing the site in ${LANGUAGES[lang]}. Reply in ${LANGUAGES[lang]}. Keep trip links exactly as given.` }
      ],
      messages
    });
    req.on('close', () => stream.abort());

    for await (const event of stream){
      if(event.type === 'content_block_delta' && event.delta.type === 'text_delta'){ send({ t: event.delta.text }); question.answer += event.delta.text; }
    }
    const final = await stream.finalMessage();
    if(final.stop_reason === 'refusal'){
      send({ t: "\n\nSorry, I can't help with that one. Our safari experts can, though: [request a free quote](contact.html)." });
    }
    send({ done: true });
  } catch(err){
    let message = 'The assistant is unavailable right now.';
    if(err instanceof Anthropic.AuthenticationError) message = 'The AI assistant is not configured yet (missing or invalid API key).';
    else if(err instanceof Anthropic.RateLimitError) message = 'The assistant is very busy. Please try again in a moment.';
    else if(err instanceof Anthropic.APIError) message = `The assistant hit an error (${err.status}).`;
    if(!(err instanceof Anthropic.APIUserAbortError)) console.error('[chat]', err.message);
    question.offline = true;   // the visitor was shown the assistant's offline answer
    send({ error: message, fallback: true });
  }
  save('questions');
  res.end();
}

/* ---------- POST /api/translate ----------
   Fills gaps in lang/*.js: { lang:'fr', strings:['English', ...] }
   → { translations: { English: 'Français', ... } }
   Results are saved in server/translations/<lang>.json, so each
   string is only ever sent to Claude once. */
const TRANSLATION_DIR = path.join(ROOT, 'server', 'translations');
const translationCache = {};
function cacheFor(lang){
  if(!translationCache[lang]){
    try { translationCache[lang] = JSON.parse(fs.readFileSync(path.join(TRANSLATION_DIR, lang + '.json'), 'utf8')); }
    catch { translationCache[lang] = {}; }
  }
  return translationCache[lang];
}

const TRANSLATION_SCHEMA = {
  type: 'object',
  properties: {
    translations: {
      type: 'array',
      items: {
        type: 'object',
        properties: { source: { type: 'string' }, translation: { type: 'string' } },
        required: ['source', 'translation'],
        additionalProperties: false
      }
    }
  },
  required: ['translations'],
  additionalProperties: false
};

async function handleTranslate(req, res){
  const ip = req.socket.remoteAddress || 'unknown';
  if(rateLimited(ip)) return sendJSON(res, 429, { error: 'Too many requests' });

  let lang, strings;
  try {
    const body = JSON.parse(await readBody(req, 200_000));
    lang = body.lang;
    strings = Array.isArray(body.strings) ? body.strings.filter(s => typeof s === 'string' && s.trim() && s.length <= 3000).slice(0, 80) : [];
  } catch { return sendJSON(res, 400, { error: 'Bad request' }); }
  if(!LANGUAGES[lang] || lang === 'en') return sendJSON(res, 400, { error: 'Unknown language' });

  const cache = cacheFor(lang);
  const out = {};
  const todo = [];
  strings.forEach(s => { if(cache[s] !== undefined) out[s] = cache[s]; else todo.push(s); });

  if(todo.length){
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 16000,
        output_config: {
          effort: 'low',
          format: { type: 'json_schema', schema: TRANSLATION_SCHEMA }
        },
        system: `You translate website text for SafariNomad, an East African safari company, from English into ${LANGUAGES[lang]}.
- Write natural, warm, concise ${LANGUAGES[lang]} that reads as if written by a native speaker for a travel website.
- Keep placeholders exactly as they are: {n}, {name}, {max} and any other {word}.
- Keep Markdown, links and URLs unchanged, e.g. [text](contact.html) keeps contact.html (translate only the link text).
- Keep proper nouns as they are usually written in ${LANGUAGES[lang]}: park, place and brand names (SafariNomad, Maasai Mara, Serengeti...).
- Keep the same punctuation style, capitalisation pattern and leading or trailing symbols.
- Return every source string exactly as given, paired with its translation.`,
        messages: [{ role: 'user', content: JSON.stringify(todo) }]
      });
      if(response.stop_reason !== 'refusal'){
        const text = response.content.find(b => b.type === 'text')?.text || '{}';
        const { translations = [] } = JSON.parse(text);
        translations.forEach(({ source, translation }) => {
          // only accept translations of strings we asked for, with placeholders intact
          const keep = s => (s.match(/\{\w+\}|\]\([^)]*\)/g) || []).sort().join('|');
          if(todo.includes(source) && translation && keep(source) === keep(translation)){
            cache[source] = translation;
            out[source] = translation;
          }
        });
        fs.mkdirSync(TRANSLATION_DIR, { recursive: true });
        fs.writeFileSync(path.join(TRANSLATION_DIR, lang + '.json'), JSON.stringify(cache, null, 1));
      }
    } catch(err){
      if(!(err instanceof Anthropic.AuthenticationError)) console.error('[translate]', err.message);
      if(!Object.keys(out).length) return sendJSON(res, 503, { error: 'Translation unavailable' });
    }
  }
  sendJSON(res, 200, { translations: out });
}

/* =========================================================
   Saved data: bookings, enquiries and assistant questions
   ========================================================= */
const DATA_DIR = path.join(ROOT, 'server', 'data');
const KINDS = ['bookings', 'enquiries', 'questions'];
const db = {};
KINDS.forEach(k => {
  try { db[k] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, k + '.json'), 'utf8')); }
  catch { db[k] = []; }
});
// Write to a temporary file, then swap it in, so a crash never leaves half a file.
// On Windows the swap can be refused for a moment while another program (an editor,
// antivirus, backup) has the file open, so retry briefly and then write in place.
// A failed save is logged but never stops the server: the data stays in memory
// and is written with the next save.
function save(kind){
  const file = path.join(DATA_DIR, kind + '.json');
  const text = JSON.stringify(db[kind], null, 1);
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file + '.tmp', text);
    for(let attempt = 1; ; attempt++){
      try { fs.renameSync(file + '.tmp', file); return; }
      catch(err){
        if(!['EPERM', 'EBUSY', 'EACCES'].includes(err.code)) throw err;
        if(attempt >= 5){ fs.writeFileSync(file, text); fs.rmSync(file + '.tmp', { force: true }); return; }
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 40 * attempt);   // short pause, then retry
      }
    }
  } catch(err){
    console.error(`[save] could not write ${kind}.json:`, err.message);
  }
}
const newId = () => crypto.randomBytes(6).toString('hex');
const clean = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* =========================================================
   Website content edited in the dashboard
   ---------------------------------------------------------
   server/data/content.json holds the edits; js/content.js is
   rewritten on every save so the pages pick them up (it calls
   applyContent() from js/data.js).
   ========================================================= */
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const CONTENT_JS = path.join(ROOT, 'js', 'content.js');
const UPLOAD_DIR = path.join(ROOT, 'images', 'uploads');
let content = {};
try { content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8')); } catch {}
let contentVersion = 1;

// Text shown on the site: no HTML, trimmed, limited length
const txt = (v, max = 160) => clean(String(v ?? ''), max).replace(/[<>"`]/g, '');
const num = (v, min, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= min && n <= max ? n : undefined; };
const img = v => (typeof v === 'string' && /^images\/[\w\-./]+\.(jpe?g|png|webp)$/i.test(v) && !v.includes('..')) ? v : undefined;
const slug = v => txt(v, 60).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dateStr = v => (typeof v === 'string' && !isNaN(new Date(v))) ? v.slice(0, 25) : '';
const drop = o => { Object.keys(o).forEach(k => o[k] === undefined && delete o[k]); return o; };
const COUNTRIES = ['kenya', 'tanzania', 'uganda', 'rwanda', 'multi'];
const STYLES = ['wildlife', 'gorilla', 'beach', 'trek', 'camping', 'family', 'luxury'];

function tripFields(t){
  return drop({
    title: t.title !== undefined ? txt(t.title, 120) || undefined : undefined,
    route: t.route !== undefined ? txt(t.route, 200) : undefined,
    countries: t.countries !== undefined ? txt(t.countries, 80) : undefined,
    country: COUNTRIES.includes(t.country) ? t.country : undefined,
    styles: Array.isArray(t.styles) ? t.styles.filter(x => STYLES.includes(x)) : undefined,
    stay: t.stay !== undefined ? txt(t.stay, 60) : undefined,
    days: num(t.days, 1, 60), group: num(t.group, 1, 40),
    price: num(t.price, 1, 200000),
    was: t.was === null || t.was === '' || t.was === 0 ? 0 : num(t.was, 1, 200000),
    img: img(t.img), alt: t.alt !== undefined ? txt(t.alt, 160) : undefined,
    badge: t.badge !== undefined ? txt(t.badge, 30) : undefined,
    featured: typeof t.featured === 'boolean' ? t.featured : undefined,
    hidden: typeof t.hidden === 'boolean' ? t.hidden : undefined
  });
}
function cleanContent(c){
  const out = {};
  const base = evalData(false);
  const baseIds = new Set(base.TRIPS.map(t => t.id));
  out.trips = {};
  Object.entries(c.trips && typeof c.trips === 'object' ? c.trips : {}).slice(0, 500).forEach(([id, t]) => {
    if(baseIds.has(id) && t && typeof t === 'object'){ const f = tripFields(t); if(Object.keys(f).length) out.trips[id] = f; }
  });
  out.added = (Array.isArray(c.added) ? c.added : []).slice(0, 200).map(t => {
    const f = tripFields(t || {}), id = slug(t && t.id) || slug(f.title);
    return id && f.title && f.price && f.days && !baseIds.has(id) ? Object.assign({ id, months: [] }, f) : null;
  }).filter(Boolean).filter((t, i, a) => a.findIndex(x => x.id === t.id) === i);
  out.flash = (Array.isArray(c.flash) ? c.flash : []).slice(0, 100).map(f => f && ({
    trip: txt(f.trip, 60), pct: num(f.pct, 1, 89), ends: dateStr(f.ends), starts: dateStr(f.starts), label: txt(f.label, 24) || 'Flash sale'
  })).filter(f => f && f.trip && f.pct);
  if(Array.isArray(c.lastMinute)) out.lastMinute = c.lastMinute.slice(0, 60).map(t => {
    const id = slug(t.id) || 'lm-' + slug(t.title);
    return drop({ id: id.startsWith('lm-') ? id : 'lm-' + id, title: txt(t.title, 120), countries: txt(t.countries, 60), days: num(t.days, 1, 60),
      extra: txt(t.extra, 30), extraIcon: /^fa-[\w-]+$/.test(t.extraIcon || '') ? t.extraIcon : 'fa-star',
      departs: txt(t.departs, 20), spaces: num(t.spaces, 0, 60), price: num(t.price, 1, 200000), was: num(t.was, 1, 200000),
      img: img(t.img) || 'images/lion-walking.jpg', alt: txt(t.alt, 160) });
  }).filter(t => t.title && t.price && t.days && !isNaN(new Date(t.departs + ' 12:00 UTC')));
  if(Array.isArray(c.flights)) out.flights = c.flights.slice(0, 200).map(f => {
    const code = v => /^[A-Z]{3}$/.test(v) ? v : '';
    return drop({ from: code(f.from), to: code(f.to), time: /^\d{1,2}h( \d{1,2}m)?$/.test(f.time) ? f.time : '', stops: num(f.stops, 0, 3) || 0,
      region: f.region === 'europe' ? 'europe' : 'regional', fare: f.fare ? num(f.fare, 20, 20000) : undefined });
  }).filter(f => f.from && f.to && f.time && f.from !== f.to);
  return out;
}
function saveContent(c){
  content = c;
  contentVersion++;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 1));
  fs.writeFileSync(CONTENT_JS, '/* Written by the server when the admin saves website content (server/data/content.json). */\n' +
    'if(typeof applyContent === "function") applyContent(' + JSON.stringify(content).replace(/</g, '\\u003c') + ');\n');
}

// Travellers already booked on each departure of a trip (private trips don't share seats)
function bookedSeats(tripId){
  const out = {};
  db.bookings.filter(b => b.trip === tripId && b.status !== 'cancelled' && !b.private)
    .forEach(b => { out[b.date] = (out[b.date] || 0) + b.adults + b.children; });
  return out;
}

/* ---------- GET /api/availability?trip=ID ---------- */
function handleAvailability(req, res){
  const id = new URL(req.url, 'http://x').searchParams.get('trip');
  const found = loadData().BookingRules.find(id);
  if(!found) return sendJSON(res, 404, { error: 'Unknown trip' });
  sendJSON(res, 200, { trip: id, capacity: found.capacity, booked: bookedSeats(id) });
}

/* ---------- POST /api/bookings ---------- */
async function handleBooking(req, res){
  const ip = req.socket.remoteAddress || 'unknown';
  if(rateLimited(ip)) return sendJSON(res, 429, { error: 'Too many requests. Please wait a minute.' });
  let b;
  try { b = JSON.parse(await readBody(req)); } catch { return sendJSON(res, 400, { error: 'Bad request' }); }

  const { BookingRules, BOOKING } = loadData();
  const found = BookingRules.find(clean(b.trip, 60));
  if(!found) return sendJSON(res, 400, { error: 'Please choose a trip.' });
  const isPrivate = found.kind === 'private' || (found.kind === 'group' && b.private === true);
  const date = clean(b.date, 10);
  if(!BookingRules.isDeparture(found.trip.id, date, isPrivate)) return sendJSON(res, 400, { error: 'That date is no longer available. Please pick another.' });

  const adults = Math.floor(Number(b.adults)), children = Math.floor(Number(b.children) || 0);
  if(!(adults >= 1 && adults <= 20 && children >= 0 && children <= 20)) return sendJSON(res, 400, { error: 'Please check the number of travellers.' });
  const party = adults + children;
  if(!isPrivate){
    const left = found.capacity - (bookedSeats(found.trip.id)[date] || 0);
    if(party > left) return sendJSON(res, 409, { error: left > 0 ? `Only ${left} seats are left on that date.` : 'That departure has just sold out. Please pick another date.', seatsLeft: Math.max(0, left) });
  } else if(party > 12) return sendJSON(res, 400, { error: 'For groups over 12, please request a quote.' });

  const name = clean(b.name, 120), email = clean(b.email, 160);
  if(!name || !emailOk(email)) return sendJSON(res, 400, { error: 'Please enter your name and a valid email address.' });

  let ref;
  do { ref = 'SN-' + crypto.randomBytes(3).toString('hex').toUpperCase(); } while(db.bookings.some(x => x.ref === ref));
  const booking = {
    id: newId(), ref, created: new Date().toISOString(), status: 'pending',
    trip: found.trip.id, tripTitle: found.trip.title, days: found.trip.days,
    date, endDate: BookingRules.addDays(date, found.trip.days - 1), private: isPrivate,
    adults, children, total: BookingRules.price(found.trip.id, adults, children), deposit: BOOKING.deposit * party,
    balanceDue: BookingRules.addDays(date, -BOOKING.balanceDays),
    name, email, phone: clean(b.phone, 40), country: clean(b.country, 80),
    notes: clean(b.notes, 2000), lang: LANGUAGES[b.lang] ? b.lang : 'en', currency: clean(b.currency, 4), note: ''
  };
  db.bookings.push(booking);
  save('bookings');
  console.log(`[booking] ${ref} ${booking.tripTitle} on ${date} for ${party} (${email})`);
  const { note, ...forVisitor } = booking;
  sendJSON(res, 201, { ref, booking: forVisitor });
}

/* ---------- POST /api/enquiries (quote, flight, newsletter, brochure…) ---------- */
async function handleEnquiry(req, res){
  const ip = req.socket.remoteAddress || 'unknown';
  if(rateLimited(ip)) return sendJSON(res, 429, { error: 'Too many requests. Please wait a minute.' });
  let b;
  try { b = JSON.parse(await readBody(req)); } catch { return sendJSON(res, 400, { error: 'Bad request' }); }
  const fields = {};
  Object.entries(b.fields && typeof b.fields === 'object' ? b.fields : {}).slice(0, 30)
    .forEach(([k, v]) => { const key = clean(k, 60), val = clean(String(v ?? ''), 3000); if(key && val) fields[key] = val; });
  const email = Object.entries(fields).find(([k]) => /e-?mail/i.test(k))?.[1] || '';
  if(!emailOk(email)) return sendJSON(res, 400, { error: 'Please enter a valid email address.' });
  const enquiry = { id: newId(), created: new Date().toISOString(), status: 'new', type: clean(b.type, 40) || 'Enquiry', page: clean(b.page, 120), fields, note: '' };
  db.enquiries.push(enquiry);
  save('enquiries');
  console.log(`[enquiry] ${enquiry.type} from ${email}`);
  sendJSON(res, 201, { ok: true });
}

/* =========================================================
   Admin: sign in, read everything, update status and notes
   ========================================================= */
// The admin password: ADMIN_PASSWORD if set, otherwise server/data/admin-password.txt.
// The file is read on every sign-in, so editing it takes effect straight away (no restart).
const PASSWORD_FILE = path.join(DATA_DIR, 'admin-password.txt');
function adminPassword(){
  if(process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD.trim();
  try { return fs.readFileSync(PASSWORD_FILE, 'utf8').trim(); }
  catch {
    // Easy to read and type: no look-alike characters (I l 1 O 0), e.g. "k7mp-x4tr-9qwe"
    const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
    const pw = [0, 1, 2].map(() => [...crypto.randomBytes(4)].map(b => abc[b % abc.length]).join('')).join('-');
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PASSWORD_FILE, pw);
    return pw;
  }
}
const sessions = new Map();                     // token → expiry time
const SESSION_MS = 12 * 3600_000;
const loginHits = new Map();
const tokenOf = req => (req.headers.authorization || '').replace(/^Bearer\s+/i, '');

function isAdmin(req){
  const exp = sessions.get(tokenOf(req));
  if(!exp || exp < Date.now()){ sessions.delete(tokenOf(req)); return false; }
  return true;
}

async function handleAdmin(req, res){
  const route = new URL(req.url, 'http://x').pathname.replace('/api/admin/', '');

  if(route === 'login' && req.method === 'POST'){
    const ip = req.socket.remoteAddress || 'unknown';
    const recent = (loginHits.get(ip) || []).filter(t => Date.now() - t < 60_000);
    recent.push(Date.now()); loginHits.set(ip, recent);
    if(recent.length > 5) return sendJSON(res, 429, { error: 'Too many attempts. Please wait a minute.' });
    let pw = '';
    try { pw = String(JSON.parse(await readBody(req, 2000)).password || '').trim(); } catch {}   // ignore stray spaces from copy-paste
    const hash = v => crypto.createHash('sha256').update(v).digest();
    if(!crypto.timingSafeEqual(hash(pw), hash(adminPassword()))) return sendJSON(res, 401, { error: 'Wrong password.' });
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_MS);
    return sendJSON(res, 200, { token });
  }

  if(!isAdmin(req)) return sendJSON(res, 401, { error: 'Please sign in.' });

  if(route === 'logout' && req.method === 'POST'){
    sessions.delete(tokenOf(req));
    return sendJSON(res, 200, { ok: true });
  }
  if(route === 'data' && req.method === 'GET'){
    const { TRIPS, LAST_MINUTE } = loadData();
    const trips = [...TRIPS, ...LAST_MINUTE].map(t => ({ id: t.id, title: t.title, days: t.days, capacity: t.group || t.spaces, private: t.group <= 2 }));
    return sendJSON(res, 200, { bookings: db.bookings, enquiries: db.enquiries, questions: db.questions.slice(-1500), trips, now: new Date().toISOString() });
  }
  if(route === 'update' && req.method === 'POST'){
    let b;
    try { b = JSON.parse(await readBody(req, 10_000)); } catch { return sendJSON(res, 400, { error: 'Bad request' }); }
    const STATUSES = { bookings: ['pending', 'confirmed', 'completed', 'cancelled'], enquiries: ['new', 'replied', 'closed'], questions: ['new', 'reviewed'] };
    if(!STATUSES[b.kind]) return sendJSON(res, 400, { error: 'Unknown list' });
    const item = db[b.kind].find(x => x.id === b.id);
    if(!item) return sendJSON(res, 404, { error: 'Not found' });
    if(b.status !== undefined){
      if(!STATUSES[b.kind].includes(b.status)) return sendJSON(res, 400, { error: 'Unknown status' });
      // Re-opening a cancelled booking must still fit in the departure
      if(b.kind === 'bookings' && item.status === 'cancelled' && b.status !== 'cancelled' && !item.private){
        const cap = loadData().BookingRules.find(item.trip)?.capacity || 0;
        if((bookedSeats(item.trip)[item.date] || 0) + item.adults + item.children > cap) return sendJSON(res, 409, { error: 'Not enough seats left on that departure to restore this booking.' });
      }
      item.status = b.status;
    }
    if(typeof b.note === 'string') item.note = b.note.slice(0, 4000);
    item.updated = new Date().toISOString();
    save(b.kind);
    return sendJSON(res, 200, { item });
  }
  if(route === 'content' && req.method === 'GET'){
    const base = evalData(false);
    let images = [];
    try { images = fs.readdirSync(path.join(ROOT, 'images')).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).map(f => 'images/' + f); } catch {}
    try { images = images.concat(fs.readdirSync(UPLOAD_DIR).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).map(f => 'images/uploads/' + f)); } catch {}
    return sendJSON(res, 200, { content, base: { trips: base.TRIPS, lastMinute: base.LAST_MINUTE, flights: base.FLIGHTS, airports: base.AIRPORTS }, images });
  }
  if(route === 'content' && req.method === 'POST'){
    let b;
    try { b = JSON.parse(await readBody(req, 2_000_000)); } catch { return sendJSON(res, 400, { error: 'Bad request' }); }
    const next = cleanContent(b.content && typeof b.content === 'object' ? b.content : {});
    saveContent(next);
    console.log('[content] website content updated');
    return sendJSON(res, 200, { content: next });
  }
  if(route === 'upload' && req.method === 'POST'){
    let b;
    try { b = JSON.parse(await readBody(req, 12_000_000)); } catch { return sendJSON(res, 400, { error: 'Image too large (max 8 MB).' }); }
    const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.data || ''));
    if(!m) return sendJSON(res, 400, { error: 'Please upload a JPG, PNG or WebP image.' });
    const buf = Buffer.from(m[2], 'base64');
    const sig = { jpeg: [0xFF, 0xD8], png: [0x89, 0x50], webp: [0x52, 0x49] }[m[1]];
    if(buf[0] !== sig[0] || buf[1] !== sig[1]) return sendJSON(res, 400, { error: 'That file is not a valid image.' });
    const name = (slug(String(b.name || '').replace(/\.\w+$/, '')) || 'photo').slice(0, 40) + '-' + crypto.randomBytes(3).toString('hex') + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1]);
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
    return sendJSON(res, 201, { path: 'images/uploads/' + name });
  }
  sendJSON(res, 404, { error: 'Not found' });
}

/* ---------- Static files ---------- */
const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.webp':'image/webp', '.ico':'image/x-icon', '.md':'text/plain; charset=utf-8',
  '.mp4':'video/mp4', '.webm':'video/webm' };

function serveStatic(req, res){
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split(/[?#]/)[0]).replace(/\/{2,}/g, '/'); }
  catch { res.writeHead(400); return res.end('Bad request'); }       // malformed %-encoding
  if(urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.normalize(path.join(ROOT, urlPath));
  // never serve outside the site folder, or the server code / packages
  if(!file.startsWith(ROOT + path.sep) || /[\\/](server|node_modules)[\\/]/.test(file.slice(ROOT.length)) || /package(-lock)?\.json$/.test(file)){
    res.writeHead(404); return res.end('Not found');
  }
  // Videos are streamed in pieces (Range requests), which Safari and iPhones need to play them
  if(/\.(mp4|webm)$/i.test(file)){
    return fs.stat(file, (err, st) => {
      if(err || !st.isFile()){ res.writeHead(404, { 'Content-Type':'text/plain' }); return res.end('Not found'); }
      const type = TYPES[path.extname(file).toLowerCase()];
      const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if(!m){
        res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=86400' });
        return req.method === 'HEAD' ? res.end() : fs.createReadStream(file).pipe(res);
      }
      let start = m[1] === '' ? st.size - Number(m[2]) : Number(m[1]);
      let end = m[1] !== '' && m[2] !== '' ? Number(m[2]) : st.size - 1;
      if(!(start >= 0 && start <= end && end < st.size)){ res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { 'Content-Type': type, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=86400' });
      if(req.method === 'HEAD') return res.end();
      fs.createReadStream(file, { start, end }).pipe(res);
    });
  }
  fs.readFile(file, (err, data) => {
    if(err){ res.writeHead(404, { 'Content-Type':'text/plain' }); return res.end('Not found'); }
    const headers = { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' };
    if(/\.(html|js|css)$/.test(file)) headers['Cache-Control'] = 'no-cache';   // edits show on the next page load
    res.writeHead(200, headers);
    res.end(data);
  });
}

function sendJSON(res, status, obj){
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

// Any error inside one request is logged and answered with a 500; it never stops the server
async function route(req, res){
  const path = req.url.split('?')[0];
  const post = handler => req.method === 'POST' ? handler(req, res) : sendJSON(res, 405, { error: 'Use POST' });
  if(path === '/api/availability') return handleAvailability(req, res);
  if(path === '/api/bookings') return post(handleBooking);
  if(path === '/api/enquiries') return post(handleEnquiry);
  if(path.startsWith('/api/admin/')) return handleAdmin(req, res);
  if(path.startsWith('/api/chat')) return post(handleChat);
  if(path.startsWith('/api/translate')) return post(handleTranslate);
  if(req.method !== 'GET' && req.method !== 'HEAD') return sendJSON(res, 405, { error: 'Method not allowed' });
  serveStatic(req, res);
}

http.createServer((req, res) => {
  Promise.resolve().then(() => route(req, res)).catch(err => {
    console.error('[server]', req.method, req.url, err);
    if(!res.headersSent) sendJSON(res, 500, { error: 'Server error' });
    else res.end();
  });
}).listen(PORT, () => {
  console.log(`SafariNomad running at http://localhost:${PORT}`);
  console.log(`Admin dashboard:  http://localhost:${PORT}/admin.html`);
  if(!process.env.ADMIN_PASSWORD) console.log(`Admin password:   ${adminPassword()}   (edit server/data/admin-password.txt, or set ADMIN_PASSWORD, to change it)`);
  if(!process.env.ANTHROPIC_API_KEY) console.log('Note: ANTHROPIC_API_KEY is not set, so the AI assistant will use its offline answers.');
});
