// ============================================================
// KP ATELIER — Chat widget (glass), available on every page.
// First visit: asks for name + phone to create a lightweight guest identity.
// After that, the widget remembers them (localStorage) and chats persist
// across page loads and, once they place an order, connect to that order too.
// ============================================================

const ChatWidget = {
  socket: null,
  isOpen: false,
  hasIdentity: false,

  init() {
    if (document.getElementById("chat-widget-root")) return;

    const wrap = document.createElement("div");
    wrap.id = "chat-widget-root";
    wrap.innerHTML = `
      <button class="chat-widget-btn" id="chat-widget-toggle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
        <span class="chat-widget-badge" id="chat-widget-badge" style="display:none;">1</span>
      </button>
      <div class="chat-widget-panel glass" id="chat-widget-panel"></div>
    `;
    document.body.appendChild(wrap);

    document.getElementById("chat-widget-toggle").addEventListener("click", () => this.toggle());

    this.hasIdentity = !!CustomerId.get();
    this.renderPanel();

    if (this.hasIdentity) this.connectSocket();
  },

  toggle() {
    this.isOpen = !this.isOpen;
    document.getElementById("chat-widget-panel").classList.toggle("open", this.isOpen);
    if (this.isOpen && this.hasIdentity) this.loadMessages();
  },

  renderPanel() {
    const panel = document.getElementById("chat-widget-panel");
    if (!this.hasIdentity) {
      panel.innerHTML = `
        <div class="chat-widget-header">
          <div><div class="title">Chat with KP Atelier</div><div class="sub">We usually reply quickly</div></div>
          <button class="chat-widget-close" onclick="ChatWidget.toggle()">&times;</button>
        </div>
        <div class="chat-prompt">
          <p class="text-muted mb-24" style="font-size:12.5px;">Tell us how to reach you, and let's chat.</p>
          <div class="field"><input type="text" id="chat-prompt-name" placeholder="Your name" /></div>
          <div class="field"><input type="tel" id="chat-prompt-phone" placeholder="Phone number" /></div>
          <button class="btn btn-gold btn-block" id="chat-prompt-start">Start Chat</button>
        </div>
      `;
      document.getElementById("chat-prompt-start").addEventListener("click", () => this.startIdentity());
    } else {
      panel.innerHTML = `
        <div class="chat-widget-header">
          <div><div class="title">KP Atelier</div><div class="sub">Ask about sizing, price, delivery…</div></div>
          <button class="chat-widget-close" onclick="ChatWidget.toggle()">&times;</button>
        </div>
        <div class="chat-widget-messages" id="chat-widget-messages"><div class="spinner"></div></div>
        <div class="chat-widget-composer">
          <button class="chat-widget-icon-btn" id="chat-attach-btn" title="Send a photo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </button>
          <input type="file" id="chat-widget-image-input" accept="image/*" style="display:none;" />
          <input type="text" id="chat-widget-text" placeholder="Type a message…" />
          <button class="chat-widget-icon-btn chat-widget-send" id="chat-widget-send-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      `;
      document.getElementById("chat-attach-btn").addEventListener("click", () => document.getElementById("chat-widget-image-input").click());
      document.getElementById("chat-widget-image-input").addEventListener("change", (e) => this.sendMessage(null, e.target.files[0]));
      document.getElementById("chat-widget-send-btn").addEventListener("click", () => this.sendMessage());
      document.getElementById("chat-widget-text").addEventListener("keydown", (e) => { if (e.key === "Enter") this.sendMessage(); });
    }
  },

  async startIdentity() {
    const name = document.getElementById("chat-prompt-name").value.trim();
    const phone = document.getElementById("chat-prompt-phone").value.trim();
    if (!phone) { toast("Please enter your phone number", true); return; }

    try {
      const data = await apiRequest("/customers/guest", { method: "POST", body: { name, phone } });
      CustomerId.set(data.customer.id);
      this.hasIdentity = true;
      this.renderPanel();
      this.loadMessages();
      this.connectSocket();
    } catch (err) {
      toast(err.message, true);
    }
  },

  connectSocket() {
    if (this.socket) return;
    this.socket = io("https://kp-atelier-backend.onrender.com");
    this.socket.on("connect", () => {
      // join once we know which chat thread we have (after first message load)
    });
  },

  async loadMessages() {
    const customerId = CustomerId.get();
    if (!customerId) return;
    try {
      const data = await apiRequest(`/chat/customer/${customerId}`);
      this.renderMessages(data.messages);
      if (this.socket) this.socket.emit("join_chat", data.chat.id);
      if (!this.socket._boundNewMessage) {
        this.socket.on("new_message", (msg) => {
          if (msg.sender_type === "admin") this.appendMessage(msg);
        });
        this.socket._boundNewMessage = true;
      }
    } catch (err) {
      const container = document.getElementById("chat-widget-messages");
      if (container) container.innerHTML = `<div class="empty-state" style="padding:20px;">Could not load chat.</div>`;
    }
  },

  renderMessages(messages) {
    const container = document.getElementById("chat-widget-messages");
    if (!container) return;
    if (!messages.length) {
      container.innerHTML = `<div class="empty-state" style="padding:20px; font-size:12.5px;">Say hello — we're here to help with sizing, pricing, or anything else.</div>`;
      return;
    }
    container.innerHTML = messages.map(this.messageHtml).join("");
    container.scrollTop = container.scrollHeight;
  },

  messageHtml(m) {
    const mine = m.sender_type === "customer";
    return `
      <div class="chat-widget-msg ${mine ? 'mine' : 'theirs'}">
        ${m.body ? escapeHtml(m.body) : ""}
        ${m.image_url ? `<img src="${fullImageUrl(m.image_url)}" />` : ""}
      </div>
    `;
  },

  appendMessage(m) {
    const container = document.getElementById("chat-widget-messages");
    if (!container) return;
    container.insertAdjacentHTML("beforeend", this.messageHtml(m));
    container.scrollTop = container.scrollHeight;
    if (!this.isOpen) {
      const badge = document.getElementById("chat-widget-badge");
      badge.style.display = "flex";
    }
  },

  async sendMessage(textOverride, file) {
    const customerId = CustomerId.get();
    if (!customerId) return;

    const input = document.getElementById("chat-widget-text");
    const body = textOverride !== undefined && textOverride !== null ? textOverride : input.value.trim();

    if (!body && !file) return;

    const formData = new FormData();
    if (body) formData.append("body", body);
    if (file) formData.append("image", file);

    try {
      await apiRequest(`/chat/customer/${customerId}/message`, { method: "POST", body: formData, isForm: true });
      if (input) input.value = "";
      this.loadMessages();
    } catch (err) {
      toast(err.message, true);
    }
  },
};

document.addEventListener("DOMContentLoaded", () => ChatWidget.init());
