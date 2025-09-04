(function(){
  const LS_CART = 'hc_cart';
  const LS_PRODUCTS = 'hc_products';

  function getCart(){ try { return JSON.parse(localStorage.getItem(LS_CART)||'[]'); } catch { return []; } }
  function setCart(c){ localStorage.setItem(LS_CART, JSON.stringify(c)); }
  function getProducts(){
    try { const s = JSON.parse(localStorage.getItem(LS_PRODUCTS)||'[]'); if (Array.isArray(s) && s.length) return s; } catch {}
    return window.SampleProducts || [];
  }
  function formatPrice(n){ return `¥${n.toLocaleString('ja-JP')}`; }

  function findProduct(id){ return getProducts().find(p=>p.id===id); }

  function render(){
    const root = document.getElementById('cartRoot'); if(!root) return;
    const cart = getCart();
    if(!cart.length){ root.innerHTML = '<div class="empty">カートは空です。</div>'; return; }
    let total = 0;
    const table = document.createElement('table');
    const thead = document.createElement('thead'); thead.innerHTML = '<tr><th>商品</th><th>価格</th><th>数量</th><th>小計</th><th></th></tr>';
    const tbody = document.createElement('tbody');
    cart.forEach(item=>{
      const p = findProduct(item.id); if(!p) return;
      const tr = document.createElement('tr');
      const subtotal = p.price * item.qty; total += subtotal;
      tr.innerHTML = `<td>${p.name}</td><td>${formatPrice(p.price)}</td>`;
      const qty = document.createElement('td');
      const inpt = document.createElement('input'); inpt.type='number'; inpt.min='1'; inpt.value=String(item.qty);
      inpt.addEventListener('change', ()=>{
        const n = Math.max(1, parseInt(inpt.value||'1',10));
        item.qty = n; setCart(cart); render();
      });
      qty.appendChild(inpt);
      const st = document.createElement('td'); st.textContent = formatPrice(subtotal);
      const tdDel = document.createElement('td');
      const btn = document.createElement('button'); btn.className='btn btn-ghost'; btn.textContent='削除';
      btn.addEventListener('click', ()=>{ const idx = cart.findIndex(c=>c.id===item.id); if(idx>-1){ cart.splice(idx,1); setCart(cart); render(); }});
      tdDel.appendChild(btn);
      tr.appendChild(qty); tr.appendChild(st); tr.appendChild(tdDel);
      tbody.appendChild(tr);
    });
    table.appendChild(thead); table.appendChild(tbody);
    const totalBox = document.createElement('div'); totalBox.style.display='flex'; totalBox.style.justifyContent='space-between'; totalBox.style.marginTop='12px';
    const tlabel = document.createElement('div'); tlabel.textContent='合計'; tlabel.style.color='var(--muted)';
    const tval = document.createElement('div'); tval.className='price'; tval.textContent = formatPrice(total);
    totalBox.append(tlabel, tval);
    const actions = document.createElement('div'); actions.style.marginTop='12px';
    const btn = document.createElement('button'); btn.className='btn btn-primary'; btn.textContent='ご購入手続きへ（デモ）';
    btn.addEventListener('click', ()=>{
      alert('デモのため決済は実装されていません。\nバックエンド/決済の実装が必要です。');
    });
    actions.appendChild(btn);
    root.innerHTML='';
    root.append(table, totalBox, actions);
  }

  document.addEventListener('DOMContentLoaded', render);
})();

