const KEY = 'tasklane-tasks-v1';
let tasks = [], status = 'all', catF = '', q = '', editing = null, fresh = null, popId = null, dragId = null;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATS = ['Work','Personal','Study'];

/* ---------- persistence ---------- */
function saveToLocalStorage(){ try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) {} }
function loadFromLocalStorage(){
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (Array.isArray(v)) return v.filter(t => t && typeof t.text === 'string');
  } catch (e) {}
  return null;
}

/* ---------- dates ---------- */
const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
const parse = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
function dueInfo(t){
  if (!t.due) return null;
  const todayS = iso(new Date());
  const label = t.due === todayS ? 'Due today' : 'Due ' + parse(t.due).toLocaleDateString(undefined,{month:'short',day:'numeric'});
  return {label, late: !t.done && t.due < todayS};
}

/* ---------- CRUD ---------- */
function createTask(text, cat, due){
  const t = {id: Date.now().toString(36) + Math.random().toString(36).slice(2,5), text, cat, due, done:false};
  tasks.unshift(t); fresh = t.id; commit();
}
function updateTask(id, patch){ const t = tasks.find(x => x.id === id); if (t) Object.assign(t, patch); commit(); }
function deleteTask(id){
  const el = document.querySelector(`li[data-id="${id}"]`);
  const finish = () => { tasks = tasks.filter(t => t.id !== id); commit(); };
  if (el && !matchMedia('(prefers-reduced-motion:reduce)').matches){ el.classList.add('out'); setTimeout(finish, 200); } else finish();
}
function toggleTask(id){ const t = tasks.find(x => x.id === id); if (t){ t.done = !t.done; popId = id; commit(); } }
function moveTask(fromId, toId){
  if (fromId === toId) return;
  const from = tasks.findIndex(t => t.id === fromId); const [item] = tasks.splice(from, 1);
  const to = tasks.findIndex(t => t.id === toId); tasks.splice(to, 0, item); commit();
}
function commit(){ saveToLocalStorage(); render(); fresh = null; popId = null; }

/* ---------- render ---------- */
function visible(){
  const s = q.trim().toLowerCase();
  return tasks.filter(t =>
    (status === 'all' || (status === 'done' ? t.done : !t.done)) &&
    (!catF || t.cat === catF) && (!s || t.text.toLowerCase().includes(s)));
}
function itemHTML(t){
  if (editing === t.id){
    return `<li data-id="${t.id}" data-cat="${t.cat}"><div class="edit" style="grid-column:1/-1">
      <input type="text" id="eText" value="${esc(t.text)}" maxlength="120" aria-label="Edit title">
      <select id="eCat">${CATS.map(c => `<option${c === t.cat ? ' selected' : ''}>${c}</option>`).join('')}</select>
      <input type="date" id="eDue" value="${t.due || ''}" aria-label="Edit due date">
      <div class="row"><button class="btn ghost" data-act="cancel">Cancel</button><button class="btn" data-act="save">Save</button></div></div></li>`;
  }
  const d = dueInfo(t);
  return `<li data-id="${t.id}" data-cat="${t.cat}" class="${t.done ? 'done' : ''}${fresh === t.id ? ' new' : ''}" draggable="true">
    <span class="grip" title="Drag to reorder" aria-hidden="true">⋮⋮</span>
    <button class="chk${popId === t.id ? ' pop' : ''}" data-act="toggle" role="checkbox" aria-checked="${t.done}" aria-label="Mark ${esc(t.text)} ${t.done ? 'active' : 'complete'}">✓</button>
    <div class="txt"><span class="title" data-act="edit">${esc(t.text)}</span>
      <div class="meta"><span class="tag">${t.cat}</span>${d ? `<span class="${d.late ? 'late' : ''}">${d.late ? 'Overdue · ' : ''}${d.label}</span>` : ''}</div></div>
    <div class="acts"><button data-act="edit" aria-label="Edit task">Edit</button><button data-act="del" aria-label="Delete task">Delete</button></div></li>`;
}
function render(){
  const list = visible();
  const done = tasks.filter(t => t.done).length, act = tasks.length - done;
  $('nAll').textContent = tasks.length; $('nAct').textContent = act; $('nDone').textContent = done;
  $('prog').style.width = tasks.length ? Math.round(done / tasks.length * 100) + '%' : '0';
  $('summary').textContent = tasks.length ? `${done} of ${tasks.length} done` : 'No tasks yet';
  $('clear').hidden = done === 0;
  document.querySelectorAll('#status button').forEach(b => b.setAttribute('aria-pressed', b.dataset.s === status));
  if (!list.length){
    $('list').innerHTML = `<li class="empty" style="display:block;border-left:1px dashed var(--line)">${tasks.length ? 'No tasks match these filters. Clear the search or pick another status.' : 'Nothing here yet. Type a task above and press Enter.'}</li>`;
  } else $('list').innerHTML = list.map(itemHTML).join('');
  if (editing) { const e = $('eText'); if (e){ e.focus(); e.setSelectionRange(e.value.length, e.value.length); } }
}

