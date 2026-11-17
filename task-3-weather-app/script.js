const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const WX = 'https://api.open-meteo.com/v1/forecast';
const KEY = 'skyline-recent-v1';
let unit = 'c', place = null, reqId = 0;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

class CityNotFound extends Error {}

/* WMO weather code -> label, icon, background theme */
function describe(code, day){
  const d = day === 1;
  if (code === 0) return {t: d ? 'Sunny' : 'Clear night', i: d ? '☀️' : '🌙', th: d ? 'clear-day' : 'clear-night'};
  if (code === 1 || code === 2) return {t: code === 1 ? (d ? 'Mostly sunny' : 'Mostly clear') : 'Partly cloudy', i: d ? '⛅' : '☁️', th: d ? 'clear-day' : 'clear-night'};
  if (code === 3) return {t: 'Overcast', i: '☁️', th: d ? 'cloud-day' : 'cloud-night'};
  if (code === 45 || code === 48) return {t: 'Foggy', i: '🌫️', th: 'fog'};
  if (code >= 51 && code <= 57) return {t: 'Drizzle', i: '🌦️', th: 'rain'};
  if (code >= 61 && code <= 67) return {t: 'Rain', i: '🌧️', th: 'rain'};
  if (code >= 71 && code <= 77) return {t: 'Snow', i: '❄️', th: 'snow'};
  if (code >= 80 && code <= 82) return {t: 'Rain showers', i: '🌧️', th: 'rain'};
  if (code === 85 || code === 86) return {t: 'Snow showers', i: '🌨️', th: 'snow'};
  if (code >= 95) return {t: 'Thunderstorm', i: '⛈️', th: 'storm'};
  return {t: 'Unknown', i: '🌡️', th: d ? 'cloud-day' : 'cloud-night'};
}

/* ---------- network ---------- */
async function getJSON(url){
  const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, {signal: ctrl.signal});
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally { clearTimeout(to); }
}
async function geocode(name){
  const data = await getJSON(`${GEO}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);
  if (!data.results || !data.results.length) throw new CityNotFound(name);
  return data.results[0];
}
async function fetchWeather(p){
  const f = unit === 'f';
  const url = `${WX}?latitude=${p.latitude}&longitude=${p.longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto` +
    `&temperature_unit=${f ? 'fahrenheit' : 'celsius'}&wind_speed_unit=${f ? 'mph' : 'kmh'}`;
  return getJSON(url);
}

/* ---------- ui state ---------- */
function show(state, text){
  $('spin').hidden = state !== 'loading';
  $('out').hidden = state !== 'ok';
  $('msg').hidden = state !== 'error';
  if (state === 'error') $('msg').textContent = text;
}
async function load(resolve){
  const id = ++reqId;
  show('loading');
  let stage = 'network';
  try {
    const p = await resolve();
    const w = await fetchWeather(p);
    if (id !== reqId) return;
    stage = 'display';
    place = p; render(p, w); show('ok');
  } catch (err) {
    console.error('Skyline error (' + stage + '):', err);
    if (id !== reqId) return;
    if (err instanceof CityNotFound) show('error', `We couldn't find "${err.message}". Check the spelling or try a nearby larger city.`);
    else if (err.name === 'AbortError') show('error', 'The weather service took too long to respond. Check your connection and try again.');
    else if (stage === 'display') show('error', 'Weather loaded but could not be displayed: ' + err.message);
    else if (/^HTTP/.test(err.message)) show('error', 'The weather service returned an error (' + err.message + '). Try again in a moment.');
    else show('error', 'The request to the weather service was blocked or failed. If this page is open inside a preview (such as Claude), download the file and open it in a regular browser tab. Otherwise check your internet connection, VPN or ad blocker.');
  }
}
function search(name){
  name = name.trim();
  if (!name){ show('error', 'Enter a city name to search.'); return; }
  load(async () => { const p = await geocode(name); saveRecent(p.name); return p; });
}

/* ---------- render ---------- */
function render(p, w){
  const c = w.current, u = w.current_units, d = describe(c.weather_code, c.is_day);
  document.body.dataset.theme = d.th;
  $('city').textContent = [p.name, p.admin1 && p.admin1 !== p.name ? p.admin1 : '', p.country].filter(Boolean).join(', ');
  const t = new Date(c.time);
  $('local').textContent = 'Local time ' + t.toLocaleString(undefined, {weekday:'short', hour:'numeric', minute:'2-digit'}).replace(/ GMT.*/, '') + ' · feels like ' + Math.round(c.apparent_temperature) + '°';
  $('temp').textContent = Math.round(c.temperature_2m) + '°';
  $('cond').textContent = d.t;
  $('icon').textContent = d.i;
  const wind = unit === 'f' ? 'mph' : 'km/h';
  $('metrics').innerHTML = [
    ['Humidity', c.relative_humidity_2m + '%'],
    ['Wind', Math.round(c.wind_speed_10m) + ' ' + wind],
    ['Pressure', Math.round(c.pressure_msl) + ' hPa']
  ].map(([k, v]) => `<div class="m"><span>${k}</span><b>${v}</b></div>`).join('');
  $('fc').innerHTML = w.daily.time.map((day, i) => {
    const [y, m, dd] = day.split('-').map(Number);
    const name = i === 0 ? 'Today' : new Date(y, m - 1, dd).toLocaleDateString(undefined, {weekday:'short'});
    const fd = describe(w.daily.weather_code[i], 1);
    return `<div class="day"><div>${name}</div><div class="i" title="${fd.t}">${fd.i}</div>
      <div class="hi">${Math.round(w.daily.temperature_2m_max[i])}°</div><div class="lo">${Math.round(w.daily.temperature_2m_min[i])}°</div></div>`;
  }).join('');
}

/* ---------- recent searches ---------- */
function loadRecent(){ try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function saveRecent(name){
  const list = [name, ...loadRecent().filter(n => n.toLowerCase() !== name.toLowerCase())].slice(0, 5);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  renderRecent();
}
function renderRecent(){
  const list = loadRecent();
  $('recent').innerHTML = list.map(n => `<button class="chip" type="button" data-city="${esc(n)}">${esc(n)}</button>`).join('');
}

/* ---------- events ---------- */
$('form').addEventListener('submit', e => { e.preventDefault(); search($('q').value); });
$('recent').addEventListener('click', e => { const b = e.target.closest('[data-city]'); if (b){ $('q').value = b.dataset.city; search(b.dataset.city); } });
document.querySelector('.units').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.dataset.u === unit) return;
  unit = b.dataset.u;
  document.querySelectorAll('.units button').forEach(x => x.setAttribute('aria-pressed', x.dataset.u === unit));
  if (place) load(async () => place);
});

renderRecent();
const first = loadRecent()[0] || 'Tokyo';
$('q').value = first; search(first);
