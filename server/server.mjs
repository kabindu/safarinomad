/* =========================================================
   SafariNomad: website server + AI safari assistant
   ---------------------------------------------------------
   Serves the site and adds these endpoints:

     POST /api/chat          AI assistant (streams Server-Sent Events)
     POST /api/translate     fills gaps in the lang/*.js files
     GET  /api/availability  seats already booked on each departure
     POST /api/bookings      a booking request from book.html
     POST /api/enquiries     quote, flight and newsletter forms
     POST /api/leads         progress saved from the booking / customise forms (follow-ups)
     POST /api/track         anonymous visit counts for the admin Insights page (daily totals only)
     GET  /api/flight-status live flight status, airport boards, routes (server/flights.mjs)
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
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI, ApiError as GeminiApiError } from '@google/genai';
import { flightStatusConfigured, flightByNumber, airportBoard, routeSearch, FlightApiError } from './flights.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3000;
const MODEL = 'claude-opus-5-5';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

// Google Gemini (free tier in Google AI Studio). Used when GEMINI_API_KEY is set and no Anthropic key is.
// GEMINI_MODEL picks the model; gemini-3.8-flash is the best model on Google's free tier (Nov 2026).
// Note: on the free tier Google may use conversations to improve its products.
// Measured 5 Nov 2026: gemini-3.6-flash with minimal thinking showed first words in ~3 s; gemini-3.8-flash
// was often "high demand" (503 after 9-15 s), so it is the backup rather than the first choice.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
// MINIMAL thinking answers fastest and was still detailed; set GEMINI_THINKING=LOW/MEDIUM/HIGH for deeper (slower) answers
const GEMINI_THINKING = (process.env.GEMINI_THINKING || 'MINIMAL').toUpperCase();
const GEMINI_FIRST_WORDS_MS = 8000;   // a model that hasn't started answering by then is skipped
// When a model is busy (503) or over its free limit (429), try the next free model
const GEMINI_MODELS = [...new Set([GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-3.5-flash-lite'])];
const geminiBusy = err => err instanceof GeminiApiError && (err.status === 503 || err.status === 429);
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
// Which AI answers chat: AI_PROVIDER=claude|gemini forces one; otherwise Claude if its key is set, then Gemini
function chatProvider(){
  const want = (process.env.AI_PROVIDER || '').toLowerCase();
  if(want === 'gemini') return gemini ? 'gemini' : null;
  if(want === 'claude') return process.env.ANTHROPIC_API_KEY ? 'claude' : null;
  return process.env.ANTHROPIC_API_KEY ? 'claude' : gemini ? 'gemini' : null;
}
const LANGUAGES = { en: 'English', fr: 'French', es: 'Spanish', de: 'German' };

/* ---------- Brief the assistant from js/data.js ---------- */
const DATA_FILE = path.join(ROOT, 'js', 'data.js');
let briefing = { mtime: 0, text: '', plain: '' };

// The site data with the admin's edits applied (flash sales start and end on their own,
// so the result is rebuilt at least once a minute)
let dataCache = { key: '', value: null };
function evalData(withContent){
  const code = fs.readFileSync(DATA_FILE, 'utf8');
  return new vm.Script(code + '\n;' + (withContent ? 'applyContent(__C);' : '') +
    '({ SITE, TRIPS, LAST_MINUTE, FLIGHTS, AIRPORTS, PLACES, PARTNERS, KNOWLEDGE, BOOKING, BookingRules })').runInNewContext({ __C: JSON.parse(JSON.stringify(content)) });
}
function dataKey(){ return fs.statSync(DATA_FILE).mtimeMs + '|' + contentVersion + '|' + Math.floor(Date.now() / 60_000); }
function loadData(){
  const key = dataKey();
  if(key !== dataCache.key) dataCache = { key, value: evalData(true) };
  return dataCache.value;
}

