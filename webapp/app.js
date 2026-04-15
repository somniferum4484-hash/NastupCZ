/**
 * NástupCZ — ENGINE v2.9.0 (INFO PAGE + NASTA AI)
 * MASTER RULES: 
 * 1. ONLY RUSSIAN LANGUAGE. 
 * 2. NO LANGUAGE SWITCHER.
 * 3. LOGO GOES TO HOME.
 * 4. 4 BOTTOM BUTTONS: VACS, FAVS, NASTA, INFO.
 */

const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbxwJX9gVpAbzJ4wS2J3BGv59HTcbIo_eZMDZb_IfD6oe_UkdwhUkqdh5vt_lhGALtnk/exec',
  NAME: 'NástupCZ'
};

const I18N = {
  ru: { 
    vacs: 'Вакансии', facs: 'Избранное', nasta: 'ИИ Наста', info: 'Инфо', search: 'Поиск...', 
    all: 'Все города', back: '← Назад', apply: 'ОТКЛИКНУТЬСЯ', loading: '⚡ NástupCZ...',
    empty: 'Ничего не найдено', housing: 'Жилье', schedule: 'График', salary: 'Зарплата', city: 'Город',
    h_desc: 'ОПИСАНИЕ', h_reqs: 'ТРЕБОВАНИЯ', h_cond: 'УСЛОВИЯ И БОНУСЫ',
    f_name: 'Имя (латинскими буквами)', f_last: 'Фамилия (латинскими буквами)',
    f_dob: 'Дата рождения', f_phone: 'Номер телефона (Viber/TG)',
    f_email: 'Электронная почта', f_citizen: 'Гражданство', f_res: 'Тип пребывания',
    f_cancel: 'Отмена', s_success: 'Отправлено!', 
    s_provided: 'Предоставляется ✅', s_not_provided: 'Не предоставляется ❌'
  }
};

let state = {
  lang: 'ru',
  favs: JSON.parse(localStorage.getItem('favs') || '[]'),
  vacs: [], filtered: [], info: [], filters: { city: '', q: '' }, page: 'list', loading: true,
  lastPageType: ''
};

let debounceTimer;
function debounce(func, delay) {
  return function(...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
}

const applyFiltersDebounced = debounce(applyFilters, 300);

function fixImg(url) {
  if (!url) return null;
  const id = url.split('id=')[1] || url.split('/d/')[1]?.split('/')[0];
  return id ? `https://lh3.googleusercontent.com/d/${id}=w800` : url;
}

function shortenSalary(s) {
  if (!s) return '—';
  let short = s.split('(')[0].split(';')[0].split(',')[0].trim();
  return short.length > 35 ? short.substring(0, 32) + '...' : short;
}

function parseHousing(val, t) {
  if (!val) return '—';
  const v = val.toLowerCase();
  if (v === 'нет' || v === 'no') return t.s_not_provided;
  if (v === 'да' || v === 'yes') return t.s_provided;
  return val;
}

window.onload = load;

async function load() {
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=getVacancies`);
    const data = await res.json();
    state.vacs = (data.vacancies || []).map(v => ({ ...v, img: fixImg(v.image_url) }));
    state.filtered = [...state.vacs];
    
    // Подгружаем инфо асинхронно
    loadInfo();
    
    state.loading = false;
    updateView();
  } catch (e) { console.error(e); }
}

async function loadInfo() {
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=getInfo`);
    const data = await res.json();
    state.info = data.info || [];
  } catch (e) { console.warn('Info sheet not found or empty'); }
}

function resetApp() {
  state.filters.city = '';
  state.filters.q = '';
  state.page = 'list';
  state.filtered = [...state.vacs];
  updateView();
  window.scrollTo(0,0);
}

function updateView() {
  const root = document.getElementById('app');
  const t = I18N.ru;

  if (!root.dataset.init) {
    root.innerHTML = `<div id="h-c"></div><div id="m-c"></div><div id="n-c"></div>`;
    root.dataset.init = "1";
  }
  const hBox = document.getElementById('h-c');
  const mBox = document.getElementById('m-c');
  const nBox = document.getElementById('n-c');

  if (state.page === 'list' || state.page === 'favs') {
    const isList = state.page === 'list';
    const items = state.page === 'favs' ? state.vacs.filter(v => state.favs.includes(v.id)) : state.filtered;
    
    // Update header only if type changed (to keep focus)
    const hType = isList ? 'search' : 'plain';
    if (hBox.dataset.type !== hType) {
      hBox.innerHTML = renderHeader(t);
      hBox.dataset.type = hType;
    } else {
      // Just update active chips
      hBox.querySelectorAll('.chip').forEach(c => {
        const city = c.innerText === t.all ? '' : c.innerText;
        c.classList.toggle('active', state.filters.city === city);
      });
    }
    
    mBox.innerHTML = renderList(items, t);
    nBox.innerHTML = renderBottom(t);
  } else if (state.page === 'info') {
    hBox.innerHTML = renderHeader(t);
    hBox.dataset.type = 'info';
    mBox.innerHTML = renderInfo(t);
    nBox.innerHTML = renderBottom(t);
  } else {
    hBox.innerHTML = '';
    hBox.dataset.type = 'none';
    mBox.innerHTML = (state.page === 'detail' ? renderDetail(t) : renderApply(t));
    nBox.innerHTML = renderBottom(t);
  }
}

