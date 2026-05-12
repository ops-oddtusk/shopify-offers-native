# Shopify Offers & Bundles Manager — Complete Setup Guide

## What This App Does

This app gives your Shopify store a full promotions engine: 12 types of discounts and bundles, 19 storefront display blocks (popups, gamification, social proof, banners), checkout confirmations, and post-purchase upsells. Everything runs inside Shopify — no external hosting, no monthly fees, no servers to maintain.

The app uses three Shopify-native systems working together. Metaobjects store your offer configurations (think of them as a built-in database). Shopify Functions handle the actual discount math at checkout. Theme App Extensions render the popups, banners, countdown timers, and interactive elements on your storefront.

---

## Prerequisites

Before you begin, make sure you have:

1. A Shopify store on any paid plan
2. Node.js version 18 or higher installed on your computer (download from https://nodejs.org)
3. Shopify CLI installed globally: run `npm install -g @shopify/cli` in your terminal
4. A free Shopify Partner account at https://partners.shopify.com (needed to register the app)

---

## Step 1: Register the App in Shopify Partners

Go to https://partners.shopify.com and log in. Click **Apps** in the sidebar, then **Create app**, then **Create app manually**. Name it "Offers & Bundles Manager" (or whatever you prefer). Once created, copy the **Client ID** from the app overview page — you'll need it in the next step.

---

## Step 2: Configure the Project

Open the file `shopify.app.toml` in the project root. Find the line that says `client_id = "YOUR_CLIENT_ID_HERE"` and replace `YOUR_CLIENT_ID_HERE` with the Client ID you copied. Save the file.

---

## Step 3: Create the Metaobject Schema (Your Offer Database)

This step creates the data structure that stores all your offers inside Shopify. You need a Shopify Admin API access token with the right permissions.

In your Shopify Admin, go to **Settings → Apps and sales channels → Develop apps**. Click **Create an app**, name it something like "Setup Helper", and under **Configuration**, enable these Admin API scopes: `write_metaobjects`, `read_metaobjects`, `write_products`, `read_products`, `write_discounts`, `read_discounts`. Click **Install app** and copy the **Admin API access token** (starts with `shpat_`). You only see this once, so save it somewhere.

Now run the setup script from your terminal:

```bash
cd shopify-offers-native
SHOPIFY_STORE=your-store.myshopify.com SHOPIFY_TOKEN=shpat_xxxxx node scripts/setup-metaobjects.js
```

Replace `your-store.myshopify.com` with your actual store URL and `shpat_xxxxx` with your token.

This script does two things: it creates the "Offer" metaobject type with all 38 configuration fields, and it seeds 6 starter templates (Black Friday BOGO, Diwali Bundle, Clearance Volume Discount, Welcome First Order, Free Gift Over $100, Mix & Match Pick 3) so you can see how offers are structured.

---

## Step 4: Deploy the Extensions

From the project directory, run:

```bash
shopify app deploy
```

This pushes all the extensions to your Shopify store: three Shopify Functions (product discount, order discount, cart transform), the theme extension with all 19 display blocks, the checkout banner, and the post-purchase upsell.

---

## Step 5: Connect the Discount Functions

After deploying, you need to create discount entries that use your Shopify Functions.

Go to **Shopify Admin → Discounts → Create discount**. Under "App discount", you'll see your functions listed. Create three discounts:

**Product Discount:** Select the "Product Discount" function. This handles percentage off, fixed amount, BOGO, Buy X Get Y, volume tiers, quantity breaks, bundles, free gifts, and minimum quantity discounts. Name it something like "Offers Engine — Products". Set it to "Automatic" so it applies without a code.

**Order Discount:** Select the "Order Discount" function. This handles Spend X Save Y offers. Name it "Offers Engine — Orders" and set it to automatic.

**Cart Transform:** This one activates automatically after deploy — it merges bundle items into a single line in the cart. No manual step needed.

---

## Step 6: Add Display Blocks to Your Theme

Go to **Shopify Admin → Online Store → Themes → Customize**. In the theme editor, you'll see an "Add block" or "Add section" button. Look under the "Apps" section — all 19 display blocks will appear there.

Here's what each block does and where to place it:

**Popup Blocks** (add to any page — they target the body):

- **Entry Popup** — Shows when a customer lands on your site. Configurable delay (default 2 seconds). Auto-generates subtitle from the offer type ("Buy One Get One Free!", "Get 20% Off!", etc.).
- **Exit-Intent Popup** — Triggers when the customer moves their mouse toward the browser's close/back button (or switches tabs on mobile). Great for last-chance offers.
- **Cart Upsell Popup** — Appears after a customer adds something to their cart. Shows gift products or complementary items.
- **Countdown Modal** — A prominent popup with a large countdown timer. Best for flash sales.
- **Spin the Wheel** — Gamification popup where customers spin for discount codes. Weighted probabilities ensure you control how often each prize is won.
- **Scratch Card** — Customers scratch a surface to reveal their discount. Touch-enabled for mobile.

**Banner & Bar Blocks** (add to specific pages or globally):

- **Floating Announcement Bar** — Sticky bar at top or bottom of the page with countdown timer and CTA button.
- **Product Offer Banner** — Shows on product pages with the offer details and countdown.
- **Offer Badge** — Small overlay badge on product cards (for collection pages and search results).
- **Slide-In Drawer** — Side panel that slides in with offer details.

**Product & Bundle Blocks** (add to product or collection pages):

- **Bundle Card** — Displays a product bundle with individual items, prices, and total savings.
- **Build Your Own Bundle** — Interactive block where customers pick products to build their own bundle.
- **Frequently Bought Together** — Recommended products grid (pair with related products).
- **Volume Discount Table** — Shows tiered pricing ("Buy 3 get 10% off, Buy 5 get 20% off").
- **Savings Calculator** — Visual breakdown showing original price, discount, and final price.

**Urgency & Social Proof Blocks:**

- **Stock Countdown** — Shows remaining inventory with a pulsing urgency indicator.
- **Cart Progress Bar** — "Spend $X more to get free shipping!" — updates in real time as items are added.
- **Recent Purchase Notifications** — Toast notifications showing recent purchases from other customers.

**Page Block:**

- **Offer Landing Page** — A full-page grid of all your active offers. Add it as a dedicated section on a page.

**Checkout & Post-Purchase** (these go in checkout settings, not the theme editor):

- **Checkout Banner** — Confirms the discount was applied during checkout. Shows total savings.
- **Post-Purchase Upsell** — One-click upsell on the thank-you page after purchase.

For each block you add, select an offer from the "Select Offer" dropdown. The block pulls all its content from the offer's metaobject data.

---

## Step 7: Create Your First Offer

Go to **Shopify Admin → Content → Metaobjects → Offer → Add entry**. Here's a walkthrough of the key fields:

**Basic Settings:**

- **Title** — The headline shown to customers (e.g., "Summer BOGO Sale").
- **Internal Name** — For your reference only, not shown to customers.
- **Offer Type** — Choose from: BOGO, BUY_X_GET_Y, PERCENTAGE_OFF, FIXED_AMOUNT, PRODUCT_BUNDLE, COLLECTION_BUNDLE, VOLUME_TIERED, FREE_GIFT, SPEND_X_SAVE_Y, MIX_AND_MATCH, QUANTITY_BREAKS, MIN_QUANTITY.
- **Status** — Set to ACTIVE when ready to go live. Use PAUSED to temporarily disable, EXPIRED to permanently end.
- **Show on Storefront** — Toggle this on for the offer to appear in any display blocks.

**Pricing:**

- **Discount Type** — PERCENTAGE or FIXED_AMOUNT.
- **Discount Value** — The number (e.g., 20 for 20% off, or 10 for $10 off).
- **Pricing Display Mode** — Controls how prices show on your store:
  - `discount_on_selling` — Discount calculated from the current selling price
  - `set_compare_at` — Automatically sets the compare-at price to show savings
  - `use_compare_at` — Calculates discount from the existing compare-at price
  - `manual_price` — You set the exact price

**Targeting:**

- **Target Products** — Select which products this offer applies to.
- **Target Collections** — Or target entire collections instead.
- **Customer Target** — ALL (everyone), NEW_ONLY (first-time visitors), or RETURNING_ONLY (repeat visitors).

**Scheduling:**

- **Starts At** — When the offer becomes active (leave blank for immediately).
- **Ends At** — When it expires. Countdown timers use this date.

**Popup Configuration:**

- **Popup Style** — ENTRY, EXIT_INTENT, CART_UPSELL, or NONE.
- **Popup Delay** — Seconds before the popup appears (default 2).
- **Popup Frequency** — How often a visitor sees it: EVERY_VISIT, ONCE_PER_SESSION, ONCE_PER_DAY, ONCE_EVER.
- **Popup Image** — Upload a custom image for the popup.

**Badge & Display:**

- **Badge Text** — Short text for badges and banners (e.g., "BOGO!", "Save 20%").
- **Description** — Longer description shown in banners and landing pages.

**Type-Specific Fields:**

For **BOGO**: No extra fields needed — it automatically gives the second item free.

For **BUY_X_GET_Y**: Set buy_quantity, get_quantity, and get_discount_percent (e.g., buy 2, get 1 at 50% off).

For **VOLUME_TIERED**: Enter JSON in the volume_tiers field:
```json
[
  { "min_qty": 3, "discount": 10 },
  { "min_qty": 5, "discount": 20 },
  { "min_qty": 10, "discount": 30 }
]
```

For **QUANTITY_BREAKS**: Enter JSON in the quantity_breaks field:
```json
[
  { "min_qty": 1, "price_each": 30 },
  { "min_qty": 3, "price_each": 25 },
  { "min_qty": 5, "price_each": 20 }
]
```

For **BUNDLES**: Select bundle products, set bundle_price or bundle_save_percent.

For **FREE_GIFT**: Set spend_threshold and select gift_products.

For **SPEND_X_SAVE_Y**: Set spend_threshold and the discount. For multiple tiers, use the spend_save_tiers JSON field:
```json
[
  { "spend": 50, "save": 10, "type": "fixed_amount" },
  { "spend": 100, "save": 15, "type": "percentage" }
]
```

**Gamification** (for Spin Wheel / Scratch Card):

Set gamification_type to SPIN_WHEEL or SCRATCH_CARD, then enter prizes as JSON in gamification_prizes:
```json
[
  { "label": "10% Off", "code": "SPIN10", "probability": 40, "color": "#059669" },
  { "label": "15% Off", "code": "SPIN15", "probability": 25, "color": "#2563eb" },
  { "label": "Free Shipping", "code": "FREESHIP", "probability": 20, "color": "#f59e0b" },
  { "label": "Try Again", "code": "", "probability": 15, "color": "#6b7280" }
]
```

The probability values are relative weights — they don't need to sum to 100.

---

## Daily Operations

**Creating a new offer:** Shopify Admin → Content → Metaobjects → Offer → Add entry. Fill in the fields, set status to ACTIVE, and it's live.

**Pausing an offer:** Edit the metaobject entry, change status to PAUSED. All storefront blocks will stop showing it.

**Scheduling offers in advance:** Set the starts_at date to a future date and status to ACTIVE. The storefront blocks will only show it once that date arrives.

**Duplicating an offer:** Shopify doesn't have a built-in metaobject duplicate button. Copy the settings from an existing offer (or from one of the 6 starter templates) into a new entry.

**Changing how an offer displays:** Go to Themes → Customize, find the display block, and change its settings (colors, button text, etc.) or swap which offer it references.

**Checking offer templates:** Go to Content → Metaobjects → Offer Template to see the 6 pre-built configurations. Use these as reference when creating new offers.

---

## File Structure Reference

```
shopify-offers-native/
├── shopify.app.toml                   # App configuration (your Client ID goes here)
├── package.json                       # Dependencies
├── scripts/
│   └── setup-metaobjects.js           # One-time setup script
├── metaobject-definitions/
│   └── offer.json                     # Offer schema reference (38 fields)
└── extensions/
    ├── product-discount/              # Shopify Function: product-level discounts
    │   ├── shopify.extension.toml
    │   ├── input-queries/run.graphql
    │   └── src/run.js
    ├── order-discount/                # Shopify Function: order-level discounts
    │   ├── shopify.extension.toml
    │   ├── input-queries/run.graphql
    │   └── src/run.js
    ├── cart-transform/                # Shopify Function: bundle merging
    │   ├── shopify.extension.toml
    │   ├── input-queries/run.graphql
    │   └── src/run.js
    ├── offer-display/                 # Theme extension: all 19 storefront blocks
    │   ├── shopify.extension.toml     # Block registrations
    │   ├── blocks/                    # 19 Liquid template files
    │   │   ├── entry-popup.liquid
    │   │   ├── exit-intent-popup.liquid
    │   │   ├── cart-upsell-popup.liquid
    │   │   ├── floating-bar.liquid
    │   │   ├── countdown-modal.liquid
    │   │   ├── slide-in-drawer.liquid
    │   │   ├── spin-wheel.liquid
    │   │   ├── scratch-card.liquid
    │   │   ├── cart-progress-bar.liquid
    │   │   ├── volume-discount-table.liquid
    │   │   ├── stock-countdown.liquid
    │   │   ├── recent-purchases.liquid
    │   │   ├── bundle-card.liquid
    │   │   ├── build-your-bundle.liquid
    │   │   ├── offer-landing-page.liquid
    │   │   ├── product-offer-banner.liquid
    │   │   ├── offer-badge.liquid
    │   │   ├── savings-calculator.liquid
    │   │   └── frequently-bought-together.liquid
    │   └── assets/
    │       ├── offers-engine.js       # Shared JavaScript (popups, timers, gamification)
    │       └── offers-styles.css      # Shared CSS (responsive, animations)
    ├── checkout-banner/               # Checkout UI Extension
    │   ├── shopify.extension.toml
    │   └── src/CheckoutBanner.jsx
    └── post-purchase-upsell/          # Post-Purchase UI Extension
        ├── shopify.extension.toml
        └── src/ThankYouUpsell.jsx
```

---

## How the Discount Logic Works

When a customer reaches checkout, the Shopify Functions evaluate their cart against your active offers.

The **Product Discount Function** reads each cart line's product metafields to find matching offers. It checks: is the offer active? Does the customer match the target (new/returning)? Is it within the scheduled dates? Then it calculates the discount based on the offer type and pricing display mode. For BOGO, it finds pairs and discounts the cheaper item. For volume tiers, it looks up the quantity and applies the matching tier. For bundles, it checks if all required products are in the cart.

The **Order Discount Function** handles Spend X Save Y. It looks at the cart total and applies the appropriate tier discount.

The **Cart Transform Function** handles bundle presentation. When all products in a bundle are in the cart, it merges them into a single line item showing the bundle name and price.

---

## Storefront Visibility Logic

Every popup and interactive block runs through a three-check visibility system before appearing:

1. **Schedule Check** — Is the current time between starts_at and ends_at? If not, the block is hidden.
2. **Customer Target Check** — Does the visitor match the target audience (ALL, NEW_ONLY, RETURNING_ONLY)? New vs. returning is determined by a cookie set after 5 seconds on their first visit.
3. **Frequency Capping** — Has this visitor already seen this offer within the configured frequency window (ONCE_EVER, ONCE_PER_DAY, ONCE_PER_SESSION, EVERY_VISIT)?

Only if all three checks pass does the block render.

---

## Troubleshooting

**Metaobjects not showing in the theme editor dropdown?** Make sure the metaobject definition has access set to "PUBLIC_READ" for the Storefront API. Re-running the setup script with the same token will update existing definitions.

**Discount not applying at checkout?** Check two things: (1) the offer's status is ACTIVE in the metaobject, and (2) you've created a discount entry in Admin → Discounts that uses the corresponding Shopify Function. The function alone isn't enough — it needs a discount entry to activate it.

**Popup not appearing?** Verify: the offer's status is ACTIVE, show_on_storefront is true, the popup_style matches the block type you added (e.g., "ENTRY" for the Entry Popup block), and the customer_target and scheduling dates allow the current visitor to see it. Check your browser's developer console for any JavaScript errors.

**Countdown timer shows "Offer expired!"?** The ends_at date has passed. Update it to a future date in the metaobject.

**Spin wheel or scratch card only shows once?** By default, gamification blocks use ONCE_EVER frequency. Change the popup_frequency field in the metaobject to ONCE_PER_SESSION or ONCE_PER_DAY if you want repeat plays. Clear your browser cookies to test again.

**Bundle discount not applying?** Make sure all products in the bundle are in the cart. The cart transform function only activates when the complete bundle is present.

**Post-purchase upsell not showing?** The post-purchase upsell extension needs to be enabled in **Settings → Checkout → Post-purchase page**. Also verify the extension is deployed (`shopify app deploy`).

---

## Costs

- Shopify Partner account: Free
- Hosting: $0 (runs entirely on Shopify infrastructure)
- External dependencies: None
- Ongoing maintenance: None required (Shopify handles updates to Functions runtime and theme engine)
