// ============================================================
// KP ATELIER — Cart drawer (glass), available on every page
// ============================================================

const CartDrawer = {
  init() {
    if (document.getElementById("cart-drawer-root")) return;

    const wrap = document.createElement("div");
    wrap.id = "cart-drawer-root";
    wrap.innerHTML = `
      <div class="cart-overlay" id="cart-overlay"></div>
      <aside class="cart-drawer glass" id="cart-drawer">
        <div class="cart-drawer-header">
          <h2>Your Bag</h2>
          <button id="cart-close-btn" style="font-size:22px; color:var(--text-muted);">&times;</button>
        </div>
        <div class="cart-items" id="cart-items-list"></div>
        <div class="cart-drawer-footer">
          <div class="cart-total"><span>Total</span><span id="cart-total-amount">₦0</span></div>
          <a href="cart.html" class="btn btn-gold btn-block">View Bag &amp; Checkout</a>
        </div>
      </aside>
    `;
    document.body.appendChild(wrap);

    document.getElementById("cart-overlay").addEventListener("click", () => this.close());
    document.getElementById("cart-close-btn").addEventListener("click", () => this.close());

    this.render();
  },

  render() {
    const listEl = document.getElementById("cart-items-list");
    const items = Cart.get();

    if (!items.length) {
      listEl.innerHTML = `<div class="empty-state">Your bag is empty.<br/>Browse the shop to find something you like.</div>`;
    } else {
      listEl.innerHTML = items.map((i) => `
        <div class="cart-item">
          ${i.image ? `<img src="${fullImageUrl(i.image)}" />` : `<div style="width:60px;height:70px;background:var(--surface-2);border-radius:6px;"></div>`}
          <div class="cart-item-info">
            <div class="name">${escapeHtml(i.name)}</div>
            <div class="price">${formatMoney(i.price)}</div>
            <div class="cart-item-controls">
              <button onclick="CartDrawer.changeQty('${i.product_id}', ${i.quantity - 1})">−</button>
              <span>${i.quantity}</span>
              <button onclick="CartDrawer.changeQty('${i.product_id}', ${i.quantity + 1})">+</button>
              <span class="cart-remove" onclick="CartDrawer.remove('${i.product_id}')">Remove</span>
            </div>
          </div>
        </div>
      `).join("");
    }

    document.getElementById("cart-total-amount").textContent = formatMoney(Cart.total());
    Cart.updateBadge();
  },

  changeQty(productId, qty) {
    Cart.updateQty(productId, qty);
    this.render();
  },

  remove(productId) {
    Cart.remove(productId);
    this.render();
  },

  open() {
    this.render();
    document.getElementById("cart-overlay").classList.add("open");
    document.getElementById("cart-drawer").classList.add("open");
  },

  close() {
    document.getElementById("cart-overlay").classList.remove("open");
    document.getElementById("cart-drawer").classList.remove("open");
  },
};

document.addEventListener("DOMContentLoaded", () => CartDrawer.init());
