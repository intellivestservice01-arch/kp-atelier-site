// ============================================================
// KP ATELIER — Product detail page
// ============================================================

let currentProduct = null;
let currentQty = 1;

function getProductIdFromUrl() {
  return new URL(window.location.href).searchParams.get("id");
}

async function loadProduct() {
  const id = getProductIdFromUrl();
  const content = document.getElementById("product-content");

  if (!id) {
    content.innerHTML = `<div class="empty-state">No product specified.</div>`;
    return;
  }

  try {
    const data = await apiRequest(`/products/${id}`);
    currentProduct = data.product;
    document.title = `${currentProduct.name} — KP Atelier`;
    renderProduct(currentProduct);
    renderRelated(data.related);
    Reviews.initSection({ gridId: "reviews-grid", summaryId: "reviews-summary", productId: currentProduct.id });
    Reviews.initModal(currentProduct.id);
  } catch (err) {
    content.innerHTML = `<div class="empty-state">Product not found.</div>`;
  }
}

function renderProduct(p) {
  const content = document.getElementById("product-content");
  const images = p.images && p.images.length ? p.images : [{ url: "" }];
  const isWishlisted = Wishlist.has(p.id);
  const isSoldOut = p.status === "sold_out";
  const isReserved = p.status === "reserved";

  content.innerHTML = `
    <div class="pd-layout">
      <div>
        <div class="pd-gallery-main">
          ${images[0].url ? `<img id="pd-main-img" src="${fullImageUrl(images[0].url)}" />` : `<div style="width:100%;height:100%;background:var(--surface-2);"></div>`}
        </div>
        ${images.length > 1 ? `
          <div class="pd-thumbs">
            ${images.map((img, i) => `<img src="${fullImageUrl(img.url)}" class="${i === 0 ? 'active' : ''}" onclick="switchImage(this, '${fullImageUrl(img.url)}')" />`).join("")}
          </div>
        ` : ""}
      </div>
      <div class="pd-info">
        <span class="eyebrow">${escapeHtml(p.category_name || "KP Atelier")}</span>
        <h1>${escapeHtml(p.name)}</h1>
        <div class="price">${formatMoney(p.price)}</div>

        ${isSoldOut ? `<div class="tag tag-soldout" style="display:inline-block; margin-bottom:16px;">Sold Out</div>` : ""}
        ${isReserved ? `<div class="tag tag-reserved" style="display:inline-block; margin-bottom:16px;">Currently Reserved</div>` : ""}

        <p class="desc">${escapeHtml(p.description)}</p>

        ${p.size_guide ? `<div class="size-guide"><strong>Size Guide:</strong> ${escapeHtml(p.size_guide)}</div>` : ""}

        <div class="pd-qty">
          <span class="text-muted" style="font-size:13px;">Quantity</span>
          <div class="qty-control">
            <button onclick="changeQty(-1)">−</button>
            <span id="qty-display">1</span>
            <button onclick="changeQty(1)">+</button>
          </div>
        </div>

        <div class="pd-actions">
          <button class="btn btn-gold" id="add-to-cart-btn" ${isSoldOut ? "disabled" : ""}>
            ${isSoldOut ? "Sold Out" : "Add to Bag"}
          </button>
          <button class="btn btn-outline" id="wishlist-toggle-btn">
            ${isWishlisted ? "♥ Saved" : "♡ Save"}
          </button>
        </div>

        <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi, I have a question about: ' + p.name)}" target="_blank" class="btn btn-glass btn-block">
          Ask About This Piece on WhatsApp
        </a>
      </div>
    </div>
  `;

  document.getElementById("add-to-cart-btn").addEventListener("click", () => {
    if (isSoldOut) return;
    Cart.add(p, currentQty);
    toast(`${p.name} added to your bag`);
    if (window.CartDrawer) CartDrawer.open();
  });

  document.getElementById("wishlist-toggle-btn").addEventListener("click", (e) => {
    const active = Wishlist.toggle(p.id);
    e.target.textContent = active ? "♥ Saved" : "♡ Save";
  });
}

function switchImage(thumbEl, url) {
  document.getElementById("pd-main-img").src = url;
  document.querySelectorAll(".pd-thumbs img").forEach((img) => img.classList.remove("active"));
  thumbEl.classList.add("active");
}

function changeQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  document.getElementById("qty-display").textContent = currentQty;
}

function renderRelated(related) {
  if (!related || !related.length) return;
  document.getElementById("related-section").style.display = "block";
  document.getElementById("related-grid").innerHTML = related.map(renderProductCard).join("");
}

(async () => {
  await SiteLayout.init("shop");
  loadProduct();
})();
