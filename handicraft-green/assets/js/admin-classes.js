(function(){
  const LS_CLASSES = 'hc_classes';

  function getClasses(){ try{ return JSON.parse(localStorage.getItem(LS_CLASSES)||'[]'); }catch{ return []; } }
  function setClasses(list){ localStorage.setItem(LS_CLASSES, JSON.stringify(list)); }
  function upsert(item){ const list = getClasses(); const i = list.findIndex(x=>x.id===item.id); if(i>-1) list[i]=item; else list.push(item); setClasses(list); }
  function remove(id){ setClasses(getClasses().filter(x=>x.id!==id)); }
  function uuid(){ return 'c-' + Math.random().toString(36).slice(2,8) + '-' + Date.now().toString(36); }

  function renderTable(){
    const root = document.getElementById('adminClassesTable'); if(!root) return;
    const list = getClasses();
    if(!list.length){ root.innerHTML = '<div class="empty">講座はまだありません。「新規作成」から追加してください。</div>'; return; }
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>ID</th><th>名称</th><th>種別</th><th>料金</th><th>定員</th><th>特集</th><th></th></tr></thead>';
    const tbody = document.createElement('tbody');
    list.forEach(c=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="muted">${c.id}</td><td>${c.name}</td><td>${c.type}</td><td>¥${(c.price||0).toLocaleString('ja-JP')}</td><td>${c.capacity||'-'}</td><td>${c.featured?'<span class="badge success">掲載</span>':'-'}</td>`;
      const td = document.createElement('td'); td.className='table-actions';
      const be = document.createElement('button'); be.className='btn btn-ghost'; be.textContent='編集'; be.addEventListener('click',()=> fillForm(c));
      const bd = document.createElement('button'); bd.className='btn btn-danger'; bd.textContent='削除'; bd.addEventListener('click',()=>{ if(confirm('削除しますか？')){ remove(c.id); renderTable(); }});
      td.append(be, bd); tr.appendChild(td); tbody.appendChild(tr);
    });
    table.appendChild(tbody); root.innerHTML=''; root.appendChild(table);
  }

  function fillForm(c){
    (document.getElementById('cid')||{}).value = c.id;
    (document.getElementById('cname')||{}).value = c.name||'';
    (document.getElementById('ctype')||{}).value = c.type||'trial';
    (document.getElementById('cprice')||{}).value = String(c.price||0);
    (document.getElementById('ccap')||{}).value = String(c.capacity||0);
    (document.getElementById('cschedule')||{}).value = c.schedule||'';
    (document.getElementById('cdesc')||{}).value = c.description||'';
    (document.getElementById('cfeat')||{}).checked = !!c.featured;
  }
  function clearForm(){ fillForm({ id:'', name:'', type:'trial', price:0, capacity:0, schedule:'', description:'', featured:false }); }

  function handleForm(){
    const form = document.getElementById('classForm'); if(!form) return;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const data = {
        id: (document.getElementById('cid')||{}).value || uuid(),
        name: (document.getElementById('cname')||{}).value || '',
        type: (document.getElementById('ctype')||{}).value || 'trial',
        price: parseInt((document.getElementById('cprice')||{}).value||'0',10)||0,
        capacity: parseInt((document.getElementById('ccap')||{}).value||'0',10)||0,
        schedule: (document.getElementById('cschedule')||{}).value || '',
        description: (document.getElementById('cdesc')||{}).value || '',
        featured: !!((document.getElementById('cfeat')||{}).checked)
      };
      upsert(data); clearForm(); renderTable(); alert('保存しました');
    });
    const newBtn = document.getElementById('newClassBtn'); if(newBtn){ newBtn.addEventListener('click', (e)=>{ e.preventDefault(); clearForm(); }); }
  }

  document.addEventListener('DOMContentLoaded', ()=>{ renderTable(); handleForm(); });
})();

