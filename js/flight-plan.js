/* =========================================================
   SafariNomad: "My flights" (flights.html)
   ---------------------------------------------------------
   Travellers save up to 6 searches, note the airline and the
   price they found on the comparison sites, and see the cheapest.
   No made-up fares: every price here is one they typed in.
   The list stays in this browser until they type an email or
   phone, then a planner can see it (admin → Flight plans) and
   help them choose.
   ========================================================= */

(function(){
  const { $, store, emailOk, toast } = SN;
  const box = $('#myFlights');
  if(!box || !window.SNFlights) return;
  const MAX = 6;
  let list = store.get('myFlights') || [];
  const lead = SN.lead('flights', 'flights');
  const key = o => [o.from, o.to, o.depart, o.ret, o.adults, o.children, o.cabin].join('|');
  const form = $('#fmForm'), status = $('#fmStatus');
  const say = (msg, err) => { status.textContent = msg; status.classList.add('show'); status.classList.toggle('error', !!err); };
  const day = s => s ? new Intl.DateTimeFormat('en-GB', { timeZone:'UTC', day:'numeric', month:'short', year:'numeric' }).format(new Date(s + 'T12:00:00Z')) : '';
  const who = o => { const n = o.adults + o.children; return `${n} traveller${n === 1 ? '' : 's'}`; };

  function fields(){
    const d = Object.fromEntries(new FormData(form).entries());
    return { Name: (d.name || '').trim(), Email: (d.email || '').trim(), Phone: (d.phone || '').trim(),
      Route: list.map(o => `${o.fromName} → ${o.toName}`).join('; '),
      Message: `Comparing ${list.length} flight option${list.length === 1 ? '' : 's'}${d.message ? `\n\n${d.message}` : ''}` };
  }
  const autosave = () => lead.save({ step:'Comparing flights', resume:'flights.html#myFlights', fields: fields(), flights: list });
  const persist = () => { store.set('myFlights', list); autosave(); };

  // The cheapest, only when the prices can fairly be compared (two or more, same currency)
  function cheapest(){
    const priced = list.filter(o => +o.price > 0);
    if(priced.length < 2 || new Set(priced.map(o => o.cur)).size > 1) return null;
    return priced.reduce((a, b) => +b.price < +a.price ? b : a);
  }

  function draw(){
    box.hidden = !list.length;
    $('#fmCount').textContent = list.length;
    const best = cheapest();
    const airlines = Object.values(AIRLINES).map(a => a.name).sort();
    $('#fmList').innerHTML = list.map((o, i) => `
      <article class="fm-opt ${o === best ? 'best' : ''}" data-i="${i}">
        <div class="fm-head">
          <b translate="no">${o.fromName} → ${o.toName}</b>
          ${o === best ? '<span class="fm-best"><i class="fa-solid fa-tag"></i> Cheapest</span>' : ''}
          <button type="button" class="fm-x" data-remove aria-label="Remove this flight" title="Remove"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <small><span translate="no">${day(o.depart)}${o.ret ? ' – ' + day(o.ret) : ''}</span> · ${who(o)} · ${o.cabinName}</small>
        <div class="fm-fields">
          <label>Airline<select data-f="airline" translate="no"><option value="">Not chosen yet</option>${airlines.map(a => `<option ${a === o.airline ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
          <label>Total price I found<span class="fm-price"><select data-f="cur" aria-label="Currency" translate="no"><option ${o.cur === 'USD' ? 'selected' : ''}>USD</option><option ${o.cur === 'EUR' ? 'selected' : ''}>EUR</option></select><input data-f="price" type="number" min="0" max="999999" inputmode="decimal" placeholder="e.g. 640" value="${+o.price > 0 ? +o.price : ''}"></span></label>
        </div>
        <div class="fm-links"><span>Check prices:</span>${SNFlights.links(o).map(s => `<a href="${s.url}" target="_blank" rel="noopener" translate="no">${s.name} <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`).join('')}</div>
      </article>`).join('');
  }

  $('#fsSave').addEventListener('click', () => {
    const o = SNFlights.current();
    if(list.some(x => key(x) === key(o))){ toast('This flight is already in My flights'); }
    else if(list.length >= MAX){ toast(`My flights holds ${MAX}. Remove one to add another.`); return; }
    else { list.push(Object.assign(o, { airline:'', price:'', cur: store.get('currency') === 'EUR' ? 'EUR' : 'USD' })); persist(); draw(); toast('Saved to My flights'); }
    box.scrollIntoView({ behavior:'smooth', block:'start' });
  });

  $('#fmList').addEventListener('click', e => {
    if(!e.target.closest('[data-remove]')) return;
    list.splice(+e.target.closest('[data-i]').dataset.i, 1);
    persist(); draw();
  });
  // Save as they type; redraw only when they leave the box, so typing is never interrupted
  $('#fmList').addEventListener('input', e => {
    const f = e.target.dataset.f; if(!f) return;
    list[+e.target.closest('[data-i]').dataset.i][f] = e.target.value;
    persist();
  });
  $('#fmList').addEventListener('change', draw);
  form.addEventListener('input', autosave);

  // One tap to fill in the email they used before on this device
  function offerEmail(input){
    const known = store.get('myEmail');
    if(!input || !known) return;
    const chip = document.createElement('button');
    chip.type = 'button'; chip.className = 'fm-use';
    chip.innerHTML = '<i class="fa-regular fa-envelope" aria-hidden="true"></i> <span translate="no"></span>';
    chip.querySelector('span').textContent = `Use ${known}`;
    chip.addEventListener('click', () => { input.value = known; input.dispatchEvent(new Event('input', { bubbles:true })); chip.hidden = true; });
    input.addEventListener('input', () => { chip.hidden = !!input.value; });
    chip.hidden = !!input.value;
    input.insertAdjacentElement('afterend', chip);
  }
  offerEmail($('#fmEmail')); offerEmail($('#fEmail'));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = fields();
    if(!list.length){ say('Please save at least one flight first.', true); return; }
    if(!f.Name){ say('Please add your name.', true); $('#fmName').focus(); return; }
    if(!emailOk(f.Email)){ say('Please enter a valid email address so we can reply.', true); $('#fmEmail').focus(); return; }
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    try{
      await SN.sendEnquiry('Flight plan', f, { draft: lead.draft, flights: list });
      lead.done();
      say('Thank you! A planner will check these flights and email you within 24 hours.');
    }catch(err){
      const lines = list.map(o => `${o.fromName} → ${o.toName}, ${day(o.depart)}${o.ret ? ' – ' + day(o.ret) : ''}, ${who(o)}, ${o.cabinName}${o.airline ? ', ' + o.airline : ''}${+o.price > 0 ? `, ${o.cur} ${o.price}` : ''}`).join('\n');
      location.href = `mailto:${SITE.email}?subject=${encodeURIComponent('My flights')}&body=${encodeURIComponent(`${f.Name}\n${f.Phone}\n\n${lines}`)}`;
      say('Your email app is opening with your flights. Just hit send and we will reply within 24 hours.');
    }
    btn.disabled = false;
  });

  draw();
})();
