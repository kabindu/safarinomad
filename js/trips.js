/* =========================================================
   SafariNomad: trips page ("Find your safari")
   Filters by country, style, length, price and saved trips.
   Filters are kept in the URL, so links like
   trips.html?country=kenya&style=beach open pre-filtered.
   ========================================================= */

(function(){
  const { $, $$, params, LANDS, inLand } = SN;
  const grid = $('#tripGrid');
  const maxPriceAll = Math.ceil(Math.max(...TRIPS.map(t => t.price)) / 500) * 500;

  // Show how many trips each option has
  $$('[data-c-country]').forEach(el => {
    const k = el.dataset.cCountry;
    el.textContent = k ? TRIPS.filter(t => t.country === k).length : TRIPS.length;
  });
  $$('[data-c-style]').forEach(el => el.textContent = TRIPS.filter(t => t.styles.includes(el.dataset.cStyle)).length);

  const range = $('#maxPrice');
  range.max = maxPriceAll;

  // Landscape filter (savannah, lakes, coast…), built from LANDSCAPES in js/data.js
  $('#landRadios').innerHTML = `<label><input type="radio" name="land" value="" checked> Any landscape <span>${TRIPS.length}</span></label>` +
    LANDS.map(l => `<label><input type="radio" name="land" value="${l.key}"> ${l.label} <span>${TRIPS.filter(t => inLand(t, l.key)).length}</span></label>`).join('');

  // "When?" month chips
  $('#monthChips').innerHTML = MONTH_NAMES.map((m, i) => `<label class="mchip"><input type="checkbox" name="month" value="${i + 1}"><span>${m}</span></label>`).join('');

  /* ---------- Read filters from URL ---------- */
  function fromURL(){
    const country = params.get('country') || '';
    const styles = (params.get('style') || '').split(',').filter(Boolean);
    const len = params.get('len') || '';
    const max = +params.get('max') || maxPriceAll;
    $('#tripQuery').value = params.get('q') || '';
    const months = (params.get('months') || '').split(',').map(Number).filter(Boolean);
    $$('input[name=month]').forEach(c => c.checked = months.includes(+c.value));
    $$('input[name=country]').forEach(r => r.checked = r.value === country);
    $$('input[name=land]').forEach(r => r.checked = r.value === (params.get('land') || ''));
    $$('input[name=style]').forEach(c => c.checked = styles.includes(c.value));
    $$('input[name=len]').forEach(r => r.checked = r.value === len);
    range.value = max;
    $('#savedOnly').checked = params.get('saved') === '1';
    $('#sortBy').value = params.get('sort') || 'popular';
  }

  /* ---------- Current state ---------- */
  function state(){
    return {
      country: ($('input[name=country]:checked') || {}).value || '',
      land: ($('input[name=land]:checked') || {}).value || '',
      styles: $$('input[name=style]:checked').map(c => c.value),
      len: ($('input[name=len]:checked') || {}).value || '',
      max: +range.value,
      q: $('#tripQuery').value.trim(),
      months: $$('input[name=month]:checked').map(c => +c.value),
      saved: $('#savedOnly').checked,
      sort: $('#sortBy').value
    };
  }

  const SORT = {
    popular: (a, b) => !!b.featured - !!a.featured,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    days: (a, b) => a.days - b.days
  };

  function render(){
    const s = state();
    const list = TRIPS.filter(t =>
      (!s.country || t.country === s.country) &&
      (!s.land || inLand(t, s.land)) &&
      (!s.styles.length || s.styles.some(x => t.styles.includes(x))) &&
      (!s.len || (DURATIONS[s.len] && DURATIONS[s.len].fits(t.days))) &&
      (!s.months.length || s.months.some(m => (t.months || []).includes(m))) &&
      t.price <= s.max &&
      (!s.saved || SN.wish.has(t.id)) &&
      (!s.q || SNSearch.tripMatches(t, s.q))
    ).sort(SORT[s.sort]);

    grid.innerHTML = list.map(SN.tripCard).join('');
    $('#noResults').classList.toggle('show', list.length === 0);
    const noText = $('#noResultsText'), emptySaved = s.saved && !SN.wish.size;
    $('#noResultsAsk').style.display = s.q && !emptySaved ? '' : 'none';
    if(s.q && !emptySaved){
      noText.innerHTML = '<strong>Nothing found for <span translate="no"></span></strong><br>Ask Nomad, our AI travel expert, or let us build a trip for you.';
      noText.querySelector('span').textContent = `“${s.q}”`;
    } else noText.textContent = emptySaved
      ? 'You haven\'t saved any trips yet. Tap the heart on any trip to save it here.'
      : 'No set itineraries match those filters, but we can build one for you.';

    // Summary line
    const bits = [];
    if(s.country) bits.push(COUNTRY_NAMES[s.country]);
    if(s.land) bits.push((LANDS.find(l => l.key === s.land) || {}).label);
    s.styles.forEach(x => bits.push(STYLE_NAMES[x]));
    if(s.months.length) bits.push(s.months.map(m => MONTH_NAMES[m - 1]).join(', '));
    if(s.saved) bits.push('Saved trips');
    if(s.q) bits.unshift(`"${s.q.replace(/[<>&]/g, '')}"`);
    $('#resultCount').innerHTML = `Showing <b>${list.length}</b> of ${TRIPS.length} trips` + (bits.length ? ` for <b>${bits.join(' · ')}</b>` : '');
    $('#pageTitle').textContent = s.saved ? 'Your saved trips' : s.country === 'world' ? 'Holidays beyond Africa' : s.country ? `${COUNTRY_NAMES[s.country]} packages` : 'All packages';
    $('#maxPriceLabel').innerHTML = s.max >= maxPriceAll ? 'Any price' : `Up to <b data-usd="${s.max}"></b>`;

    // Keep the URL in sync so the page can be bookmarked or shared
    const q = new URLSearchParams();
    if(s.country) q.set('country', s.country);
    if(s.land) q.set('land', s.land);
    if(s.styles.length) q.set('style', s.styles.join(','));
    if(s.len) q.set('len', s.len);
    if(s.months.length) q.set('months', s.months.join(','));
    if(s.max < maxPriceAll) q.set('max', s.max);
    if(s.saved) q.set('saved', '1');
    if(s.q) q.set('q', s.q);
    if(s.sort !== 'popular') q.set('sort', s.sort);
    history.replaceState(null, '', 'trips.html' + (q.toString() ? '?' + q : ''));

    SN.refresh();
  }

  $$('#filters input, #sortBy').forEach(el => el.addEventListener('input', render));
  $('#noResultsAsk').addEventListener('click', e => { e.stopPropagation(); if(window.NomadAssistant) NomadAssistant.askAbout($('#tripQuery').value.trim()); });
  $('#clearFilters').addEventListener('click', () => {
    $$('#filters input[type=checkbox]').forEach(c => c.checked = false);
    $('#tripQuery').value = '';
    $$('input[name=country]').forEach(r => r.checked = r.value === '');
    $$('input[name=land]').forEach(r => r.checked = r.value === '');
    $$('input[name=len]').forEach(r => r.checked = r.value === '');
    range.value = maxPriceAll;
    render();
  });
  $('#filterToggle').addEventListener('click', () => {
    const open = $('#filters').classList.toggle('open');
    $('#filterToggle').setAttribute('aria-expanded', open);
  });
  document.addEventListener('wishchange', () => { if($('#savedOnly').checked) render(); });
  document.addEventListener('currencychange', render);

  fromURL();
  render();
  // Arriving with filters (e.g. from a search)? Jump straight to the results.
  if(location.search) requestAnimationFrame(() => $('#finder').scrollIntoView({behavior:'auto'}));
})();