/* ---------- events ---------- */
function addFromForm(){
  const text = $('text').value.trim();
  if (!text){ $('err').textContent = 'Enter a task title before adding.'; $('text').focus(); return; }
  $('err').textContent = '';
  createTask(text, $('cat').value, $('due').value);
  $('text').value = ''; $('due').value = ''; $('text').focus();
}
function saveEdit(id){
  const text = $('eText').value.trim();
  if (!text) { $('eText').focus(); return; }
  const patch = {text, cat: $('eCat').value, due: $('eDue').value};
  editing = null; updateTask(id, patch);
}
$('addBtn').onclick = addFromForm;
$('text').addEventListener('keydown', e => { if (e.key === 'Enter') addFromForm(); });
$('status').addEventListener('click', e => { const b = e.target.closest('button'); if (b){ status = b.dataset.s; render(); } });
$('catFilter').onchange = e => { catF = e.target.value; render(); };
$('search').oninput = e => { q = e.target.value; render(); };
$('clear').onclick = () => { tasks = tasks.filter(t => !t.done); commit(); };

$('list').addEventListener('click', e => {
  const li = e.target.closest('li[data-id]'); const b = e.target.closest('[data-act]'); if (!li || !b) return;
  const id = li.dataset.id, a = b.dataset.act;
  if (a === 'toggle') toggleTask(id);
  else if (a === 'del') deleteTask(id);
  else if (a === 'edit'){ if (b.classList.contains('title') && e.detail < 2) return; editing = id; render(); }
  else if (a === 'save') saveEdit(id);
  else if (a === 'cancel'){ editing = null; render(); }
});
$('list').addEventListener('dblclick', e => { const li = e.target.closest('li[data-id]'); if (li && e.target.closest('.title')){ editing = li.dataset.id; render(); } });
$('list').addEventListener('keydown', e => {
  if (!editing) return;
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') saveEdit(editing);
  if (e.key === 'Escape'){ editing = null; render(); }
});

/* drag and drop reordering */
$('list').addEventListener('dragstart', e => { const li = e.target.closest('li[data-id]'); if (!li) return; dragId = li.dataset.id; li.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); });
$('list').addEventListener('dragover', e => { const li = e.target.closest('li[data-id]'); if (!li || !dragId) return; e.preventDefault(); document.querySelectorAll('li.over').forEach(x => x.classList.remove('over')); if (li.dataset.id !== dragId) li.classList.add('over'); });
$('list').addEventListener('drop', e => { const li = e.target.closest('li[data-id]'); if (li && dragId){ e.preventDefault(); moveTask(dragId, li.dataset.id); } dragId = null; });
$('list').addEventListener('dragend', () => { dragId = null; render(); });

/* ---------- init ---------- */
$('today').textContent = new Date().toLocaleDateString(undefined, {weekday:'long', month:'long', day:'numeric'});
const saved = loadFromLocalStorage();
tasks = saved || [
  {id:'s1', text:'Finish the Data Science assignment', cat:'Study', due:iso(new Date()), done:false},
  {id:'s2', text:'Send weekly update email', cat:'Work', due:'', done:false},
  {id:'s3', text:'Plan the weekend', cat:'Personal', due:'', done:true}
];
render();
