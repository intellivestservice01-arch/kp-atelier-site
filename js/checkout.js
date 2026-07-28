// ============================================================
// KP ATELIER — Checkout page
// ============================================================

function renderCartItems() {
  const container = document.getElementById("checkout-items");
  const items = Cart.get();

  if (!items.length) {
    document.getElementById("checkout-view").style.display = "none";
    document.getElementById("empty-cart-view").style.display = "block";
    return;
  }

  container.innerHTML = items.map((i) => `
    <div class="cart-item" style="align-items:flex-start;">
      ${i.image ? `<img src="${fullImageUrl(i.image)}" />` : `<div style="width:60px;height:70px;background:var(--surface-2);border-radius:6px;"></div>`}
      <div class="cart-item-info">
        <div class="name">${escapeHtml(i.name)}</div>
        <div class="price">${formatMoney(i.price)} × ${i.quantity} = ${formatMoney(i.price * i.quantity)}</div>
        <div class="cart-item-controls">
          <button onclick="changeCheckoutQty('${i.product_id}', ${i.quantity - 1})">−</button>
          <span>${i.quantity}</span>
          <button onclick="changeCheckoutQty('${i.product_id}', ${i.quantity + 1})">+</button>
          <span class="cart-remove" onclick="removeCheckoutItem('${i.product_id}')">Remove</span>
        </div>
      </div>
    </div>
  `).join("");

  document.getElementById("checkout-total").textContent = formatMoney(Cart.total());
}

function changeCheckoutQty(productId, qty) {
  Cart.updateQty(productId, qty);
  renderCartItems();
}

function removeCheckoutItem(productId) {
  Cart.remove(productId);
  renderCartItems();
}

async function submitOrder(e) {
  e.preventDefault();

  const name = document.getElementById("c-name").value.trim();
  const phone = document.getElementById("c-phone").value.trim();
  const email = document.getElementById("c-email").value.trim();
  const createAccount = document.getElementById("c-create-account").checked;
  const password = document.getElementById("c-password").value;

  if (!phone) { toast("Phone number is required", true); return; }
  if (createAccount && !password) { toast("Choose a password to create an account", true); return; }

  const items = Cart.get().map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
  if (!items.length) { toast("Your bag is empty", true); return; }

  const btn = document.getElementById("place-order-btn");
  btn.disabled = true;
  btn.textContent = "Placing order…";

  try {
    const data = await apiRequest("/orders", {
      method: "POST",
      body: {
        name, phone, email: email || undefined,
        account_password: createAccount ? password : undefined,
        items,
      },
    });

    CustomerId.set(data.customer.id);
    Cart.clear();

    document.getElementById("checkout-view").style.display = "none";
    document.getElementById("order-success-view").style.display = "block";
    document.getElementById("success-order-ref").textContent = data.order.order_ref;

    // Refresh the chat widget now that we have an identity
    if (window.ChatWidget) {
      ChatWidget.hasIdentity = true;
      ChatWidget.renderPanel();
      ChatWidget.connectSocket();
    }
  } catch (err) {
    toast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Place Order";
  }
}

(async () => {
  await SiteLayout.init("shop");
  renderCartItems();

  document.getElementById("checkout-form").addEventListener("submit", submitOrder);
  document.getElementById("c-create-account").addEventListener("change", (e) => {
    document.getElementById("c-password-field").style.display = e.target.checked ? "block" : "none";
  });
  document.getElementById("open-chat-from-success").addEventListener("click", () => {
    if (window.ChatWidget) ChatWidget.toggle();
  });
})();
