// Handicraft GREEN - Storefront logic

(function () {
  const LS_PRODUCTS = 'hc_products';
  const LS_CART = 'hc_cart';
  let revealObserver = null;
  let parallaxRaf = null;
  let fileProducts = null;

  function svgPlaceholder(kind) {
    const base = {
      ring: '<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0%" stop-color="#174935"/><stop offset="100%" stop-color="#0f2a20"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="100" cy="70" r="40" fill="none" stroke="#c4a962" stroke-width="6"/><rect x="70" y="30" width="60" height="12" rx="6" fill="#c4a962"/></svg>',
      gem: '<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g2" x1="0" x2="1"><stop offset="0%" stop-color="#14543d"/><stop offset="100%" stop-color="#0b3225"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g2)"/><polygon points="100,20 160,60 140,120 60,120 40,60" fill="#0dd39f" opacity="0.65"/><polygon points="100,20 140,120 60,120" fill="#15a37f" opacity="0.7"/></svg>',
      bracelet: '<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g3" x1="0" x2="1"><stop offset="0%" stop-color="#124635"/><stop offset="100%" stop-color="#0a2a1e"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g3)"/><circle cx="80" cy="75" r="35" fill="none" stroke="#a1dbc4" stroke-width="8" opacity="0.9"/><circle cx="120" cy="75" r="35" fill="none" stroke="#c4a962" stroke-width="6" opacity="0.7"/></svg>',
      earring: '<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g4" x1="0" x2="1"><stop offset="0%" stop-color="#174935"/><stop offset="100%" stop-color="#0f2a20"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g4)"/><rect x="92" y="20" width="16" height="80" rx="8" fill="#c4a962"/><circle cx="100" cy="115" r="18" fill="#e3d7b3" opacity=".85"/></svg>'
    };
    return base[kind] || base.ring;
  }

  function formatPrice(n) {
    return `¥${n.toLocaleString('ja-JP')}`;
  }

  function getStoredProducts() {
    try { return JSON.parse(localStorage.getItem(LS_PRODUCTS) || '[]'); } catch { return []; }
  }

  async function fetchJson(url){
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok) throw new Error('not ok');
    return await res.json();
  }

  async function loadProductsFromFile() {
    // Prefer admin/products.json (editor-origin), then assets/data/products.json
    try{
      let data = await fetchJson('admin/products.json');
      if(Array.isArray(data) && data.length){
        fileProducts = data; try { console.info('[Storefront] Using admin file products:', data.length); } catch {}
        return;
      }
    } catch {}
    try {
      let data = await fetchJson('assets/data/products.json');
      if(Array.isArray(data) && data.length){
        fileProducts = data; try { console.info('[Storefront] Using file products:', data.length); } catch {}
        return;
      }
    } catch {}
  }

  function getProducts() {
    const stored = getStoredProducts();
    if (Array.isArray(fileProducts) && fileProducts.length) {
      if (Array.isArray(stored) && stored.length) {
        const map = new Map();
        // start with file
        fileProducts.forEach(fp => { if (fp && fp.id) map.set(fp.id, fp); });
        // overlay stored (stored wins)
        stored.forEach(s => {
          if (!s || !s.id) return;
          const prev = map.get(s.id) || {};
          map.set(s.id, Object.assign({}, prev, s));
        });
        const merged = Array.from(map.values());
        try { console.info('[Storefront] Using merged products (file->stored override):', merged.length); } catch {}
        return merged;
      }
      return fileProducts;
    }
    if (Array.isArray(stored) && stored.length) {
      try { console.info('[Storefront] Using stored products:', stored.length); } catch {}
      return stored;
    }
    try { console.info('[Storefront] Using sample products (no stored or file data)'); } catch {}
    return window.SampleProducts || [];
  }

  function setCart(cart) {
    localStorage.setItem(LS_CART, JSON.stringify(cart));
    updateCartCount();
  }
  function getCart() {
    try { return JSON.parse(localStorage.getItem(LS_CART) || '[]'); } catch { return []; }
  }
  function addToCart(id) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) item.qty += 1; else cart.push({ id, qty: 1 });
    setCart(cart);
  }
  function updateCartCount() {
    const n = getCart().reduce((s,i)=>s+i.qty,0);
    document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = n);
  }

  // NEWS
  function formatDateStr(d) {
    // expect YYYY-MM-DD, fall back to raw
    if (!d || typeof d !== 'string' || d.length < 10) return d || '';
    const y = d.slice(0,4), m = d.slice(5,7), day = d.slice(8,10);
    return `${y}.${m}.${day}`;
  }
  function mountNews() {
    const root = document.getElementById('newsList');
    if (!root) return;
    const items = (window.News || []).slice(0,5);
    if (!items.length) { root.innerHTML = '<li class="muted">お知らせは現在ありません。</li>'; return; }
    root.innerHTML = '';
    items.forEach((n, i) => {
      const li = document.createElement('li'); li.className = 'news-item reveal';
      li.style.setProperty('--reveal-delay', `${i*80}ms`);
      const time = document.createElement('time'); time.className = 'news-date'; time.textContent = formatDateStr(n.date);
      const title = document.createElement(n.url ? 'a' : 'span');
      if (n.url) { title.href = n.url; title.className = 'news-link'; }
      title.textContent = n.title || '';
      li.append(time, title);
      root.appendChild(li);
    });
  }

  function renderCard(p) {
    const div = document.createElement('div');
    div.className = 'card';
    const media = document.createElement('div');
    media.className = 'media';
    if (p.image && typeof p.image === 'string' && !p.image.startsWith('svg:')) {
      const img = document.createElement('img');
      img.src = p.image; img.alt = p.name || 'product'; img.style.maxWidth='100%'; img.style.maxHeight='100%'; img.style.objectFit='cover';
      img.onerror = () => { media.innerHTML = svgPlaceholder('ring'); };
      media.appendChild(img);
    } else {
      media.innerHTML = (p.image && p.image.startsWith('svg:')) ? svgPlaceholder(p.image.split(':')[1]) : svgPlaceholder('ring');
    }
    const body = document.createElement('div'); body.className = 'body';
    const name = document.createElement('div'); name.className = 'name'; name.textContent = p.name;
    const hasDesc = !!(p.description && String(p.description).trim().length);
    const desc = document.createElement('div');
    if (hasDesc) { desc.className = 'muted'; desc.textContent = String(p.description).trim(); }
    const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.marginTop='8px';
    const price = document.createElement('div'); price.className = 'price'; price.textContent = formatPrice(p.price);
    const btn = document.createElement('button'); btn.className = 'btn btn-primary'; btn.textContent = 'カートに入れる';
    btn.addEventListener('click', ()=> addToCart(p.id));
    row.append(price, btn);
    body.append(name);
    if (hasDesc) body.append(desc);
    body.append(row);
    div.append(media, body);
    return div;
  }

  function mountFeatured() {
    const root = document.getElementById('featured');
    if (!root) return;
    const list = getProducts().filter(p=>p.featured).slice(0,4);
    if (!list.length) { root.innerHTML = '<div class="empty">特集商品は準備中です。</div>'; return; }
    list.forEach((p, i) => {
      const card = renderCard(p);
      if (document.body && document.body.classList.contains('home')) {
        card.classList.add('reveal');
        card.style.setProperty('--reveal-delay', `${i*100}ms`);
      }
      root.appendChild(card);
    });
  }

  function mountProducts() {
    const root = document.getElementById('products');
    if (!root) return;
    const categoryBar = document.getElementById('categoryBar');
    const select = document.getElementById('categorySelect');
    const products = getProducts();
    function render(filter) {
      root.innerHTML = '';
      let list = products;
      if (filter && filter !== 'all') list = products.filter(p=>p.category===filter);
      if (!list.length) { root.innerHTML = '<div class="empty">該当する商品がありません。</div>'; return; }
      list.forEach(p => root.appendChild(renderCard(p)));
    }
    // tags
    if (categoryBar) {
      categoryBar.innerHTML = '';
      (window.Categories||[]).forEach(cat => {
        const a = document.createElement('a'); a.href = '#'; a.className='tag'; a.textContent = cat.label; a.dataset.id = cat.id;
        a.addEventListener('click', (e)=>{ e.preventDefault();
          categoryBar.querySelectorAll('.tag').forEach(x=>x.classList.remove('active'));
          a.classList.add('active');
          render(cat.id);
        });
        if (cat.id === 'all') a.classList.add('active');
        categoryBar.appendChild(a);
      });
    }
    if (select) {
      select.addEventListener('change', ()=> render(select.value));
    }
    render('all');
  }

  function mountCartCount() { updateCartCount(); }

  function initReveal() {
    const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = Array.from(document.querySelectorAll('.reveal, .reveal-blur, [data-reveal]'));
    if (!els.length) return;
    if (prefersReduce || typeof IntersectionObserver === 'undefined') {
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
    }
    els.forEach(el => revealObserver.observe(el));
  }

  function initParallax() {
    const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) return;
    const nodes = Array.from(document.querySelectorAll('[data-parallax-speed]'));
    if (!nodes.length) return;

    const tick = () => {
      parallaxRaf = null;
      const vh = window.innerHeight || 1;
      nodes.forEach(el => {
        const speed = parseFloat(el.getAttribute('data-parallax-speed') || '0');
        if (!speed) return;
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const progress = (center - vh / 2) / vh; // -1..1 おおよそ
        const y = Math.max(-1, Math.min(1, progress)) * speed * 60; // 最大±60px程度
        el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      });
    };

    const onScroll = () => { if (!parallaxRaf) parallaxRaf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // initial
    onScroll();
  }

  document.addEventListener('DOMContentLoaded', function() {
    loadProductsFromFile().finally(() => {
      mountCartCount();
      mountNews();
      mountFeatured();
      mountProducts();
      initReveal();
      initParallax();
    });
  });
})();
