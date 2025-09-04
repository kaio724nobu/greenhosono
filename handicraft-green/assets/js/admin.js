(function(){
  const LS_PRODUCTS = 'hc_products';
  let API_BASE = '';
  // Allow override via <meta name="api-base" content="https://api.example.com"> or window.API_BASE
  try {
    const m = document.querySelector && document.querySelector('meta[name="api-base"]');
    if(m && m.content) API_BASE = String(m.content).replace(/\/$/, '');
    if(!API_BASE && typeof window !== 'undefined' && window.API_BASE){
      API_BASE = String(window.API_BASE).replace(/\/$/, '');
    }
  } catch {}

  function getProducts(){ try { return JSON.parse(localStorage.getItem(LS_PRODUCTS)||'[]'); } catch { return []; } }
  function setProducts(list){
    try { localStorage.setItem(LS_PRODUCTS, JSON.stringify(list)); }
    catch (e) { console.warn('[Admin] localStorage save failed, continuing with file save'); }
  }
  function upsertProduct(p){
    const list = getProducts();
    const idx = list.findIndex(x=>x.id===p.id);
    if(idx>-1) list[idx]=p; else list.push(p);
    setProducts(list);
    syncToFile(list);
  }
  function removeProduct(id){ setProducts(getProducts().filter(p=>p.id!==id)); }
  function removeAndSync(id){ const list = getProducts().filter(p=>p.id!==id); setProducts(list); syncToFile(list); }

  function uuid(){ return 'p-' + Math.random().toString(36).slice(2,8) + '-' + Date.now().toString(36); }
  function parsePrice(v){
    if (typeof v === 'number') return v|0;
    if (!v) return 0;
    const s = String(v).replace(/[^0-9]/g,'');
    return parseInt(s||'0',10)||0;
  }

  function renderTable(){
    const root = document.getElementById('adminProductsTable'); if(!root) return;
    const list = getProducts();
    if(!list.length){ root.innerHTML = '<div class="empty">商品はまだありません。「新規作成」から追加してください。</div>'; return; }
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>操作</th><th>画像</th><th>ID</th><th>商品名</th><th>カテゴリ</th><th>価格</th><th>特集</th><th>削除</th></tr></thead>';
    const tbody = document.createElement('tbody');
    list.forEach(p=>{
      const tr = document.createElement('tr');
      const src = (p.image && !String(p.image).startsWith('svg:')) ? (typeof resolvePath==='function'? resolvePath(String(p.image)) : String(p.image)) : '';
      const thumbHTML = src ? `<img src="${src}" alt="" style="width:48px;height:36px;object-fit:cover;border-radius:6px;" onerror="this.replaceWith(document.createTextNode('NG'))">` : '<span class="muted">-</span>';

      // 操作（編集）
      const tdEdit = document.createElement('td'); tdEdit.className='table-actions';
      const be = document.createElement('button'); be.className='btn btn-primary'; be.textContent='編集'; be.addEventListener('click',()=> fillForm(p));
      tdEdit.append(be); tr.appendChild(tdEdit);

      // 画像
      const tdImg = document.createElement('td'); tdImg.innerHTML = thumbHTML; tr.appendChild(tdImg);
      // ID
      const tdId = document.createElement('td'); tdId.className = 'muted'; tdId.textContent = p.id; tr.appendChild(tdId);
      // 商品名
      const tdName = document.createElement('td'); tdName.textContent = p.name; tr.appendChild(tdName);
      // カテゴリ
      const tdCat = document.createElement('td'); tdCat.textContent = p.category; tr.appendChild(tdCat);
      // 価格
      const tdPrice = document.createElement('td'); tdPrice.textContent = `¥${(p.price||0).toLocaleString('ja-JP')}`; tr.appendChild(tdPrice);
      // 特集
      const tdFeat = document.createElement('td'); tdFeat.innerHTML = p.featured ? '<span class="badge success">掲載</span>' : '-'; tr.appendChild(tdFeat);

      // 削除
      const tdDel = document.createElement('td'); tdDel.className='table-actions';
      const bd = document.createElement('button'); bd.className='btn btn-danger'; bd.textContent='削除'; bd.addEventListener('click',()=>{ if(confirm('削除しますか？')){ removeAndSync(p.id); renderTable(); }});
      tdDel.append(bd); tr.appendChild(tdDel);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody); root.innerHTML=''; root.appendChild(table);
  }

  function fillForm(p){
    (document.getElementById('pid')||{}).value = p.id;
    (document.getElementById('pname')||{}).value = p.name || '';
    (document.getElementById('pcat')||{}).value = p.category || 'silver';
    (document.getElementById('pprice')||{}).value = String(p.price||0);
    (document.getElementById('pdesc')||{}).value = p.description || '';
    (document.getElementById('pimage')||{}).value = p.image || 'svg:ring';
    (document.getElementById('pfeat')||{}).checked = !!p.featured;

    // preview
    const prev = document.getElementById('pimagePreview');
    const empty = document.getElementById('pimagePreviewEmpty');
    if(prev && empty){
      const src = p.image || '';
      if(typeof src === 'string' && (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:'))){
        prev.src = src; prev.style.display='block'; empty.style.display='none';
      } else {
        prev.removeAttribute('src'); prev.style.display='none'; empty.style.display='block';
      }
    }
  }

  function clearForm(){
    const file = document.getElementById('pimageFile'); if(file) file.value='';
    fillForm({ id: '', name:'', category:'silver', price:0, description:'', image:'', featured:false });
  }

  function setupImageUpload(){
    const file = document.getElementById('pimageFile'); if(!file) return;
    file.addEventListener('change', ()=>{
      const f = file.files && file.files[0];
      if(!f){ return; }
      const ok = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/heic','image/heif'];
      if(!ok.includes(f.type)){
        alert('対応していない画像形式です（jpeg/png/webp/gif/svg）');
        file.value=''; return;
      }
      // If API is available, upload file and set URL
      uploadViaApi(f).then(url => {
        if(url){
          const inp = document.getElementById('pimage'); if(inp) inp.value = url;
          const prev = document.getElementById('pimagePreview');
          const empty = document.getElementById('pimagePreviewEmpty');
          if(prev && empty){ prev.src = resolvePath(url); prev.style.display='block'; empty.style.display='none'; }
        } else {
          // Fallback: Data URL store (may fail for large files)
          const reader = new FileReader();
          reader.onload = ()=>{
            const dataURL = reader.result;
            const inp = document.getElementById('pimage'); if(inp) inp.value = dataURL;
            const prev = document.getElementById('pimagePreview');
            const empty = document.getElementById('pimagePreviewEmpty');
            if(prev && empty){ prev.src = dataURL; prev.style.display='block'; empty.style.display='none'; }
          };
          reader.readAsDataURL(f);
        }
      });
    });
  }

  function resolvePath(v){
    if(!v) return '';
    if(v.startsWith('http') || v.startsWith('data:') || v.startsWith('blob:') || v.startsWith('/')) return v;
    if(v.startsWith('./assets/')) return '../' + v.slice(2);
    if(v.startsWith('assets/')) return '../' + v;
    return v;
  }

  function api(url){ return (API_BASE || '') + url; }

  async function detectApiBase(){
    // If already provided via override, just verify it
    const tryBases = [];
    if (API_BASE) tryBases.push(API_BASE);
    if (typeof window !== 'undefined' && window.location && window.location.origin) tryBases.push(window.location.origin);
    tryBases.push('');
    tryBases.push('http://localhost:8000','http://127.0.0.1:8000','http://localhost:8080','http://127.0.0.1:8080');
    for(const b of tryBases){
      const base = String(b||'').replace(/\/$/, '');
      try{
        const r = await fetch(base + '/api/health', { cache: 'no-store' });
        if(r && r.ok){ API_BASE = base; return true; }
      }catch{}
    }
    return false;
  }

  async function uploadViaApi(file){
    try {
      const fd = new FormData();
      fd.append('file', file, file.name || 'upload');
      if(!API_BASE) await detectApiBase();
      const res = await fetch(api('/api/upload'), { method:'POST', body: fd });
      if(!res.ok) throw new Error('upload failed');
      const json = await res.json();
      if(json && json.ok && json.path){ return json.path; }
      return '';
    } catch (e) {
      console.warn('[Admin] upload API not available or failed; using data URL fallback');
      return '';
    }
  }

  function setupImageInputPreview(){
    const inp = document.getElementById('pimage');
    if(!inp) return;
    const resolve = (v)=>{
      if(!v) return '';
      if(v.startsWith('http') || v.startsWith('data:') || v.startsWith('blob:')) return v;
      if(v.startsWith('/')) return v; // root-relative
      if(v.startsWith('./assets/')) return '../' + v.slice(2);
      if(v.startsWith('assets/')) return '../' + v;
      return v;
    };
    const apply = () => {
      const v = (inp.value||'').trim();
      const prev = document.getElementById('pimagePreview');
      const empty = document.getElementById('pimagePreviewEmpty');
      if(prev && empty){
        if(v && !v.startsWith('svg:')){
          prev.src = resolve(v); prev.style.display='block'; empty.style.display='none';
        } else {
          prev.removeAttribute('src'); prev.style.display='none'; empty.style.display='block';
        }
      }
    };
    inp.addEventListener('input', apply);
    inp.addEventListener('change', apply);
  }

  function handleForm(){
    const form = document.getElementById('productForm'); if(!form) return;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const data = {
        id: (document.getElementById('pid')||{}).value || uuid(),
        name: (document.getElementById('pname')||{}).value || '',
        category: (document.getElementById('pcat')||{}).value || 'silver',
        price: parseInt((document.getElementById('pprice')||{}).value||'0',10)||0,
        description: (document.getElementById('pdesc')||{}).value || '',
        image: (document.getElementById('pimage')||{}).value || 'svg:ring',
        featured: !!((document.getElementById('pfeat')||{}).checked)
      };
      upsertProduct(data); clearForm(); renderTable(); alert('保存しました');
    });
    const newBtn = document.getElementById('newBtn'); if(newBtn){ newBtn.addEventListener('click', (e)=>{ e.preventDefault(); clearForm(); }); }

    // Import JSON handler
    const importBtn = document.getElementById('importJsonBtn');
    if(importBtn){
      importBtn.addEventListener('click', ()=>{
        const ta = document.getElementById('importJson');
        if(!ta) return;
        let list;
        try{ list = JSON.parse(ta.value||'[]'); }catch{ alert('JSONの形式を確認してください'); return; }
        if(!Array.isArray(list)){ alert('配列のJSONを貼り付けてください'); return; }
        const mapped = list.map((x,i)=>({
          id: uuid(),
          name: x.name || x.title || `商品${i+1}`,
          category: (x.category || 'silver'),
          price: parsePrice(x.price),
          description: x.description || '',
          image: x.image || x.img || '',
          featured: !!x.featured
        }));
        const merged = getProducts().concat(mapped);
        setProducts(merged);
        syncToFile(merged);
        renderTable();
        alert(`${mapped.length}件 取り込みました。必要に応じてカテゴリ等を編集してください。`);
      });
      const helpBtn = document.getElementById('importHelpBtn');
      helpBtn && helpBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        alert('1) minneのショップ一覧ページを開く\n2) ページ下までスクロールして全商品を表示\n3) 以下のスニペットをブラウザのコンソールに貼り付けて実行\n4) 出力されたJSONをコピーし、ここに貼り付けて読み込み\n\nスニペットはREADMEのImport手順をご確認ください。');
      });

      const exportBtn = document.getElementById('exportJsonBtn');
      exportBtn && exportBtn.addEventListener('click', async ()=>{
        const list = getProducts();
        const json = JSON.stringify(list, null, 2);
        try{
          await navigator.clipboard.writeText(json);
          alert(`${list.length}件をクリップボードにコピーしました。`);
        } catch {
          // fallback: open a prompt
          window.prompt('コピーしてください', json);
        }
      });

      bindActionButtons();
    }
  }

  function bindActionButtons(){
    const attach = (selector, fn) => {
      document.querySelectorAll(selector).forEach(el => {
        if(el._bound) return; el._bound = true;
        el.addEventListener('click', fn);
      });
    };
    attach('#saveToFileBtn, [data-action="save-file"]', async ()=>{
      const list = getProducts(); await syncToFile(list);
      alert('ファイルに保存しました（assets/data/products.json）');
    });
    attach('#saveToAdminBtn, [data-action="save-admin"]', async ()=>{
      const list = getProducts(); await syncToAdminFile(list);
      alert('adminに保存しました（admin/products.json）');
    });
    attach('#clearCacheBtn, [data-action="clear-cache"]', ()=>{
      localStorage.removeItem(LS_PRODUCTS);
      alert('ブラウザ側の商品キャッシュ（localStorage）を削除しました。ページを再読み込みします。');
      location.reload();
    });
  }

  async function syncToFile(list){
    try{
      if(!API_BASE) await detectApiBase();
      const res = await fetch(api('/api/products'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(list)
      });
      if(!res.ok) throw new Error('save failed');
      console.info('[Admin] Saved to file');
      setStatus(true);
    } catch(e){
      console.warn('[Admin] File save failed. Is server.py running?');
      setStatus(false);
    }
  }

  async function syncToAdminFile(list){
    try{
      if(!API_BASE) await detectApiBase();
      const res = await fetch(api('/api/admin-products'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(list)
      });
      if(!res.ok) throw new Error('save failed');
      console.info('[Admin] Saved to admin file');
      setStatus(true);
    } catch(e){
      console.warn('[Admin] Admin file save failed. Is server.py running?');
      setStatus(false);
    }
  }

  async function checkHealth(){
    const ok = await detectApiBase();
    setStatus(ok);
    if(ok){ console.info('[Admin] API connected:', API_BASE || '(relative)'); }
  }

  function setStatus(ok){
    const el = document.getElementById('fileStatus');
    if(!el) return;
    el.textContent = ok ? 'ファイル保存API: 接続OK' : 'ファイル保存API: 未接続（server.py を起動）';
    el.className = ok ? 'badge success' : 'badge';
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const guard = document.body && document.body.dataset && document.body.dataset.adminPage;
    if(guard){ if(window.AdminAuth){ window.AdminAuth.requireAdmin(); } }
    renderTable();
    handleForm();
    setupImageUpload();
    setupImageInputPreview();
    checkHealth();
    bindActionButtons();
  });
})();