function buildSystemPrompt(search = true){
  const { SITE, TRIPS, LAST_MINUTE, FLIGHTS, AIRPORTS, PLACES, PARTNERS, KNOWLEDGE, BOOKING } = loadData();
  const trips = TRIPS.map(t =>
    `- ${t.title} | id: ${t.id} | ${t.countries} | ${t.days} days | from $${t.price}${t.was ? ` (was $${t.was})` : ''} | ` +
    `styles: ${t.styles.join(', ')} | best months: ${(t.months || []).join(',') || 'any'} | route: ${t.route || '-'} | ` +
    `stays: ${t.stay} | group: ${t.group <= 2 ? 'private' : 'max ' + t.group}${t.reviews ? ` | rating ${t.rating} (${t.reviews} reviews)` : ''}`
  ).join('\n');
  const lastMinute = LAST_MINUTE.length ? LAST_MINUTE.map(t =>
    `- ${t.title} | id: ${t.id} | ${t.countries} | ${t.days} days | departs ${t.departs} | ${t.spaces} spaces left | $${t.price} (was $${t.was})`
  ).join('\n') : '(none at the moment)';
  const places = PLACES.map(p => `${p.name} (${p.country})`).join(', ');
  const routes = FLIGHTS.map(f => `${AIRPORTS[f.from] || f.from} (${f.from}) - ${AIRPORTS[f.to] || f.to} (${f.to}): about ${f.time}, ${f.stops ? '1 stop' : 'direct'}`).join('\n');
  const partners = PARTNERS ? [...PARTNERS.licences, ...PARTNERS.travel].map(x => `${x.name} (${x.sub})`).join('; ') : '';
  const facts = KNOWLEDGE.map(k => `Q: ${k.q}\nA: ${k.a}`).join('\n\n');

  return `You are Nomad, the AI travel expert on the SafariNomad website. SafariNomad is a Nairobi-based, licensed tour operator. It sells safari packages in Kenya, Tanzania (including Zanzibar), Uganda and Rwanda, plus beach, mountain, adventure and selected international holidays, and it helps travellers with flights, visas, places to stay and safari vehicles.

WHAT YOU DO
Answer any travel and tourism question a visitor asks, about anywhere in the world, as thoroughly and accurately as an experienced travel consultant: destinations and when to go, itineraries, wildlife and national parks, visas and entry rules, flights and airlines, budgets and costs, health and vaccinations, safety, packing, culture and etiquette, money and payments, accessibility, travelling with children or older relatives, honeymoons, events and festivals. You also help visitors choose and book SafariNomad's packages.

HOW TO ANSWER
- Match the depth to the question. A quick question gets a direct answer in a few sentences. A planning question (for example "plan 10 days in Kenya and Zanzibar for a family of four") gets a complete answer: a day-by-day plan, where to stay, travel times between stops, a realistic budget, the best season and practical tips.
- Lead with the answer, then the detail. For longer answers use short "## " headings or bold labels, numbered lists for days and steps, bullet lists for options, and bold for key facts. No tables and no code.
- Be concrete: real place names, drive and flight times, months and seasons, typical price ranges with the currency. Say "about" for estimates.
- Write warmly and plainly, for every age, including people who rarely use travel websites. Explain any jargon.
- Reply in the visitor's language.

CURRENT AND CHANGING INFORMATION
${search ? `- Use web search for anything that changes over time or that you are not certain of: visa and entry rules, fees, travel advisories, health requirements, airline routes and schedules, festival and event dates, opening times, and prices outside SafariNomad.
- Prefer official and primary sources: government immigration and embassy websites, ministries of health, WHO and CDC, national park and wildlife authorities, airline websites. Link the sources you relied on.
- If you cannot confirm something, say so plainly and point to the official source. Never invent facts, rules, fees or dates.` : `- You cannot browse the web in this chat. Answer from your knowledge, and for anything that changes over time (visa and entry rules, fees, travel advisories, health requirements, airline routes and schedules, event dates, prices outside SafariNomad) say that it may have changed and link the official source to check: government immigration or embassy websites, ministries of health, WHO or CDC, national park authorities, airline websites.
- Never invent facts, rules, fees or dates. If you are not sure, say so.`}

SAFARINOMAD'S OWN OFFER (quote only what is listed; never invent)
- Recommend SafariNomad packages whenever they fit what the visitor wants. Link each one as [Package title](book.html?trip=TRIP_ID), up to three at a time, and say why each fits. Quote prices, durations, routes and details exactly as listed below. Prices are per person in US dollars (visitors can switch the site to euros). Never invent packages, prices, discounts, dates or availability; the booking page shows live departure dates.
- If nothing listed fits, suggest they [customise their own package](plan.html) with a live price estimate, or ask for a [free quote](contact.html).
- Flights: SafariNomad's [flight search](flights.html) opens live fares on Google Flights, Skyscanner and Kayak and links to the official airline websites, or the team can book the flights for them.
- Visas: give the general rules, link the official site, and point to the [visa guide](flights.html#visas). When they book, they can ask SafariNomad for help with their eTA or eVisa.
- Booking: on a package's booking page the visitor picks a start date and travellers, adds their details plus visa and flight needs, and sends the request. No payment is taken then; a planner confirms within 24 hours. Deposit and balance rules are below. You cannot make bookings, take payments or see live availability yourself.
- People: WhatsApp +${SITE.whatsapp}, phone ${SITE.phone}, email ${SITE.email}, ${SITE.hoursText}.
- Pages you can link: [all packages](trips.html), [flash deals](services.html#flash-deals), [destinations](destinations.html), [flights](flights.html), [vehicles, stays and guides](services.html), [FAQs](about.html#faqs), [free quote](contact.html), [customise your trip](plan.html).

STAYING SAFE AND HONEST
- For medical, legal or immigration decisions, give general guidance and recommend the relevant professional or official office.
- Decline anything illegal or harmful, and anything unrelated to travel that you are asked to do at length; offer travel help instead.

Current offer: ${SITE.promo.text}.

PACKAGES
${trips}

LAST-MINUTE DEPARTURES
${lastMinute}

PLACES WE GO
${places}

POPULAR FLIGHT ROUTES (typical times)
${routes}

LICENCES AND PARTNERS
${partners}

BOOKING RULES
Deposit $${BOOKING.deposit} per person (never more than the trip price), balance due ${BOOKING.balanceDays} days before departure, earliest start ${BOOKING.noticeDays} days from today, children 5 to 15 pay ${Math.round(BOOKING.childRate * 100)}% on family trips.

FACTS AND POLICIES
${facts}`;
}

