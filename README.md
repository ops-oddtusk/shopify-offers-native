# Shopify Offers & Bundles Manager — Native Edition

A fully Shopify-native app for managing discounts, BOGO deals, bundles, popups, gamification, and more. **No external hosting required** — everything runs inside Shopify's infrastructure.

---

## What's Included

### 12 Offer Types
- BOGO (Buy One Get One)
- Buy X Get Y (1+1, 2+1, etc.)
- Percentage Off
- Fixed Amount Off
- Product Bundles
- Collection Bundles
- Volume / Tiered Discounts
- Free Gift with Purchase
- Spend X Save Y
- Mix & Match Bundles
- Quantity Breaks
- Minimum Quantity Discount

### 4 Pricing Display Modes
- Discount on selling price
- Auto-set compare-at price
- Calculate from compare-at price
- Manual price override

### 18 Storefront Display Blocks
- Entry Popup, Exit-Intent Popup, Cart Upsell Popup
- Floating Announcement Bar, Slide-In Drawer, Countdown Modal
- Bundle Card, Product Offer Banner, Offer Badge
- Volume Discount Table, Savings Calculator
- Cart Progress Bar, Stock Countdown
- Recent Purchase Notifications (Social Proof)
- Spin the Wheel, Scratch Card (Gamification)
- Build Your Own Bundle (Interactive)
- Offer Landing Page

### Checkout & Post-Purchase
- Checkout Banner (confirms discount applied)
- Post-Purchase Upsell (thank-you page one-click offer)

### Shopify Functions (Discount Logic)
- Product Discount Function (percentage, fixed, volume, quantity breaks, BOGO, bundles)
- Order Discount Function (Spend X Save Y)
- Cart Transform Function (merges bundle items)

---

## Installation Guide (Step by Step)

### Prerequisites
- A Shopify store (any plan)
- Shopify CLI installed on your computer (`npm install -g @shopify/cli`)
- Node.js 18+ installed

### Step 1: Create the App in Shopify Partner Dashboard

1. Go to https://partners.shopify.com and log in (create free account if needed)
2. Click **Apps** → **Create app** → **Create app manually**
3. Give it a name: "Offers & Bundles Manager"
4. Copy the **Client ID** — you'll need it in Step 2

### Step 2: Configure the App

1. Open the file `shopify.app.toml`
2. Replace `YOUR_CLIENT_ID_HERE` with your actual Client ID
3. Save the file

### Step 3: Set Up Metaobjects (Your "Database")

This creates the offer data structure inside your Shopify store:

1. In Shopify Admin, go to **Settings** → **Apps and sales channels** → **Develop apps**
2. Create a new app and give it **Admin API access** with these scopes:
   - `write_metaobjects`, `read_metaobjects`
   - `write_products`, `read_products`
   - `write_discounts`, `read_discounts`
3. Install the app and copy the **Admin API access token**
4. Run the setup script:

```bash
SHOPIFY_STORE=your-store.myshopify.com SHOPIFY_TOKEN=shpat_xxxxx node scripts/setup-metaobjects.js
```

This creates the "Offer" metaobject type and seeds 6 starter templates.

### Step 4: Deploy Extensions

```bash
cd shopify-offers-native
shopify app deploy
```

This pushes all the Shopify Functions and theme extensions to your store.

### Step 5: Add Blocks to Your Theme

1. Go to **Shopify Admin** → **Online Store** → **Themes** → **Customize**
2. In the theme editor, click **Add block** or **Add section**
3. Under "Apps" you'll see all the offer blocks:
   - Entry Popup, Exit-Intent Popup, Floating Bar, etc.
4. Add the blocks you want and configure them by selecting an offer from the dropdown
5. Save your theme

### Step 6: Create Your First Offer

1. Go to **Shopify Admin** → **Content** → **Metaobjects** → **Offer**
2. Click **Add entry**
3. Fill in:
   - **Title**: e.g., "Summer BOGO Sale"
   - **Offer Type**: Choose from dropdown (BOGO, PERCENTAGE_OFF, etc.)
   - **Status**: Set to ACTIVE when ready
   - **Pricing Display Mode**: Choose how prices show
   - **Target Products**: Select products this offer applies to
   - **Popup Style**: Choose how to display it (ENTRY, EXIT_INTENT, etc.)
   - **Popup Image**: Upload your custom image
   - **Badge Text**: e.g., "BOGO!", "Save 20%"
   - **Start/End Date**: Schedule the offer
4. Save — it's now live on your store!

---

## Daily Usage

### Creating offers:
Shopify Admin → Content → Metaobjects → Offer → Add entry

### Managing offers:
Change status to PAUSED to temporarily disable, EXPIRED to end permanently

### Changing storefront display:
Shopify Admin → Online Store → Themes → Customize → Edit block settings

### Using templates:
Check the "Offer Template" metaobjects for pre-built configurations.
Copy the settings from a template into a new offer.

---

## Volume Tiers Format

For Volume/Tiered discounts, enter JSON in the "Volume Tiers" field:

```json
[
  { "min_qty": 3, "discount": 10 },
  { "min_qty": 5, "discount": 20 },
  { "min_qty": 10, "discount": 30 }
]
```

## Quantity Breaks Format

```json
[
  { "min_qty": 1, "price_each": 30 },
  { "min_qty": 3, "price_each": 25 },
  { "min_qty": 5, "price_each": 20 }
]
```

## Gamification Prizes Format

For Spin Wheel / Scratch Card:

```json
[
  { "label": "10% Off", "code": "SPIN10", "probability": 40, "color": "#059669" },
  { "label": "15% Off", "code": "SPIN15", "probability": 25, "color": "#2563eb" },
  { "label": "Free Shipping", "code": "FREESHIP", "probability": 20, "color": "#f59e0b" },
  { "label": "Try Again", "code": "", "probability": 15, "color": "#6b7280" }
]
```

---

## File Structure

```
shopify-offers-native/
├── shopify.app.toml              # App configuration
├── package.json
├── scripts/
│   └── setup-metaobjects.js      # One-time setup script
├── metaobject-definitions/
│   └── offer.json                 # Offer schema reference
└── extensions/
    ├── product-discount/          # Shopify Function: product-level discounts
    ├── order-discount/            # Shopify Function: order-level discounts
    ├── cart-transform/            # Shopify Function: bundle cart merging
    ├── offer-display/             # Theme extension: all 18 storefront blocks
    │   ├── blocks/                # Liquid block files
    │   └── assets/                # Shared JS engine + CSS
    ├── checkout-banner/           # Checkout UI extension
    └── post-purchase-upsell/      # Thank-you page upsell
```

---

## Costs

- **Hosting**: $0 (everything runs on Shopify)
- **Shopify Partner account**: Free
- **Ongoing maintenance**: None required

---

## Troubleshooting

**Metaobjects not showing in theme editor?**
Make sure the metaobject access is set to "PUBLIC_READ" for storefront. Re-run the setup script.

**Discount not applying at checkout?**
Check that the Shopify Function is connected to a discount in Admin → Discounts.

**Popup not appearing?**
Check the offer's status is ACTIVE, show_on_storefront is true, and the popup_style matches the block type you added.
