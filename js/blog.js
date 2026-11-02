/* =========================================================
   SafariNomad: blog page
   Renders the article list, sidebar and single-article view
   from js/blog-data.js. Open an article directly with a link
   like blog.html#packing (the article id).
   ========================================================= */

let currentFilter = 'All';
let currentPage = 1;
const PER_PAGE = 9;

const TAG_MAP = {
  'Wildlife':'tag-wildlife', 'Trekking':'tag-trekking', 'Travel Tips':'tag-tips', 'Culture':'tag-culture',
  'Gear':'tag-gear', 'Destinations':'tag-destinations', 'Planning':'tag-planning'
};
const tagClass = cat => TAG_MAP[cat] || 'tag-tips';
const initials = name => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const avatar = (auth, size) => `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size/2.8)}px">${initials(auth.name)}</span>`;

function cardHTML(a){
  const auth = AUTHORS[a.author];
  // YouTube video-card layout: thumbnail + read-time badge, avatar, title, author, views • date
  return `<div class="blog-card" onclick="showArticle('${a.id}')">
    <div class="bc-img">
      <img src="${a.cover}" alt="${a.title}" loading="lazy">
      <div class="bc-tag"><span class="tag-pill ${tagClass(a.cat)}">${a.cat}</span></div>
      <span class="dur">${a.readTime.replace(' read', '')}</span>
    </div>
    <div class="bc-body">
      ${avatar(auth, 36)}
      <div>
        <h4>${a.title}</h4>
        <div class="bc-meta">${auth.name}<i class="fa-solid fa-circle-check"></i></div>
        <div class="bc-meta">${a.views} views • ${a.date}</div>
      </div>
    </div>
  </div>`;
}

function renderFeatured(){
  const a = ARTICLES[0], auth = AUTHORS[a.author];
  document.getElementById('featured').innerHTML = `
    <div class="featured-img"><img src="${a.cover}" alt="${a.title}"></div>
    <div class="featured-body">
      <div class="featured-label">
        <span class="tag-pill ${tagClass(a.cat)}">${a.cat}</span>
        <span style="color:var(--gray);font-size:13px;display:flex;align-items:center;gap:5px;"><i class="fa-regular fa-clock"></i> ${a.readTime}</span>
      </div>
      <h2>${a.title}</h2>
      <p>${a.excerpt}</p>
      <div class="author-row">${avatar(auth, 40)}<div><div class="name">${auth.name}</div><div class="meta">${auth.role} · ${a.date}</div></div></div>
    </div>`;
  document.getElementById('featured').onclick = () => showArticle(a.id);
}

