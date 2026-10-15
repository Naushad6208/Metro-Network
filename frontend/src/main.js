/* ============ CONSTANTS ============ */

/* 24 preset colours — light, pastel, dark, vibrant sab */
const PRESET_COLORS = [
  // bright
  '#E53935','#F9A825','#1E88E5','#43A047','#8E24AA',
  '#FB8C00','#EC407A','#C2185B','#00ACC1','#546E7A',
  // pastel / light
  '#FFCDD2','#FFE082','#BBDEFB','#C8E6C9','#E1BEE7',
  '#FFCCBC','#F8BBD0','#F48FB1','#B2EBF2','#CFD8DC',
  // deep / dark
  '#B71C1C','#0D47A1','#1B5E20','#4A148C'
];

const LINE_PHOTOS = [
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1553864139-1b7982a8b5a1?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1495312040802-a929cd14a6ab?auto=format&fit=crop&w=600&q=70'
];

const DEFAULT_LINES = [
  { number:'1',  name:'Red Line'     },{ number:'2',  name:'Yellow Line'  },
  { number:'3',  name:'Blue Line'    },{ number:'4',  name:'Green Line'   },
  { number:'5',  name:'Violet Line'  },{ number:'6',  name:'Orange Line'  },
  { number:'7',  name:'Pink Line'    },{ number:'8',  name:'Magenta Line' },
  { number:'9',  name:'Aqua Line'    },{ number:'10', name:'Grey Line'    }
];

const DEFAULT_ITEMS = [
  { title:'Simple Line Diagram',      icon:'🗺️', desc:'पूरी लाइन का सरल नक्शा / schematic', link:'', photo:'' },
  { title:'Track Detail One Spot',    icon:'📍', desc:'किसी एक spot का विस्तृत track detail', link:'', photo:'' },
  { title:'Curve',                    icon:'🌀', desc:'Curve details, radius और superelevation', link:'', photo:'' },
  { title:'Point',                    icon:'⚙️', desc:'Point / switch ki jaankari', link:'', photo:'' },
  { title:'Fittings',                 icon:'🔧', desc:'Rail fittings aur fastenings', link:'', photo:'' },
  { title:'Gradient',                 icon:'📐', desc:'Gradient profile aur levels', link:'', photo:'' },
  { title:'Buffer Stop',              icon:'🛑', desc:'Buffer stop ki detail aur photo', link:'', photo:'' },
  { title:'AT Weld',                  icon:'🔥', desc:'Alumino-Thermic weld history', link:'', photo:'' },
  { title:'Rail Replacement History', icon:'📜', desc:'Rail badalne ka poora record', link:'', photo:'' },
  { title:'Turnout History',          icon:'🔀', desc:'Turnout ki poori history', link:'', photo:'' }
];

/* ============ STATE ============ */
let state = null;
let currentLineId = null;
let currentUser = null;
const uid = () => Math.random().toString(36).slice(2,10);

/* ============ COLOR HELPERS ============ */
function hexToRgb(hex){
  hex = String(hex||'').replace('#','').trim();
  if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
  if(hex.length!==6 || !/^[0-9a-f]+$/i.test(hex)) return null;
  return { r:parseInt(hex.slice(0,2),16), g:parseInt(hex.slice(2,4),16), b:parseInt(hex.slice(4,6),16) };
}
function luminance(hex){
  const rgb = hexToRgb(hex); if(!rgb) return 0;
  const a = [rgb.r,rgb.g,rgb.b].map(v=>{
    v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4);
  });
  return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
}
function isLight(hex){ return luminance(hex) > 0.6; }
function textOn(hex){ return isLight(hex) ? '#0b2b5c' : '#ffffff'; }
function normalizeHex(v){
  v = String(v||'').trim();
  if(!v) return '';
  if(v[0] !== '#') v = '#' + v;
  v = v.toUpperCase();
  const body = v.slice(1);
  if(!/^[0-9A-F]+$/.test(body)) return '';
  if(body.length===3){
    return '#' + body.split('').map(c=>c+c).join('');
  }
  if(body.length===6) return v;
  return '';
}
function isHex(v){ return !!normalizeHex(v); }
function randomColor(){
  const h = Math.floor(Math.random()*360);
  const s = 55 + Math.floor(Math.random()*35);
  const l = 40 + Math.floor(Math.random()*30);
  return hslToHex(h,s,l);
}
function hslToHex(h,s,l){
  s/=100; l/=100;
  const k = n => (n + h/30) % 12;
  const a = s * Math.min(l,1-l);
  const f = n => {
    const c = l - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n), 1)));
    return Math.round(255*c).toString(16).padStart(2,'0');
  };
  return ('#' + f(0) + f(8) + f(4)).toUpperCase();
}


/* ============ MONGODB API / DATA ============ */
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/,'');
const TOKEN_KEY = 'metroPwayAuthToken_v1';

let apiToken = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || '';
let usersCache = [];
let portalCache = { theme:'light', hero:null };

