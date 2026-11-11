/* =========================================================
   SafariNomad: "Nomad" AI travel expert (chat widget)
   ---------------------------------------------------------
   Live mode:    when the site runs on server/server.mjs
                 (npm start), questions go to /api/chat and
                 Claude's reply streams in word by word.
   Offline mode: if that server isn't reachable (e.g. Live
                 Server or opening the files directly), Nomad
                 answers from KNOWLEDGE and TRIPS in js/data.js
                 using the site search.

   The conversation is kept for the browser session, so it
   carries on as visitors move between pages.
   ========================================================= */

(function(){
  const $ = s => document.querySelector(s);
  const chat = $('#chat');
  if(!chat || !$('#aiView')) return;

  const ENDPOINT = 'api/chat';
  // Translate a template (see js/i18n.js); {name} placeholders are filled from vars
  const T = (s, vars) => typeof SNI18N !== 'undefined' ? SNI18N.t(s, vars) : s.replace(/\{(\w+)\}/g, (m, k) => vars && k in vars ? vars[k] : m);
  const SUGGESTIONS = ['Plan 10 days in Kenya and Zanzibar', 'Do I need a visa for Tanzania?', 'When can I see the Great Migration?', 'How much is a gorilla permit?'];
  const GREETING = "Jambo! I'm **Nomad**, SafariNomad's AI travel expert. Ask me anything about travel, anywhere in the world: where and when to go, a day-by-day plan, visas, flights, budgets or what to pack. Where would you like to go?";

  const store = {
    get(){ try{ return JSON.parse(sessionStorage.getItem('nomadChat')) || []; }catch(e){ return []; } },
    set(v){ try{ sessionStorage.setItem('nomadChat', JSON.stringify(v.slice(-30))); }catch(e){} }
  };
  // Anonymous id so the admin dashboard can show one visitor's questions together
  function chatSession(){
    let id = '';
    try{ id = sessionStorage.getItem('nomadSession') || ''; }catch(e){}
    if(!id){ id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); try{ sessionStorage.setItem('nomadSession', id); }catch(e){} }
    return id;
  }
  let history = store.get();          // [{ role:'user'|'assistant', content, offline? }]
  let live = !/^file:/.test(location.protocol) && sessionStorage.getItem('nomadOffline') !== '1';
  let busy = false;

  const log = $('#aiLog'), form = $('#aiForm'), input = $('#aiInput'), sendBtn = $('#aiSend'), suggest = $('#aiSuggest');

  /* ---------- Switch between the options view and the AI view ---------- */
  const titleEl = $('#chatTitle'), team = $('#chatTeam'), back = $('#aiBack'), status = $('#chatStatus');
  const original = { title: titleEl.textContent, status: status.innerHTML };
  function openAI(){
    $('.chat-home').hidden = true;
    $('#aiView').hidden = false;
    back.hidden = false;
    team.classList.add('ai-mode');
    team.innerHTML = '<span><i class="fa-solid fa-wand-magic-sparkles"></i></span>';
    titleEl.textContent = 'Nomad · AI travel expert';
    status.className = 'chat-status';
    status.innerHTML = `<i></i> <span>${live ? 'Instant answers, 24/7' : 'Quick answers from our safari guide'}</span>`;
    chat.classList.add('ai-open');
    render();
    setTimeout(() => input.focus(), 50);
    try{ sessionStorage.setItem('nomadOpen', '1'); }catch(e){}
  }
  function closeAI(){
    $('.chat-home').hidden = false;
    $('#aiView').hidden = true;
    back.hidden = true;
    team.classList.remove('ai-mode');
    team.innerHTML = '<span>JK</span><span>AN</span><span>GU</span>';
    titleEl.textContent = original.title;
    status.innerHTML = original.status;
    status.className = 'chat-status' + (chat.classList.contains('is-away') ? ' away' : '');
    chat.classList.remove('ai-open');
    try{ sessionStorage.removeItem('nomadOpen'); }catch(e){}
  }
  $('#aiOpen').addEventListener('click', openAI);
  back.addEventListener('click', closeAI);

  /* ---------- Safe, tiny Markdown: **bold**, [links](url), lists ---------- */
  const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function inline(s){
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
        const ok = /^(https?:\/\/|mailto:|tel:)/i.test(url) || /^[a-z0-9_\-./?=&#%]+$/i.test(url);
        if(!ok || /^javascript:/i.test(url)) return text;
        const ext = /^https?:/i.test(url);
        return `<a href="${url}"${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
      });
  }
  // Also: short headings (## Day 1) as bold lines, numbered steps as numbered lists
  function markdown(text){
    const out = [];
    let list = null, tag = 'ul';
    const close = () => { if(list){ out.push(`<${tag}>${list.join('')}</${tag}>`); list = null; } };
    text.split('\n').forEach(line => {
      if(/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)){ close(); out.push('<hr>'); return; }   // --- divider
      const bullet = line.match(/^\s*[-*•]\s+(.*)$/), num = line.match(/^\s*\d+[.)]\s+(.*)$/);
      if(bullet || num){
        const t = num ? 'ol' : 'ul';
        if(list && t !== tag) close();
        if(!list){ list = []; tag = t; }
        list.push(`<li>${inline((bullet || num)[1])}</li>`);
        return;
      }
      close();
      const head = line.match(/^\s*#{1,4}\s+(.*)$/);
      if(head) out.push(`<p class="ai-h"><b>${inline(head[1].replace(/\*\*/g, ''))}</b></p>`);
      else if(line.trim()) out.push(`<p>${inline(line)}</p>`);
    });
    close();
    return out.join('');
  }

  /* ---------- Rendering ---------- */
  function bubble(m){
    const el = document.createElement('div');
    el.className = `ai-msg ${m.role === 'user' ? 'me' : 'bot'}`;
    el.setAttribute('translate', 'no');
    el.innerHTML = m.role === 'user' ? `<p>${esc(m.content)}</p>` : markdown(m.content) + (m.offline ? `<span class="ai-tag">${T('Quick answer')}</span>` : '');
    return el;
  }
  function render(){
    log.innerHTML = '';
    log.appendChild(bubble({ role:'assistant', content: T(GREETING) }));
    history.forEach(m => log.appendChild(bubble(m)));
    renderSuggestions();
    const asked = log.querySelectorAll('.ai-msg.me');
    if(asked.length) pin(asked[asked.length - 1]); else log.scrollTop = 0;
  }
  // Put a question at the top of the panel, so its answer reads from the start, top to bottom
  function pin(el){ log.scrollTop = Math.max(0, el.offsetTop - 14); }
  function renderSuggestions(){
    const chips = history.length ? [] : SUGGESTIONS.map(q => `<button type="button" class="ai-chip" data-q="${esc(q)}">${esc(q)}</button>`);
    if(history.length >= 2 && history.length < 8) chips.push('<button type="button" class="ai-chip" data-action="quote">Get a free quote</button>');
    if(history.length) chips.push('<button type="button" class="ai-chip" data-action="human">Talk to a human</button>');
    suggest.innerHTML = chips.join('');
  }
  suggest.addEventListener('click', e => {
    const chip = e.target.closest('.ai-chip');
    if(!chip) return;
    if(chip.dataset.action === 'human') return closeAI();
    if(chip.dataset.action === 'quote'){ location.href = 'contact.html'; return; }
    ask(T(chip.dataset.q), chip.dataset.q);   // show it in the visitor's language, match on the English
  });

  /* ---------- Asking ---------- */
  form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  input.addEventListener('keydown', e => {
    if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); ask(input.value); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
  });

  async function ask(text, matchText){
    text = (text || '').trim();
    if(!text || busy) return;
    busy = true; sendBtn.disabled = true;
    input.value = ''; input.style.height = 'auto';
    history.push({ role:'user', content:text });
    log.querySelectorAll('.ai-spacer').forEach(x => x.remove());
    const askedEl = log.appendChild(bubble({ role:'user', content:text }));
    suggest.innerHTML = '';

    const reply = document.createElement('div');
    reply.className = 'ai-msg bot';
    reply.setAttribute('translate', 'no');
    reply.innerHTML = '<span class="ai-typing"><i></i><i></i><i></i></span>';
    log.appendChild(reply);
    // Room below the question so it can sit at the top while the answer fills in underneath
    const spacer = log.appendChild(document.createElement('div'));
    spacer.className = 'ai-spacer';
    const fit = () => { spacer.style.height = Math.max(0, log.clientHeight - (reply.offsetTop + reply.offsetHeight - askedEl.offsetTop) - 40) + 'px'; };
    fit(); pin(askedEl);
    const grow = new ResizeObserver(fit); grow.observe(reply);

    let answer = '', offline = false;
    if(live){
      try { answer = await streamReply(reply); }
      catch(err){ live = false; try{ sessionStorage.setItem('nomadOffline', '1'); }catch(e){} }
    }
    if(!answer){
      offline = true;
      await new Promise(r => setTimeout(r, 450));          // a short, natural pause
      answer = localAnswer(matchText || text);
      reply.setAttribute('translate', 'no');
      reply.innerHTML = markdown(answer) + `<span class="ai-tag">${T('Quick answer')}</span>`;
      status.innerHTML = '<i></i> <span>Quick answers from our safari guide</span>';
    }

    history.push({ role:'assistant', content:answer, offline });
    store.set(history);
    renderSuggestions();
    if(typeof SN !== 'undefined') SN.refresh();
    grow.disconnect(); fit();
    busy = false; sendBtn.disabled = false;
    input.focus();
  }

  /* Stream the reply from the server; throws if the server isn't there */
  async function streamReply(el){
    const messages = history.filter(m => !m.offline || m.role === 'user').map(({ role, content }) => ({ role, content }));
    const res = await fetch(ENDPOINT, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ messages, lang: typeof SNI18N !== 'undefined' ? SNI18N.lang : 'en', session: chatSession(), page: location.pathname.split('/').pop() || 'index.html' }) });
    if(res.status === 429) return T('You are sending messages quickly! Please wait a moment and try again.');
    if(!res.ok || !(res.headers.get('content-type') || '').includes('text/event-stream')) throw new Error('no api');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '', text = '';
    while(true){
      const { value, done } = await reader.read();
      if(done) break;
      buffer += decoder.decode(value, { stream:true });
      const events = buffer.split('\n\n');
      buffer = events.pop();
      for(const ev of events){
        const line = ev.split('\n').find(l => l.startsWith('data: '));
        if(!line) continue;
        const data = JSON.parse(line.slice(6));
        if(data.error){ if(data.fallback && !text) throw new Error(data.error); continue; }
        if(data.status === 'searching'){
          // Nomad is looking something up on the web (visa rules, events, prices…)
          el.innerHTML = (text ? markdown(text) : '') + `<span class="ai-searching"><i class="fa-solid fa-globe"></i> ${T('Searching the web…')}</span>`;
          continue;
        }
        if(data.t){
          text += data.t;
          el.innerHTML = markdown(text);
        }
      }
    }
    if(!text) throw new Error('empty');
    return text;
  }

  /* ---------- Offline answers from js/data.js ---------- */
  // Filler words that shouldn't decide what a question is about
  const STOP = new Set(('what which when where who whom how much many does did can could would should will the for and with best good nice ' +
    'you your our are was were is do need want like about tell me any some there this that these those safari safaris trip trips tour tours ' +
    'please have has get go going see from into with just really very also its it they them their there here know think').split(' '));

  function localAnswer(q){
    const norm = typeof SNSearch !== 'undefined' ? SNSearch.norm : s => s.toLowerCase();
    const words = norm(q).split(' ').filter(w => w.length > 2 && !STOP.has(w));
    const topic = words.join(' ');
    const trips = [];
    const dollars = n => '$' + n.toLocaleString('en-US');
    const link = t => `[${T(t.title)}](book.html?trip=${t.id}) · ${T('{days} days, from {price}', { days:t.days, price:dollars(t.price) })}`;

    // Price questions: "under $2,000", "less than 1500"
    const price = q.match(/(?:under|below|less than|max|budget|<)\s*\$?\s*(\d[\d,]{2,})/i);
    if(price){
      const max = +price[1].replace(/,/g, '');
      // anything else they asked for ("gorilla trek under 3000") narrows the list
      const rest = q.replace(price[0], '').replace(/\b(safari|safaris|trip|trips|tour|tours|cheap|budget|for|a|the|per person|pp)\b/gi, ' ').trim();
      const fits = TRIPS.filter(t => t.price <= max && (!rest || typeof SNSearch === 'undefined' || SNSearch.tripMatches(t, rest)));
      fits.sort((a, b) => b.reviews - a.reviews).slice(0, 3).forEach(t => trips.push(t));
      const intro = rest && fits.length ? 'Here are the best-matching trips from **{max} or less** per person:' : 'Here are our most popular trips from **{max} or less** per person:';
      if(trips.length) return `${T(intro, { max:dollars(max) })}\n${trips.map(t => '- ' + link(t)).join('\n')}\n${T('See more on the [trips page]({url}), or ask for a [free quote](contact.html).', { url:'trips.html?max=' + max })}`;
      if(rest) return T("I couldn't find a matching trip under {max} on our current list, but our experts can often build one to fit your budget. [Request a free quote](contact.html) and tell us what you have in mind.", { max:dollars(max) });
    }

    // Best matching fact
    let best = null, bestScore = 0;
    KNOWLEDGE.forEach(k => {
      const hay = norm(k.q + ' ' + k.tags + ' ' + T(k.q));
      const score = words.filter(w => hay.includes(w) || hay.includes(w.replace(/s$/, ''))).length;
      if(score > bestScore){ best = k; bestScore = score; }
    });

    // Matching trips via the site search
    if(typeof SNSearch !== 'undefined'){
      if(topic) SNSearch.search(topic, 20).filter(x => x.trip).slice(0, 3).forEach(x => trips.push(x.trip));
    }

    const parts = [];
    if(best && bestScore >= 1){
      parts.push(T(best.a)
        .replace(/\bcontact\.html\b/g, '[free quote](contact.html)')
        .replace(/\bservices\.html\b/g, '[our services page](services.html)')
        .replace(/\bflights\.html\b/g, '[flights page](flights.html)'));
    }
    if(trips.length) parts.push(`${T(parts.length ? 'Trips you might like:' : 'Here are some trips that match:')}\n${trips.map(t => '- ' + link(t)).join('\n')}`);
    if(!parts.length){
      return T("I'm not sure about that one, but our safari experts will know. You can [request a free quote](contact.html), message us on [WhatsApp]({wa}) or call {phone}.", { wa:'https://wa.me/' + SITE.whatsapp, phone:SITE.phone });
    }
    parts.push(T('Want a tailored plan? [Request a free quote](contact.html).'));
    return parts.join('\n\n');
  }

  document.addEventListener('langchange', () => { if(!$('#aiView').hidden) render(); });

  // Open the chat and ask straight away (e.g. from a search that found nothing)
  function askAbout(text){
    chat.classList.add('open');
    $('#chatLauncher').setAttribute('aria-expanded', 'true');
    openAI();
    ask(text);
  }
  window.NomadAssistant = { open: openAI, ask, askAbout, localAnswer };

  // Re-open the AI view if the visitor was chatting on the previous page
  try{ if(sessionStorage.getItem('nomadOpen') === '1'){ chat.classList.add('open'); openAI(); } }catch(e){}

  // Closing the chat panel any way (X, Escape, clicking outside, the launcher) forgets that the visitor
  // was chatting, so the chat stays closed on the next pages until they open it again
  new MutationObserver(() => {
    if(!chat.classList.contains('open')){ try{ sessionStorage.removeItem('nomadOpen'); }catch(e){} }
  }).observe(chat, { attributes:true, attributeFilter:['class'] });
})();