function renderGrid(){
  const filtered = currentFilter === 'All' ? ARTICLES : ARTICLES.filter(a => a.cat === currentFilter);
  const total = filtered.length;
  const pages = Math.ceil(total / PER_PAGE);
  const slice = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  document.getElementById('articleCount').textContent = `${total} article${total !== 1 ? 's' : ''}`;
  document.getElementById('blogGrid').innerHTML = slice.map(cardHTML).join('');
  const pg = document.getElementById('pagination');
  let html = '';
  if(pages > 1){
    if(currentPage > 1) html += `<button class="pg-btn" onclick="changePage(${currentPage - 1})" aria-label="Previous page"><i class="fa-solid fa-chevron-left"></i></button>`;
    for(let i = 1; i <= pages; i++) html += `<button class="pg-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    if(currentPage < pages) html += `<button class="pg-btn" onclick="changePage(${currentPage + 1})" aria-label="Next page"><i class="fa-solid fa-chevron-right"></i></button>`;
  }
  pg.innerHTML = html;
}

function changePage(n){ currentPage = n; renderGrid(); window.scrollTo({top:300, behavior:'smooth'}); }

function filterCat(cat, pill){
  currentFilter = cat;
  currentPage = 1;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.toggle('active', pill ? p === pill : p.dataset.cat === cat));
  document.getElementById('gridHeading').textContent = cat === 'All' ? 'Latest Articles' : cat;
  renderGrid();
  showView('listing');
}

function renderSidebar(recentId, catsId){
  document.getElementById(recentId).innerHTML = ARTICLES.slice(0, 5).map(a =>
    `<div class="recent-item" onclick="showArticle('${a.id}')">
      <img src="${a.cover}" alt="" loading="lazy">
      <div><h6>${a.title}</h6><span>${a.date}</span></div>
    </div>`).join('');
  const cats = {};
  ARTICLES.forEach(a => cats[a.cat] = (cats[a.cat] || 0) + 1);
  document.getElementById(catsId).innerHTML = `<div class="cat-list">${Object.entries(cats).map(([c, n]) =>
    `<a onclick="filterCat('${c}',null)">${c}<span>${n}</span></a>`).join('')}</div>`;
}

function showArticle(id){
  const a = ARTICLES.find(x => x.id === id);
  if(!a) return;
  const auth = AUTHORS[a.author];
  document.getElementById('artHeroImg').src = a.cover;
  document.getElementById('artHeroImg').alt = a.title;
  document.getElementById('artHeroTag').innerHTML = `<span class="tag-pill ${tagClass(a.cat)}">${a.cat}</span>`;
  document.getElementById('artHeroTitle').textContent = a.title;
  document.getElementById('artMeta').innerHTML = `
    <div class="am-author">${avatar(auth, 36)} <span>${auth.name} · ${auth.role}</span></div>
    <div class="am-date"><i class="fa-regular fa-calendar"></i> ${a.date}</div>
    <div class="am-date"><i class="fa-regular fa-clock"></i> ${a.readTime}</div>
    <div class="am-date"><i class="fa-solid fa-eye"></i> ${a.views} views</div>`;
  document.getElementById('artBreadcrumb').textContent = a.title.length > 40 ? a.title.substring(0, 40) + '…' : a.title;
  document.getElementById('artBody').innerHTML = a.body;
  document.getElementById('artAuthorBio').innerHTML = `
    ${avatar(auth, 80)}
    <div><h5 style="font-family:var(--font-body);font-weight:700;font-size:16px;margin-bottom:4px;">About ${auth.name}</h5>
    <p style="color:var(--gray);font-size:13.5px;margin-bottom:10px;">${auth.role}</p>
    <p style="font-size:14px;color:#3a4a3a;">${auth.bio}</p></div>`;
  const related = ARTICLES.filter(x => x.id !== id && (x.cat === a.cat || x.author === a.author)).slice(0, 3);
  document.getElementById('relatedGrid').innerHTML = related.map(r =>
    cardHTML(r)).join('');
  renderSidebar('artSidebarRecent', 'artSidebarCats');
  history.replaceState(null, '', '#' + id);
  document.title = a.title + ' | SafariNomad Blog';
  showView('article');
  window.scrollTo({top:0, behavior:'smooth'});
}

function showView(v){
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.getElementById('view-' + v).classList.add('active');
  if(v === 'listing'){
    history.replaceState(null, '', location.pathname + location.search);
    document.title = 'Safari Blog: East Africa Guides & Travel Notes | SafariNomad';
    window.scrollTo({top:0, behavior:'smooth'});
  }
}

function doSearch(){
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  if(!q) return;
  currentFilter = 'All';
  currentPage = 1;
  const results = ARTICLES.filter(a => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.cat.toLowerCase().includes(q));
  const safe = q.replace(/[<>&"]/g, '');
  document.getElementById('blogGrid').innerHTML = results.length
    ? results.map(cardHTML).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--gray);"><i class="fa-solid fa-magnifying-glass" style="font-size:40px;opacity:.3;display:block;margin-bottom:16px;"></i>No articles found for "<strong>${safe}</strong>".<br><br><button class="btn btn-sm" onclick="filterCat('All',null)">Show All Articles</button></div>`;
  document.getElementById('articleCount').textContent = `${results.length} result${results.length !== 1 ? 's' : ''} for "${safe}"`;
  document.getElementById('gridHeading').textContent = 'Search Results';
  document.getElementById('pagination').innerHTML = '';
  showView('listing');
  document.getElementById('gridHeading').scrollIntoView({behavior:'smooth'});
}

function subscribe(btn){
  const input = btn.parentElement.querySelector('input');
  if(!SN.emailOk(input.value.trim())){ SN.toast('Please enter a valid email address'); return; }
  input.value = '';
  SN.toast('You\'re subscribed! Safari tips incoming.');
}

function shareTo(network){
  const url = encodeURIComponent(location.href);
  const text = encodeURIComponent(document.getElementById('artHeroTitle').textContent);
  const links = {
    fb: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    tw: `https://x.com/intent/tweet?url=${url}&text=${text}`,
    wa: `https://wa.me/?text=${text}%20${url}`,
    lk: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
  };
  window.open(links[network], '_blank', 'noopener');
}

/* ---------- Start ---------- */
renderFeatured();
renderGrid();
renderSidebar('sidebarRecent', 'sidebarCats');
document.getElementById('searchInput').addEventListener('keydown', e => { if(e.key === 'Enter') doSearch(); });
const startHash = location.hash.replace('#', '');
if(startHash && ARTICLES.find(a => a.id === startHash)) showArticle(startHash);