function apiUrl(path){ return `${API_BASE}${path}`; }

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (apiToken) headers.set('Authorization', `Bearer ${apiToken}`);
  const res = await fetch(apiUrl(path), {...options, headers});
  let data = null;
  try { data = await res.json(); } catch(e) {}
  if (!res.ok) {
    const msg = data?.message || `Server error (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

function setToken(token){
  apiToken = token || '';
  if (apiToken) {
    localStorage.setItem(TOKEN_KEY, apiToken);
    sessionStorage.setItem(TOKEN_KEY, apiToken);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

function buildDefault() {
  return {
    lines: DEFAULT_LINES.map((l,i) => ({
      id: uid(), number: l.number, name: l.name,
      color: PRESET_COLORS[i % 10],
      photo: LINE_PHOTOS[i % LINE_PHOTOS.length],
      items: DEFAULT_ITEMS.map(it => ({ id: uid(), ...it }))
    }))
  };
}

async function loadState() {
  try {
    const p = await apiFetch('/api/portal');
    if (p?.data?.lines?.length) {
      state = p.data;
      portalCache = {
        theme: p.theme || 'light',
        hero: p.hero || Object.assign({}, HERO_DEFAULT)
      };
      return state;
    }
  } catch(e) {
    console.error(e);
    toast('❌ MongoDB/backend se data load nahi hua: ' + e.message, 'err');
  }
  state = buildDefault();
  return state;
}

async function saveState() {
  try {
    const r = await apiFetch('/api/portal', {method:'PUT', body:JSON.stringify({data:state})});
    if (r?.data) state = r.data;
    return true;
  } catch(e) {
    toast('❌ MongoDB me data save nahi hua: ' + e.message, 'err');
    return false;
  }
}

/* ============ USERS ============ */
async function loadUsers() {
  try {
    const r = await apiFetch('/api/users');
    usersCache = Array.isArray(r.users) ? r.users : [];
  } catch(e) {
    usersCache = [];
    console.error(e);
  }
  return usersCache;
}
function getUsers() { return usersCache; }
function findUser(u) {
  return usersCache.find(x => x.username.toLowerCase() === String(u).toLowerCase());
}

/* ============ SESSION ============ */
async function loadSession() {
  if (!apiToken) return null;
  try {
    const r = await apiFetch('/api/auth/me');
    return r.user || null;
  } catch(e) {
    setToken('');
    return null;
  }
}
function saveSession() { /* JWT is managed by setToken(); no user data is stored locally. */ }

/* ============ THEME ============ */
function applyTheme(t) {
  t = t === 'dark' ? 'dark' : 'light';
  portalCache.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('themeBtn').textContent = t === 'dark' ? '☀️' : '🌙';
}
async function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { await apiFetch('/api/portal/preferences', {method:'PUT', body:JSON.stringify({theme:next})}); }
  catch(e) { toast('❌ Theme save nahi hua: '+e.message,'err'); }
}

/* ============ TOAST ============ */
let toastTimer = null;
function toast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast ' + type, 2400);
}

/* ============ HELPERS ============ */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
const escAttr = esc;
function isAdmin() { return currentUser && currentUser.role === 'admin'; }
function canEdit() { return isAdmin(); }

function resizeImage(file, maxW = 900, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ============ DOM REFS ============ */
const lineGrid      = document.getElementById('lineGrid');
const itemGrid      = document.getElementById('itemGrid');
const viewLines     = document.getElementById('viewLines');
const viewItems     = document.getElementById('viewItems');
const viewSearch    = document.getElementById('viewSearch');
const heroSection   = document.getElementById('heroSection');
const crumb         = document.getElementById('crumb');
const lineCountPill = document.getElementById('lineCountPill');
const itemCountPill = document.getElementById('itemCountPill');
const itemsTitle    = document.getElementById('itemsTitle');
const itemsSubtitle = document.getElementById('itemsSubtitle');
const searchInput   = document.getElementById('searchInput');
const searchClear   = document.getElementById('searchClear');
const searchResults = document.getElementById('searchResults');
const searchCountPill = document.getElementById('searchCountPill');
const searchQueryText = document.getElementById('searchQueryText');

/* ============ LOGIN UI ============ */
function refreshLoginUI() {
  const da = document.getElementById('dynamicActions');
  if (currentUser) {
    da.innerHTML = `
      <button class="icon-btn" id="settingsBtn" title="Settings">⚙️</button>
      <div class="user-chip" id="userChip">
        <div class="user-avatar">${esc(currentUser.username[0].toUpperCase())}</div>
        <span>${esc(currentUser.username)}</span>
        <span class="role ${currentUser.role}">${currentUser.role}</span>
      </div>
      <button class="ghost-btn" id="logoutBtn">Logout</button>
    `;
    document.getElementById('settingsBtn').addEventListener('click', () => openSettingsModal());
    document.getElementById('logoutBtn').addEventListener('click', doLogout);
  } else {
    da.innerHTML = `<button class="ghost-btn" id="loginBtn">🔐 Login</button>`;
    document.getElementById('loginBtn').addEventListener('click', openLoginModal);
  }
  document.getElementById('lineGrid').classList.toggle('locked', !canEdit());
  if (typeof applyHero === 'function') applyHero();
  document.getElementById('itemGrid').classList.toggle('locked', !canEdit());
}

async function doLogout() {
  try { if (apiToken) await apiFetch('/api/auth/logout', {method:'POST'}); } catch(e) {}
  setToken('');
  currentUser = null;
  toast('👋 Logout ho gaya');
  refreshLoginUI();
  renderLines();
  if (viewItems.classList.contains('active') && currentLineId) renderItems();
}


/* ============ LOGIN MODAL ============ */
function openLoginModal() {
  const users = getUsers();
  const isFirst = users.length === 1 && users[0].username === 'admin';
  modal.innerHTML = `
    <div class="login-hero">
      <div class="login-icon">🔐</div>
      <h3>Sign In</h3>
      <p>Edit karne ke liye login karein</p>
    </div>
    ${isFirst ? `<div class="login-hint">
      Default first-time admin: <b>admin</b> / <b>metro123</b><br>
      Login ke baad ⚙️ Settings se password badal dein.
    </div>` : ''}
    <div class="field"><label>Username</label>
      <input id="lUser" placeholder="admin" autocomplete="username"></div>
    <div class="field"><label>Password</label>
      <input id="lPass" type="password" placeholder="••••••" autocomplete="current-password"></div>
    <div class="modal-actions">
      <button class="btn sec" id="mCancel">Cancel</button>
      <button class="btn primary" id="mLogin">Login</button>
    </div>
    <div style="text-align:center;margin-top:14px">
      <a href="#" id="forgotPw" style="font-size:12.5px;color:var(--brand2);font-weight:600;text-decoration:none">🔑 Password bhool gaye? Secret code se badlein</a>
    </div>
  `;
  document.getElementById('mCancel').addEventListener('click', closeModal);
  document.getElementById('forgotPw').addEventListener('click', e => { e.preventDefault(); openRecoveryModal(); });

  const tryLogin = async () => {
    const u = document.getElementById('lUser').value.trim();
    const p = document.getElementById('lPass').value;
    if (!u || !p) { toast('❌ Dono fields bharein', 'err'); return; }
    try {
      const r = await apiFetch('/api/auth/login', {method:'POST', body:JSON.stringify({username:u,password:p})});
      setToken(r.token);
      currentUser = r.user;
      await loadUsers();
      closeModal();
      toast('✅ Welcome, ' + currentUser.username + '!', 'ok');
      refreshLoginUI();
      renderLines();
      if (viewItems.classList.contains('active') && currentLineId) renderItems();
      if (viewSearch.classList.contains('active')) performSearch(searchInput.value);
    } catch(e) {
      toast('❌ ' + e.message, 'err');
    }
  };
  document.getElementById('mLogin').addEventListener('click', tryLogin);
  document.getElementById('lPass').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
  overlay.classList.add('show');
  setTimeout(() => { const e = document.getElementById('lUser'); if (e) e.focus(); }, 100);
}

/* ============ PASSWORD RECOVERY (secret code stored in MongoDB) ============ */
let recoveryFails = 0, recoveryLockUntil = 0;

function openRecoveryModal() {
  modal.innerHTML = `
    <div class="login-hero">
      <div class="login-icon">🔑</div>
      <h3>Password Badlein</h3>
      <p>Secret code MongoDB me stored hai. Code verify hone par hi password change hoga.</p>
    </div>
    <div class="field"><label>Secret Code</label>
      <input id="rCode" type="password" placeholder="Secret code" autocomplete="off"></div>
    <div class="field"><label>Username</label>
      <input id="rUser" value="admin" autocomplete="off"></div>
    <div class="field"><label>Naya Password</label>
      <input id="rNew" type="password" placeholder="Kam se kam 5 characters" autocomplete="new-password"></div>
    <div class="field"><label>Confirm Password</label>
      <input id="rNew2" type="password" placeholder="Dobara likhein" autocomplete="new-password"></div>
    <div class="modal-actions">
      <button class="btn sec" id="rBack">← Wapas</button>
      <button class="btn primary" id="rSave">Change Password</button>
    </div>`;
  document.getElementById('rBack').addEventListener('click', openLoginModal);

  const doReset = async () => {
    const now = Date.now();
    if (now < recoveryLockUntil) {
      toast('⏳ Bahut galat koshish — ' + Math.ceil((recoveryLockUntil-now)/1000) + 's ruk kar try karein', 'err'); return;
    }
    const code = document.getElementById('rCode').value;
    const uname = document.getElementById('rUser').value.trim();
    const n1 = document.getElementById('rNew').value;
    const n2 = document.getElementById('rNew2').value;
    if (!code || !uname || !n1 || !n2) { toast('❌ Saare fields bharein', 'err'); return; }
    if (n1.length < 5) { toast('❌ Naya password chhota hai (5+)', 'err'); return; }
    if (n1 !== n2) { toast('❌ Confirm password match nahi', 'err'); return; }
    try {
      await apiFetch('/api/auth/recover-password', {
        method:'POST',
        body:JSON.stringify({username:uname, recoveryCode:code, newPassword:n1})
      });
      recoveryFails = 0;
      toast('✅ Password change ho gaya — ab login karein', 'ok');
      openLoginModal();
      setTimeout(() => { const lu = document.getElementById('lUser'); if (lu) lu.value = uname; }, 150);
    } catch(e) {
      recoveryFails++;
      if (recoveryFails >= 5) { recoveryLockUntil = now + 60000; recoveryFails = 0; }
      toast('❌ ' + e.message, 'err');
    }
  };
  document.getElementById('rSave').addEventListener('click', doReset);
  document.getElementById('rNew2').addEventListener('keydown', e => { if (e.key === 'Enter') doReset(); });
  overlay.classList.add('show');
  setTimeout(() => { const e = document.getElementById('rCode'); if (e) e.focus(); }, 100);
}


/* ============ SETTINGS MODAL ============ */
function openSettingsModal(tab = 'password') {
  if (!currentUser) { openLoginModal(); return; }
  modal.innerHTML = `
    <h3>⚙️ Settings</h3>
    <p class="sub">Logged in as <b>${esc(currentUser.username)}</b> (${currentUser.role})</p>
    <div class="tabs">
      <button class="tab ${tab==='password'?'active':''}" data-tab="password">🔑 Password</button>
      ${isAdmin() ? `<button class="tab ${tab==='users'?'active':''}" data-tab="users">👥 Users</button>` : ''}
      ${isAdmin() ? `<button class="tab ${tab==='danger'?'active':''}" data-tab="danger">⚠️ Danger</button>` : ''}
    </div>
    <div id="tabContent"></div>
  `;
  modal.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => openSettingsModal(t.dataset.tab)));
  const content = document.getElementById('tabContent');
  if (tab === 'password') renderPasswordTab(content);
  else if (tab === 'users' && isAdmin()) renderUsersTab(content);
  else if (tab === 'danger' && isAdmin()) renderDangerTab(content);
  overlay.classList.add('show');
}

function renderPasswordTab(c) {
  c.innerHTML = `
    <div class="field"><label>Current Password</label><input id="cpOld" type="password" placeholder="••••••"></div>
    <div class="field"><label>New Password</label><input id="cpNew" type="password" placeholder="Kam se kam 5 characters"></div>
    <div class="field"><label>Confirm New Password</label><input id="cpNew2" type="password" placeholder="Dobara likhein"></div>
    <div class="modal-actions">
      <button class="btn sec" id="mCancel">Close</button>
      <button class="btn primary" id="cpSave">Change Password</button>
    </div>
    ${isAdmin() ? `
    <hr style="border:none;border-top:1px solid var(--line);margin:18px 0">
    <div class="field"><label>🔐 Secret Code badlein (MongoDB me save hoga)</label>
      <input id="rcNew" type="text" placeholder="Naya secret code (6+ characters)" autocomplete="off"></div>
    <button class="btn primary" id="rcSave" style="width:100%">Save Secret Code</button>` : ''}
  `;
  document.getElementById('mCancel').onclick = closeModal;

  const rcBtn = document.getElementById('rcSave');
  if (rcBtn) rcBtn.onclick = async () => {
    const v = document.getElementById('rcNew').value.trim();
    if (v.length < 6) { toast('❌ Secret code kam se kam 6 characters ka rakhein', 'err'); return; }
    try {
      await apiFetch('/api/settings/recovery-code', {method:'PUT', body:JSON.stringify({recoveryCode:v})});
      toast('✅ Secret code MongoDB me save ho gaya', 'ok');
      document.getElementById('rcNew').value = '';
    } catch(e) { toast('❌ ' + e.message, 'err'); }
  };

  document.getElementById('cpSave').onclick = async () => {
    const oldP = document.getElementById('cpOld').value;
    const newP = document.getElementById('cpNew').value;
    const newP2 = document.getElementById('cpNew2').value;
    if (newP.length < 5) { toast('❌ New password chhota hai (5+)', 'err'); return; }
    if (newP !== newP2) { toast('❌ Confirm password match nahi', 'err'); return; }
    try {
      await apiFetch('/api/auth/change-password', {method:'POST', body:JSON.stringify({currentPassword:oldP,newPassword:newP})});
      toast('✅ Password change ho gaya', 'ok');
      closeModal();
    } catch(e) { toast('❌ ' + e.message, 'err'); }
  };
}

async function renderUsersTab(c) {
  await loadUsers();
  const users = getUsers();
  c.innerHTML = `
    <div class="field" style="margin-bottom:10px"><label>Add New User</label></div>
    <div class="field"><input id="nuUser" placeholder="Username" autocomplete="off"></div>
    <div class="field"><input id="nuPass" type="password" placeholder="Password (5+ chars)"></div>
    <div class="field"><select id="nuRole">
      <option value="viewer">Viewer (sirf dekh sakte hain)</option>
      <option value="admin">Admin (full access)</option>
    </select></div>
    <button class="btn primary" id="addUserBtn" style="width:100%">➕ Add User</button>
    <div style="margin:22px 0 10px;font-size:12.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px">
      Existing Users (${users.length})
    </div>
    <div id="usersList"></div>
    <div class="modal-actions"><button class="btn sec" id="mCancel">Close</button></div>
  `;
  const list = document.getElementById('usersList');
  list.innerHTML = users.map(u => `
    <div class="user-row">
      <div class="uavatar">${esc(u.username[0].toUpperCase())}</div>
      <div class="uinfo">
        <div class="uname">${esc(u.username)} ${u.id === currentUser.id ? '<span style="color:var(--muted);font-size:11px">(you)</span>' : ''}</div>
        <div class="umeta">Created: ${new Date(u.created || Date.now()).toLocaleDateString()}</div>
      </div>
      <span class="role-tag ${u.role}">${u.role}</span>
      ${u.id !== currentUser.id ? `<button class="del-user" data-del="${u.id}" title="Delete">🗑️</button>` : ''}
    </div>`).join('');

  list.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    const id = b.dataset.del;
    const u = users.find(x => x.id === id);
    if (!u || !confirm(`User "${u.username}" ko delete karna hai?`)) return;
    try {
      await apiFetch('/api/users/' + encodeURIComponent(id), {method:'DELETE'});
      await renderUsersTab(c);
      toast('🗑️ User delete ho gaya', 'ok');
    } catch(e) { toast('❌ ' + e.message, 'err'); }
  });

  document.getElementById('addUserBtn').onclick = async () => {
    const u = document.getElementById('nuUser').value.trim();
    const p = document.getElementById('nuPass').value;
    const r = document.getElementById('nuRole').value;
    if (!u || !p) { toast('❌ Username aur password bharein', 'err'); return; }
    if (p.length < 5) { toast('❌ Password chhota hai (5+)', 'err'); return; }
    try {
      await apiFetch('/api/users', {method:'POST', body:JSON.stringify({username:u,password:p,role:r})});
      await renderUsersTab(c);
      toast('✅ User add ho gaya', 'ok');
    } catch(e) { toast('❌ ' + e.message, 'err'); }
  };
  document.getElementById('mCancel').onclick = closeModal;
}

function renderDangerTab(c) {
  c.innerHTML = `
    <div style="background:#ffe9e9;border:1px solid #ffd0d0;border-radius:12px;padding:14px;margin-bottom:14px;color:#c62828;font-size:13px;line-height:1.55">
      <b>⚠️ Warning:</b> Yeh actions undo nahi ho sakte.
    </div>
    <div class="field"><label>Reset Portal Data</label><small>Saari lines, sections, links, photos — default ho jayenge.</small></div>
    <button class="btn danger" id="resetDataBtn" style="width:100%;margin-bottom:18px">🔄 Reset Portal Data</button>
    <div class="field"><label>Reset Users</label><small>Sab users delete ho jayenge, sirf default admin rahega.</small></div>
    <button class="btn danger" id="resetUsersBtn" style="width:100%">🗑️ Reset All Users</button>
    <div class="modal-actions"><button class="btn sec" id="mCancel">Close</button></div>
  `;
  document.getElementById('mCancel').onclick = closeModal;
  document.getElementById('resetDataBtn').onclick = async () => {
    if (!confirm('Portal data reset karna hai?')) return;
    try {
      const r = await apiFetch('/api/admin/reset-portal', {method:'POST'});
      state = r.data;
      goHome(); closeModal(); renderLines();
      toast('🔄 Data reset ho gaya', 'ok');
    } catch(e) { toast('❌ ' + e.message, 'err'); }
  };
  document.getElementById('resetUsersBtn').onclick = async () => {
    if (!confirm('Sab users delete ho jayenge. Sirf default admin rahega. Continue?')) return;
    try {
      await apiFetch('/api/admin/reset-users', {method:'POST'});
      setToken(''); currentUser = null; await loadUsers();
      closeModal(); refreshLoginUI(); renderLines();
      toast('🗑️ Users reset — default admin ready', 'ok');
    } catch(e) { toast('❌ ' + e.message, 'err'); }
  };
}

/* ============ RENDER LINES ============ */
function updateHeroStats() { /* hero stats removed */ }

function renderLines() {
  lineCountPill.textContent = state.lines.length + (state.lines.length === 1 ? ' Line' : ' Lines');
  updateHeroStats();

  lineGrid.innerHTML = state.lines.map(line => {
    const badgeText = textOn(line.color);
    return `
    <div class="line-card" style="--c:${line.color};--badge-text:${badgeText}" data-line="${line.id}">
      <div class="line-photo" style="background-image:url('${escAttr(line.photo || '')}')">
        <div class="line-photo-overlay"></div>
        <div class="line-badge">${esc(line.number)}</div>
        ${canEdit() ? `<button class="line-edit" data-edit="${line.id}" title="Edit Line">✎</button>` : ''}
      </div>
      <div class="line-body">
        <div class="line-name">${esc(line.name)}</div>
        <div class="line-sub">${line.items.length} SECTIONS</div>
      </div>
    </div>
  `}).join('') + `
    <button class="add-card" id="addLineBtn">
      <div class="plus">＋</div>
      <div>Nayi Line<br>Add Karein</div>
    </button>
  `;

  lineGrid.querySelectorAll('[data-line]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.line-edit')) return;
      openLine(el.dataset.line);
    });
  });
  lineGrid.querySelectorAll('[data-edit]').forEach(b => {
    b.addEventListener('click', e => {
      e.stopPropagation();
      if (!canEdit()) { toast('🔐 Admin access chahiye', 'err'); openLoginModal(); return; }
      openLineModal(b.dataset.edit);
    });
  });
  document.getElementById('addLineBtn').addEventListener('click', () => {
    if (!canEdit()) { toast('🔐 Admin access chahiye', 'err'); openLoginModal(); return; }
    openLineModal();
  });
  lineGrid.classList.toggle('locked', !canEdit());
}

/* ============ RENDER ITEMS ============ */
function renderItems() {
  const line = state.lines.find(l => l.id === currentLineId);
  if (!line) { goHome(); return; }

  const badgeText = textOn(line.color);
  itemsTitle.innerHTML = `<span style="color:${line.color}">●</span> ${esc(line.name)}`;
  itemsSubtitle.textContent = `Line ${esc(line.number)} — P-Way Sections`;
  itemCountPill.textContent = line.items.length + ' Sections';

  crumb.innerHTML = `
    <a id="crumbHome">All Lines</a>
    <span class="sep">›</span>
    <span class="cur">${esc(line.name)}</span>
  `;
  document.getElementById('crumbHome').addEventListener('click', goHome);

  let cards = '';
  if (!line.items.length) {
    cards = `<div class="empty" style="grid-column:1/-1">
      Abhi koi section nahi hai. Neeche "Add" par click karein.
    </div>`;
  } else {
    cards = line.items.map(it => {
      const hasPhoto = !!(it.photo && it.photo.length > 5);
      if (hasPhoto) {
        return `
          <a class="item-card has-photo" style="--c:${line.color};--badge-text:${badgeText}"
             href="${it.link ? escAttr(it.link) : 'javascript:void(0)'}"
             ${it.link ? 'target="_blank" rel="noopener"' : ''}>
            <button class="edit-dot" data-edit="${it.id}" title="Edit / Link">✎</button>
            <div class="item-photo" style="background-image:url('${escAttr(it.photo)}')">
              <div class="item-photo-badge">${esc(it.icon)}</div>
              <div class="photo-tag">📷 PHOTO</div>
            </div>
            <div class="item-content">
              <div class="item-title">${esc(it.title)}</div>
              <div class="item-desc">${esc(it.desc || '')}</div>
              <div class="item-go">
                ${it.link ? 'Open' : 'Set Link'} <span class="arw">→</span>
              </div>
            </div>
          </a>
        `;
      } else {
        return `
          <a class="item-card" style="--c:${line.color};--badge-text:${badgeText}"
             href="${it.link ? escAttr(it.link) : 'javascript:void(0)'}"
             ${it.link ? 'target="_blank" rel="noopener"' : ''}>
            <button class="edit-dot" data-edit="${it.id}" title="Edit / Link">✎</button>
            <div class="item-icon">${esc(it.icon)}</div>
            <div class="item-title">${esc(it.title)}</div>
            <div class="item-desc">${esc(it.desc || '')}</div>
            <div class="item-go">
              ${it.link ? 'Open' : 'Set Link'} <span class="arw">→</span>
            </div>
          </a>
        `;
      }
    }).join('');
  }

  itemGrid.innerHTML = cards + `
    <button class="add-card" id="addItemBtn">
      <div class="plus">＋</div>
      <div>Naya Icon<br>Add Karein</div>
    </button>
  `;

  itemGrid.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      if (!canEdit()) { toast('🔐 Admin access chahiye', 'err'); openLoginModal(); return; }
      openItemModal(line.id, btn.dataset.edit);
    });
  });
  document.getElementById('addItemBtn').addEventListener('click', () => {
    if (!canEdit()) { toast('🔐 Admin access chahiye', 'err'); openLoginModal(); return; }
    openItemModal(line.id);
  });
  itemGrid.classList.toggle('locked', !canEdit());
}

/* ============ NAVIGATION ============ */
function openLine(id) {
  currentLineId = id;
  viewLines.classList.remove('active');
  viewItems.classList.add('active');
  viewSearch.classList.remove('active');
  heroSection.style.display = 'none';
  crumb.style.display = '';
  renderItems();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', '#line=' + id);
}
function goHome() {
  currentLineId = null;
  viewItems.classList.remove('active');
  viewSearch.classList.remove('active');
  viewLines.classList.add('active');
  heroSection.style.display = '';
  crumb.innerHTML = '';
  crumb.style.display = '';
  renderLines();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', location.pathname);
  searchInput.value = '';
  searchClear.classList.remove('show');
}

/* ============ SEARCH ============ */
function performSearch(q) {
  q = (q || '').trim();
  if (!q) {
    searchClear.classList.remove('show');
    if (viewSearch.classList.contains('active')) {
      viewSearch.classList.remove('active');
      if (currentLineId) { viewItems.classList.add('active'); heroSection.style.display = 'none'; }
      else { viewLines.classList.add('active'); heroSection.style.display = ''; }
    }
    return;
  }
  searchClear.classList.add('show');
  const lq = q.toLowerCase();

  viewLines.classList.remove('active');
  viewItems.classList.remove('active');
  viewSearch.classList.add('active');
  heroSection.style.display = 'none';
  crumb.style.display = 'none';

  const results = [];
  state.lines.forEach(line => {
    line.items.forEach(it => {
      const hay = (it.title + ' ' + (it.desc||'') + ' ' + line.name + ' ' + line.number).toLowerCase();
      if (hay.includes(lq)) results.push({ line, item: it });
    });
  });

  searchCountPill.textContent = results.length + ' result' + (results.length === 1 ? '' : 's');
  searchQueryText.textContent = `"${q}" ke liye ${results.length} result${results.length===1?'':'s'}`;

  if (!results.length) {
    searchResults.innerHTML = `<div class="empty">
      <div style="font-size:42px;margin-bottom:12px">🔍</div>
      <div style="font-weight:700;font-size:16px;margin-bottom:6px">Koi result nahi mila</div>
      <div style="font-size:13px">Kuch aur try karein</div>
    </div>`;
    return;
  }

  searchResults.innerHTML = results.map(({line, item}) => {
    const link = item.link ? escAttr(item.link) : 'javascript:void(0)';
    const hasPhoto = !!(item.photo && item.photo.length > 5);
    const iconStyle = hasPhoto ? `background-image:url('${escAttr(item.photo)}')` : '';
    const badgeText = textOn(line.color);
    return `
      <a class="result-item" style="--c:${line.color};--badge-text:${badgeText}"
         href="${link}"
         ${item.link ? 'target="_blank" rel="noopener"' : ''}
         data-open-line="${line.id}">
        <div class="result-icon" style="${iconStyle}">${hasPhoto ? '' : esc(item.icon)}</div>
        <div class="result-body">
          <div class="result-title">${esc(item.title)}</div>
          <div class="result-meta">
            <span class="line-tag">${esc(line.number)} • ${esc(line.name)}</span>
            ${hasPhoto ? '<span>📷 Photo</span>' : ''}
            ${item.link ? '<span>🔗 Link</span>' : '<span>No link</span>'}
          </div>
          ${item.desc ? `<div class="result-desc">${esc(item.desc)}</div>` : ''}
        </div>
      </a>
    `;
  }).join('');

  searchResults.querySelectorAll('[data-open-line]').forEach(el => {
    el.addEventListener('click', e => {
      const href = el.getAttribute('href');
      if (!href || href === 'javascript:void(0)') {
        e.preventDefault();
        searchInput.value = '';
        searchClear.classList.remove('show');
        openLine(el.dataset.openLine);
      }
    });
  });
}
searchInput.addEventListener('input', e => performSearch(e.target.value));
searchClear.addEventListener('click', () => {
  searchInput.value = '';
  performSearch('');
  searchInput.focus();
});

/* ============ PDF REPORT ============ */
function downloadReport() {
  const line = state.lines.find(l => l.id === currentLineId);
  if (!line) return;
  const w = window.open('', '_blank');
  if (!w) { toast('❌ Popup block hua — allow karein', 'err'); return; }
  const dt = new Date().toLocaleString();
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${esc(line.name)} — P-Way Report</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;padding:30px;color:#101f38;line-height:1.5}
  .head{display:flex;gap:18px;align-items:center;border-bottom:3px solid ${line.color};
    padding-bottom:14px;margin-bottom:22px}
  .head img{width:100px;height:100px;object-fit:cover;border-radius:12px;flex-shrink:0}
  .badge{display:inline-block;background:${line.color};color:${textOn(line.color)};
    padding:5px 14px;border-radius:999px;font-weight:700;font-size:13px;margin-bottom:6px}
  .head h1{font-size:26px;margin:0 0 4px}
  .head p{color:#6b7a90;font-size:12.5px}
  table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}
  th{background:${line.color};color:${textOn(line.color)};padding:11px;text-align:left;font-size:12.5px}
  td{padding:11px;border-bottom:1px solid #e2e8f2;vertical-align:top}
  tr:nth-child(even) td{background:#f8faff}
  .icon-cell{width:60px;text-align:center}
  .icon-cell .em{font-size:22px}
  .icon-cell .th{width:48px;height:48px;border-radius:10px;object-fit:cover;display:block;margin:0 auto}
  .num{width:34px;color:#6b7a90;font-weight:700}
  .link{color:#1e5fbf;word-break:break-all;font-size:11px}
  .foot{margin-top:34px;text-align:center;color:#6b7a90;font-size:11px;
    border-top:1px solid #e2e8f2;padding-top:14px}
  .no-print{text-align:center;margin-bottom:16px}
  .no-print button{background:#1e5fbf;color:white;border:none;padding:10px 22px;
    border-radius:10px;font-weight:700;cursor:pointer;font-size:14px;margin:0 4px}
  .no-print button:hover{background:#0b2b5c}
  @media print{.no-print{display:none}body{padding:12px}}
</style></head><body>
<div class="no-print">
  <button onclick="window.print()">🖨️ Print / Save as PDF</button>
  <button onclick="window.close()">✕ Close</button>
</div>
<div class="head">
  ${line.photo ? `<img src="${escAttr(line.photo)}" onerror="this.style.display='none'">` : ''}
  <div>
    <div class="badge">Line ${esc(line.number)}</div>
    <h1>${esc(line.name)}</h1>
    <p>P-Way Report • Generated: ${esc(dt)}</p>
  </div>
</div>
<table>
  <thead><tr>
    <th class="num">#</th><th style="width:60px">Icon</th>
    <th>Section</th><th>Description</th><th>Link</th>
  </tr></thead>
  <tbody>
    ${line.items.map((it,i) => `
      <tr>
        <td class="num">${i+1}</td>
        <td class="icon-cell">${
          it.photo && it.photo.length > 5
            ? `<img class="th" src="${escAttr(it.photo)}" onerror="this.outerHTML='${esc(it.icon)}'">`
            : `<span class="em">${esc(it.icon)}</span>`
        }</td>
        <td><b>${esc(it.title)}</b></td>
        <td>${esc(it.desc || '-')}</td>
        <td class="link">${it.link ? esc(it.link) : '-'}</td>
      </tr>`).join('')}
  </tbody>
</table>
<div class="foot">
  Metro P-Way Portal • ${line.items.length} sections • © ${new Date().getFullYear()}
</div>
</body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
  toast('📄 Report ready', 'ok');
}
document.getElementById('pdfBtn').addEventListener('click', downloadReport);

/* ============ MODAL SYSTEM ============ */
const overlay = document.getElementById('overlay');
const modal   = document.getElementById('modal');
function closeModal() { overlay.classList.remove('show'); modal.innerHTML = ''; }
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ============ LINE MODAL (with enhanced color picker) ============ */
function openLineModal(lineId = null) {
  if (!canEdit()) { toast('🔐 Admin access chahiye', 'err'); return; }
  const line = lineId ? state.lines.find(l => l.id === lineId) : null;
  let picked = line ? line.color : PRESET_COLORS[state.lines.length % PRESET_COLORS.length];
  let photoData = line ? (line.photo || '') : LINE_PHOTOS[state.lines.length % LINE_PHOTOS.length];

  const isPhotoUrl = photoData && /^https?:\/\//i.test(photoData);
  const photoUrlVal = isPhotoUrl ? photoData : '';

  modal.innerHTML = `
    <h3>${line ? 'Line Edit Karein' : 'Nayi Metro Line'}</h3>
    <p class="sub">${line ? esc(line.name) : 'Number, naam, colour aur photo'}</p>

    <div class="field">
      <label>Line Number / Code</label>
      <input id="mNum" value="${line ? escAttr(line.number) : state.lines.length + 1}" placeholder="e.g. 11">
    </div>
    <div class="field">
      <label>Line Name</label>
      <input id="mName" value="${line ? escAttr(line.name) : ''}" placeholder="e.g. Silver Line">
    </div>

    <div class="field">
      <label>🎨 Line Colour</label>
      <div class="color-picker-box">
        <div class="color-preview-bar" id="colorPreview">
          <span class="cpb-num">L${line ? escAttr(line.number) : state.lines.length + 1}</span>
          <span class="cpb-hex" id="cpbHex">${escAttr(picked)}</span>
        </div>

        <div class="color-swatches" id="swatchGrid">
          ${PRESET_COLORS.map(c => `
            <div class="sw ${c.toUpperCase()===picked.toUpperCase()?'sel':''} ${isLight(c)?'is-light':''}"
                 data-c="${c}" style="background:${c}" title="${c}"></div>
          `).join('')}
        </div>

        <div class="color-custom-row">
          <div class="color-input-wrap">
            <button type="button" class="color-wheel-btn" title="Custom colour chunein"></button>
            <input type="color" id="colorNative" value="${isHex(picked) ? normalizeHex(picked) : '#1E88E5'}">
          </div>
          <input type="text" class="hex-input" id="hexInput" maxlength="7"
                 placeholder="#1E88E5" value="${escAttr(picked)}">
          <button type="button" class="random-btn" id="randColorBtn" title="Random">🎲</button>
        </div>

        <div class="color-hint">Koi bhi colour chunein — swatch, color wheel, ya hex code daalein</div>
      </div>
    </div>

    <div class="field">
      <label>Line Photo</label>
      <div class="photo-row">
        <div class="photo-preview ${photoData?'has-img':''}" id="photoPrev" style="${photoData ? `background-image:url('${escAttr(photoData)}')` : ''}">
          ${photoData ? '' : '🖼️'}
          <button type="button" class="remove-photo" id="rmPhoto" title="Remove">✕</button>
        </div>
        <div class="photo-actions">
          <label class="file-label">
            📤 Upload Photo
            <input type="file" id="photoFile" accept="image/*">
          </label>
          <input id="mPhoto" placeholder="Ya URL paste karein" value="${escAttr(photoUrlVal)}">
        </div>
      </div>
      <small>Upload karne par photo automatically compress ho jati hai (~900px width).</small>
    </div>

    <div class="modal-actions">
      ${line ? '<button class="btn danger" id="mDel">Delete</button>' : ''}
      <button class="btn sec" id="mCancel">Cancel</button>
      <button class="btn primary" id="mSave">${line ? 'Save' : 'Add Line'}</button>
    </div>
  `;

  /* ---- COLOUR PICKER LOGIC ---- */
  const previewBar = document.getElementById('colorPreview');
  const hexInput   = document.getElementById('hexInput');
  const nativeInp  = document.getElementById('colorNative');

  function updateColorUI(c){
    if(!c || !isHex(c)) return;
    c = normalizeHex(c);
    picked = c;

    // preview bar
    previewBar.style.background = c;
    const light = isLight(c);
    previewBar.classList.toggle('light-text', light);
    document.getElementById('cpbHex').textContent = c;

    // swatches
    document.querySelectorAll('#swatchGrid .sw').forEach(s => {
      s.classList.toggle('sel', s.dataset.c.toUpperCase() === c);
    });

    // native picker value
    nativeInp.value = c;

    // hex input (only if not focused to avoid cursor jump)
    if(document.activeElement !== hexInput){
      hexInput.value = c;
    }
  }

  // swatch clicks
  document.querySelectorAll('#swatchGrid .sw').forEach(sw => {
    sw.addEventListener('click', () => updateColorUI(sw.dataset.c));
  });

  // native color picker
  nativeInp.addEventListener('input', e => updateColorUI(e.target.value));

  // hex input
  hexInput.addEventListener('input', e => {
    let v = e.target.value.trim();
    // strip non-hex except #
    v = '#' + v.replace(/[^0-9a-fA-F]/g,'').slice(0,6);
    if(v === '#') v = '';
    e.target.value = v;

    if(v.length === 7 && isHex(v)){
      updateColorUI(v);
    } else if(v.length === 4 && isHex(v)){
      updateColorUI(v);
    }
  });
  hexInput.addEventListener('blur', () => {
    const v = normalizeHex(hexInput.value);
    if(v) updateColorUI(v);
    else hexInput.value = picked;
  });

  // random
  document.getElementById('randColorBtn').addEventListener('click', () => {
    updateColorUI(randomColor());
  });

  // initial UI
  updateColorUI(picked);

  /* ---- PHOTO LOGIC ---- */
  const prev = document.getElementById('photoPrev');
  const photoUrlInput = document.getElementById('mPhoto');

  function setPreview(src) {
    photoData = src || '';
    if (photoData) {
      prev.style.backgroundImage = `url('${photoData}')`;
      prev.innerHTML = `<button type="button" class="remove-photo" id="rmPhoto" title="Remove">✕</button>`;
      prev.classList.add('has-img');
    } else {
      prev.style.backgroundImage = '';
      prev.innerHTML = `🖼️<button type="button" class="remove-photo" id="rmPhoto" title="Remove">✕</button>`;
      prev.classList.remove('has-img');
    }
    bindRemove();
  }
  function bindRemove() {
    const rm = document.getElementById('rmPhoto');
    if (rm) rm.onclick = (e) => { e.preventDefault(); photoUrlInput.value=''; setPreview(''); };
  }
  bindRemove();

  document.getElementById('photoFile').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const dataUrl = await resizeImage(f);
      setPreview(dataUrl);
      photoUrlInput.value = '';
      toast('📷 Photo upload ho gayi', 'ok');
    } catch (err) { toast('❌ Photo load nahi hui', 'err'); }
  });

  photoUrlInput.addEventListener('input', () => {
    let v = photoUrlInput.value.trim();
    if (v && !/^https?:\/\//i.test(v) && !v.startsWith('./') && !v.startsWith('/') && !v.startsWith('data:')) {
      v = 'https://' + v;
      photoUrlInput.value = v;
    }
    setPreview(v);
  });

  /* ---- SAVE / DELETE ---- */
  document.getElementById('mCancel').onclick = closeModal;

  document.getElementById('mSave').onclick = () => {
    const num  = document.getElementById('mNum').value.trim();
    const name = document.getElementById('mName').value.trim();
    if (!num || !name) { toast('❌ Number aur name bharein', 'err'); return; }
    if (!isHex(picked)) { toast('❌ Colour galat hai', 'err'); return; }

    if (line) {
      line.number = num; line.name = name; line.color = normalizeHex(picked); line.photo = photoData;
      toast('✅ Line update ho gayi', 'ok');
    } else {
      state.lines.push({
        id: uid(), number: num, name, color: normalizeHex(picked), photo: photoData,
        items: DEFAULT_ITEMS.map(it => ({ id: uid(), ...it }))
      });
      toast('✅ Line add ho gayi', 'ok');
    }
    saveState();
    closeModal();
    renderLines();
    if (viewItems.classList.contains('active') && currentLineId) renderItems();
  };

  const delBtn = document.getElementById('mDel');
  if (delBtn) {
    delBtn.onclick = () => {
      if (!confirm(`Line "${line.name}" aur uske saare sections delete karne hain?`)) return;
      state.lines = state.lines.filter(l => l.id !== line.id);
      saveState();
      closeModal();
      goHome();
      toast('🗑️ Line delete ho gayi', 'ok');
    };
  }

  overlay.classList.add('show');
}

/* ============ ITEM MODAL ============ */
function openItemModal(lineId, itemId) {
  if (!canEdit()) { toast('🔐 Admin access chahiye', 'err'); return; }
  const line = state.lines.find(l => l.id === lineId);
  if (!line) return;
  const item = itemId ? line.items.find(i => i.id === itemId) : null;

  const EMOJI_SUGGEST = ['🗺️','📍','🌀','⚙️','🔧','📐','🛑','🔥','📜','🔀',
                         '🛤️','🚉','📊','📷','📁','🔗','🛠️','📝','🧭','⚠️'];

  let itemPhoto = item ? (item.photo || '') : '';
  const isItemPhotoUrl = itemPhoto && /^https?:\/\//i.test(itemPhoto);
  const itemPhotoUrlVal = isItemPhotoUrl ? itemPhoto : '';

  modal.innerHTML = `
    <h3>${item ? 'Section Edit Karein' : 'Naya Section Add Karein'}</h3>
    <p class="sub">${esc(line.name)} • Line ${esc(line.number)}</p>

    <div class="field">
      <label>Title</label>
      <input id="iTitle" placeholder="e.g. Ballast Profile" value="${item ? escAttr(item.title) : ''}">
    </div>

    <div class="field">
      <label>Icon (emoji) — chhota badge ke liye</label>
      <input id="iIcon" maxlength="4" placeholder="🗺️" value="${item ? escAttr(item.icon) : '📌'}">
      <div class="color-row" id="emojiRow" style="margin-top:10px">
        ${EMOJI_SUGGEST.map(e => `<div class="sw" data-e="${e}" style="background:var(--input-bg);font-size:16px;display:grid;place-items:center;box-shadow:0 0 0 1px var(--line);aspect-ratio:1;width:32px;border-radius:50%">${e}</div>`).join('')}
      </div>
    </div>

    <div class="field">
      <label>Section Photo (optional)</label>
      <div class="photo-row">
        <div class="photo-preview ${itemPhoto?'has-img':''}" id="itemPhotoPrev" style="${itemPhoto ? `background-image:url('${escAttr(itemPhoto)}')` : ''}">
          ${itemPhoto ? '' : '📷'}
          <button type="button" class="remove-photo" id="rmItemPhoto" title="Remove">✕</button>
        </div>
        <div class="photo-actions">
          <label class="file-label">
            📤 Upload Photo
            <input type="file" id="itemPhotoFile" accept="image/*">
          </label>
          <input id="iPhotoUrl" placeholder="Ya URL paste karein" value="${escAttr(itemPhotoUrlVal)}">
        </div>
      </div>
      <small>Agar photo lagayenge to card par emoji ki jagah photo dikhegi (emoji chhote badge ke roop me).</small>
    </div>

    <div class="field">
      <label>Description (optional)</label>
      <input id="iDesc" placeholder="Chhota vivaran" value="${item ? escAttr(item.desc || '') : ''}">
    </div>

    <div class="field">
      <label>Link (URL / file path)</label>
      <input id="iLink" placeholder="https://... ya ./files/track.pdf" value="${item ? escAttr(item.link || '') : ''}">
    </div>

    <div class="modal-actions">
      ${item ? '<button class="btn danger" id="mDel">Delete</button>' : ''}
      <button class="btn sec" id="mCancel">Cancel</button>
      <button class="btn primary" id="mSave">${item ? 'Save' : 'Add'}</button>
    </div>
  `;

  const iPrev = document.getElementById('itemPhotoPrev');
  const iPhotoUrl = document.getElementById('iPhotoUrl');

  function setItemPreview(src) {
    itemPhoto = src || '';
    if (itemPhoto) {
      iPrev.style.backgroundImage = `url('${itemPhoto}')`;
      iPrev.innerHTML = `<button type="button" class="remove-photo" id="rmItemPhoto" title="Remove">✕</button>`;
      iPrev.classList.add('has-img');
    } else {
      iPrev.style.backgroundImage = '';
      iPrev.innerHTML = `📷<button type="button" class="remove-photo" id="rmItemPhoto" title="Remove">✕</button>`;
      iPrev.classList.remove('has-img');
    }
    bindItemRemove();
  }
  function bindItemRemove() {
    const rm = document.getElementById('rmItemPhoto');
    if (rm) rm.onclick = (e) => { e.preventDefault(); iPhotoUrl.value=''; setItemPreview(''); };
  }
  bindItemRemove();

  document.getElementById('itemPhotoFile').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const dataUrl = await resizeImage(f);
      setItemPreview(dataUrl);
      iPhotoUrl.value = '';
      toast('📷 Photo upload ho gayi', 'ok');
    } catch (err) { toast('❌ Photo load nahi hui', 'err'); }
  });

  iPhotoUrl.addEventListener('input', () => {
    let v = iPhotoUrl.value.trim();
    if (v && !/^https?:\/\//i.test(v) && !v.startsWith('./') && !v.startsWith('/') && !v.startsWith('data:')) {
      v = 'https://' + v;
      iPhotoUrl.value = v;
    }
    setItemPreview(v);
  });

  modal.querySelectorAll('#emojiRow .sw').forEach(sw => {
    sw.addEventListener('click', () => { document.getElementById('iIcon').value = sw.dataset.e; });
  });

  document.getElementById('mCancel').onclick = closeModal;

  document.getElementById('mSave').onclick = () => {
    const title = document.getElementById('iTitle').value.trim();
    const icon  = document.getElementById('iIcon').value.trim() || '📌';
    const desc  = document.getElementById('iDesc').value.trim();
    let   link  = document.getElementById('iLink').value.trim();

    if (!title) { toast('❌ Title bharna zaroori hai', 'err'); return; }
    if (link && !/^(https?:|mailto:|tel:|\.|\/|#|javascript:)/i.test(link)) link = 'https://' + link;

    if (item) {
      Object.assign(item, { title, icon, desc, link, photo: itemPhoto });
      toast('✅ Update ho gaya', 'ok');
    } else {
      line.items.push({ id: uid(), title, icon, desc, link, photo: itemPhoto });
      toast('✅ Add ho gaya', 'ok');
    }
    saveState();
    closeModal();
    renderItems();
  };

  const delBtn = document.getElementById('mDel');
  if (delBtn) {
    delBtn.onclick = () => {
      if (!confirm('Is section ko delete karna hai?')) return;
      line.items = line.items.filter(i => i.id !== itemId);
      saveState();
      closeModal();
      renderItems();
      toast('🗑️ Delete ho gaya', 'ok');
    };
  }

  overlay.classList.add('show');
}


/* ============ HERO BANNER (MongoDB) ============ */
const HERO_DEFAULT = {
  tag: 'LIVE • P-WAY MANAGEMENT SYSTEM',
  heading: 'Metro ki Har Line ki Poori Jaankari\nEk Hi Jagah',
  highlight: 'Har Line',
  desc: 'Track diagrams, curves, points, fittings, gradients, welds, aur poori history — sab kuch organised aur ek click par.',
  photo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=80',
  accent: '#ffd166',
  overlay: 100
};
function loadHero() {
  return Object.assign({}, HERO_DEFAULT, portalCache.hero || {});
}
async function saveHero(h) {
  try {
    const r = await apiFetch('/api/portal/hero', {method:'PUT', body:JSON.stringify(h)});
    portalCache.hero = r.hero;
    return true;
  } catch(e) {
    toast('❌ Banner MongoDB me save nahi hua: '+e.message, 'err');
    return false;
  }
}
function applyHero() {
  const h = loadHero();
  const sec = document.getElementById('heroSection');
  sec.style.setProperty('--hero-accent', h.accent || '#ffd166');
  document.getElementById('heroBg').style.backgroundImage = h.photo ? `url("${String(h.photo).replace(/"/g,'%22')}")` : 'none';
  document.getElementById('heroOverlay').style.opacity = Math.max(0, Math.min(100, +h.overlay)) / 100;
  document.getElementById('heroTagText').textContent = h.tag || '';
  document.getElementById('heroDesc').textContent = h.desc || '';
  let html = esc(h.heading || '');
  const hl = esc((h.highlight || '').trim());
  if (hl) html = html.replace(hl, `<span class="hl">${hl}</span>`);
  document.getElementById('heroTitle').innerHTML = html.replace(/\n/g, '<br>');
  document.getElementById('heroEditBtn').classList.toggle('show', !!canEdit());
}
function openHeroModal() {
  if (!canEdit()) { toast('🔐 Admin access chahiye', 'err'); return; }
  const h = loadHero();
  let photo = h.photo || '';
  const isUrl = /^https?:\/\//i.test(photo);
  modal.innerHTML = `
    <h3>✏️ Banner Edit Karein</h3>
    <p class="sub">Photo, heading, text aur colour sab MongoDB me save honge</p>
    <div class="field"><label>Banner Photo</label>
      <div class="hero-ph-row">
        <div class="hero-ph-prev" id="hPrev" style="${photo ? `background-image:url('${escAttr(photo)}')` : ''}">${photo ? '' : '🖼️'}</div>
        <div class="photo-actions" style="flex:1">
          <label class="file-label">📤 Upload Photo<input type="file" id="hFile" accept="image/*"></label>
          <input id="hUrl" placeholder="Ya URL paste karein" value="${isUrl ? escAttr(photo) : ''}">
        </div>
      </div>
      <small>Upload par photo auto-compress hoti hai (~1600px).</small>
    </div>
    <div class="field"><label>Upar ka chhota tag</label><input id="hTag" value="${escAttr(h.tag)}"></div>
    <div class="field"><label>Heading <small style="display:inline">(nayi line ke liye Enter dabayein)</small></label>
      <textarea id="hHead">${esc(h.heading)}</textarea></div>
    <div class="field"><label>Heading me highlight hone wale shabd</label>
      <input id="hHl" value="${escAttr(h.highlight)}" placeholder="e.g. Har Line"></div>
    <div class="field"><label>Description</label><textarea id="hDesc">${esc(h.desc)}</textarea></div>
    <div class="field"><label>Highlight colour</label>
      <div style="display:flex;gap:10px;align-items:center">
        <input type="color" id="hAcc" value="${/^#[0-9a-f]{6}$/i.test(h.accent) ? h.accent : '#ffd166'}" style="width:54px;height:40px;padding:2px;border-radius:10px;flex:0 0 auto">
        <small style="margin:0">Heading ke highlight shabdon ka colour</small>
      </div></div>
    <div class="field"><label>Photo ke upar ka neela parda: <b id="hOvVal">${h.overlay}%</b></label>
      <input type="range" id="hOv" min="0" max="100" value="${h.overlay}" style="padding:0">
      <small>Kam karein to photo zyada saaf dikhegi.</small></div>
    <div class="modal-actions">
      <button class="btn danger" id="hReset">↺ Default</button>
      <button class="btn sec" id="mCancel">Cancel</button>
      <button class="btn primary" id="hSave">Save</button>
    </div>`;
  const prev = document.getElementById('hPrev');
  const setPrev = src => { photo = src; prev.style.backgroundImage = src ? `url('${src.replace(/'/g,"%27")}')` : ''; prev.textContent = src ? '' : '🖼️'; };
  document.getElementById('hFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { setPrev(await resizeImage(f, 1600, 0.8)); document.getElementById('hUrl').value = ''; }
    catch(err) { toast('❌ Photo load nahi hui', 'err'); }
  });
  document.getElementById('hUrl').addEventListener('input', e => { const v = e.target.value.trim(); if (/^https?:\/\//i.test(v)) setPrev(v); });
  document.getElementById('hOv').addEventListener('input', e => { document.getElementById('hOvVal').textContent = e.target.value + '%'; });
  document.getElementById('mCancel').onclick = closeModal;
  document.getElementById('hReset').onclick = async () => {
    if (!confirm('Banner default par wapas laayein?')) return;
    if (await saveHero(HERO_DEFAULT)) { applyHero(); closeModal(); toast('↺ Banner default par wapas', 'ok'); }
  };
  document.getElementById('hSave').onclick = async () => {
    const heading = document.getElementById('hHead').value.trim();
    if (!heading) { toast('❌ Heading khaali nahi ho sakti', 'err'); return; }
    const nh = {
      tag: document.getElementById('hTag').value.trim(),
      heading,
      highlight: document.getElementById('hHl').value.trim(),
      desc: document.getElementById('hDesc').value.trim(),
      photo,
      accent: document.getElementById('hAcc').value,
      overlay: +document.getElementById('hOv').value
    };
    if (await saveHero(nh)) { applyHero(); closeModal(); toast('✅ Banner update ho gaya', 'ok'); }
  };
  overlay.classList.add('show');
}
document.getElementById('heroEditBtn').addEventListener('click', openHeroModal);


/* ============ INIT ============ */
document.getElementById('themeBtn').addEventListener('click', toggleTheme);

async function init() {
  document.getElementById('dynamicActions').innerHTML = '<span class="ghost-btn">⏳ Loading MongoDB...</span>';
  try {
    await loadState();
    applyTheme(portalCache.theme || 'light');
    await loadUsers();
    currentUser = await loadSession();
    if (currentUser) {
      await loadUsers();
    }
    refreshLoginUI();
    renderLines();

    const m = location.hash.match(/line=([a-z0-9]+)/i);
    if (m && state.lines.some(l => l.id === m[1])) openLine(m[1]);
  } catch(e) {
    console.error(e);
    toast('❌ App initialization failed: '+e.message, 'err');
  }
}
init();
