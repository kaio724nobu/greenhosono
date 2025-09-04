(function(){
  const LS_ADMIN = 'hc_admin';
  const DEFAULT_PASSWORD = 'admin123'; // demo default (override via /api/admin-config or window.ADMIN_PASSWORD)
  let PASSWORD = DEFAULT_PASSWORD;

  async function loadPassword(){
    try {
      // Accept override via global first
      if (typeof window !== 'undefined' && window.ADMIN_PASSWORD) {
        PASSWORD = String(window.ADMIN_PASSWORD);
        return;
      }
      // Then via server config
      const res = await fetch('/api/admin-config', { cache: 'no-store' });
      if(res && res.ok){
        const json = await res.json();
        if(json && typeof json.password === 'string' && json.password){ PASSWORD = json.password; }
      }
    } catch {}
  }

  function isAuthed(){ return localStorage.getItem(LS_ADMIN)==='1'; }
  function login(pass){ if(pass===PASSWORD){ localStorage.setItem(LS_ADMIN,'1'); return true; } return false; }
  function logout(){ localStorage.removeItem(LS_ADMIN); }
  function requireAdmin(){ if(!isAuthed()){ window.location.href = './login.html'; } }

  window.AdminAuth = { isAuthed, login, logout, requireAdmin };

  document.addEventListener('DOMContentLoaded', () => {
    // Fire and forget password load
    loadPassword();
    const form = document.getElementById('loginForm');
    if(form){
      form.addEventListener('submit', (e)=>{
        e.preventDefault();
        const pass = (document.getElementById('password')||{}).value || '';
        if(login(pass)){
          window.location.href = './index.html';
        } else {
          alert('パスワードが違います。');
        }
      });
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn){ logoutBtn.addEventListener('click', ()=>{ logout(); window.location.href='./login.html'; }); }
  });
})();
