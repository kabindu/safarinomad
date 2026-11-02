/* =========================================================
   SafariNomad: whole-site translation engine
   ---------------------------------------------------------
   English is written in the HTML and scripts as normal. When a
   visitor picks another language, every piece of visible text
   (and placeholders, tooltips, aria-labels, the page title) is
   swapped for its translation from lang/fr.js, lang/es.js or lang/de.js.
   Content added later (trip cards, filters, search
   results, chat...) is translated automatically as it appears.

   Dictionary keys are the English text with numbers replaced
   by {n}, so "Showing 17 of 17 trips" uses one entry:
       "of {n} trips": "sur {n} voyages"

   Anything missing from a dictionary is, when the site runs on
   server/server.mjs, translated by Claude and saved for next time.

   To keep something in English (names, user input), give it
   translate="no".
   ========================================================= */

const SNI18N = (function(){
  const LANGS = { en:'English', fr:'Français', es:'Español', de:'Deutsch' };
  window.I18N_DICT = window.I18N_DICT || {};
  let lang = 'en';
  let dict = {};
  let paused = false;

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'SVG']);
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  const NUM = /\d[\d,.]*/g;
  const SEPARATORS = /(\s[·•→|]\s|\s—\s)/;

  const original = new WeakMap();     // text node → English text
  const lastSet = new WeakMap();      // text node → what we last wrote
  const attrOriginal = new WeakMap(); // element → { attr: English }
  const missing = new Set();
  const originalTitle = document.title;

  /* ---------- Lookup ---------- */
  function exact(core){
    const nums = [];
    const key = core.replace(NUM, m => { nums.push(m); return '{n}'; });
    const hit = dict[key];
    if(hit === undefined) return { key, hit:null };
    let i = 0;
    return { key, hit: hit.replace(/\{n\}/g, () => nums[i++] ?? '') };
  }

  function lookup(core){
    if(!/[A-Za-z]/.test(core)) return core;               // numbers, symbols, emoji
    if(/^[A-Z]{1,4}$/.test(core) || /^(\S+@\S+|(https?:\/\/|www\.)\S+|[\w-]+\.html\S*)$/.test(core) || core === 'SafariNomad') return core; // codes, initials, emails, links, brand
    const whole = exact(core);
    if(whole.hit !== null) return whole.hit;
    // "Kenya · Tanzania", "Nairobi → Maasai Mara": translate the pieces
    if(SEPARATORS.test(core)){
      const parts = core.split(SEPARATORS);
      let found = false;
      const out = parts.map((p, i) => {
        const piece = p.trim();
        if(i % 2 || !/[A-Za-z]/.test(piece) || piece === 'SafariNomad') return p;
        const r = exact(piece);
        if(r.hit !== null){ found = true; return p.replace(piece, r.hit); }
        missing.add(r.key);
        return p;
      });
      if(found) return out.join('');
    }
    missing.add(whole.key);
    return null;
  }

  /* Translate a string from code: SNI18N.t('Hello {name}', { name:'Ana' }) */
  function t(str, vars){
    let out = String(str);
    if(lang !== 'en'){
      const hit = lookup(out.replace(/\s+/g, ' ').trim());
      if(hit !== null) out = hit;
    }
    if(vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return out;
  }

  /* ---------- Applying to the page ---------- */
  function skip(el){
    for(let e = el; e && e !== document.body; e = e.parentElement){
      if(SKIP_TAGS.has(e.tagName) || e.getAttribute('translate') === 'no') return true;
    }
    return false;
  }

  function translateText(node){
    let en = original.get(node);
    if(en === undefined || node.data !== lastSet.get(node)){ en = node.data; original.set(node, en); }
    let next = en;
    if(lang !== 'en'){
      const core = en.replace(/\s+/g, ' ').trim();
      if(core){
        const hit = lookup(core);
        if(hit !== null) next = en.match(/^\s*/)[0] + hit + en.match(/\s*$/)[0];
      }
    }
    if(node.data !== next) node.data = next;
    lastSet.set(node, next);
  }

  function translateAttrs(el){
    let orig = attrOriginal.get(el);
    if(!orig){ orig = {}; attrOriginal.set(el, orig); }
    ATTRS.forEach(a => {
      if(!el.hasAttribute(a)) return;
      const cur = el.getAttribute(a);
      if(!(a in orig) || cur !== orig['_' + a]) orig[a] = cur;
      let next = orig[a];
      if(lang !== 'en' && orig[a].trim()){ const hit = lookup(orig[a].trim()); if(hit !== null) next = hit; }
      orig['_' + a] = next;
      if(cur !== next) el.setAttribute(a, next);
    });
  }

  function translateTree(root){
    if(!root) return;
    if(root.nodeType === 3){ if(root.data.trim() && !skip(root.parentElement)) translateText(root); return; }
    if(root.nodeType !== 1 || skip(root)) return;
    translateAttrs(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.nodeType === 1 && (SKIP_TAGS.has(n.tagName) || n.getAttribute('translate') === 'no'))
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    for(let n = walker.nextNode(); n; n = walker.nextNode()){
      if(n.nodeType === 3){ if(n.data.trim()) translateText(n); }
      else translateAttrs(n);
    }
  }

  function translatePage(){
    paused = true;
    translateTree(document.body);
    document.title = lang === 'en' ? originalTitle : t(originalTitle);
    document.documentElement.lang = lang;
    paused = false;
    requestMissing();
  }

  /* ---------- Watch for new or changed content ---------- */
  const observer = new MutationObserver(records => {
    if(paused || lang === 'en') return;
    paused = true;
    for(const r of records){
      if(!r.target.isConnected) continue;           // replaced again before we got to it
      if(r.type === 'characterData'){
        if(r.target.data !== lastSet.get(r.target) && r.target.data.trim() && !skip(r.target.parentElement)) translateText(r.target);
      }
      else if(r.type === 'attributes'){ if(!skip(r.target)) translateAttrs(r.target); }
      else r.addedNodes.forEach(n => n.isConnected && translateTree(n));
    }
    paused = false;
    requestMissing();
  });

  /* ---------- Fill gaps with Claude (when server/server.mjs is running) ---------- */
  let gapTimer, serverOK = !/^file:/.test(location.protocol);
  function requestMissing(){
    if(lang === 'en' || !serverOK || !missing.size) return;
    clearTimeout(gapTimer);
    gapTimer = setTimeout(async () => {
      const batch = [...missing].slice(0, 80);
      batch.forEach(k => missing.delete(k));
      try{
        const res = await fetch('api/translate', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ lang, strings: batch }) });
        if(!res.ok) throw new Error(res.status);
        const { translations } = await res.json();
        if(translations && Object.keys(translations).length){
          Object.assign(dict, translations);
          try{
            const cache = JSON.parse(localStorage.getItem('i18n-extra-' + lang) || '{}');
            localStorage.setItem('i18n-extra-' + lang, JSON.stringify(Object.assign(cache, translations)));
          }catch(e){}
          translatePage();
        }
      }catch(e){ serverOK = false; }
    }, 500);
  }

  /* ---------- Loading a language ---------- */
  function loadDict(code){
    return new Promise(resolve => {
      if(window.I18N_DICT[code]) return resolve();
      const s = document.createElement('script');
      s.src = `lang/${code}.js`;
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  }

  async function setLang(code){
    if(!LANGS[code]) code = 'en';
    if(code !== 'en') await loadDict(code);
    lang = code;
    dict = code === 'en' ? {} : Object.assign({}, window.I18N_DICT[code] || {});
    if(code !== 'en'){
      try{ Object.assign(dict, JSON.parse(localStorage.getItem('i18n-extra-' + code) || '{}')); }catch(e){}
    }
    missing.clear();
    try{ localStorage.setItem('lang', JSON.stringify(code)); }catch(e){}
    translatePage();
    document.dispatchEvent(new CustomEvent('langchange', { detail:{ lang:code } }));
    document.documentElement.style.visibility = '';
  }

  function start(){
    let saved = 'en';
    try{ saved = JSON.parse(localStorage.getItem('lang')) || 'en'; }catch(e){}
    observer.observe(document.body, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTRS });
    if(saved !== 'en'){
      document.documentElement.style.visibility = 'hidden';              // avoid a flash of English
      setTimeout(() => { document.documentElement.style.visibility = ''; }, 1500);
      setLang(saved);
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  return {
    t, setLang,
    get lang(){ return lang; },
    get name(){ return LANGS[lang]; },
    languages: LANGS,
    missing: () => [...missing]
  };
})();
