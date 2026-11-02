/* =========================================================
   SafariNomad: quote / contact form
   Pre-fills from links like contact.html?trip=classic-kenya.
   Sends the request to the server (it appears in admin.html);
   without the server it opens the visitor's email app instead.
   ========================================================= */

(function(){
  const { $, params } = SN;
  const form = $('#contactForm');
  if(!form) return;
  const status = $('#contactStatus');

  // Pre-fill when arriving from a "View Trip" / "Get a Quote" button
  const tripId = params.get('trip');
  const trip = tripId && ([...TRIPS, ...LAST_MINUTE].find(t => t.id === tripId));
  if(trip){
    $('#tripNotice').hidden = false;
    $('#tripNoticeName').textContent = trip.title;
    const dest = COUNTRY_NAMES[trip.country] || (/zanzibar/i.test(trip.countries) ? 'Zanzibar / Coast' : trip.countries);
    [...$('#destination').options].forEach(o => { if(o.value === dest) o.selected = true; });
    $('#message').value = `I'm interested in "${trip.title}" (${trip.days} days). Please send me dates and a price.`;
  }

  // Arriving from "Request John" on the guides page
  const guide = params.get('guide');
  if(guide && !trip){
    $('#tripNotice').hidden = false;
    $('#tripNotice').innerHTML = `<i class="fa-solid fa-user-tie"></i> You're asking about: <b>${guide.replace(/[<>&]/g, '')}</b>`;
    $('#message').value = `I'd like to travel with ${guide}. Please let me know availability and suggest an itinerary.`;
  }

  // Arriving from "Request a room" on the services page
  const hotel = params.get('hotel');
  if(hotel && !trip){
    $('#tripNotice').hidden = false;
    $('#tripNotice').innerHTML = `<i class="fa-solid fa-hotel"></i> You're asking about: <b>${hotel.replace(/[<>&]/g, '')}</b>`;
    $('#message').value = `I'd like to book a room at ${hotel}. Please send me rates for my dates.`;
  }

  function setStatus(msg, err){ status.textContent = msg; status.classList.add('show'); status.classList.toggle('error', !!err); }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    if(!d.name.trim() || !d.email.trim() || !d.destination || !d.message.trim()){
      setStatus('Please fill in your name, email, destination and trip details.', true); return;
    }
    if(!SN.emailOk(d.email.trim())){ setStatus('Please enter a valid email address.', true); return; }

    const saved = [...SN.wish].map(id => (TRIPS.find(t => t.id === id) || {}).title).filter(Boolean);
    const body = [
      'Name: ' + d.name,
      'Email: ' + d.email,
      'Phone: ' + (d.phone || '-'),
      'Destination: ' + d.destination,
      'Travel month: ' + (d.travelMonth || 'Flexible'),
      'Travellers: ' + d.groupSize,
      'Budget per person: ' + d.budget,
      saved.length ? 'Saved trips: ' + saved.join('; ') : '',
      '',
      'Trip details:',
      d.message
    ].join('\n');

    const fields = { Name:d.name, Email:d.email, Phone:d.phone, Destination:d.destination, 'Travel month':d.travelMonth || 'Flexible',
      Travellers:d.groupSize, Budget:d.budget, Trip:trip ? trip.title : (guide || ''), 'Saved trips':saved.join('; '), Message:d.message };
    try{
      await SN.sendEnquiry('Quote request', fields);
      setStatus('Thank you! Your request is with our planners. We\'ll reply within 24 hours.');
    }catch(err){
      location.href = `mailto:${SITE.email}?subject=${encodeURIComponent('Quote request: ' + d.destination)}&body=${encodeURIComponent(body)}`;
      setStatus('Your email app is opening with your request. Just hit send and we\'ll reply within 24 hours.');
    }
    form.reset();
  });
})();
