# SafariNomad website

A static site: open `index.html` in a browser, or use VS Code Live Server. No build step.

For **online booking with live seats, the admin dashboard and the AI assistant**, run the included server (`npm install`, then `npm start`) and open http://localhost:3000. See [Bookings and the admin dashboard](#bookings-and-the-admin-dashboard).

## Pages

| File | Page |
|---|---|
| `index.html` | Home |
| `trips.html` | All trips, with filters (links like `trips.html?country=kenya&style=beach` open pre-filtered) |
| `destinations.html` | Kenya, Tanzania, Uganda, Rwanda guides |
| `deals.html` | Offers, last-minute departures, trips on sale |
| `flights.html` | Bush & beach flight routes, international flights, transfers, flight request form |
| `services.html` | Services: safari vehicles, accommodation levels, tour guides (profiles, private guide hire) and our quality standards on the road and where you stay. `guides.html` now forwards here |
| `about.html` | Story, guides, responsible travel, reviews, FAQs |
| `book.html` | Booking calendar: real departure dates, seats left, travellers, details (`book.html?trip=<trip id>` opens a trip; add `&date=2026-11-14` to pick a date) |
| `contact.html` | Quote form (`contact.html?trip=<trip id>` pre-fills it) |
| `admin.html` | Team dashboard: bookings, departures, enquiries, chat questions, and **website content** (package photos and prices, flash sales, last-minute deals, flights). Needs the server; not linked from the site |
| `blog.html` | Blog list and articles (`blog.html#<article id>` opens one) |

## Where to change things

| To change… | Edit |
|---|---|
| Trips, prices, last-minute departures | Easiest: the admin dashboard's **Website content** pages. Defaults live in `js/data.js` (`TRIPS`, `LAST_MINUTE`); dashboard edits are saved in `server/data/content.json` and published as `js/content.js` |
| Phone, email, address, social links, promo banner | `js/data.js` (`SITE`) |
| Menus and dropdowns (all pages at once) | the `MENU` list at the top of `js/layout.js` |
| Footer | `js/layout.js` |
| Card / box look (YouTube-style greys, radius) | `--yt-*` tokens in `css/base.css` |
| Blog articles and authors | `js/blog-data.js` |
| Translations (FR / ES / DE) | `lang/fr.js`, `lang/es.js`, `lang/de.js` |
| Departure days, deposit, notice period, child price | `BOOKING` in `js/data.js` |
| Sale banner text, countdown end date, office hours (chat online/away) | `SITE.promo` and `SITE.hours` in `js/data.js` |
| A trip's route line and best months ("When?" search) | `route` and `months` on each trip in `js/data.js` |
| Search: related words (e.g. "monkeys" → chimps), popular searches, FAQ entries | `SYNONYMS`, `POPULAR` and the FAQ list in `js/search.js` |
| Brand colours and fonts | `css/base.css` (`:root`) |
| Page text (headings, paragraphs) | the page's `.html` file |
| Photos | drop files in `images/` and reference them as `images/name.jpg` |

## Folder layout

```
css/
  base.css        colours, fonts, buttons (every page)
  layout.css      header, menus, drawer, footer (every page)
  components.css  cards, carousels, reviews, forms, FAQs (every page)
  home.css        hero + search bar (home only)
  pages.css       trips filters, destinations, deals (inner pages)
  blog.css        blog only
js/
  data.js         site data: trips, prices, contact details
  i18n.js         translation engine (switches the whole site's language)
  layout.js       shared header + footer
  main.js         shared behaviour: menus, currency, saved trips, cards
  home.js         home page
  trips.js        trips page filters
  pages.js        destinations / deals trip lists
  contact.js      quote form
  blog-data.js    blog articles
  blog.js         blog page
images/           all site photos
lang/
  fr.js es.js de.js  French, Spanish and German text
server/
  server.mjs      website server: AI chat, bookings, enquiries, admin
  data/           saved bookings, enquiries, chat questions (created on first run)
```

Each page loads its scripts in this order: `data.js`, `i18n.js`, `layout.js`, `main.js`, then its own page script.

## Languages

The globe icon in the header switches the whole site to English, French, Spanish or German: page text, menus, trip cards, filters, search results, the blog and the chat. The choice is remembered on the next visit.

Translations live in `lang/fr.js`, `lang/es.js` and `lang/de.js`. Each line pairs the English text with its translation:

```js
"Request a free quote": "Demander un devis gratuit",
"Save up to {n}% on every safari": "Économisez jusqu'à {n} % sur chaque safari",
```

