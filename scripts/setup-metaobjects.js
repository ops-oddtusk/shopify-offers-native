#!/usr/bin/env node

/**
 * Setup Script: Creates metaobject definitions in your Shopify store.
 *
 * Usage:
 *   1. Get your store's Admin API access token from:
 *      Shopify Admin → Settings → Apps and sales channels → Develop apps
 *   2. Run: SHOPIFY_STORE=your-store.myshopify.com SHOPIFY_TOKEN=your-token node scripts/setup-metaobjects.js
 *
 * This only needs to be run ONCE during initial setup.
 */

const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_TOKEN;
const API_VERSION = "2024-10";

if (!STORE || !TOKEN) {
  console.error("\n❌ Missing environment variables!");
  console.error("Usage:");
  console.error(
    "  SHOPIFY_STORE=your-store.myshopify.com SHOPIFY_TOKEN=shpat_xxxxx node scripts/setup-metaobjects.js\n"
  );
  process.exit(1);
}

const GRAPHQL_URL = `https://${STORE}/admin/api/${API_VERSION}/graphql.json`;

async function graphql(query, variables = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

// ─── Metaobject Definition ────────────────────────────────────

const CREATE_METAOBJECT_DEFINITION = `
  mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        id
        name
        type
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function createOfferDefinition() {
  console.log("\n🔧 Creating 'Offer' metaobject definition...\n");

  const fieldDefinitions = [
    { name: "Title", key: "title", type: "single_line_text_field",
      validations: [{ name: "min", value: "1" }] },
    { name: "Description", key: "description", type: "multi_line_text_field" },
    { name: "Offer Type", key: "offer_type", type: "single_line_text_field",
      validations: [{ name: "choices", value: JSON.stringify([
        "BOGO", "BUY_X_GET_Y", "PERCENTAGE_OFF", "FIXED_AMOUNT",
        "PRODUCT_BUNDLE", "COLLECTION_BUNDLE", "VOLUME_TIERED",
        "FREE_GIFT", "SPEND_X_SAVE_Y", "MIX_AND_MATCH",
        "QUANTITY_BREAKS", "MIN_QUANTITY"
      ])}]
    },
    { name: "Status", key: "status", type: "single_line_text_field",
      validations: [{ name: "choices", value: JSON.stringify([
        "ACTIVE", "PAUSED", "DRAFT", "SCHEDULED", "EXPIRED"
      ])}]
    },
    { name: "Pricing Display Mode", key: "pricing_display_mode", type: "single_line_text_field",
      validations: [{ name: "choices", value: JSON.stringify([
        "DISCOUNT_ON_PRICE", "AUTO_COMPARE_AT", "CALC_FROM_COMPARE_AT", "MANUAL_OVERRIDE"
      ])}]
    },
    { name: "Discount Value", key: "discount_value", type: "number_decimal" },
    { name: "Discount Type", key: "discount_type", type: "single_line_text_field",
      validations: [{ name: "choices", value: JSON.stringify(["percentage", "fixed_amount", "free"]) }]
    },
    { name: "Buy Quantity", key: "buy_quantity", type: "number_integer" },
    { name: "Get Quantity", key: "get_quantity", type: "number_integer" },
    { name: "Get Discount Percent", key: "get_discount_percent", type: "number_decimal" },
    { name: "Bundle Price", key: "bundle_price", type: "number_decimal" },
    { name: "Bundle Save Percent", key: "bundle_save_percent", type: "number_decimal" },
    { name: "Bundle Save Amount", key: "bundle_save_amount", type: "number_decimal" },
    { name: "Spend Threshold", key: "spend_threshold", type: "number_decimal" },
    { name: "Mix Match Pick Count", key: "mix_match_pick_count", type: "number_integer" },
    { name: "Volume Tiers", key: "volume_tiers", type: "json" },
    { name: "Quantity Break Tiers", key: "quantity_break_tiers", type: "json" },
    { name: "Min Quantity Required", key: "min_quantity", type: "number_integer" },
    { name: "Manual Price Override", key: "manual_price", type: "number_decimal" },
    { name: "Manual Compare At Price", key: "manual_compare_at_price", type: "number_decimal" },
    { name: "Target Products", key: "target_products", type: "list.product_reference" },
    { name: "Target Collections", key: "target_collections", type: "list.collection_reference" },
    { name: "Gift Products", key: "gift_products", type: "list.product_reference" },
    { name: "Popup Style", key: "popup_style", type: "single_line_text_field",
      validations: [{ name: "choices", value: JSON.stringify([
        "NONE", "ENTRY", "EXIT_INTENT", "CART_UPSELL", "FLOATING_BAR",
        "SLIDE_IN", "PRODUCT_BANNER", "COUNTDOWN_MODAL"
      ])}]
    },
    { name: "Popup Image", key: "popup_image", type: "file_reference" },
    { name: "Badge Text", key: "badge_text", type: "single_line_text_field" },
    { name: "Popup Trigger Delay (s)", key: "popup_delay_seconds", type: "number_integer" },
    { name: "Popup Frequency", key: "popup_frequency", type: "single_line_text_field",
      validations: [{ name: "choices", value: JSON.stringify([
        "EVERY_VISIT", "ONCE_PER_SESSION", "ONCE_PER_DAY", "ONCE_EVER"
      ])}]
    },
    { name: "Show On Storefront", key: "show_on_storefront", type: "boolean" },
    { name: "Start Date", key: "starts_at", type: "date_time" },
    { name: "End Date", key: "ends_at", type: "date_time" },
    { name: "Priority", key: "priority", type: "number_integer" },
    { name: "Customer Target", key: "customer_target", type: "single_line_text_field",
      validations: [{ name: "choices", value: JSON.stringify(["ALL", "NEW_ONLY", "RETURNING_ONLY"]) }]
    },
    { name: "Gamification Type", key: "gamification_type", type: "single_line_text_field",
      validations: [{ name: "choices", value: JSON.stringify([
        "NONE", "SPIN_WHEEL", "SCRATCH_CARD", "PROGRESS_BAR"
      ])}]
    },
    { name: "Gamification Prizes", key: "gamification_prizes", type: "json" },
    { name: "Cart Progress Goal", key: "cart_progress_goal", type: "number_decimal" },
    { name: "Cart Progress Message", key: "cart_progress_message", type: "single_line_text_field" },
    { name: "Social Proof Enabled", key: "social_proof_enabled", type: "boolean" },
    { name: "Stock Urgency Threshold", key: "stock_urgency_threshold", type: "number_integer" },
    { name: "Translations", key: "translations", type: "json" },
  ];

  const result = await graphql(CREATE_METAOBJECT_DEFINITION, {
    definition: {
      name: "Offer",
      type: "app_offer",
      description: "Discount offers, BOGO deals, bundles, and promotional campaigns",
      access: { storefront: "PUBLIC_READ" },
      fieldDefinitions,
    },
  });

  const { metaobjectDefinition, userErrors } =
    result.data.metaobjectDefinitionCreate;

  if (userErrors.length > 0) {
    console.error("❌ Errors creating Offer definition:");
    userErrors.forEach((e) => console.error(`   ${e.field}: ${e.message}`));
    return false;
  }

  console.log(`✅ Created: ${metaobjectDefinition.name} (${metaobjectDefinition.type})`);
  console.log(`   ID: ${metaobjectDefinition.id}`);
  return true;
}

// ─── Offer Template Definition ────────────────────────────────

async function createTemplateDefinition() {
  console.log("\n🔧 Creating 'Offer Template' metaobject definition...\n");

  const result = await graphql(CREATE_METAOBJECT_DEFINITION, {
    definition: {
      name: "Offer Template",
      type: "app_offer_template",
      description: "Pre-built offer templates (Black Friday BOGO, Diwali Bundle, etc.)",
      access: { storefront: "NONE" },
      fieldDefinitions: [
        { name: "Template Name", key: "template_name", type: "single_line_text_field" },
        { name: "Category", key: "category", type: "single_line_text_field",
          validations: [{ name: "choices", value: JSON.stringify([
            "SEASONAL", "EVERYDAY", "CLEARANCE", "LAUNCH", "HOLIDAY"
          ])}]
        },
        { name: "Offer Config JSON", key: "offer_config", type: "json",
          description: "Pre-filled offer fields as JSON — used to populate a new offer" },
        { name: "Suggested Popup Style", key: "suggested_popup", type: "single_line_text_field" },
        { name: "Suggested Badge", key: "suggested_badge", type: "single_line_text_field" },
      ],
    },
  });

  const { metaobjectDefinition, userErrors } =
    result.data.metaobjectDefinitionCreate;

  if (userErrors.length > 0) {
    console.error("❌ Errors creating Template definition:");
    userErrors.forEach((e) => console.error(`   ${e.field}: ${e.message}`));
    return false;
  }

  console.log(`✅ Created: ${metaobjectDefinition.name} (${metaobjectDefinition.type})`);
  return true;
}

// ─── Seed Templates ───────────────────────────────────────────

const CREATE_METAOBJECT = `
  mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id handle }
      userErrors { field message }
    }
  }
