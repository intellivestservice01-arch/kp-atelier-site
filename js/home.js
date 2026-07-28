// ============================================================
// KP ATELIER — Homepage
// ============================================================

const CATEGORY_ICONS = {
  caps: "🧢", shirts: "👕", jackets: "🧥", "trousers-cargos": "👖",
  "team-jerseys": "🎽", accessories: "👜", polos: "🎽", tracksuits: "🧥",
};

async function loadCategories() {
  const grid = document.getElementById("category-grid");
  try {
    const data = await apiRequest("/products/categories");
    if (!data.categories.length) {
      grid.innerHTML = `<div class="text-muted">Categories will appear here once added.</div>`;
      return;
    }
    grid.innerHTML = data.categories.map((c) => `
      <a href="shop.html?category=${c.id}" class="category-card">
        <span class="cap-icon">${CATEGORY_ICONS[c.slug] || "✦"}</span>
        <div class="overlay"><span>${escapeHtml(c.name)}</span></div>
      </a>
    `).join("");
  } catch (err) {
    grid.innerHTML = `<div class="text-muted">Could not load categories.</div>`;
  }
}

async function loadNewArrivals() {
  const grid = document.getElementById("new-arrivals-grid");
  try {
    const data = await apiRequest("/products?status=available");
    const newItems = data.products.filter((p) => p.is_new_arrival).slice(0, 8);
    const toShow = newItems.length ? newItems : data.products.slice(0, 8);

    if (!toShow.length) {
      grid.innerHTML = `<div class="empty-state">No products yet — check back soon.</div>`;
      return;
    }
    grid.innerHTML = toShow.map(renderProductCard).join("");
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">Could not load products.</div>`;
  }
}

(async () => {
  await SiteLayout.init("home");
  loadCategories();
  loadNewArrivals();
})();
