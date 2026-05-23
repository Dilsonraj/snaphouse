# Little Knot — Gift Store

A small, handcrafted-feeling e-commerce site built with plain HTML, CSS and JavaScript. Orders are placed through WhatsApp — no payment gateway, no backend.

## Files

- `index.html` — the storefront
- `style.css` — all styling
- `script.js` — cart, search, filters, WhatsApp checkout
- `products.json` — your initial product catalog
- `admin.html` — simple product manager (add / edit / delete / export)

## Setup

1. **Set your WhatsApp number**
   Open `script.js` and replace `YOUR_WHATSAPP_NUMBER` with your number in international format **without `+` or spaces**, e.g. `919876543210`.
   Also replace the same placeholder in `index.html` (3 places: floating button, contact section, footer).

2. **Edit products**
   Open `admin.html` in your browser. Add, edit, delete products. Changes save to your browser's localStorage and the shop reads from there automatically.
   Click **Export JSON** to download an updated `products.json` you can replace in the project.

3. **Run locally**
   Open `index.html` in a browser, or run a tiny server (so `fetch('products.json')` works):
   ```
   python3 -m http.server 8000
   ```
   then visit `http://localhost:8000`.

## Deploy

Drag the folder into **Netlify**, **Vercel**, or push to **GitHub Pages**. No build step needed.

## Notes

- Cart is saved in localStorage (`lk_cart`).
- Products are loaded from localStorage (`lk_products`) if present, otherwise from `products.json`.
- All sample product images are from Unsplash — replace with your own when you go live.