- Numbers are written as `{n}`, so prices, dates and counts can change without touching the translations. Keep the same number of `{n}` in both sides.
- Keep placeholders like `{max}`, `{phone}` and markdown links like `](contact.html)` exactly as they are.
- **Changed some English text?** Add a line for the new text to each language file. Until you do, that text shows in English.
- When the site runs through the Node server with an API key (see below), any text missing from these files is translated automatically and remembered in the visitor's browser and in `server/translations/`.
- To find missing text, open a page in another language and run `SNI18N.missing()` in the browser console.

## Bookings and the admin dashboard

**For travellers:** every trip card has a **Book dates** button that opens `book.html`. They pick a trip, choose a start date on a real calendar (today onwards, up to 12 months ahead), add adults and children, enter their details and press **Request booking**. They get a reference like `SN-4F2A9C`, a summary, and can add the trip to their calendar. No payment is taken on the site: a planner confirms and sends a deposit link.

**Dates and seats** follow `BOOKING` in `js/data.js`:

- Small-group trips leave on set weekdays (`departDays`, Saturdays if a trip isn't listed), with seats up to the trip's `group` size. The calendar shows seats left and greys out sold-out dates.
- Private trips (`group` of 2 or less), or any trip with the **Private trip** switch on, can start on any day.
- Last-minute trips leave only on their `departs` date, with `spaces` seats.
- `noticeDays` (earliest start), `monthsAhead`, `deposit`, `balanceDays` and `childRate` (family trips) are set there too.

The server re-checks every booking (date, seats, details), so two people can't take the last seat.

**For the team:** open http://localhost:3000/admin.html and sign in.

- **Password:** set your own before starting the server (`set ADMIN_PASSWORD=...`, or `$env:ADMIN_PASSWORD="..."` in PowerShell). If you don't, one is created on first run, printed in the server window and saved in `server/data/admin-password.txt`.
- **Overview:** bookings to confirm, travellers in the next 30 days, confirmed value, new enquiries and the latest activity.
- **Bookings:** search and filter, then click one to confirm, complete or cancel it, email or WhatsApp the traveller, and keep a private team note. Cancelling frees the seats.
- **Departures:** each upcoming departure with seats booked and who's on it.
- **Enquiries:** quote requests, flight requests, guide requests and brochure sign-ups.
- **Chat questions:** everything visitors asked Nomad and its replies, grouped by conversation. Common questions are worth adding to `KNOWLEDGE` in `js/data.js`.
- **CSV** downloads the current list for Excel or Google Sheets. The page refreshes itself every 30 seconds.

Everything is saved as JSON files in `server/data/`. Back up that folder; it is never served to visitors. Without the server (opening the files directly), bookings and forms fall back to opening the visitor's email app.

## Adding a new page

1. Copy `about.html` and rename it.
2. Change `<title>`, the description and `data-page` on `<body>`.
3. Replace the content inside `<main>`. The header and footer appear automatically.
4. Add a link to it in `js/layout.js`.

## AI safari assistant ("Nomad")

Visitors open it from the **Chat with us** button → **Ask Nomad, our AI assistant**.

**Two modes:**

- **Live (Claude):** run the site with the included server and Nomad answers with Claude, streaming replies word by word. It is briefed automatically from `js/data.js` (trips, prices, routes, best months, `KNOWLEDGE` facts, contact details), so edit the data and Nomad stays in sync. No restart needed.
- **Offline:** when the server isn't running (Live Server, or opening the files directly), Nomad answers from `KNOWLEDGE` and the trip list using the site search. Answers are marked "Quick answer".

**Turn on live mode:**

1. Get an API key from https://console.anthropic.com
2. In a terminal in this folder:
   ```
   npm install
   set ANTHROPIC_API_KEY=sk-ant-...        (Command Prompt)
   $env:ANTHROPIC_API_KEY="sk-ant-..."     (PowerShell)
   npm start
   ```
3. Open http://localhost:3000

The key stays on the server and is never sent to the browser. To host it publicly, deploy `server/server.mjs` to any Node host (Render, Railway, a VPS…) with `ANTHROPIC_API_KEY` set as an environment variable.

| To change… | Edit |
|---|---|
| What Nomad knows (policies, FAQs) | `KNOWLEDGE` in `js/data.js` |
| Nomad's personality and rules | `buildSystemPrompt()` in `server/server.mjs` |
| Model, reply length, rate limit | `MODEL`, `max_tokens`, `rateLimited()` in `server/server.mjs` |
| Suggested questions, greeting, offline answers | top of `js/assistant.js` |

## Hero photos

The home page hero is a slideshow of seven 4K photos in `images/hero/` (each has a `-4k.jpg` at 3840px and a
`-hd.jpg` at 1920px; the browser picks one for the screen). They come from Wikimedia Commons under Creative
Commons licences and are credited at the bottom of the home page. To use your own, replace the files with the same
names, or edit the slides at the top of `index.html` (photo, description and place label).
