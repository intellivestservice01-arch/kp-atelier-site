// ============================================================
// KP ATELIER SITE — Reviews module
// Reusable on the homepage (general reviews) and product pages (product-specific).
// ============================================================

const Reviews = {
  _productId: null, // set when the modal is opened scoped to a specific product

  stars(n) {
    const full = Math.round(n);
    return "★".repeat(full) + "☆".repeat(5 - full);
  },

  cardHtml(r) {
    return `
      <div class="review-card glass">
        <div class="review-stars">${this.stars(r.rating)}</div>
        <p class="review-body">${escapeHtml(r.body)}</p>
        <div class="review-author">— ${escapeHtml(r.customer_name)}</div>
      </div>
    `;
  },

  // Loads and renders reviews into a grid, optionally scoped to a product.
  async initSection({ gridId, summaryId, productId = null }) {
    const grid = document.getElementById(gridId);
    const summaryEl = summaryId ? document.getElementById(summaryId) : null;
    if (!grid) return;

    try {
      const query = productId ? `?product_id=${productId}` : "";
      const data = await apiRequest(`/reviews${query}`);

      if (summaryEl) {
        if (data.total_count > 0) {
          summaryEl.innerHTML = `
            <div class="reviews-summary">
              <span class="reviews-summary-stars">${this.stars(data.average_rating)}</span>
              <span class="reviews-summary-text">${data.average_rating.toFixed(1)} out of 5 &middot; ${data.total_count} review${data.total_count === 1 ? "" : "s"}</span>
            </div>
          `;
        } else {
          summaryEl.innerHTML = "";
        }
      }

      if (!data.reviews.length) {
        grid.innerHTML = `<div class="empty-state">No reviews yet — be the first to share your experience.</div>`;
        return;
      }

      grid.innerHTML = data.reviews.map((r) => this.cardHtml(r)).join("");
    } catch (err) {
      grid.innerHTML = `<div class="empty-state">Could not load reviews right now.</div>`;
    }
  },

  // Wires up the submission modal. Pass a productId to scope reviews submitted
  // from this page to that product (e.g. from product.html); omit for general
  // site reviews (homepage).
  initModal(productId = null) {
    this._productId = productId;

    const modal = document.getElementById("review-modal");
    const openBtn = document.getElementById("open-review-modal-btn");
    const closeBtn = document.getElementById("close-review-modal");
    const form = document.getElementById("review-form");
    const starInput = document.getElementById("star-input");
    const ratingField = document.getElementById("review-rating");

    if (!modal || !form) return;

    const openModal = () => modal.classList.remove("hidden");
    const closeModal = () => { modal.classList.add("hidden"); form.reset(); setStars(5); };

    if (openBtn) openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    function setStars(value) {
      ratingField.value = value;
      starInput.querySelectorAll("span").forEach((s) => {
        s.classList.toggle("active", Number(s.dataset.value) <= value);
      });
    }
    setStars(5);

    starInput.querySelectorAll("span").forEach((s) => {
      s.addEventListener("click", () => setStars(Number(s.dataset.value)));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("submit-review-btn");
      btn.disabled = true;
      btn.textContent = "Submitting…";

      try {
        await apiRequest("/reviews", {
          method: "POST",
          body: {
            customer_name: document.getElementById("review-name").value.trim(),
            rating: Number(ratingField.value),
            body: document.getElementById("review-body").value.trim(),
            product_id: this._productId,
          },
        });
        toast("Thanks! Your review will appear once it's approved.");
        closeModal();
      } catch (err) {
        toast(err.message, true);
      } finally {
        btn.disabled = false;
        btn.textContent = "Submit Review";
      }
    });
  },
};
