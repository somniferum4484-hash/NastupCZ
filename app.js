/**
 * NástupCZ — ENGINE v3.1.2 (TELEGRAM UI FIX)
 */
if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.expand();

const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbxwJX9gVpAbzJ4wS2J3BGv59HTcbIo_eZMDZb_IfD6oe_UkdwhUkqdh5vt_lhGALtnk/exec',
  NAME: 'NástupCZ'
};

const I18N = {
  ru: {
    vacs: 'Вакансии', facs: 'Избранное', edu: 'Обучение', info: 'Инфо', search: 'Поиск...',
    all: 'Все города', back: '← Назад', apply: 'ПОДАТЬ ЗАЯВКУ', loading: '⚡ NástupCZ...',
    empty: 'Ничего не найдено', housing: 'Жилье', schedule: 'График', salary: 'Зарплата', city: 'Город',
    form_desc: 'После подачи заявки наш менеджер свяжется с вами в ближайшие дни. Ожидайте звонка.',
    h_desc: 'ОПИСАНИЕ', h_reqs: 'ТРЕБОВАНИЯ', h_cond: 'УСЛОВИЯ И БОНУСЫ',
    f_name: 'Имя', f_last: 'Фамилия',
    f_dob: 'Дата рождения', f_phone: 'Номер телефона (Viber/TG)',
    f_email: 'Электронная почта', f_citizen: 'Гражданство', f_res: 'Тип пребывания',
    f_cancel: 'ОТМЕНА', s_success: 'Спасибо за вашу заявку! Наш менеджер свяжется с вами в ближайшее время. Ожидайте звонка.', s_err: 'Ошибка при отправке',
    s_provided: 'Предоставляется ✅', s_not_provided: 'Не предоставляется ❌'
  }
};

