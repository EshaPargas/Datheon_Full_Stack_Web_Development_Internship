const API = 'https://fakestoreapi.com/products';
const TAX = 0.08, FREE_SHIP = 100, SHIP = 7.99, KEY = 'marlo-cart-v1';
const CATS = ['All', 'Electronics', 'Jewelry', 'Clothing'];
const FALLBACK = [
  {id:1,title:'Fjallraven Foldsack No. 1 Backpack, Fits 15 Laptops',price:109.95,category:"men's clothing",image:'',rating:{rate:3.9,count:120}},
  {id:2,title:'Mens Casual Premium Slim Fit T-Shirts',price:22.3,category:"men's clothing",image:'',rating:{rate:4.1,count:259}},
  {id:5,title:"John Hardy Women's Legends Naga Bracelet",price:695,category:'jewelery',image:'',rating:{rate:4.6,count:400}},
  {id:6,title:'Solid Gold Petite Micropave',price:168,category:'jewelery',image:'',rating:{rate:3.9,count:70}},
  {id:9,title:'WD 2TB Elements Portable External Hard Drive',price:64,category:'electronics',image:'',rating:{rate:3.3,count:203}},
  {id:14,title:'Samsung 49-Inch Curved Gaming Monitor',price:999.99,category:'electronics',image:'',rating:{rate:2.2,count:140}},
  {id:15,title:"BIYLACLESEN Women's 3-in-1 Snowboard Jacket",price:56.99,category:"women's clothing",image:'',rating:{rate:2.6,count:235}},
  {id:19,title:"Opna Women's Short Sleeve Moisture T-Shirt",price:7.95,category:"women's clothing",image:'',rating:{rate:4.5,count:146}}
];

let products = [], cart = [], cat = 'All', query = '';
const $ = id => document.getElementById(id);
const money = n => '$' + n.toFixed(2);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function groupOf(c){
  if (c === 'electronics') return 'Electronics';
  if (c === 'jewelery' || c === 'jewelry') return 'Jewelry';
  return 'Clothing';
}
function badgeOf(p){
  if (p.rating.rate >= 4.5) return 'Top rated';
  if (p.rating.count >= 300) return 'Best seller';
  if (p.price < 15) return 'Great value';
  return '';
}
function stars(r){
  const full = Math.round(r);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

/* ---------- persistence ---------- */
function loadCart(){
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; }
  catch (e) { return []; }
}
function saveCart(){ try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }

/* ---------- cart actions ---------- */
function addToCart(id){
  const p = products.find(x => x.id === id); if (!p) return;
  const line = cart.find(x => x.id === id);
  if (line) line.qty++;
  else cart.push({id:p.id, title:p.title, price:p.price, image:p.image, qty:1});
  renderCart(); openCart();
}
function removeFromCart(id){ cart = cart.filter(x => x.id !== id); renderCart(); }
function updateQuantity(id, delta){
  const line = cart.find(x => x.id === id); if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) removeFromCart(id); else renderCart();
}
function calculateTotal(){
  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const tax = subtotal * TAX;
  const shipping = subtotal === 0 || subtotal >= FREE_SHIP ? 0 : SHIP;
  return {subtotal, tax, shipping, total: subtotal + tax + shipping};
}

/* ---------- rendering ---------- */
function renderFilters(){
  $('filters').innerHTML = CATS.map(c =>
    `<button class="chip" data-cat="${c}" aria-pressed="${c === cat}">${c}</button>`).join('');
}
function renderGrid(){
  const q = query.trim().toLowerCase();
  const list = products.filter(p =>
    (cat === 'All' || groupOf(p.category) === cat) && (!q || p.title.toLowerCase().includes(q)));
  if (!list.length){ $('grid').innerHTML = '<p class="empty">No products match. Try another search or category.</p>'; return; }
  $('grid').innerHTML = list.map(p => {
    const b = badgeOf(p);
    const img = p.image
      ? `<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" onerror="this.outerHTML='<span class=ph>🛍️</span>'">`
      : '<span class="ph">🛍️</span>';
    return `<article class="card">
      ${b ? `<span class="badge">${b}</span>` : ''}
      <div class="img">${img}</div>
      <div class="body">
        <h3 class="title">${esc(p.title)}</h3>
        <div class="meta">${groupOf(p.category)}</div>
        <div class="meta"><span class="stars" aria-hidden="true">${stars(p.rating.rate)}</span> ${p.rating.rate.toFixed(1)} (${p.rating.count})</div>
        <div class="row"><span class="price">${money(p.price)}</span><button class="add" data-add="${p.id}">Add to cart</button></div>
      </div></article>`;
  }).join('');
}
function renderCart(){
  const n = cart.reduce((s, x) => s + x.qty, 0);
  $('count').textContent = n; $('count').hidden = n === 0;
  $('items').innerHTML = cart.length ? cart.map(x => `
    <div class="item">
      ${x.image ? `<img src="${esc(x.image)}" alt="">` : '<span class="ph" style="font-size:2rem">🛍️</span>'}
      <div><div class="t">${esc(x.title)}</div>
        <div class="qty"><button data-dec="${x.id}" aria-label="Decrease quantity">−</button><span>${x.qty}</span><button data-inc="${x.id}" aria-label="Increase quantity">+</button>
        <button class="rm" data-rm="${x.id}">Remove</button></div></div>
      <strong class="sans">${money(x.price * x.qty)}</strong>
    </div>`).join('') : '<p class="empty">Your cart is empty. Add something you like.</p>';
  const t = calculateTotal();
  $('sub').textContent = money(t.subtotal);
  $('tax').textContent = money(t.tax);
  $('ship').textContent = t.shipping ? money(t.shipping) : (t.subtotal ? 'Free' : '$0.00');
  $('total').textContent = money(t.total);
  $('checkout').disabled = cart.length === 0;
  saveCart();
}