function getSystemPrompt(search = true){
  const key = dataKey();
  if(key !== briefing.mtime) briefing = { mtime: key, text: buildSystemPrompt(true), plain: buildSystemPrompt(false) };
  return search ? briefing.text : briefing.plain;
}

/* ---------- Simple per-visitor rate limit ---------- */
const hits = new Map();
// The rate limiters remember recent requests per visitor; every 5 minutes, forget anyone quiet for 2 minutes
const LIMITERS = [];
setInterval(() => {
  const cutoff = Date.now() - 120_000;
  LIMITERS.forEach(m => { for(const [k, times] of m){ if(!times.length || times[times.length - 1] < cutoff) m.delete(k); } });
}, 300_000).unref();
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
    .map(m => ({ role: m.role, content: m.content.slice(0, m.role === 'assistant' ? 8000 : 4000) }));
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
    body = JSON.parse(await readBody(req, 200_000));
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
  saveSoon('questions');

  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
  const send = obj => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  // No API key: the browser shows its offline answer (the question is still recorded)
  const provider = chatProvider();
  if(!provider){
    question.offline = true;
    saveSoon('questions');
    send({ error: 'The AI assistant is not configured yet (no API key).', fallback: true });
    return res.end();
  }
  const today = new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
  const visitorNote = `Today is ${today} (Nairobi time). The visitor is browsing the site in ${LANGUAGES[lang]}. Reply in ${LANGUAGES[lang]}. Keep package links exactly as given.`;

  // ---- Google Gemini ----
  if(provider === 'gemini'){
    let closed = false;
    req.on('close', () => { closed = true; });
    const request = {
      contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      config: { systemInstruction: getSystemPrompt(false) + '\n\n' + visitorNote, maxOutputTokens: 8192, thinkingConfig: { thinkingLevel: GEMINI_THINKING } }
    };
    try {
      for(let i = 0; i < GEMINI_MODELS.length && !closed; i++){
        // Each model gets GEMINI_FIRST_WORDS_MS to start answering; busy or slow → quietly try the next one
        const attempt = new AbortController();
        const stop = () => attempt.abort();
        req.on('close', stop);
        let slow = false;
        const timer = setTimeout(() => { slow = true; attempt.abort(); }, GEMINI_FIRST_WORDS_MS);
        try {
          const stream = await gemini.models.generateContentStream({ model: GEMINI_MODELS[i], ...request, config: { ...request.config, abortSignal: attempt.signal } });
          for await (const chunk of stream){
            const t = chunk.text;
            if(t){ clearTimeout(timer); send({ t }); question.answer += t; }
          }
          clearTimeout(timer);
          break;
        } catch(err){
          clearTimeout(timer);
          if(closed) throw err;
          const canRetry = !question.answer && i < GEMINI_MODELS.length - 1;
          if((slow || geminiBusy(err)) && canRetry){ console.log(`[chat:gemini] ${GEMINI_MODELS[i]} ${slow ? 'too slow' : `busy (${err.status})`}, trying ${GEMINI_MODELS[i + 1]}`); continue; }
          throw slow ? new Error('No model answered in time') : err;
        } finally {
          req.off('close', stop);
        }
      }
      send({ done: true });
    } catch(err){
      let message = 'The assistant is unavailable right now.';
      if(err instanceof GeminiApiError){
        if(err.status === 429) message = 'The assistant has reached its free limit for now. Please try again later.';
        else if(err.status === 400 || err.status === 401 || err.status === 403) message = 'The AI assistant is not configured yet (missing or invalid Gemini API key).';
        else message = `The assistant hit an error (${err.status}).`;
      }
      if(!closed) console.error('[chat:gemini]', err.message);
      question.offline = true;
      send({ error: message, fallback: true });
    }
    saveSoon('questions');
    return res.end();
  }

  // ---- Anthropic Claude ----

  try {
    const params = {
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'medium' },               // thoughtful answers; short questions still get short replies
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',                             // if a reply is declined, Anthropic retries on a suitable model
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }],   // live facts: visas, advisories, events, airlines
      system: [
        { type: 'text', text: getSystemPrompt(), cache_control: { type: 'ephemeral' } },
        { type: 'text', text: visitorNote }
      ],
      messages
    };
    let final, aborted = false;
    req.on('close', () => { aborted = true; });
    // A long web search can pause the turn; re-send it (with the partial answer) to let it finish
    for(let round = 0; round < 3 && !aborted; round++){
      const stream = client.beta.messages.stream(params);
      req.on('close', () => stream.abort());
      for await (const event of stream){
        if(event.type === 'content_block_start' && event.content_block.type === 'server_tool_use') send({ status: 'searching' });
        if(event.type === 'content_block_delta' && event.delta.type === 'text_delta'){ send({ t: event.delta.text }); question.answer += event.delta.text; }
      }
      final = await stream.finalMessage();
      if(final.stop_reason !== 'pause_turn') break;
      params.messages = [...messages, { role: 'assistant', content: final.content }];
    }
    if(final && final.stop_reason === 'refusal'){
      send({ t: "\n\nSorry, I can't help with that one. Our travel experts can, though: [request a free quote](contact.html)." });
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
  saveSoon('questions');
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

  const provider = chatProvider();
  if(todo.length && provider){
    const system = `You translate website text for SafariNomad, an East African safari company, from English into ${LANGUAGES[lang]}.
- Write natural, warm, concise ${LANGUAGES[lang]} that reads as if written by a native speaker for a travel website.
- Keep placeholders exactly as they are: {n}, {name}, {max} and any other {word}.
- Keep Markdown, links and URLs unchanged, e.g. [text](contact.html) keeps contact.html (translate only the link text).
- Keep proper nouns as they are usually written in ${LANGUAGES[lang]}: park, place and brand names (SafariNomad, Maasai Mara, Serengeti...).
- Keep the same punctuation style, capitalisation pattern and leading or trailing symbols.
- Return every source string exactly as given, paired with its translation.`;
    try {
      let translations = [];
      if(provider === 'gemini'){
        let response;
        for(const model of GEMINI_MODELS){
          try { response = await gemini.models.generateContent({ model, contents: JSON.stringify(todo),
            config: { systemInstruction: system, responseMimeType: 'application/json', responseJsonSchema: TRANSLATION_SCHEMA, thinkingConfig: { thinkingLevel: 'MINIMAL' } } }); break; }
          catch(err){ if(!geminiBusy(err) || model === GEMINI_MODELS[GEMINI_MODELS.length - 1]) throw err; }
        }
        translations = JSON.parse(response.text || '{}').translations || [];
      } else {
        const response = await client.messages.create({
          model: MODEL,
          max_tokens: 16000,
          output_config: { effort: 'low', format: { type: 'json_schema', schema: TRANSLATION_SCHEMA } },
          system,
          messages: [{ role: 'user', content: JSON.stringify(todo) }]
        });
        if(response.stop_reason !== 'refusal') translations = JSON.parse(response.content.find(b => b.type === 'text')?.text || '{}').translations || [];
      }
      // only accept translations of strings we asked for, with placeholders intact
      const keep = s => (s.match(/\{\w+\}|\]\([^)]*\)/g) || []).sort().join('|');
      translations.forEach(({ source, translation }) => {
        if(todo.includes(source) && translation && keep(source) === keep(translation)){
          cache[source] = translation;
          out[source] = translation;
        }
      });
      fs.mkdirSync(TRANSLATION_DIR, { recursive: true });
      fs.writeFileSync(path.join(TRANSLATION_DIR, lang + '.json'), JSON.stringify(cache, null, 1));
    } catch(err){
      if(!(err instanceof Anthropic.AuthenticationError) && !(err instanceof GeminiApiError && [400, 401, 403].includes(err.status))) console.error('[translate]', err.message);
      if(!Object.keys(out).length) return sendJSON(res, 503, { error: 'Translation unavailable' });
    }
  }
  sendJSON(res, 200, { translations: out });
}