`;

async function seedTemplates() {
  console.log("\n📦 Seeding offer templates...\n");

  const templates = [
    {
      handle: "black-friday-bogo",
      fields: [
        { key: "template_name", value: "Black Friday BOGO" },
        { key: "category", value: "SEASONAL" },
        { key: "offer_config", value: JSON.stringify({
          offer_type: "BOGO", buy_quantity: 1, get_quantity: 1,
          get_discount_percent: 100, badge_text: "BLACK FRIDAY BOGO!",
          popup_style: "ENTRY", pricing_display_mode: "AUTO_COMPARE_AT"
        })},
        { key: "suggested_popup", value: "COUNTDOWN_MODAL" },
        { key: "suggested_badge", value: "BLACK FRIDAY!" },
      ],
    },
    {
      handle: "diwali-bundle",
      fields: [
        { key: "template_name", value: "Diwali Festival Bundle" },
        { key: "category", value: "HOLIDAY" },
        { key: "offer_config", value: JSON.stringify({
          offer_type: "PRODUCT_BUNDLE", bundle_save_percent: 25,
          badge_text: "Diwali Special 🪔", popup_style: "ENTRY",
          pricing_display_mode: "AUTO_COMPARE_AT"
        })},
        { key: "suggested_popup", value: "ENTRY" },
        { key: "suggested_badge", value: "Festival Deal!" },
      ],
    },
    {
      handle: "clearance-volume",
      fields: [
        { key: "template_name", value: "Clearance Volume Discount" },
        { key: "category", value: "CLEARANCE" },
        { key: "offer_config", value: JSON.stringify({
          offer_type: "VOLUME_TIERED",
          volume_tiers: [
            { min_qty: 2, discount: 15 },
            { min_qty: 5, discount: 30 },
            { min_qty: 10, discount: 50 }
          ],
          badge_text: "Clearance!", popup_style: "FLOATING_BAR",
          pricing_display_mode: "DISCOUNT_ON_PRICE"
        })},
        { key: "suggested_popup", value: "FLOATING_BAR" },
        { key: "suggested_badge", value: "Up to 50% Off!" },
      ],
    },
    {
      handle: "welcome-first-order",
      fields: [
        { key: "template_name", value: "Welcome — First Order Discount" },
        { key: "category", value: "EVERYDAY" },
        { key: "offer_config", value: JSON.stringify({
          offer_type: "PERCENTAGE_OFF", discount_value: 10,
          discount_type: "percentage", customer_target: "NEW_ONLY",
          badge_text: "Welcome 10% Off!", popup_style: "ENTRY",
          pricing_display_mode: "DISCOUNT_ON_PRICE"
        })},
        { key: "suggested_popup", value: "ENTRY" },
        { key: "suggested_badge", value: "New Customer Deal" },
      ],
    },
    {
      handle: "free-gift-threshold",
      fields: [
        { key: "template_name", value: "Free Gift Over $100" },
        { key: "category", value: "EVERYDAY" },
        { key: "offer_config", value: JSON.stringify({
          offer_type: "FREE_GIFT", spend_threshold: 100,
          badge_text: "Free Gift!", popup_style: "CART_UPSELL",
          pricing_display_mode: "DISCOUNT_ON_PRICE"
        })},
        { key: "suggested_popup", value: "CART_UPSELL" },
        { key: "suggested_badge", value: "Free Gift Inside!" },
      ],
    },
    {
      handle: "mix-match-pick3",
      fields: [
        { key: "template_name", value: "Mix & Match — Pick Any 3" },
        { key: "category", value: "EVERYDAY" },
        { key: "offer_config", value: JSON.stringify({
          offer_type: "MIX_AND_MATCH", mix_match_pick_count: 3,
          bundle_save_percent: 20, badge_text: "Pick 3 & Save!",
          popup_style: "PRODUCT_BANNER",
          pricing_display_mode: "AUTO_COMPARE_AT"
        })},
        { key: "suggested_popup", value: "PRODUCT_BANNER" },
        { key: "suggested_badge", value: "Build Your Bundle" },
      ],
    },
  ];

  for (const template of templates) {
    const result = await graphql(CREATE_METAOBJECT, {
      metaobject: {
        type: "app_offer_template",
        handle: template.handle,
        fields: template.fields,
      },
    });

    const { metaobject, userErrors } = result.data.metaobjectCreate;
    if (userErrors.length > 0) {
      console.error(`  ❌ ${template.handle}:`, userErrors[0].message);
    } else {
      console.log(`  ✅ ${template.handle}`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Shopify Offers & Bundles — Setup Script  ");
  console.log("═══════════════════════════════════════════");
  console.log(`  Store: ${STORE}`);

  const offerOk = await createOfferDefinition();
  if (!offerOk) {
    console.error("\n⚠️  Offer definition may already exist. Continuing...\n");
  }

  const templateOk = await createTemplateDefinition();
  if (!templateOk) {
    console.error("\n⚠️  Template definition may already exist. Continuing...\n");
  }

  await seedTemplates();

  console.log("\n═══════════════════════════════════════════");
  console.log("  ✅ Setup complete!");
  console.log("  Go to Shopify Admin → Content → Metaobjects");
  console.log("  to start creating offers.");
  console.log("═══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err.message);
  process.exit(1);
});
