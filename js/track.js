// ============================================================
// KP ATELIER — Tracking page
// ============================================================

const STATUS_LABELS = { order_placed: "Order Placed", packed: "Packed", in_transit: "In Transit", delivered: "Delivered" };
const STATUS_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>`;

async function trackOrder() {
  const trackingId = document.getElementById("track-input").value.trim();
  const resultEl = document.getElementById("track-result");

  if (!trackingId) { toast("Enter a tracking ID first", true); return; }

  resultEl.innerHTML = `<div class="spinner"></div>`;

  try {
    const data = await apiRequest(`/tracking/${encodeURIComponent(trackingId)}`);
    renderResult(data);
  } catch (err) {
    resultEl.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

function renderResult(data) {
  const resultEl = document.getElementById("track-result");

  const itemsList = data.items.map((i) => `${escapeHtml(i.name)} × ${i.quantity}`).join(", ");

  resultEl.innerHTML = `
    <div class="glass mt-40" style="border-radius:14px; padding:26px; max-width:520px; margin:0 auto 40px;">
      <div class="text-muted" style="font-size:12px; margin-bottom:4px;">ORDER ${escapeHtml(data.order_ref)}</div>
      <div style="font-weight:600; margin-bottom:14px;">${itemsList}</div>
      ${data.delivery_estimate ? `<div class="text-muted" style="font-size:13px;">Estimated delivery: <strong style="color:var(--text);">${escapeHtml(data.delivery_estimate)}</strong></div>` : ""}
    </div>

    <div class="timeline">
      ${data.timeline.map((step) => `
        <div class="timeline-step ${step.reached ? 'reached' : ''}">
          <div class="timeline-dot">${STATUS_ICON}</div>
          <div>
            <div class="timeline-label">${STATUS_LABELS[step.status] || step.status}</div>
            ${step.event ? `<div class="text-muted" style="font-size:12px;">${step.event.location ? escapeHtml(step.event.location) + ' — ' : ''}${formatDate(step.event.created_at)}</div>` : ""}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

(async () => {
  await SiteLayout.init("track");
  document.getElementById("track-btn").addEventListener("click", trackOrder);
  document.getElementById("track-input").addEventListener("keydown", (e) => { if (e.key === "Enter") trackOrder(); });

  const urlId = new URL(window.location.href).searchParams.get("id");
  if (urlId) {
    document.getElementById("track-input").value = urlId;
    trackOrder();
  }
})();