/* =========================================================
   Saved data: bookings, enquiries and assistant questions
   ========================================================= */
const DATA_DIR = path.join(ROOT, 'server', 'data');
const KINDS = ['bookings', 'enquiries', 'questions', 'leads'];   // leads = unfinished bookings / custom trips to follow up
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
// Bookings and enquiries are written at once; frequent, low-stakes data is batched (a few seconds at most)
const saveTimers = {};
function saveSoon(kind, ms = 3000){
  if(!saveTimers[kind]) saveTimers[kind] = setTimeout(() => { saveTimers[kind] = 0; save(kind); }, ms);
}
// Write anything still pending when the server stops
['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => { Object.keys(saveTimers).forEach(k => { if(saveTimers[k]){ clearTimeout(saveTimers[k]); save(k); } }); if(analyticsTimer) save('analytics'); process.exit(0); }));
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
    adults, children, total: BookingRules.price(found.trip.id, adults, children), deposit: BookingRules.deposit(found.trip.id, adults, children),
    balanceDue: BookingRules.addDays(date, -BOOKING.balanceDays),
    name, email, phone: clean(b.phone, 40), country: clean(b.country, 80),
    notes: clean(b.notes, 2000), lang: LANGUAGES[b.lang] ? b.lang : 'en', currency: clean(b.currency, 4), note: '',
    // Travel documents & flights (step 5 on the booking page)
    nationality: clean(b.nationality, 80), visa: clean(b.visa, 40), flights: clean(b.flights, 40),
    flightNo: clean(b.flightNo, 40), arrival: clean(b.arrival, 40), flyFrom: clean(b.flyFrom, 80)
  };
  db.bookings.push(booking);
  save('bookings');
  closeLead(b.draft, `Booked ${ref}`);
  console.log(`[booking] ${ref} ${booking.tripTitle} on ${date} for ${party} (${email})`);
  const { note, ...forVisitor } = booking;
  sendJSON(res, 201, { ref, booking: forVisitor });
}

