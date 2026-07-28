# KP Atelier — Public Site

The customer-facing storefront. Plain HTML, CSS, JavaScript — no build step.
Talks to the same `kp-atelier-backend` API as the admin panel.

## How to run it

**Easiest way — VS Code Live Server extension:**
1. Install "Live Server" (Extensions panel → search "Live Server" by Ritwick Dey)
2. Right-click `index.html` → "Open with Live Server"

**Or from a terminal:**
```bash
cd kp-atelier-site
python -m http.server 8090
```
Then open `http://localhost:8090`.

Make sure `kp-atelier-backend` is running first (`npm run dev`, port 5000).

## Pages

| Page | What it does |
|---|---|
| `index.html` | Homepage — hero, shop-by-category (the "wardrobe" grouping, e.g. all caps together), new arrivals |
| `shop.html` | Full catalog with category, price range, and search filters |
| `product.html` | Product detail — photo gallery, description, size guide, add to bag, wishlist, "Ask on WhatsApp" |
| `cart.html` | Editable bag + checkout form (guest or optional account) |
| `track.html` | Public order tracking by tracking ID, no login |
| `wishlist.html` | Saved items (stored in the browser, no account needed) |

## How ordering actually works here (no online payment)

1. Customer adds items to their bag (stored in their browser) and checks out with just name + phone (email and account creation are optional).
2. That submits one order to the backend — a chat thread is automatically created and linked to it.
3. The floating chat widget (bottom-right, gold) lets the customer talk to admin directly — that's where price gets confirmed and payment details get shared.
4. Once admin confirms in the admin panel, the customer gets a tracking ID they can use on `track.html`.

No card details are ever collected on this site — that's intentional, matching how you wanted payments handled.

## Chat widget details

- First time a visitor opens it, it asks for name + phone to create a lightweight guest identity (stored in their browser via `localStorage`).
- After that, it remembers them across every page and every visit.
- Real-time via Socket.io — admin's replies appear without the customer refreshing.
- If they check out without ever opening the widget, the order itself creates their identity, and the widget picks it up automatically afterward.

## WhatsApp integration

The WhatsApp number is set in `js/api.js`:
```js
const WHATSAPP_NUMBER = "2349010578554";
```
It's used for: the floating WhatsApp button (bottom-left, green, on every page) and the "Ask About This Piece" button on each product page (pre-fills a message with the product name).

## Design notes

- Glassmorphism is used throughout on purpose: the nav bar, cart drawer, chat widget, and the intro logo animation all use frosted-glass panels, per your brief.
- Dark/light mode toggle lives in the footer and remembers the visitor's choice.
- Product cards swap to a second "hover" image on mouseover if you uploaded one as the second photo when adding the product in the admin panel — first photo is main, second is hover, matching what the admin panel README says.
- Internal product IDs are never sent to this site at all — the backend strips them out before the public API responds, so there's nothing to accidentally expose here.

## If something doesn't load

Same as the admin panel: open dev tools (F12) → Console. "Failed to fetch"
almost always means the backend isn't running on port 5000. Check `API_BASE`
at the top of `js/api.js` if you ever move the backend somewhere else.