/* ---------- drawer & modal ---------- */
function openCart(){ $('drawer').classList.add('on'); $('scrim').classList.add('on'); $('drawer').setAttribute('aria-hidden','false'); }
function closeCart(){ $('drawer').classList.remove('on'); $('scrim').classList.remove('on'); $('drawer').setAttribute('aria-hidden','true'); }
function openModal(html){ $('box').innerHTML = html; $('modal').classList.add('on'); }
function closeModal(){ $('modal').classList.remove('on'); }

function showCheckout(){
  const t = calculateTotal();
  openModal(`<h2 id="mt">Checkout</h2>
    <p class="meta">Demo only. No payment is taken.</p>
    <label for="cn">Full name</label><input id="cn" autocomplete="name">
    <label for="ce">Email</label><input id="ce" type="email" autocomplete="email">
    <label for="cc">Card number</label><input id="cc" inputmode="numeric" placeholder="4242 4242 4242 4242">
    <div class="two"><div><label for="cx">Expiry</label><input id="cx" placeholder="MM/YY"></div><div><label for="cv">CVC</label><input id="cv" inputmode="numeric" placeholder="123"></div></div>
    <div id="err" class="err" role="alert"></div>
    <button id="pay" class="go">Pay ${money(t.total)}</button>
    <button id="cancel" class="go" style="background:none;color:var(--ink);border:1px solid var(--line)">Back to cart</button>`);
  $('cn').focus();
}
function placeOrder(){
  const name = $('cn').value.trim(), email = $('ce').value.trim();
  const card = $('cc').value.replace(/\s/g,''), exp = $('cx').value.trim(), cvc = $('cv').value.trim();
  let e = '';
  if (!name) e = 'Enter your full name.';
  else if (!/^\S+@\S+\.\S+$/.test(email)) e = 'Enter a valid email address.';
  else if (!/^\d{13,19}$/.test(card)) e = 'Enter a card number with 13 to 19 digits.';
  else if (!/^\d{2}\/\d{2}$/.test(exp)) e = 'Enter the expiry as MM/YY.';
  else if (!/^\d{3,4}$/.test(cvc)) e = 'Enter the 3 or 4 digit CVC.';
  if (e){ $('err').textContent = e; return; }
  const t = calculateTotal(), n = cart.reduce((s,x) => s + x.qty, 0);
  const order = 'MR-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  cart = []; renderCart(); closeCart();
  openModal(`<h2 id="mt">Order confirmed</h2>
    <p>Thanks, ${esc(name)}. Your order <strong>${order}</strong> (${n} item${n === 1 ? '' : 's'}, ${money(t.total)}) is on its way. A receipt goes to ${esc(email)}.</p>
    <button id="done" class="go">Keep shopping</button>`);
}

/* ---------- data ---------- */
async function loadProducts(){
  $('grid').innerHTML = '<div class="skel"></div>'.repeat(8);
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(API, {signal: ctrl.signal}); clearTimeout(to);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    products = data.filter(p => !!p && p.rating);
  } catch (err) {
    products = FALLBACK;
    $('note').innerHTML = '<div class="note sans">Could not reach FakeStoreAPI, so you are seeing a small offline sample without images. Open this file in a regular browser tab with internet access to load the full catalog.</div>';
  }
  renderGrid();
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) { if (e.target === $('scrim')) closeCart(); if (e.target === $('modal')) closeModal(); return; }
  const d = t.dataset;
  if (d.cat){ cat = d.cat; renderFilters(); renderGrid(); }
  else if (d.add) addToCart(+d.add);
  else if (d.inc) updateQuantity(+d.inc, 1);
  else if (d.dec) updateQuantity(+d.dec, -1);
  else if (d.rm) removeFromCart(+d.rm);
  else if (t.id === 'open') openCart();
  else if (t.id === 'close') closeCart();
  else if (t.id === 'checkout') showCheckout();
  else if (t.id === 'pay') placeOrder();
  else if (t.id === 'cancel' || t.id === 'done') closeModal();
});
$('scrim').addEventListener('click', closeCart);
$('search').addEventListener('input', e => { query = e.target.value; renderGrid(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape'){ closeModal(); closeCart(); } });

cart = loadCart();
renderFilters(); renderCart(); loadProducts();