/* ---------- POST /api/track: anonymous visit counts (admin → Insights) ----------
   Privacy first: no IP address, name, cookie or visitor ID is stored. Each page view only
   adds 1 to today's totals: pages, packages opened, searches, where the visit came from
   (another website's domain), the visitor's time zone (a rough region) and language.
   A "session" is counted once per browser tab session. Bots and headless browsers are skipped. */
let analytics;
try { analytics = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'analytics.json'), 'utf8')); } catch { analytics = { since: new Date().toISOString().slice(0, 10), days: {} }; }
db.analytics = analytics;
let analyticsTimer = 0;
const saveAnalytics = () => { if(!analyticsTimer) analyticsTimer = setTimeout(() => { analyticsTimer = 0; save('analytics'); }, 10_000); };
const trackHits = new Map();
LIMITERS.push(trackHits);
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python|node-fetch/i;
function bump(map, key, max = 300){
  key = clean(String(key || ''), 80);
  if(!key) return;
  if(map[key] === undefined && Object.keys(map).length >= max) key = '(other)';
  map[key] = (map[key] || 0) + 1;
}
async function handleTrack(req, res){
  const ip = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (trackHits.get(ip) || []).filter(t => now - t < 60_000);
  recent.push(now); trackHits.set(ip, recent);
  if(recent.length > 60 || BOT.test(req.headers['user-agent'] || '')) return sendJSON(res, 204, {});
  let b;
  try { b = JSON.parse(await readBody(req, 4_000)); } catch { return sendJSON(res, 400, { error: 'Bad request' }); }
  const day = new Date(now + 3 * 3600_000).toISOString().slice(0, 10);              // Nairobi date
  const d = analytics.days[day] = analytics.days[day] || { sessions: 0, views: 0, pages: {}, trips: {}, searches: {}, interests: {}, refs: {}, tz: {}, lang: {} };
  if(b.t === 'search'){ bump(d.searches, String(b.q || '').toLowerCase().replace(/\s+/g, ' ').trim()); saveAnalytics(); return sendJSON(res, 204, {}); }
  d.views++;
  bump(d.pages, clean(b.page, 60) || 'index.html');
  if(b.trip) bump(d.trips, clean(b.trip, 60));
  if(b.q) bump(d.searches, String(b.q).toLowerCase().replace(/\s+/g, ' ').trim());
  [].concat(b.interests || []).slice(0, 6).forEach(x => bump(d.interests, x));
  if(b.s){
    d.sessions++;
    bump(d.refs, clean(b.ref, 80) || 'Direct / typed');
    bump(d.tz, clean(b.tz, 60) || 'Unknown');
    bump(d.lang, clean(b.lang, 12) || 'Unknown');
  }
  // Keep about a year and a bit
  const keys = Object.keys(analytics.days).sort();
  while(keys.length > 400) delete analytics.days[keys.shift()];
  saveAnalytics();
  sendJSON(res, 204, {});
}