function renderHeader(t) {
  const cities = [...new Set(state.vacs.map(v => v.city))].filter(c => c);
  return `
    <header class="glass-header">
      <div class="brand-row" onclick="resetApp()" style="cursor:pointer">
        <div class="logo-block">
          <img src="logo.png" class="logo-img" onerror="this.src='https://img.icons8.com/clouds/100/job.png'">
          <div class="logo-text">${CONFIG.NAME}</div>
        </div>
      </div>
      ${state.page === 'list' ? `
        <input type="text" class="search-input" value="${state.filters.q}" placeholder="${t.search}" oninput="debouncedSearch(this.value)">
        <div class="city-scroller">
          <button class="chip ${state.filters.city===''?'active':''}" onclick="setCity('')">${t.all}</button>
          ${cities.map(c => `<button class="chip ${state.filters.city===c?'active':''}" onclick="setCity('${c}')">${c}</button>`).join('')}
        </div>
      ` : ''}
    </header>
  `;
}

function renderList(items, t) {
  if (state.loading) return `<div style="padding:150px 0; text-align:center; color:#fff">${t.loading}</div>`;
  return `<div class="main-grid">${items.map(v => {
    const isFav = state.favs.includes(v.id);
    return `<div class="v-card" onclick="openDet(${v.id})"><button class="star-btn ${isFav?'on':''}" onclick="toggleFav(event, ${v.id})">${isFav?'⭐':'☆'}</button>
      <div class="v-company" style="color:var(--gold)">${v.company}</div><div class="v-title" style="color:#fff">${v.title}</div>
      ${v.img ? `<img src="${v.img}" class="v-img-grid">` : ''}<div class="v-salary" style="color:#fff; font-weight:800">${shortenSalary(v.salary)}</div>
      <div style="font-size:13px; color:var(--gold)">📍 ${v.city}</div></div>`;
  }).join('')}</div>`;
}

