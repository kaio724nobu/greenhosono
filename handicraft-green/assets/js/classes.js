(function(){
  const LS_CLASSES = 'hc_classes';
  const TYPES = [
    { id: 'all', label: 'すべて' },
    { id: 'trial', label: '体験' },
    { id: 'course', label: 'コース' },
    { id: 'workshop', label: 'ワークショップ' },
  ];

  function typeLabel(id){ return (TYPES.find(t=>t.id===id)||{}).label || id; }
  function getClasses(){
    try{ const s = JSON.parse(localStorage.getItem(LS_CLASSES)||'[]'); if(Array.isArray(s) && s.length) return s; }catch{}
    return window.SampleClasses || [];
  }
  function formatPrice(n){ return `¥${n.toLocaleString('ja-JP')}`; }

  function renderCard(c){
    const div = document.createElement('div'); div.className='card';
    const body = document.createElement('div'); body.className='body';
    // badges row
    const badges = document.createElement('div'); badges.style.display='flex'; badges.style.gap='6px'; badges.style.alignItems='center';
    const type = document.createElement('span'); type.className='badge'; type.textContent = typeLabel(c.type||'');
    badges.appendChild(type);
    if(c.featured){ const b = document.createElement('span'); b.className='badge success'; b.textContent='おすすめ'; badges.appendChild(b); }
    const title = document.createElement('div'); title.style.fontWeight='700'; title.style.fontSize='16px'; title.textContent = c.name;
    const meta = document.createElement('div'); meta.className='muted'; meta.textContent = `${c.schedule}・定員${c.capacity||'-'}名`;
    const desc = document.createElement('div'); desc.className='muted'; desc.textContent = c.description || '';
    const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.marginTop='6px';
    const price = document.createElement('div'); price.className='price'; price.textContent = formatPrice(c.price||0);
    const btn = document.createElement('button'); btn.className='btn btn-primary'; btn.textContent='予約（デモ）';
    btn.addEventListener('click', ()=> alert('デモのため予約は未実装です。'));
    row.append(price, btn);
    body.append(badges, title, meta, desc, row); div.append(body); return div;
  }

  function mount(){
    const root = document.getElementById('classes'); if(!root) return;
    const filterBar = document.getElementById('classFilters');
    const all = getClasses();
    function render(filter){
      root.innerHTML='';
      let list = all;
      if(filter && filter!=='all'){ list = all.filter(c=>c.type===filter); }
      if(!list.length){ root.innerHTML = '<div class="empty">該当する講座がありません。</div>'; return; }
      list.forEach(c => root.appendChild(renderCard(c)));
    }
    if(filterBar){
      filterBar.innerHTML='';
      TYPES.forEach(t=>{
        const a = document.createElement('a'); a.href='#'; a.className='pill'; a.textContent = t.label; a.dataset.id = t.id;
        a.addEventListener('click',(e)=>{ e.preventDefault(); filterBar.querySelectorAll('.pill').forEach(x=>x.classList.remove('active')); a.classList.add('active'); render(t.id); });
        if(t.id==='all') a.classList.add('active');
        filterBar.appendChild(a);
      });
    }
    render('all');
  }

  document.addEventListener('DOMContentLoaded', mount);
})();
