/* =========================================================
   SafariNomad admin: Prices
   ---------------------------------------------------------
   Shows each package's current price against its estimated
   cost, the lowest safe price, the suggested price and what
   other operators charge. Nothing reaches the website until
   someone ticks packages and presses Publish; the last publish
   can be undone. Estimates come from server/pricing.mjs.
   ========================================================= */

const AdminPricing = (function(){
  let state = { rows: null, tiers: [], canUndo: false, canOverride: false, mode: 'below', find: '', picked: new Set(), edits: {} };
  const CONF = { high: 'Well sourced', medium: 'Estimate', low: 'Rough estimate' };

  async function render(el, ctx){
    try { Object.assign(state, await ctx.api('pricing')); }
    catch(err){ el.innerHTML = `<div class="adm-empty"><i class="fa-solid fa-lock"></i><p>${ctx.esc(err.message)}</p></div>`; return; }
    draw(el, ctx);
  }
  const priceOf = r => state.edits[r.id] !== undefined ? Number(state.edits[r.id]) : r.proposed;
  const shown = () => state.rows.filter(r => (state.mode === 'all' || (state.mode === 'below' && r.current < r.floor) || (state.mode === 'rough' && r.confidence === 'low')) && r.title.toLowerCase().includes(state.find.toLowerCase()));

  function draw(el, ctx){
    const { esc, usd } = ctx, under = state.rows.filter(r => r.current < r.floor).length, list = shown();
    const seg = [['below', `Below cost (${under})`], ['all', `All (${state.rows.length})`], ['rough', `Rough estimates (${state.rows.filter(r => r.confidence === 'low').length})`]];
    el.innerHTML = `
      <div class="pr-lead ${under ? '' : 'ok'}">${under ? `<b>${under} of ${state.rows.length} packages are priced below their estimated cost.</b> Selling at these prices would lose money.` : '<b>No package is below its estimated cost.</b>'} These are estimates: please have someone who runs safaris check them, especially the rough ones, before you publish.</div>
      <details class="pr-tiers"><summary>Group discounts travellers can ask for</summary>
        <div class="pr-tier-rows">${state.tiers.map(t => `<div><input class="adm-input" type="number" min="2" max="200" data-tmin value="${esc(t.min)}"> people or more: <input class="adm-input" type="number" min="1" max="30" data-tpct value="${esc(t.pct)}"> % off</div>`).join('')}</div>
        <button type="button" class="adm-btn" id="prTiers">Save group discounts</button>
      </details>
      <div class="seg">${seg.map(([k, l]) => `<button type="button" data-mode="${k}" class="${k === state.mode ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="pr-bar">
        <input class="adm-input" id="prFind" placeholder="Find a package" value="${esc(state.find)}" style="max-width:220px">
        <button type="button" class="adm-btn" id="prAll">Select all shown</button>
        <button type="button" class="adm-btn" id="prNone">Clear</button>
        <span class="sp"></span><b id="prCount"></b>
        ${state.canUndo ? '<button type="button" class="adm-btn" id="prUndo"><i class="fa-solid fa-rotate-left"></i> Undo last publish</button>' : ''}
        <button type="button" class="adm-btn primary" id="prGo"><i class="fa-solid fa-upload"></i> Publish selected</button>
      </div>
      ${list.length ? `<div class="table-wrap"><table class="adm-table pr-table">
        <thead><tr><th></th><th>Package</th><th>Now</th><th>Est. cost</th><th>Lowest safe</th><th>Suggested</th><th>Other operators</th><th>Change</th></tr></thead>
        <tbody>${list.map(r => { const p = priceOf(r), diff = Math.round((p / r.current - 1) * 100); return `
          <tr class="${r.current < r.floor ? 'under' : ''}">
            <td data-l="Publish"><input type="checkbox" data-pick="${esc(r.id)}" aria-label="Publish ${esc(r.title)}" ${state.picked.has(r.id) ? 'checked' : ''}></td>
            <td data-l="Package"><b>${esc(r.title)}</b><small>${r.days} day${r.days === 1 ? '' : 's'} · <span class="conf ${r.confidence}">${CONF[r.confidence]}</span></small><small>${esc(r.why)}</small></td>
            <td data-l="Now">${usd(r.current)}</td>
            <td data-l="Est. cost">${r.cost ? usd(r.cost) : '–'}</td>
            <td data-l="Lowest safe">${usd(r.floor)}</td>
            <td data-l="Suggested"><input type="number" min="1" max="200000" data-price="${esc(r.id)}" value="${esc(p)}" class="${p < r.floor ? 'low' : ''}" aria-label="New price for ${esc(r.title)}"></td>
            <td data-l="Other operators">${r.range ? `${usd(r.range[0])}–${usd(r.range[1])}` : '–'}</td>
            <td data-l="Change"><span class="pr-up">${diff > 0 ? '+' : ''}${diff}%</span></td>
          </tr>`; }).join('')}</tbody></table></div>` : '<div class="adm-empty"><i class="fa-solid fa-circle-check"></i><p>Nothing to show here.</p></div>'}`;
    wire(el, ctx);
  }

  function wire(el, ctx){
    const $ = s => el.querySelector(s), redraw = () => draw(el, ctx);
    const count = () => { $('#prCount').textContent = `${state.picked.size} selected`; };
    count();
    el.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { state.mode = b.dataset.mode; redraw(); });
    $('#prFind').oninput = e => { state.find = e.target.value; const pos = e.target.selectionStart; redraw(); const f = $('#prFind'); f.focus(); f.setSelectionRange(pos, pos); };
    $('#prAll').onclick = () => { shown().forEach(r => state.picked.add(r.id)); redraw(); };
    $('#prNone').onclick = () => { state.picked.clear(); redraw(); };
    el.querySelectorAll('[data-pick]').forEach(c => c.onchange = () => { c.checked ? state.picked.add(c.dataset.pick) : state.picked.delete(c.dataset.pick); count(); });
    el.querySelectorAll('[data-price]').forEach(i => i.oninput = () => {
      state.edits[i.dataset.price] = i.value;
      const r = state.rows.find(x => x.id === i.dataset.price);
      i.classList.toggle('low', Number(i.value) < r.floor);
    });
    const tiers = $('#prTiers');
    if(tiers) tiers.onclick = async () => {
      const mins = [...el.querySelectorAll('[data-tmin]')], pcts = [...el.querySelectorAll('[data-tpct]')];
      try { const r = await ctx.api('pricing/tiers', { method: 'POST', body: JSON.stringify({ tiers: mins.map((m, i) => ({ min: Number(m.value), pct: Number(pcts[i].value) })) }) }); state.tiers = r.tiers; ctx.content.reset(); ctx.toast('Group discounts saved'); redraw(); }
      catch(err){ if(err.message !== 'Signed out') ctx.toast(err.message, true); }
    };
    const undo = $('#prUndo');
    if(undo) undo.onclick = async () => {
      if(!confirm('Put back the prices from before your last publish?')) return;
      try { await ctx.api('pricing/undo', { method: 'POST', body: '{}' }); ctx.content.reset(); ctx.toast('Last publish undone'); state.picked.clear(); state.edits = {}; render(el, ctx); }
      catch(err){ if(err.message !== 'Signed out') ctx.toast(err.message, true); }
    };
    $('#prGo').onclick = async () => {
      if(!state.picked.size) return ctx.toast('Tick the packages to publish first', true);
      if(ctx.content.isDirty()) return ctx.toast('You have unsaved changes under Packages or Deals. Save them first', true);
      const rows = state.rows.filter(r => state.picked.has(r.id)), below = rows.filter(r => priceOf(r) < r.floor);
      if(rows.some(r => !(priceOf(r) > 0))) return ctx.toast('One of the prices is empty', true);
      if(below.length && !state.canOverride) return ctx.toast(`${below.length} price(s) are below the lowest safe price. Only the owner can publish those`, true);
      if(!confirm(`Publish ${rows.length} new price${rows.length === 1 ? '' : 's'} to the live website?\n\nBookings already made keep their price. You can undo this afterwards.`)) return;
      if(below.length && !confirm(`${below.length} of these are BELOW the lowest safe price and would lose money. Publish anyway?`)) return;
      try {
        await ctx.api('pricing/publish', { method: 'POST', body: JSON.stringify({ prices: Object.fromEntries(rows.map(r => [r.id, priceOf(r)])), confirmBelow: below.length > 0 }) });
        ctx.content.reset(); ctx.toast(`${rows.length} price${rows.length === 1 ? '' : 's'} published`);
        state.picked.clear(); state.edits = {}; render(el, ctx);
      } catch(err){ if(err.message !== 'Signed out') ctx.toast(err.message, true); }
    };
  }
  return { render };
})();