function renderInfo(t) {
  if (state.info.length === 0) return `<div style="padding:100px 20px; text-align:center;">Загрузка инструкций...</div>`;
  return `
    <div class="main-grid" style="animation: fadeIn 0.3s">
      <div class="d-card" style="padding:25px;">
        <h2 style="color:var(--gold); margin-top:0;">Инструкции</h2>
        ${state.info.map(i => `
          <div style="margin-bottom:30px;">
            <div style="color:var(--gold); font-weight:800; font-size:14px; text-transform:uppercase; margin-bottom:10px; border-left:3px solid var(--gold); padding-left:10px;">${i.category}</div>
            <div style="color:#fff; line-height:1.6; white-space: pre-wrap;">${i.content}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderDetail(t) {
  const v = state.current; const isFav = state.favs.includes(v.id);
  const reqs = Array.isArray(v.requirements) ? v.requirements : (v.requirements ? [v.requirements] : []);
  return `
    <div class="detail-cont" style="animation: fadeIn 0.3s"><a href="#" class="d-back" onclick="nav('list', event)" style="color:var(--gold); text-decoration:none; padding-left:20px">${t.back}</a>
      <div class="d-card">${v.img ? `<img src="${v.img}" style="width:100%; height:240px; object-fit:cover;">` : ''}
        <div style="padding:25px;"><div style="display:flex; justify-content:space-between; align-items:flex-start"><div>
                <div style="color:var(--gold); font-weight:800; font-size:13px; text-transform:uppercase; margin-bottom:5px">${v.company}</div>
                <h1 style="margin:0; font-size:26px; color:#fff">${v.title}</h1></div>
             <button class="star-btn ${isFav?'on':''}" style="position:static" onclick="toggleFav(event, ${v.id})">${isFav?'⭐':'☆'}</button></div>
          <div class="detail-info-grid">
            <div class="info-box"><span>${t.salary}</span><span style="color:#fff">${v.salary}</span></div>
            <div class="info-box"><span>${t.city}</span><span style="color:#fff">${v.city}</span></div>
            <div class="info-box"><span>${t.housing}</span><span style="color:#fff">${parseHousing(v.housing, t)}</span></div>
            <div class="info-box"><span>${t.schedule}</span><span style="color:#fff">${v.schedule || '—'}</span></div>
          </div>
          <span class="d-sect">${t.h_desc}</span><p class="d-p" style="color:#fff">${v.description}</p>
          ${reqs.length > 0 ? `<span class="d-sect">${t.h_reqs}</span><ul class="d-p" style="color:#fff; padding-left:40px">${reqs.map(r=>`<li>${r}</li>`).join('')}</ul>` : ''}
          ${v.conditions ? `<span class="d-sect">${t.h_cond}</span><p class="d-p" style="color:#fff">${v.conditions}</p>` : ''}
        </div>
      </div><button class="footer-btn" onclick="nav('apply', event)">${t.apply}</button>
    </div>
  `;
}

function renderApply(t) {
  const citizens = ['Украина','Россия','Беларусь','Чехия','Другое'];
  const residences = [
    'Виза дочасной охраны (Dočasná ochrana)',
    'Рабочая карта (Zaměstnanecká karta)',
    'ПМЖ (Trvalý pobyt)',
    'Гражданство Чехии (České občanství)',
    'Паспорт ЕС (EU pas)',
    'Другое (Jiné)'
  ];
  return `<div class="detail-cont" style="padding:20px 15px;"><div class="d-card" style="padding:30px;"><h2 style="color:#fff; margin-bottom:10px">${t.apply}</h2>
      <div style="color:var(--gold); margin-bottom:30px; font-weight:700">${state.current.title}</div>
      <form onsubmit="handleApply(event)">
        <div class="form-group"><label class="form-label">${t.f_name}</label><input type="text" id="l-f" class="search-input" required></div>
        <div class="form-group"><label class="form-label">${t.f_last}</label><input type="text" id="l-l" class="search-input" required></div>
        <div class="form-group"><label class="form-label">${t.f_dob}</label><input type="date" id="l-d" class="search-input" required></div>
        <div class="form-group"><label class="form-label">${t.f_phone}</label><input type="tel" id="l-p" class="search-input" placeholder="+..." required></div>
        <div class="form-group"><label class="form-label">${t.f_email}</label><input type="email" id="l-e" class="search-input" required></div>
        <div class="form-group"><label class="form-label">${t.f_citizen}</label><select id="l-c" class="search-input">
          ${citizens.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select></div>
        <div class="form-group"><label class="form-label">${t.f_res}</label><select id="l-r" class="search-input">
          ${residences.map(r => `<option value="${r}">${r}</option>`).join('')}
        </select></div>
        <button type="submit" class="footer-btn" style="position:static; width:100%; margin-top:30px; display:block">${t.apply}</button>
      </form><button onclick="nav('detail', event)" style="background:none; border:none; color:#cbd5e1; width:100%; margin-top:20px; cursor:pointer; font-size:14px">${t.f_cancel}</button>
    </div></div>`;
}

function renderBottom(t) {
  return `<nav class="b-nav">
    <div class="b-item ${state.page==='list'?'active':''}" onclick="nav('list')"><span class="b-ico">💼</span><span>${t.vacs}</span></div>
    <div class="b-item ${state.page==='favs'?'active':''}" onclick="nav('favs')"><span class="b-ico">⭐</span><span>${t.facs}</span></div>
    <div class="b-item" onclick="window.open('https://t.me/NastupCZ_bot')"><span class="b-ico">👩‍💼</span><span>${t.nasta}</span></div>
    <div class="b-item ${state.page==='info'?'active':''}" onclick="nav('info')"><span class="b-ico">ℹ️</span><span>${t.info}</span></div>
  </nav>`;
}

function setCity(c) { state.filters.city = c; applyFilters(); }
function nav(p, e) { if(e) e.preventDefault(); state.page = p; updateView(); window.scrollTo(0,0); }
function openDet(id) { state.current = state.vacs.find(v => v.id === id); state.page = 'detail'; updateView(); window.scrollTo(0,0); }
function debouncedSearch(v) { state.filters.q = v; applyFiltersDebounced(); }
function toggleFav(e, id) { e.stopPropagation(); if (state.favs.includes(id)) state.favs = state.favs.filter(i => i !== id); else state.favs.push(id); localStorage.setItem('favs', JSON.stringify(state.favs)); updateView(); }
function applyFilters() { state.filtered = state.vacs.filter(v => { const mCity = !state.filters.city || v.city === state.filters.city; const mSearch = !state.filters.q || (v.title + v.description + v.company).toLowerCase().includes(state.filters.q.toLowerCase()); return mCity && mSearch; }); updateView(); }
async function handleApply(e) { e.preventDefault(); const t = I18N.ru; const btn = e.target.querySelector('button'); btn.innerText = "..."; btn.disabled = true; const payload = { action: 'submitLead', firstName: document.getElementById('l-f').value, lastName: document.getElementById('l-l').value, dob: document.getElementById('l-d').value, phone: document.getElementById('l-p').value, email: document.getElementById('l-e').value, citizenship: document.getElementById('l-c').value, residenceType: document.getElementById('l-r').value, vacancy_id: state.current.id, vacancy_title: state.current.title }; await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify(payload) }); alert(t.s_success); state.page = 'list'; updateView(); }
