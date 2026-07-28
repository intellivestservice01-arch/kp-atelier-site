// ============================================================
// Shared product card markup + wiring (hover-swap image, wishlist heart,
// click-through to detail page). Used on index/shop/wishlist/product pages.
// ============================================================

function renderProductCard(p) {
  const primary = (p.images || []).find((i) => i.type === "primary") || (p.images || [])[0];
  const hover = (p.images || []).find((i) => i.type === "hover");
  const isWishlisted = Wishlist.has(p.id);

  const tags = [];
  if (p.is_new_arrival) tags.push(`<span class="tag tag-new">New</span>`);
  if (p.status === "sold_out") tags.push(`<span class="tag tag-soldout">Sold Out</span>`);
  if (p.status === "reserved") tags.push(`<span class="tag tag-reserved">Reserved</span>`);

  return `
    <div class="product-card" data-product-id="${p.id}" onclick="window.location.href='product.html?id=${p.id}'">
      <div class="product-image-wrap">
        <div class="product-tags">${tags.join("")}</div>
        <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlistBtn(this, '${p.id}')">
          <svg viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 000-7.8z"/></svg>
        </button>
        ${primary ? `<img src="${fullImageUrl(primary.url)}" alt="${escapeHtml(p.name)}" />` : `<div style="width:100%;height:100%;background:var(--surface-2);"></div>`}
        ${hover ? `<img class="img-hover" src="${fullImageUrl(hover.url)}" alt="" />` : ""}
      </div>
      <div class="p-cat">${escapeHtml(p.category_name || "")}</div>
      <div class="p-name">${escapeHtml(p.name)}</div>
      <div class="p-price">${formatMoney(p.price)}</div>
    </div>
  `;
}

function toggleWishlistBtn(btn, productId) {
  const active = Wishlist.toggle(productId);
  btn.classList.toggle("active", active);
  btn.querySelector("svg").setAttribute("fill", active ? "currentColor" : "none");
  toast(active ? "Added to wishlist" : "Removed from wishlist");
}
