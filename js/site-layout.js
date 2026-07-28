// ============================================================
// Injects nav + footer + WhatsApp float button.
// Each page includes: <div id="nav-root"></div> ... <div id="footer-root"></div>
// and calls SiteLayout.init("shop") with the current page key for nav highlighting.
// ============================================================

const SiteLayout = {
  async init(activeKey) {
    Theme.init();
    this.renderNav(activeKey);
    this.renderFooter();
    this.renderWhatsApp();
    this.renderIntroLoader();
    Cart.updateBadge();

    document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        Theme.toggle();
        this.syncThemeLabels();
      });
    });
    this.syncThemeLabels();

    const searchInputs = document.querySelectorAll(".nav-search input");
    searchInputs.forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && input.value.trim()) {
          window.location.href = `shop.html?search=${encodeURIComponent(input.value.trim())}`;
        }
      });
    });
  },

  syncThemeLabels() {
    document.querySelectorAll(".theme-toggle-label").forEach((el) => {
      el.textContent = Theme.current() === "dark" ? "Dark" : "Light";
    });
  },

  renderIntroLoader() {
    if (sessionStorage.getItem("kp_intro_shown")) return;
    sessionStorage.setItem("kp_intro_shown", "1");
    const loader = document.createElement("div");
    loader.className = "intro-loader";
    loader.innerHTML = `<img src="assets/kp-logo.jpeg" alt="KP Atelier" />`;
    document.body.appendChild(loader);
    setTimeout(() => loader.remove(), 2200);
  },

  renderNav(activeKey) {
    const root = document.getElementById("nav-root");
    if (!root) return;

    const links = [
      { key: "home", href: "index.html", label: "Home" },
      { key: "shop", href: "shop.html", label: "Shop" },
      { key: "track", href: "track.html", label: "Track Order" },
    ];

    root.innerHTML = `
      <header class="nav">
        <div class="nav-inner">
          <a href="index.html" class="nav-brand">
            <img src="assets/kp-logo.jpeg" alt="KP Atelier" />
            <span>KP Atelier</span>
          </a>
          <nav class="nav-links">
            ${links.map((l) => `<a href="${l.href}" class="${l.key === activeKey ? 'active' : ''}">${l.label}</a>`).join("")}
          </nav>
          <div class="nav-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input type="text" placeholder="Search products…" />
          </div>
          <div class="nav-actions">
            <a href="wishlist.html" class="icon-link" title="Wishlist">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 000-7.8z"/></svg>
            </a>
            <button class="icon-link" id="cart-toggle-btn" title="Cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2l1.5 5M6 2H3M6 2l1.5 5m0 0h11.5l1.5-5H7.5zm0 0L9 18h9M9 18a2 2 0 100 4 2 2 0 000-4zM18 18a2 2 0 100 4 2 2 0 000-4z"/></svg>
              <span class="cart-count" style="display:none;">0</span>
            </button>
            <button class="theme-toggle-btn icon-link" title="Toggle theme">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            </button>
          </div>
        </div>
      </header>
    `;

    document.getElementById("cart-toggle-btn").addEventListener("click", () => {
      if (window.CartDrawer) window.CartDrawer.open();
      else window.location.href = "cart.html";
    });
  },

  renderFooter() {
    const root = document.getElementById("footer-root");
    if (!root) return;

    root.innerHTML = `
      <footer>
        <div class="container">
          <div class="footer-grid">
            <div>
              <div class="footer-brand">
                <img src="assets/kp-logo.jpeg" alt="KP Atelier" />
                <span>KP Atelier</span>
              </div>
              <p class="text-muted" style="font-size:13px; max-width:280px;">Thoughtfully made clothing, sold directly — every piece confirmed personally before it ships.</p>
            </div>
            <div>
              <h4>Shop</h4>
              <ul>
                <li><a href="shop.html">All Products</a></li>
                <li><a href="shop.html?filter=new">New Arrivals</a></li>
                <li><a href="wishlist.html">Wishlist</a></li>
              </ul>
            </div>
            <div>
              <h4>Support</h4>
              <ul>
                <li><a href="track.html">Track Order</a></li>
                <li><a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank">WhatsApp Us</a></li>
              </ul>
            </div>
            <div>
              <h4>Preferences</h4>
              <button class="theme-toggle-footer theme-toggle-btn">
                <span class="theme-toggle-label">Dark</span> mode
              </button>
            </div>
          </div>
          <div class="footer-bottom">
            <span>&copy; ${new Date().getFullYear()} KP Atelier. All rights reserved.</span>
            <span>Payments confirmed manually by our team — no card details ever stored.</span>
          </div>
        </div>
      </footer>
    `;
  },

  renderWhatsApp() {
    if (document.querySelector(".whatsapp-float")) return;
    const btn = document.createElement("a");
    btn.className = "whatsapp-float";
    btn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi KP Atelier, I'd like to ask about ")}`;
    btn.target = "_blank";
    btn.title = "Chat on WhatsApp";
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M17.6 6.3A8 8 0 003.9 16.1L3 21l5.1-.9a8 8 0 0011.6-7 8 8 0 00-2.1-6.8zm-5.6 12.2a6.5 6.5 0 01-3.3-.9l-.2-.1-2.5.4.5-2.4-.1-.2a6.6 6.6 0 1112 3.2 6.5 6.5 0 01-6.4 0zm3.6-4.9c-.2-.1-1.2-.6-1.4-.6s-.3-.1-.5.1-.6.6-.7.8-.3.2-.5.1a5.4 5.4 0 01-1.6-1 6 6 0 01-1.1-1.4c-.1-.2 0-.3.1-.4l.3-.4.2-.3v-.3c0-.1-.5-1.3-.7-1.7s-.4-.4-.5-.4h-.5a.9.9 0 00-.6.3 2.8 2.8 0 00-.9 2.1 4.9 4.9 0 001 2.6 11.2 11.2 0 004.3 3.8c.6.3 1.1.4 1.4.5a3.4 3.4 0 001.6.1 2.7 2.7 0 001.7-1.2 2.2 2.2 0 00.2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>`;
    document.body.appendChild(btn);
  },
};
