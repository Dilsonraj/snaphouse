/* =========================================================
   Little Knot — script.js
   Vanilla JS. Cart in localStorage. WhatsApp checkout.
   Products from localStorage if you've edited them in admin.html,
   otherwise fetched from products.json.
   ========================================================= */

/* ---------- Config ---------- */
const WHATSAPP_NUMBER = "917358470385"; // e.g. "919876543210"
const CURRENCY = "₹";
const LS_PRODUCTS = "lk_products";
const LS_CART = "lk_cart";
const LS_WISH = "lk_wish";

/* ---------- State ---------- */
let products = [];
let cart = JSON.parse(localStorage.getItem(LS_CART) || "[]");
let wish = JSON.parse(localStorage.getItem(LS_WISH) || "[]");
let activeCat = "all";
let activeSort = "featured";
let searchTerm = "";

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = (n) => CURRENCY + n.toLocaleString("en-IN");
const save = () => {
  localStorage.setItem(LS_CART, JSON.stringify(cart));
  localStorage.setItem(LS_WISH, JSON.stringify(wish));
};

/* ---------- Toast ---------- */
const toastEl = $("#toast");
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 2200);
}

/* ---------- Load products ---------- */
async function loadProducts() {
  const stored = localStorage.getItem(LS_PRODUCTS);
  if (stored) {
    products = JSON.parse(stored);
    return;
  }
  try {
    const res = await fetch("products.json");
    products = await res.json();
  } catch (e) {
    console.error("Could not load products.json", e);
    products = [];
  }
}

/* ---------- Render products ---------- */
function getFiltered() {
  let list = [...products];
  if (activeCat !== "all") list = list.filter((p) => p.category === activeCat);
  if (searchTerm) {
    const t = searchTerm.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(t) ||
        p.description.toLowerCase().includes(t) ||
        p.category.toLowerCase().includes(t)
    );
  }
  if (activeSort === "low") list.sort((a, b) => a.price - b.price);
  if (activeSort === "high") list.sort((a, b) => b.price - a.price);
  return list;
}

function renderProducts() {
  const grid = $("#productGrid");
  const list = getFiltered();
  $("#emptyState").hidden = list.length > 0;

  grid.innerHTML = list
    .map((p) => {
      const inCart = cart.find((c) => c.id === p.id);
      const isWished = wish.includes(p.id);
      return `
      <article class="card reveal" data-id="${p.id}">
        <div class="card__media">
          ${p.tag ? `<span class="card__tag">${p.tag}</span>` : ""}
          <button class="card__wish ${isWished ? "is-on" : ""}" data-wish="${p.id}" aria-label="Save to wishlist">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="${isWished ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6">
              <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21Z"/>
            </svg>
          </button>
          <img src="${p.image}" alt="${p.title}" loading="lazy"/>
          <button class="card__quick" data-quick="${p.id}">Quick view</button>
        </div>
        <div class="card__body">
          <h3 class="card__title"><span>${p.title}</span><strong>${money(p.price)}</strong></h3>
          <p class="card__desc">${p.description}</p>
          <button class="card__add ${inCart ? "is-added" : ""}" data-add="${p.id}">
            ${inCart ? "✓ Added to basket" : "Add to basket +"}
          </button>
        </div>
      </article>`;
    })
    .join("");

  attachReveal();
}

/* ---------- Categories ---------- */
function renderCats() {
  $$(".cat").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.cat === activeCat);
  });
  const heading = $("#shopHeading");
  heading.textContent =
    activeCat === "all" ? "Featured this week" : `${activeCat} we love`;
}

/* ---------- Cart ---------- */
function updateCartCount() {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  $("#cartCount").textContent = n;
  $("#cartCount").style.display = n > 0 ? "flex" : "none";
}

function addToCart(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  const existing = cart.find((i) => i.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id: p.id, qty: 1 });
  save();
  updateCartCount();
  renderProducts();
  renderCart();
  toast(`${p.title} added to basket`);
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
  save();
  updateCartCount();
  renderCart();
  renderProducts();
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  save();
  updateCartCount();
  renderCart();
  renderProducts();
}