/* ---------- POST /api/leads: progress saved from the booking and customise forms ----------
   The page sends what the visitor has filled in so far, but only once there is a way to
   reach them (an email or a phone number). If they leave without finishing, the team sees
   them under "Unfinished" in admin.html and can email, call or WhatsApp them.
   One lead per browser draft id; sending the booking/enquiry marks it "booked". */
const leadHits = new Map();
LIMITERS.push(leadHits);
function leadLimited(ip){
  const now = Date.now();
  const recent = (leadHits.get(ip) || []).filter(t => now - t < 60_000);
  recent.push(now); leadHits.set(ip, recent);
  return recent.length > 40;                       // autosave is debounced; this only stops abuse
}
function closeLead(draft, outcome){
  const lead = draft && db.leads.find(x => x.draft === clean(draft, 40));
  if(!lead || lead.status === 'booked') return;
  lead.status = 'booked'; lead.outcome = outcome; lead.updated = new Date().toISOString();
  saveSoon('leads');
}
async function handleLead(req, res){
  const ip = req.socket.remoteAddress || 'unknown';
  if(leadLimited(ip)) return sendJSON(res, 429, { error: 'Too many requests.' });
  let b;
  try { b = JSON.parse(await readBody(req, 20_000)); } catch { return sendJSON(res, 400, { error: 'Bad request' }); }
  const draft = clean(b.draft, 40);
  if(!/^[a-z0-9-]{8,40}$/i.test(draft)) return sendJSON(res, 400, { error: 'Bad draft id' });
  const fields = {};
  Object.entries(b.fields && typeof b.fields === 'object' ? b.fields : {}).slice(0, 30)
    .forEach(([k, v]) => { const key = clean(k, 60), val = clean(String(v ?? ''), 1500); if(key && val) fields[key] = val; });
  const email = emailOk(fields.Email || '') ? fields.Email : '';
  const phone = (fields.Phone || '').replace(/[^\d+]/g, '').length >= 7 ? fields.Phone : '';
  if(!email && !phone) return sendJSON(res, 202, { saved: false });   // nobody to follow up with yet
  const now = new Date().toISOString();
  let lead = db.leads.find(x => x.draft === draft);
  if(lead && lead.status === 'booked') return sendJSON(res, 200, { saved: false });
  if(!lead){ lead = { id: newId(), draft, created: now, status: 'open', note: '' }; db.leads.push(lead); }
  Object.assign(lead, {
    source: b.source === 'custom' ? 'Custom trip' : 'Booking', page: clean(b.page, 120), step: clean(b.step, 80),
    resume: clean(b.resume, 300), name: clean(fields.Name || '', 120), email, phone, fields, updated: now
  });
  saveSoon('leads');
  sendJSON(res, 200, { saved: true });
}

/* ---------- GET /api/flight-status ----------
   ?type=flight&number=KQ117&date=2026-11-08
   ?type=board&airport=NBO&dir=dep|arr&date=…&slot=0-3
   ?type=route&from=NBO&to=ZNZ&date=…&slot=0-3
   Answers come from server/flights.mjs (cached, shared between visitors). */
