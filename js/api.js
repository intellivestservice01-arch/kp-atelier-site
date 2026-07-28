// ============================================================
// KP ATELIER — public site shared client
// ============================================================

const API_BASE = "http://localhost:5000/api";
const WHATSAPP_NUMBER = "2349010578554"; // no + or leading 0, wa.me format

const Theme = {
  KEY: "kp_theme",
  init() {
    const saved = localStorage.getItem(this.KEY) || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  },
  toggle() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(this.KEY, next);
    return next;
  },
  current() {
    return document.documentElement.getAttribute("data-theme") || "dark";
  },
};

async function apiRequest(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  if (!isForm && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  let data;
  try { data = await res.json(); } catch (e) { data = {}; }

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function fullImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `http://localhost:5000${path}`;
}

function formatMoney(amount) {
  if (amount === null || amount === undefined) return "—";
  return "₦" + Number(amount).toLocaleString();
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso.replace(" ", "T"));
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function toast(message, isError = false) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const el = document.createElement("div");
  el.className = "toast" + (isError ? " error" : "");
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ---------- Cart (client-side, submitted as a single order on checkout) ----------

const Cart = {
  KEY: "kp_cart",
  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch (e) { return []; }
  },
  save(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
  },
  add(product, quantity = 1) {
    const items = this.get();
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: product.images && product.images[0] ? product.images[0].url : "",
        quantity,
      });
    }
    this.save(items);
  },
  updateQty(productId, quantity) {
    let items = this.get();
    if (quantity <= 0) {
      items = items.filter((i) => i.product_id !== productId);
    } else {
      const item = items.find((i) => i.product_id === productId);
      if (item) item.quantity = quantity;
    }
    this.save(items);
  },
  remove(productId) {
    this.save(this.get().filter((i) => i.product_id !== productId));
  },
  clear() {
    this.save([]);
  },
  total() {
    return this.get().reduce((sum, i) => sum + i.price * i.quantity, 0);
  },
  count() {
    return this.get().reduce((sum, i) => sum + i.quantity, 0);
  },
  updateBadge() {
    document.querySelectorAll(".cart-count").forEach((el) => {
      const count = this.count();
      el.textContent = count;
      el.style.display = count > 0 ? "flex" : "none";
    });
  },
};

// ---------- Wishlist (client-side) ----------

const Wishlist = {
  KEY: "kp_wishlist",
  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch (e) { return []; }
  },
  has(productId) {
    return this.get().includes(productId);
  },
  toggle(productId) {
    let items = this.get();
    if (items.includes(productId)) {
      items = items.filter((id) => id !== productId);
    } else {
      items.push(productId);
    }
    localStorage.setItem(this.KEY, JSON.stringify(items));
    return items.includes(productId);
  },
};

// ---------- Guest customer identity (for chat + checkout continuity) ----------

const CustomerId = {
  KEY: "kp_customer_id",
  get() { return localStorage.getItem(this.KEY); },
  set(id) { localStorage.setItem(this.KEY, id); },
};