function cartTotal() {
  return cart.reduce((s, i) => {
    const p = products.find((x) => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
}

function renderCart() {
  const body = $("#cartBody");
  const foot = $("#cartFoot");
  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty__icon">◠</div>
        <h4>Your basket is empty</h4>
        <p>Find something small and meaningful in the shop.</p>
        <button class="btn btn--dark" data-close>Start shopping</button>
      </div>`;
    foot.hidden = true;
    return;
  }
  foot.hidden = false;
  body.innerHTML = cart
    .map((i) => {
      const p = products.find((x) => x.id === i.id);
      if (!p) return "";
      return `
      <div class="cart-item">
        <img src="${p.image}" alt="${p.title}"/>
        <div class="cart-item__col">
          <h4 class="cart-item__title">${p.title}</h4>
          <span class="cart-item__price">${money(p.price)}</span>
          <div class="cart-item__qty">
            <button data-qty="${p.id}" data-delta="-1" aria-label="Decrease">–</button>
            <span>${i.qty}</span>
            <button data-qty="${p.id}" data-delta="1" aria-label="Increase">+</button>
          </div>
        </div>
        <button class="cart-item__remove" data-remove="${p.id}">remove</button>
      </div>`;
    })
    .join("");
  $("#cartSubtotal").textContent = money(cartTotal());
}

/* ---------- Drawer / Modal helpers ---------- */
function openEl(el) {
  el.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeEl(el) {
  el.hidden = true;
  document.body.style.overflow = "";
}

/* ---------- Quick view ---------- */
function openQuickView(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  $("#quickViewPanel").innerHTML = `
    <button class="modal__close" data-close aria-label="Close">✕</button>
    <div class="qv">
      <img src="${p.image}" alt="${p.title}"/>
      <div>
        <span class="eyebrow">${p.category}</span>
        <h3>${p.title}</h3>
        <div class="price">${money(p.price)}</div>
        <p>${p.description}</p>
        <p class="muted" style="font-size:.85rem">
          ${p.stock > 0 ? `${p.stock} in stock · ready to wrap` : "Currently sold out"}
        </p>
        <button class="btn btn--dark" data-add="${p.id}" ${p.stock === 0 ? "disabled" : ""}>
          Add to basket — ${money(p.price)}
        </button>
      </div>
    </div>`;
  openEl($("#quickView"));
}

/* ---------- Checkout (WhatsApp) ---------- */
function buildWhatsappMessage(form) {
  const lines = [
    "*New order from Little Knot*",
    "",
    `*Name:* ${form.name}`,
    `*Phone:* ${form.phone}`,
    `*Address:* ${form.address}`,
    "",
    "*Ordered items:*",
  ];
  cart.forEach((i) => {
    const p = products.find((x) => x.id === i.id);
    if (p) lines.push(`• ${p.title} × ${i.qty} — ${money(p.price * i.qty)}`);
  });
  lines.push("", `*Total: ${money(cartTotal())}*`);
  return encodeURIComponent(lines.join("\n"));
}

function handleCheckout(e) {
  e.preventDefault();
  if (cart.length === 0) {
    toast("Your basket is empty");
    return;
  }
  const data = Object.fromEntries(new FormData(e.target).entries());
  const msg = buildWhatsappMessage(data);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  window.open(url, "_blank");
  closeEl($("#checkoutModal"));
  closeEl($("#cartDrawer"));
  toast("Opening WhatsApp…");
}

/* ---------- Scroll reveal ---------- */
let revealObserver;
function attachReveal() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            revealObserver.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 }
    );
  }
  $$(".reveal:not(.is-in)").forEach((el) => revealObserver.observe(el));
}

/* ---------- Events ---------- */
function bindEvents() {
  // Nav scroll
  window.addEventListener("scroll", () => {
    $("#nav").classList.toggle("is-scrolled", window.scrollY > 8);
  });

  // Hamburger
  $("#hamburger").addEventListener("click", () => {
    $("#navLinks").classList.toggle("is-open");
  });
  $$("#navLinks a").forEach((a) =>
    a.addEventListener("click", () => $("#navLinks").classList.remove("is-open"))
  );

  // Search toggle
  $("#searchToggle").addEventListener("click", () => {
    const bar = $("#searchbar");
    bar.hidden = !bar.hidden;
    if (!bar.hidden) $("#searchInput").focus();
  });
  $("#searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value.trim();
    renderProducts();
  });

  // Categories
  $$(".cat").forEach((b) =>
    b.addEventListener("click", () => {
      activeCat = b.dataset.cat;
      renderCats();
      renderProducts();
      document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
    })
  );

  // Sort chips
  $$(".chip").forEach((c) =>
    c.addEventListener("click", () => {
      $$(".chip").forEach((x) => x.classList.remove("chip--active"));
      c.classList.add("chip--active");
      activeSort = c.dataset.sort;
      renderProducts();
    })
  );

  // Delegated clicks
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-add]");
    if (t) return addToCart(t.dataset.add);
    const q = e.target.closest("[data-quick]");
    if (q) return openQuickView(q.dataset.quick);
    const w = e.target.closest("[data-wish]");
    if (w) {
      const id = w.dataset.wish;
      wish = wish.includes(id) ? wish.filter((x) => x !== id) : [...wish, id];
      save();
      renderProducts();
      toast(wish.includes(id) ? "Saved to wishlist" : "Removed from wishlist");
      return;
    }
    const qty = e.target.closest("[data-qty]");
    if (qty) return changeQty(qty.dataset.qty, parseInt(qty.dataset.delta, 10));
    const rm = e.target.closest("[data-remove]");
    if (rm) return removeFromCart(rm.dataset.remove);
    const close = e.target.closest("[data-close]");
    if (close) {
      const modal = close.closest(".modal, .drawer");
      if (modal) closeEl(modal);
      else {
        $$(".modal, .drawer").forEach((m) => { if (!m.hidden) closeEl(m); });
      }
    }
  });

  // Cart open
  $("#cartToggle").addEventListener("click", () => {
    renderCart();
    openEl($("#cartDrawer"));
  });

  // Checkout
  $("#checkoutBtn").addEventListener("click", () => {
    closeEl($("#cartDrawer"));
    openEl($("#checkoutModal"));
  });
  $("#checkoutForm").addEventListener("submit", handleCheckout);

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      $$(".modal, .drawer").forEach((m) => {
        if (!m.hidden) closeEl(m);
      });
    }
  });
}

/* ---------- Init ---------- */
(async function init() {
  $("#year").textContent = new Date().getFullYear();
  await loadProducts();
  renderCats();
  renderProducts();
  updateCartCount();
  bindEvents();
})();