let state = {
  lang: 'ru',
  favs: JSON.parse(localStorage.getItem('favs') || '[]'),
  vacs: [], filtered: [], info: [], education: [], filters: { city: '', q: '' }, 
  page: 'list', loading: true, current: null, isEdu: false,
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

function saveFocus() {
  const active = document.activeElement;
  if (!active || !active.id) return null;
  return { id: active.id, start: active.selectionStart, end: active.selectionEnd };
}

function restoreFocus(fState) {
  if (!fState) return;
  const el = document.getElementById(fState.id);
  if (el) {
    el.focus();
    if (typeof fState.start === 'number') el.setSelectionRange(fState.start, fState.end);
  }
}

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
    loadInfo();
    loadEducation();
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

async function loadEducation() {
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=getEducation`);
    const data = await res.json();
    state.education = data.education || [];
  } catch (e) { console.warn('Education sheet not found or empty'); }
}

function resetApp() {
  state.filters.city = '';
  state.filters.q = '';
  state.page = 'list';
  state.isEdu = false;
  state.filtered = [...state.vacs];
  updateView();
  window.scrollTo(0, 0);
}

function updateView() {
  const fState = saveFocus();
  const root = document.getElementById('app');
  const t = I18N.ru;

  if (!root.dataset.init) {
    root.innerHTML = `<div id="h-c"></div><div id="m-c"></div><div id="n-c"></div>`;
    root.dataset.init = "1";
  }
  const hBox = document.getElementById('h-c');
  const mBox = document.getElementById('m-c');
  const nBox = document.getElementById('n-c');

  if (state.page === 'list' || state.page === 'favs' || state.page === 'education' || state.page === 'info') {
    const isList = state.page === 'list';
    
    // Update header ONLY if type changed (to keep input focus)
    const hType = isList ? 'search' : 'plain';
    if (hBox.dataset.type !== hType) {
      hBox.innerHTML = renderHeader(t);
      hBox.dataset.type = hType;
    } else {
      // Just update active chips if we are in list mode
      hBox.querySelectorAll('.chip').forEach(c => {
        const city = c.innerText === t.all ? '' : c.innerText;
        c.classList.toggle('active', state.filters.city === city);
      });
    }

    // Update main content
    if (state.page === 'list' || state.page === 'favs') {
      const items = state.page === 'favs' ? state.vacs.filter(v => state.favs.includes(v.id)) : state.filtered;
      mBox.innerHTML = renderList(items, t);
    } else if (state.page === 'education') {
      mBox.innerHTML = renderEducation(t);
    } else if (state.page === 'info') {
      mBox.innerHTML = renderInfo(t);
    }

    nBox.innerHTML = renderBottom(t);
  } else {
    // Detail / Apply pages
    hBox.innerHTML = '';
    hBox.dataset.type = 'none';
    mBox.innerHTML = (state.page === 'detail' ? renderDetail(t) : renderApply(t));
    nBox.innerHTML = renderBottom(t);
  }
  restoreFocus(fState);
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
        <input type="text" id="main-search" class="search-input" value="${state.filters.q}" placeholder="${t.search}" oninput="debouncedSearch(this.value)">
        <div class="city-scroller">
          <button class="chip ${state.filters.city === '' ? 'active' : ''}" onclick="setCity('')">${t.all}</button>
          ${cities.map(c => `<button class="chip ${state.filters.city === c ? 'active' : ''}" onclick="setCity('${c}')">${c}</button>`).join('')}
        </div>
      ` : ''}
    </header>
  `;
}

const SVG_STAR = `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;

function renderList(items, t) {
  if (state.loading) return `<div style="padding:150px 0; text-align:center; color:#fff">${t.loading}</div>`;
  if (items.length === 0) return `<div style="padding:100px 20px; text-align:center; color:#fff">${t.empty}</div>`;
  return `<div class="main-grid">${items.map(v => {
    const isFav = state.favs.includes(v.id);
    return `<div class="v-card" onclick="openDet(${v.id})"><button class="star-btn ${isFav ? 'on' : ''}" onclick="toggleFav(event, ${v.id})">${SVG_STAR}</button>
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

function renderEducation(t) {
  if (state.education.length === 0) return `<div style="padding:100px 20px; text-align:center;">Загрузка программ обучения...</div>`;
  return `
    <div class="main-grid" style="animation: fadeIn 0.3s; padding-bottom: 250px;">
      <h2 style="grid-column: 1/-1; color:#fff; text-align:center; font-size:24px; margin:20px 0 10px;">Программы Обучения</h2>
      ${state.education.map((e, idx) => `
        <div class="d-card" style="padding:0; overflow:hidden; border:1px solid var(--gold); margin-bottom: 20px;">
          <div style="background:var(--gold); color:#000; padding:15px; font-weight:800; font-size:16px; border-bottom:1px solid rgba(0,0,0,0.1)">${e.title}</div>
          <div style="padding:20px;">
            <div style="color:#fff; line-height:1.6; margin-bottom:20px; white-space: pre-wrap; font-size:15px">${e.content}</div>
            <div class="detail-info-grid" style="margin-bottom:20px;">
              <div class="info-box"><span>СТОИМОСТЬ</span><span style="color:#fff">${e.price}</span></div>
              <div class="info-box"><span>СРОКИ</span><span style="color:#fff">${e.duration}</span></div>
            </div>
            ${e.conditions ? `
              <div style="background:rgba(212,168,67,0.1); border-radius:8px; padding:15px; border-left:4px solid var(--gold); margin-bottom:20px">
                <div style="color:var(--gold); font-weight:800; font-size:12px; margin-bottom:5px; text-transform:uppercase;">Условия получения сертификата</div>
                <div style="color:#fff; font-size:14px; line-height:1.5;">${e.conditions}</div>
              </div>
            ` : ''}
            <button class="edu-btn" onclick="openEduApply(${idx})">ЗАПИСАТЬСЯ НА КУРС</button>
          </div>
        </div>
      `).join('')}
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
             <button class="star-btn ${isFav ? 'on' : ''}" style="position:static" onclick="toggleFav(event, ${v.id})">${SVG_STAR}</button></div>
          <div class="detail-info-grid">
            <div class="info-box"><span>${t.salary}</span><span style="color:#fff">${v.salary}</span></div>
            <div class="info-box"><span>${t.city}</span><span style="color:#fff">${v.city}</span></div>
            <div class="info-box"><span>${t.housing}</span><span style="color:#fff">${parseHousing(v.housing, t)}</span></div>
            <div class="info-box"><span>${t.schedule}</span><span style="color:#fff">${v.schedule || '—'}</span></div>
          </div>
          <span class="d-sect">${t.h_desc}</span><p class="d-p" style="color:#fff">${v.description}</p>
          ${reqs.length > 0 ? `<span class="d-sect">${t.h_reqs}</span><ul class="d-p" style="color:#fff; padding-left:40px">${reqs.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
          ${v.conditions ? `<span class="d-sect">${t.h_cond}</span><p class="d-p" style="color:#fff">${v.conditions}</p>` : ''}
        </div>
      </div><button class="footer-btn" onclick="nav('apply', event)">${t.apply}</button>
    </div>
  `;
}

function renderApply(t) {
  const citizens = ['Украина', 'Россия', 'Беларусь', 'Чехия', 'Другое'];
  const residences = ['Виза дочасной охраны (Dočasná ochrana)', 'Рабочая карта (Zaměstnanecká karta)', 'ПМЖ (Trvalý pobyt)', 'Гражданство Чехии (České občanství)', 'Паспорт ЕС (EU pas)', 'Другое (Jiné)'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 16 - i);

  const title = state.isEdu ? state.current.title : state.current.title;
  const subtitle = state.isEdu ? 'ЗАПИСЬ НА ОБУЧЕНИЕ' : state.current.company;

  return `<div class="detail-cont" style="padding: 30px 15px 320px;">
      <div id="top-anchor"></div>
      <a href="#" class="d-back" onclick="nav(state.isEdu?'education':(state.page==='apply'?'detail':'list'), event)" style="color:var(--gold); text-decoration:none; padding-left:20px; display:block; margin-bottom:20px; font-weight:700; font-size:18px;">${t.back}</a>
      <div class="d-card" style="padding:30px;"><h2 style="color:#fff; margin-bottom:10px">${t.apply}</h2>
      <div style="color:var(--gold); margin-bottom:5px; font-weight:700; text-transform:uppercase; font-size:12px;">${subtitle}</div>
      <div style="color:#fff; margin-bottom:15px; font-weight:800; font-size:18px">${title}</div>
      <div class="form-instruction">${t.form_desc}</div>
      <form id="apply-form" onsubmit="handleApply(event)" style="margin-top:25px;">
        <div class="form-group">
          <label class="form-label">${t.f_name} (латинскими буквами как в паспорте)</label>
          <input type="text" id="l-f" class="search-input" pattern="^[A-Za-z\\s\\-]+$" title="Только ЛАТИНСКИЕ буквы (как в паспорте)" required>
        </div>
        <div class="form-group">
          <label class="form-label">${t.f_last} (латинскими буквами как в паспорте)</label>
          <input type="text" id="l-l" class="search-input" pattern="^[A-Za-z\\s\\-]+$" title="Только ЛАТИНСКИЕ буквы (как в паспорте)" required>
        </div>
        <div class="form-group"><label class="form-label">${t.f_dob}</label>
          <div class="date-spinner-row">
            <select id="dob-d" class="search-input mini-select" required><option value="" disabled selected>ДД</option>${days.map(d => `<option value="${d}">${d}</option>`).join('')}</select>
            <select id="dob-m" class="search-input mini-select" required><option value="" disabled selected>ММ</option>${months.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select>
            <select id="dob-y" class="search-input mini-select" required><option value="" disabled selected>ГГГГ</option>${years.map(y => `<option value="${y}">${y}</option>`).join('')}</select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${t.f_phone}</label>
          <input type="tel" id="l-p" class="search-input" placeholder="+..." pattern="^\\+\\d{7,15}$" title="Формат: + и цифры (международный)" required>
        </div>
        <div class="form-group">
          <label class="form-label">${t.f_email}</label>
          <input type="email" id="l-e" class="search-input" title="Введите корректный Email" required>
        </div>
        <div class="form-group">
          <label class="form-label">${t.f_citizen}</label>
          <select id="l-c" class="search-input" required>
            <option value="" disabled selected>Выберите из списка...</option>
            ${citizens.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t.f_res}</label>
          <select id="l-r" class="search-input" required>
            <option value="" disabled selected>Выберите из списка...</option>
            ${residences.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex; justify-content:center; width:100%;">
          <button type="submit" id="submit-btn" class="footer-btn action-btn-center">${t.apply}</button>
        </div>
      </form>
    </div></div>`;
}

function renderBottom(t) {
  return `<nav class="b-nav">
    <div class="b-item ${state.page === 'list' ? 'active' : ''}" onclick="nav('list')"><span class="b-ico">💼</span><span>${t.vacs}</span></div>
    <div class="b-item ${state.page === 'favs' ? 'active' : ''}" onclick="nav('favs')"><span class="b-ico">⭐</span><span>${t.facs}</span></div>
    <div class="b-item ${state.page === 'education' ? 'active' : ''}" onclick="nav('education')"><span class="b-ico">🎓</span><span>${t.edu}</span></div>
    <div class="b-item ${state.page === 'info' ? 'active' : ''}" onclick="nav('info')"><span class="b-ico">ℹ️</span><span>${t.info}</span></div>
  </nav>`;
}

function setCity(c) { state.filters.city = c; applyFilters(); }
function scrollUp() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  setTimeout(() => {
    const top = document.getElementById('top-anchor');
    if (top) top.scrollIntoView();
  }, 10);
}
function nav(p, e) { if (e) e.preventDefault(); state.page = p; scrollUp(); updateView(); }
function openDet(id) { state.isEdu = false; state.current = state.vacs.find(v => v.id === id); history.pushState({ view: 'detail' }, ''); state.page = 'detail'; scrollUp(); updateView(); }
function openEduApply(idx) { state.isEdu = true; state.current = state.education[idx]; history.pushState({ view: 'education_apply' }, ''); state.page = 'apply'; scrollUp(); updateView(); }

// Перехват аппаратной кнопки "Назад" (Android) и свайпов (iOS)
window.addEventListener('popstate', function () {
  if (state.page === 'detail') { state.page = 'list'; scrollUp(); updateView(); }
  else if (state.page === 'apply') { state.page = state.isEdu ? 'education' : 'detail'; scrollUp(); updateView(); }
});
function debouncedSearch(v) { state.filters.q = v; applyFiltersDebounced(); }
function toggleFav(e, id) { e.stopPropagation(); if (state.favs.includes(id)) state.favs = state.favs.filter(i => i !== id); else state.favs.push(id); localStorage.setItem('favs', JSON.stringify(state.favs)); updateView(); }
function applyFilters() { state.filtered = state.vacs.filter(v => { const mCity = !state.filters.city || v.city === state.filters.city; const mSearch = !state.filters.q || (v.title + v.description + v.company).toLowerCase().includes(state.filters.q.toLowerCase()); return mCity && mSearch; }); updateView(); }

async function handleApply(e) {
  e.preventDefault();
  const form = document.getElementById('apply-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const t = I18N.ru;
  const btn = e.target.querySelector('button');
  btn.innerText = "..."; btn.disabled = true;

  const dob = `${document.getElementById('dob-d').value}.${document.getElementById('dob-m').value}.${document.getElementById('dob-y').value}`;
  const payload = {
    action: 'submitLead',
    firstName: document.getElementById('l-f').value,
    lastName: document.getElementById('l-l').value,
    dob: dob,
    phone: document.getElementById('l-p').value,
    email: document.getElementById('l-e').value,
    citizenship: document.getElementById('l-c').value,
    residenceType: document.getElementById('l-r').value,
    vacancy_id: state.isEdu ? 'EDU' : state.current.id,
    vacancy_title: state.current.title,
    vacancy_company: state.isEdu ? 'ОБУЧЕНИЕ' : state.current.company
  };
  await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify(payload) });
  alert(t.s_success);
  state.page = state.isEdu ? 'education' : 'list';
  updateView();
}