const statusHits = new Map();
LIMITERS.push(statusHits);
async function handleFlightStatus(req, res){
  const ip = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (statusHits.get(ip) || []).filter(t => now - t < 60_000);
  recent.push(now); statusHits.set(ip, recent);
  if(recent.length > 30) return sendJSON(res, 429, { error: 'Too many searches. Please wait a minute.' });
  if(!flightStatusConfigured()) return sendJSON(res, 200, { configured: false });

  const q = new URL(req.url, 'http://x').searchParams;
  const type = q.get('type'), date = q.get('date') || '', slot = Number(q.get('slot'));
  // Dates from yesterday to two days ahead (what flight status is useful for)
  const day = n => new Date(now + n * 864e5).toISOString().slice(0, 10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < day(-2) || date > day(3)) return sendJSON(res, 400, { error: 'Please pick a date from yesterday to two days ahead.' });
  const airport = v => /^[A-Za-z]{3}$/.test(v || '');
  const okSlot = Number.isInteger(slot) && slot >= 0 && slot <= 3;
  try {
    let flights;
    if(type === 'flight'){
      const number = (q.get('number') || '').replace(/\s+/g, '');
      if(!/^[A-Za-z0-9]{2,3}\d{1,4}[A-Za-z]?$/.test(number)) return sendJSON(res, 400, { error: 'Please enter a flight number like KQ 117.' });
      flights = await flightByNumber(number, date);
    } else if(type === 'board'){
      if(!airport(q.get('airport')) || !okSlot) return sendJSON(res, 400, { error: 'Please choose an airport and a time.' });
      flights = await airportBoard(q.get('airport'), q.get('dir') === 'arr' ? 'arr' : 'dep', date, slot);
    } else if(type === 'route'){
      if(!airport(q.get('from')) || !airport(q.get('to')) || !okSlot) return sendJSON(res, 400, { error: 'Please choose both airports and a time.' });
      flights = await routeSearch(q.get('from'), q.get('to'), date, slot);
    } else return sendJSON(res, 400, { error: 'Unknown search' });
    sendJSON(res, 200, { configured: true, flights, checked: new Date().toISOString() });
  } catch(err){
    if(err instanceof FlightApiError){
      if(err.code === 'key') return sendJSON(res, 200, { configured: false });
      console.error('[flight-status]', err.message);
      return sendJSON(res, 503, { error: err.code === 'limit' ? 'Live flight status has reached today\'s limit. Please use the airline\'s official site below.' : 'Live flight status is busy right now. Please try again in a minute.' });
    }
    console.error('[flight-status]', err.message);
    sendJSON(res, 503, { error: 'Live flight status is unavailable right now.' });
  }
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
  closeLead(b.draft, `Sent: ${enquiry.type}`);
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
LIMITERS.push(hits, loginHits);
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
    const { TRIPS, LAST_MINUTE, PLACES } = loadData();
    const trips = [...TRIPS, ...LAST_MINUTE].map(t => ({ id: t.id, title: t.title, days: t.days, capacity: t.group || t.spaces, private: t.group <= 2, country: t.country || '', countries: t.countries || '', img: t.img || '' }));
    const places = PLACES.map(p => ({ name: p.name, country: p.country }));
    return sendJSON(res, 200, { bookings: db.bookings, enquiries: db.enquiries, questions: db.questions.slice(-1500), leads: db.leads, trips, places, analytics, now: new Date().toISOString() });
  }
  if(route === 'update' && req.method === 'POST'){
    let b;
    try { b = JSON.parse(await readBody(req, 10_000)); } catch { return sendJSON(res, 400, { error: 'Bad request' }); }
    const STATUSES = { bookings: ['pending', 'confirmed', 'completed', 'cancelled'], enquiries: ['new', 'replied', 'closed'], questions: ['new', 'reviewed'], leads: ['open', 'contacted', 'booked', 'lost'] };
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
  cachedFile(file).then(f => {
    if(!f){ res.writeHead(404, { 'Content-Type':'text/plain' }); return res.end('Not found'); }
    const headers = { 'Content-Type': f.type, 'ETag': f.etag, 'Vary': 'Accept-Encoding',
      // Pages, styles and scripts: always check for a newer version (a quick 304 when unchanged), so edits show at once.
      // Photos, fonts: keep for a week (uploads get new file names, so they never go stale).
      'Cache-Control': f.text ? 'no-cache' : 'public, max-age=604800' };
    if(req.headers['if-none-match'] === f.etag){ res.writeHead(304, headers); return res.end(); }
    const accept = req.headers['accept-encoding'] || '';
    let body = f.raw;
    if(f.br && /\bbr\b/.test(accept)){ body = f.br; headers['Content-Encoding'] = 'br'; }
    else if(f.gz && /\bgzip\b/.test(accept)){ body = f.gz; headers['Content-Encoding'] = 'gzip'; }
    headers['Content-Length'] = body.length;
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  }).catch(() => { res.writeHead(500); res.end('Server error'); });
}

