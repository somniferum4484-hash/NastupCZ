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
    vacs: 'Вакансии', facs: 'Избранное', edu: 'Обучение', info: 'Инфо', search: 'Поиск...', 
    all: 'Все города', back: '← Назад', apply: 'ПОДАТЬ ЗАЯВКУ', loading: '⚡ NástupCZ...',
    empty: 'Ничего не найдено', housing: 'Жилье', schedule: 'График', salary: 'Зарплата', city: 'Город',
    form_desc: 'После подачи заявки наш менеджер свяжется с вами в ближайшие дни. Ожидайте звонка.',
    h_desc: 'ОПИСАНИЕ', h_reqs: 'ТРЕБОВАНИЯ', h_cond: 'УСЛОВИЯ И БОНУСЫ',
    f_name: 'Имя (латинскими буквами)', f_last: 'Фамилия (латинскими буквами)',
    f_dob: 'Дата рождения', f_phone: 'Номер телефона (Viber/TG)',
    f_email: 'Электронная почта', f_citizen: 'Гражданство', f_res: 'Тип пребывания',
    f_cancel: 'ОТМЕНА', s_success: 'Спасибо за вашу заявку! Наш менеджер свяжется с вами в ближайшее время. Ожидайте звонка.', s_err: 'Ошибка при отправке',
    s_provided: 'Предоставляется ✅', s_not_provided: 'Не предоставляется ❌'
  }
};

let state = {
  lang: 'ru',
  favs: JSON.parse(localStorage.getItem('favs') || '[]'),
  vacs: [], filtered: [], info: [], education: [], filters: { city: '', q: '' }, page: 'list', loading: true
};

function fixImg(url) {
// ... (lines 37-55 stay same)
}

window.onload = load;

async function load() {
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=getVacancies`);
    const data = await res.json();
    state.vacs = (data.vacancies || []).map(v => ({ ...v, img: fixImg(v.image_url) }));
    state.filtered = [...state.vacs];
    
    // Подгружаем инфо и обучение асинхронно
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
// ... (lines 82-89 stay same)
}

function updateView() {
  const root = document.getElementById('app');
  const t = I18N.ru;
  if (state.page === 'list' || state.page === 'favs') {
    const items = state.page === 'favs' ? state.vacs.filter(v => state.favs.includes(v.id)) : state.filtered;
    root.innerHTML = `${renderHeader(t)}${renderList(items, t)}${renderBottom(t)}`;
  } else if (state.page === 'info') {
    root.innerHTML = `${renderHeader(t)}${renderInfo(t)}${renderBottom(t)}`;
  } else if (state.page === 'education') {
    root.innerHTML = `${renderHeader(t)}${renderEducation(t)}${renderBottom(t)}`;
  } else {
    root.innerHTML = `${state.page==='detail'?renderDetail(t):renderApply(t)}${renderBottom(t)}`;
  }
}

// ... (renderHeader, renderList stay same)

function renderInfo(t) {
// ... (lines 136-150 stay same)
}

function renderEducation(t) {
  if (state.education.length === 0) return `<div style="padding:100px 20px; text-align:center;">Загрузка программ обучения...</div>`;
  return `
    <div class="main-grid" style="animation: fadeIn 0.3s; padding-bottom: 300px;">
      <h2 style="grid-column: 1/-1; color:#fff; text-align:center; font-size:24px; margin:20px 0 10px;">Программы Обучения</h2>
      ${state.education.map(e => `
        <div class="d-card" style="padding:0; overflow:hidden; border:1px solid var(--gold); margin-bottom: 20px;">
          <div style="background:var(--gold); color:#000; padding:15px; font-weight:800; font-size:16px;">${e.title}</div>
          <div style="padding:20px;">
            <div style="color:#fff; line-height:1.6; margin-bottom:20px; white-space: pre-wrap;">${e.content}</div>
            <div class="detail-info-grid" style="margin-bottom:20px;">
              <div class="info-box"><span>СТОИМОСТЬ</span><span style="color:#fff">${e.price}</span></div>
              <div class="info-box"><span>СРОКИ</span><span style="color:#fff">${e.duration}</span></div>
            </div>
            ${e.conditions ? `
              <div style="background:rgba(212,168,67,0.1); border-radius:8px; padding:15px; border-left:4px solid var(--gold);">
                <div style="color:var(--gold); font-weight:800; font-size:12px; margin-bottom:5px; text-transform:uppercase;">Условия</div>
                <div style="color:#fff; font-size:14px; line-height:1.5;">${e.conditions}</div>
              </div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ... (renderDetail, renderApply stay same until renderBottom)

function renderBottom(t) {
  return `<nav class="b-nav">
    <div class="b-item ${state.page==='list'?'active':''}" onclick="nav('list')"><span class="b-ico">💼</span><span>${t.vacs}</span></div>
    <div class="b-item ${state.page==='favs'?'active':''}" onclick="nav('favs')"><span class="b-ico">⭐</span><span>${t.facs}</span></div>
    <div class="b-item ${state.page==='education'?'active':''}" onclick="nav('education')"><span class="b-ico">🎓</span><span>${t.edu}</span></div>
    <div class="b-item ${state.page==='info'?'active':''}" onclick="nav('info')"><span class="b-ico">ℹ️</span><span>${t.info}</span></div>
  </nav>`;
}

function setCity(c) { state.filters.city = c; applyFilters(); }
function scrollUp() { 
  setTimeout(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0; 
    document.documentElement.scrollTop = 0;
    const top = document.getElementById('top-anchor');
    if (top) top.scrollIntoView();
  }, 80); 
}
function nav(p, e) { if(e) e.preventDefault(); state.page = p; updateView(); scrollUp(); }
function openDet(id) { state.current = state.vacs.find(v => v.id === id); state.page = 'detail'; updateView(); scrollUp(); }
function debouncedSearch(v) { state.filters.q = v; applyFilters(); }
function toggleFav(e, id) { e.stopPropagation(); if (state.favs.includes(id)) state.favs = state.favs.filter(i => i !== id); else state.favs.push(id); localStorage.setItem('favs', JSON.stringify(state.favs)); updateView(); }
function applyFilters() { state.filtered = state.vacs.filter(v => { const mCity = !state.filters.city || v.city === state.filters.city; const mSearch = !state.filters.q || (v.title + v.description + v.company).toLowerCase().includes(state.filters.q.toLowerCase()); return mCity && mSearch; }); updateView(); }
async function handleApply(e) { 
  e.preventDefault(); const t = I18N.ru; const btn = e.target.querySelector('button'); btn.innerText = "..."; btn.disabled = true; 
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
    vacancy_id: state.current.id, 
    vacancy_title: state.current.title,
    vacancy_company: state.current.company
  }; 
  await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify(payload) }); 
  alert(t.s_success); state.page = 'list'; updateView(); 
}
