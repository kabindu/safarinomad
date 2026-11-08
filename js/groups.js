/* =========================================================
   SafariNomad: group, school & corporate trips (groups.html)
   Shows a few packages that suit groups, and sends the group
   request to the server as a "Group trip" enquiry (admin →
   Enquiries). Progress is saved as a follow-up lead once an
   email or phone is typed (admin → Unfinished).
   ========================================================= */

(function(){
  const { $ } = SN;

  // Short, good-value trips that work well for groups (shown if they exist in js/data.js)
  const GROUP_TRIPS = ['nairobi-national-park', 'naivasha-hells-gate', 'rift-valley-lakes', 'mombasa-sgr-escape', 'amboseli-tsavo', 'mara-short-break'];
  const grid = $('#groupTrips');
  if(grid){
    grid.innerHTML = GROUP_TRIPS.map(id => TRIPS.find(t => t.id === id)).filter(Boolean).slice(0, 6).map(t => SN.tripCard(t)).join('');
    SN.refresh();
  }

  const form = $('#groupForm');
  if(!form) return;
  const status = $('#groupStatus');
  const say = (msg, err) => { status.textContent = msg; status.classList.add('show'); status.classList.toggle('error', !!err); };
  const fields = () => {
    const d = Object.fromEntries(new FormData(form).entries());
    return { Name: d.name, Email: (d.email || '').trim(), Phone: d.phone, 'Group type': d.type, Organisation: d.org,
      'Group size': d.size, Ages: d.ages, 'Travel month': d.when || 'Flexible', Days: d.days, Budget: d.budget,
      Message: `Group trip: ${d.size || '?'} people (${d.type})${d.ideas ? `\n\n${d.ideas}` : ''}` };
  };

  // Follow-up if they leave before sending
  const lead = SN.lead('group', 'group');
  form.addEventListener('input', () => lead.save({ step: 'Filling in the group form', resume: 'groups.html#group-form', fields: fields() }));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = fields();
    if(!(f.Name || '').trim() || !f.Email){ say('Please add your name and email so we can send the plan.', true); return; }
    if(!SN.emailOk(f.Email)){ say('Please enter a valid email address.', true); return; }
    if(!(+f['Group size'] >= 5)){ say('Please tell us how many people (5 or more).', true); $('#gSize').focus(); return; }
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    try{
      await SN.sendEnquiry('Group trip', f, { draft: lead.draft });
      lead.done();
      say('Thank you! Your group request is with our planners. You will hear from us within 24 hours.');
      form.reset();
    }catch(err){
      if(err.message !== 'offline' && err.message !== 'failed' && !/fetch/i.test(err.message)){ say(err.message, true); btn.disabled = false; return; }
      const body = Object.entries(f).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
      location.href = `mailto:${SITE.email}?subject=${encodeURIComponent('Group trip request')}&body=${encodeURIComponent(body)}`;
      say('Your email app is opening with your request. Just hit send and we will reply within 24 hours.');
    }
    btn.disabled = false;
  });
})();