/* ---------- File cache ----------
   Each file is read from disk once and kept in memory with a Brotli and a gzip copy (text only)
   and an ETag. A quick stat on every request notices edits, so changes still show straight away.
   Large files (videos, big photos) are read fresh and not kept, so memory stays small. */
const fileCache = new Map();
const brotli = promisify(zlib.brotliCompress), gzip = promisify(zlib.gzip);
// Read and compress pages, styles, scripts and translations once at start-up, so the first visitors are fast too
async function warmCache(){
  const dirs = ['.', 'css', 'js', 'lang'];
  for(const d of dirs){
    let names = [];
    try { names = fs.readdirSync(path.join(ROOT, d)).filter(n => /\.(html|css|js)$/.test(n)); } catch {}
    for(const n of names) await cachedFile(path.join(ROOT, d, n)).catch(() => {});
  }
}
const CACHE_MAX_FILE = 2 * 1024 * 1024, CACHE_MAX_TOTAL = 150 * 1024 * 1024;
let cacheBytes = 0;
async function cachedFile(file){
  let st;
  try { st = await fs.promises.stat(file); } catch { return null; }
  if(!st.isFile()) return null;
  const hit = fileCache.get(file);
  if(hit && hit.mtime === st.mtimeMs && hit.size === st.size) return hit;
  const raw = await fs.promises.readFile(file);
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const text = /^(text\/|application\/json|image\/svg)/.test(type);
  const f = { mtime: st.mtimeMs, size: st.size, type, text, raw,
    etag: '"' + crypto.createHash('sha1').update(raw).digest('base64url').slice(0, 16) + '"' };
  if(text && raw.length > 512){
    // Compression runs off the main thread, so other visitors are never held up
    [f.br, f.gz] = await Promise.all([brotli(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } }), gzip(raw, { level: 9 })]);
  }
  const weight = raw.length + (f.br ? f.br.length + f.gz.length : 0);
  if(raw.length <= CACHE_MAX_FILE){
    if(hit) cacheBytes -= hit.weight;
    // Full: forget the oldest entries first
    for(const [k, v] of fileCache){ if(cacheBytes + weight <= CACHE_MAX_TOTAL) break; fileCache.delete(k); cacheBytes -= v.weight; }
    f.weight = weight; fileCache.set(file, f); cacheBytes += weight;
  }
  return f;
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
  if(path === '/api/leads') return post(handleLead);
  if(path === '/api/track') return post(handleTrack);
  if(path === '/api/flight-status') return req.method === 'GET' ? handleFlightStatus(req, res) : sendJSON(res, 405, { error: 'Use GET' });
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
  warmCache();
  console.log(`SafariNomad running at http://localhost:${PORT}`);
  console.log(`Admin dashboard:  http://localhost:${PORT}/admin.html`);
  if(!process.env.ADMIN_PASSWORD) console.log(`Admin password:   ${adminPassword()}   (edit server/data/admin-password.txt, or set ADMIN_PASSWORD, to change it)`);
  console.log(flightStatusConfigured() ? 'Flight status:    live (AeroDataBox)' : 'Flight status:    no AERODATABOX_KEY, so searches link to official airline/airport sites');
  const ai = chatProvider();
  console.log(ai === 'claude' ? `AI assistant:     Claude (${MODEL})` : ai === 'gemini' ? `AI assistant:     Google Gemini (${GEMINI_MODELS.join(' → ')}, ${GEMINI_THINKING.toLowerCase()} thinking, no web search)` : 'Note: no AI key set (GEMINI_API_KEY or ANTHROPIC_API_KEY), so the assistant uses its offline answers.');
});
