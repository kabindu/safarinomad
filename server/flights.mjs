/* =========================================================
   SafariNomad: live flight status (flights.html → Flight status)
   ---------------------------------------------------------
   Data comes from AeroDataBox, a licensed flight-data service
   (airline and airport websites forbid automated copying).
   Set in .env:
     AERODATABOX_KEY=...           your key
     AERODATABOX_VIA=rapidapi      only if the key is from RapidAPI
     FLIGHT_API_DAILY_LIMIT=300    safety cap on paid calls per day
   Without a key the page links visitors to the airline's and
   airport's own official status pages instead.

   Light by design: every answer is cached for a few minutes and
   identical searches made at the same time share one request,
   so 1,000 visitors checking KQ 117 cost a single call.
   ========================================================= */

const KEY = process.env.AERODATABOX_KEY || '';
const VIA = (process.env.AERODATABOX_VIA || 'direct').toLowerCase();
const BASE = VIA === 'rapidapi' ? 'https://aerodatabox.p.rapidapi.com' : 'https://api.aerodatabox.com';
const HEADERS = VIA === 'rapidapi'
  ? { 'X-RapidAPI-Key': KEY, 'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com' }
  : { 'X-Api-Key': KEY };
const DAILY_LIMIT = Number(process.env.FLIGHT_API_DAILY_LIMIT) || 300;

export const flightStatusConfigured = () => !!KEY;

/* ---------- Cache + request sharing ---------- */
const cache = new Map();      // key → { exp, value }
const inflight = new Map();   // key → promise of a request already on its way
let budget = { day: '', used: 0 };

async function cached(key, ttlMs, load){
  const hit = cache.get(key);
  if(hit && hit.exp > Date.now()) return hit.value;
  if(inflight.has(key)) return inflight.get(key);
  const p = load().then(value => {
    cache.set(key, { exp: Date.now() + ttlMs, value });
    if(cache.size > 2000) for(const [k, v] of cache){ if(v.exp < Date.now() || cache.size > 1500) cache.delete(k); }
    return value;
  }).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

class FlightApiError extends Error {
  constructor(code, message){ super(message); this.code = code; }
}

async function call(path){
  const day = new Date().toISOString().slice(0, 10);
  if(budget.day !== day) budget = { day, used: 0 };
  if(budget.used >= DAILY_LIMIT) throw new FlightApiError('limit', 'Daily flight-data limit reached');
  budget.used++;
  const r = await fetch(BASE + path, { headers: HEADERS, signal: AbortSignal.timeout(12_000) });
  if(r.status === 204 || r.status === 404) return null;                  // nothing found
  if(r.status === 401 || r.status === 403) throw new FlightApiError('key', 'Flight data key rejected');
  if(r.status === 429) throw new FlightApiError('busy', 'Flight data service is busy');
  if(!r.ok) throw new FlightApiError('upstream', `Flight data error ${r.status}`);
  return r.json();
}

/* ---------- Simplify AeroDataBox answers to what the page shows ---------- */
const time = t => (t && t.local) || '';
function side(m){
  if(!m) return null;
  const a = m.airport || {};
  return {
    iata: a.iata || a.icao || '', name: a.shortName || a.name || '', city: a.municipalityName || '',
    scheduled: time(m.scheduledTime), revised: time(m.revisedTime), predicted: time(m.predictedTime), actual: time(m.runwayTime),
    terminal: m.terminal || '', gate: m.gate || '', checkIn: m.checkInDesk || '', baggage: m.baggageBelt || ''
  };
}
function simplify(f){
  return {
    number: f.number || '', status: f.status || 'Unknown', updated: f.lastUpdatedUtc || '',
    airline: { name: (f.airline && f.airline.name) || '', iata: (f.airline && f.airline.iata) || '' },
    aircraft: (f.aircraft && f.aircraft.model) || '',
    dep: side(f.departure), arr: side(f.arrival)
  };
}

/* ---------- Searches ---------- */
// One flight number on one day (e.g. KQ117, 2026-11-08)
export function flightByNumber(number, date){
  const n = number.replace(/\s+/g, '').toUpperCase();
  return cached(`f:${n}:${date}`, 120_000, async () =>
    ((await call(`/flights/number/${encodeURIComponent(n)}/${date}?withAircraftImage=false&withLocation=false`)) || []).map(simplify));
}

// An airport's departures or arrivals in a 6-hour window (slot 0-3 = 00-06, 06-12, 12-18, 18-24 local time)
export function airportBoard(iata, dir, date, slot){
  const code = iata.toUpperCase();
  const from = `${date}T${String(slot * 6).padStart(2, '0')}:00`;
  const to = slot === 3 ? `${date}T23:59` : `${date}T${String(slot * 6 + 6).padStart(2, '0')}:00`;
  const direction = dir === 'arr' ? 'Arrival' : 'Departure';
  return cached(`b:${code}:${dir}:${date}:${slot}`, 180_000, async () => {
    const data = await call(`/flights/airports/iata/${code}/${from}/${to}?direction=${direction}&withLeg=true&withCancelled=true&withCodeshared=false&withCargo=false&withPrivate=false`);
    const list = (data && (dir === 'arr' ? data.arrivals : data.departures)) || [];
    // Per AeroDataBox's schema: with withLeg=true each flight has departure + arrival, and the airport
    // sub-object is left out on the side that equals the requested airport, so we fill that code in.
    // (Without withLeg there is one `movement`: times at this airport, but its airport is the opposite one.)
    const own = dir === 'arr' ? 'arr' : 'dep', other = dir === 'arr' ? 'dep' : 'arr';
    return list.map(f => {
      const s = simplify(f);
      if(f.movement){
        s[own] = side({ ...f.movement, airport: undefined });
        s[other] = side({ airport: f.movement.airport });
      }
      if(s[own] && !s[own].iata) s[own].iata = code;
      return s;
    });
  });
}

// From A to B: A's departure board in that window, keeping flights to B
export async function routeSearch(from, to, date, slot){
  const board = await airportBoard(from, 'dep', date, slot);
  return board.filter(f => f.arr && f.arr.iata === to.toUpperCase());
}

export { FlightApiError };
