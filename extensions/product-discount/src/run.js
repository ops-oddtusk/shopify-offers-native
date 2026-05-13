// @ts-check

/**
 * @typedef {import("../generated/api")} RunInput
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  var EMPTY = { discountApplicationStrategy: "FIRST", discounts: [] };

  var configRaw = input && input.discountNode && input.discountNode.metafield
    ? input.discountNode.metafield.value : null;
  if (!configRaw) return EMPTY;

  var config;
  try { config = JSON.parse(configRaw); } catch (e) { return EMPTY; }

  var pricingMode = config.pricing_mode || "selling_price";
  var discountValue = parseFloat(config.discount_value) || 10;
  var discountType = config.discount_type || "percentage";
  var message = config.message || discountValue + "% off";

  var lines = (input && input.cart && input.cart.lines) ? input.cart.lines : [];
  if (lines.length === 0) return EMPTY;

  var discounts = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.merchandise || !line.cost) continue;

    var selling = parseFloat(line.cost.amountPerQuantity.amount);
    var base = selling;

    if (pricingMode === "compare_at_price" && line.cost.compareAtAmountPerQuantity) {
      base = parseFloat(line.cost.compareAtAmountPerQuantity.amount);
    }

    if (base <= 0) continue;

    var discountAmt = 0;
    if (discountType === "percentage") {
      discountAmt = base * (discountValue / 100);
    } else {
      discountAmt = discountValue;
    }

    var effective = discountAmt;
    if (pricingMode === "compare_at_price" && base > selling) {
      effective = Math.max(0, discountAmt - (base - selling));
    }

    effective = Math.min(effective, selling);

    if (effective > 0) {
      discounts.push({
        targets: [{ productVariant: { id: line.merchandise.id } }],
        value: { fix
cd ~/Desktop/shopify-offers-native

# 1. Update package.json to use v2.0.0
cat > extensions/product-discount/package.json << 'EOF'
{
  "name": "offer-product-discount",
  "version": "0.0.1",
  "license": "UNLICENSED",
  "scripts": {
    "build": "npm exec -- shopify app function build",
    "typegen": "npm exec -- shopify app function typegen",
    "preview": "npm exec -- shopify app function run"
  },
  "dependencies": {
    "@shopify/shopify_function": "^2.0.0"
  }
}
EOF

# 2. Update TOML — remove command entirely (CLI handles it for JS)
cat > extensions/product-discount/shopify.extension.toml << 'EOF'
api_version = "2025-07"

[[extensions]]
name = "Compare At Discount"
handle = "offer-product-discount"
type = "function"
description = "Applies discounts based on compare-at price"

  [[extensions.targeting]]
  target = "purchase.product-discount.run"
  input_query = "src/run.graphql"
  export = "run"

  [extensions.build]
  path = "dist/function.wasm"

  [extensions.ui]
  enable_create = true
EOF

# 3. Rewrite run.js for v2.0.0 API
cat > extensions/product-discount/src/run.js << 'JSEOF'
// @ts-check

/**
 * @typedef {import("../generated/api")} RunInput
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  var EMPTY = { discountApplicationStrategy: "FIRST", discounts: [] };

  var configRaw = input && input.discountNode && input.discountNode.metafield
    ? input.discountNode.metafield.value : null;
  if (!configRaw) return EMPTY;

  var config;
  try { config = JSON.parse(configRaw); } catch (e) { return EMPTY; }

  var pricingMode = config.pricing_mode || "selling_price";
  var discountValue = parseFloat(config.discount_value) || 10;
  var discountType = config.discount_type || "percentage";
  var message = config.message || discountValue + "% off";

  var lines = (input && input.cart && input.cart.lines) ? input.cart.lines : [];
  if (lines.length === 0) return EMPTY;

  var discounts = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.merchandise || !line.cost) continue;

    var selling = parseFloat(line.cost.amountPerQuantity.amount);
    var base = selling;

    if (pricingMode === "compare_at_price" && line.cost.compareAtAmountPerQuantity) {
      base = parseFloat(line.cost.compareAtAmountPerQuantity.amount);
    }

    if (base <= 0) continue;

    var discountAmt = 0;
    if (discountType === "percentage") {
      discountAmt = base * (discountValue / 100);
    } else {
      discountAmt = discountValue;
    }

    var effective = discountAmt;
    if (pricingMode === "compare_at_price" && base > selling) {
      effective = Math.max(0, discountAmt - (base - selling));
    }

    effective = Math.min(effective, selling);

    if (effective > 0) {
      discounts.push({
        targets: [{ productVariant: { id: line.merchandise.id } }],
        value: { fixedAmount: { amount: (effective * line.quantity).toFixed(2) } },
        message: message
      });
    }
  }

  if (discounts.length === 0) return EMPTY;
  return { discountApplicationStrategy: "FIRST", discounts: discounts };
}
