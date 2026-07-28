// ============================================================
// KP ATELIER — Shop page
// ============================================================

async function loadCategoryOptions() {
  const sel = document.getElementById("filter-category");
  try {
    const data = await apiRequest("/products/categories");
    data.categories.forEach((c) => {
      sel.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
    });
  } catch (e) { /* non-critical */ }
}

function currentParams() {
  const url = new URL(window.location.href);
  return {
    category: url.searchParams.get("category") || "",
    search: url.searchParams.get("search") || "",
    filter: url.searchParams.get("filter") || "",
    minPrice: url.searchParams.get("minPrice") || "",
    maxPrice: url.searchParams.get("maxPrice") || "",
  };
}

async function loadProducts() {
  const grid = document.getElementById("shop-grid");
  grid.innerHTML = `<div class="spinner"></div>`;

  const params = currentParams();
  document.getElementById("filter-category").value = params.category;
  document.getElementById("filter-min-price").value = params.minPrice;
  document.getElementById("filter-max-price").value = params.maxPrice;

  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.minPrice) query.set("minPrice", params.minPrice);
  if (params.maxPrice) query.set("maxPrice", params.maxPrice);

  const titleEl = document.getElementById("shop-title");
  if (params.search) titleEl.textContent = `Results for "${params.search}"`;
  else if (params.filter === "new") titleEl.textContent = "New Arrivals";
  else titleEl.textContent = "Shop All";

  try {
    const data = await apiRequest(`/products?${query.toString()}`);
    let products = data.products;
    if (params.filter === "new") products = products.filter((p) => p.is_new_arrival);

    if (!products.length) {
      grid.innerHTML = `<div class="empty-state">No products match your filters. Try adjusting or clearing them.</div>`;
      return;
    }
    grid.innerHTML = products.map(renderProductCard).join("");
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">Could not load products: ${escapeHtml(err.message)}</div>`;
  }
}

function applyFilters() {
  const category = document.getElementById("filter-category").value;
  const minPrice = document.getElementById("filter-min-price").value;
  const maxPrice = document.getElementById("filter-max-price").value;

  const url = new URL(window.location.href);
  category ? url.searchParams.set("category", category) : url.searchParams.delete("category");
  minPrice ? url.searchParams.set("minPrice", minPrice) : url.searchParams.delete("minPrice");
  maxPrice ? url.searchParams.set("maxPrice", maxPrice) : url.searchParams.delete("maxPrice");
  url.searchParams.delete("filter");
  window.history.pushState({}, "", url);
  loadProducts();
}

function clearFilters() {
  window.history.pushState({}, "", "shop.html");
  document.getElementById("filter-category").value = "";
  document.getElementById("filter-min-price").value = "";
  document.getElementById("filter-max-price").value = "";
  loadProducts();
}

(async () => {
  await SiteLayout.init("shop");
  await loadCategoryOptions();
  loadProducts();

  document.getElementById("apply-filters-btn").addEventListener("click", applyFilters);
  document.getElementById("clear-filters-btn").addEventListener("click", clearFilters);
})();
