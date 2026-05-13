var EMPTY = { discountApplicationStrategy: "FIRST", discounts: [] };

export function run(input) {
  var configRaw = input && input.discountNode && input.discountNode.metafield
    ? input.discountNode.metafield.value : null;
  if (!configRaw) return EMPTY;

  var config;
  try { config = JSON.parse(configRaw); } catch (e) { return EMPTY; }

  var offerType = config.offer_type || "percentage_off";
  var lines = (input && input.cart && input.cart.lines) ? input.cart.lines : [];
  if (lines.length === 0) return EMPTY;

  var discounts = [];

  switch (offerType) {
    case "percentage_off":
      discounts = handlePercentageOff(lines, config);
      break;
    case "fixed_amount_off":
      discounts = handleFixedAmountOff(lines, config);
      break;
    case "bogo_free":
      discounts = handleBogoFree(lines, config);
      break;
    case "bogo_discounted":
      discounts = handleBogoDiscounted(lines, config);
      break;
    case "buy_x_get_y_free":
      discounts = handleBuyXGetYFree(lines, config);
      break;
    case "buy_x_get_y_discounted":
      discounts = handleBuyXGetYDiscounted(lines, config);
      break;
    case "volume_discount":
      discounts = handleVolumeDiscount(lines, config);
      break;
    case "tiered_pricing":
      discounts = handleTieredPricing(lines, config);
      break;
    case "spend_and_save":
      discounts = handleSpendAndSave(lines, config);
      break;
    case "second_item_discount":
      discounts = handleSecondItemDiscount(lines, config);
      break;
    case "bundle_discount":
      discounts = handleBundleDiscount(lines, config);
      break;
    case "cart_minimum_discount":
      discounts = handleCartMinimumDiscount(lines, config);
      break;
    default:
      return EMPTY;
  }

  if (discounts.length === 0) return EMPTY;
  return { discountApplicationStrategy: "FIRST", discounts: discounts };
}

// --- Helpers ---

function getBasePrice(line, useCompareAt) {
  var selling = parseFloat(line.cost.amountPerQuantity.amount);
  var compareAt = line.cost.compareAtAmountPerQuantity
    ? parseFloat(line.cost.compareAtAmountPerQuantity.amount) : 0;
  var base = (useCompareAt && compareAt > 0) ? compareAt : selling;
  return { selling: selling, compareAt: compareAt, base: base };
}

function calcEffective(discountAmt, prices, useCompareAt) {
  var effective = discountAmt;
  if (useCompareAt && prices.compareAt > prices.selling) {
    effective = Math.max(0, discountAmt - (prices.compareAt - prices.selling));
  }
  return Math.min(Math.max(0, effective), prices.selling);
}

function makeDiscount(line, amount, qty, message) {
  if (amount <= 0) return null;
  return {
    targets: [{ productVariant: { id: line.merchandise.id } }],
    value: { fixedAmount: { amount: (amount * qty).toFixed(2) } },
    message: message
  };
}

function useCA(config) {
  return config.pricing_mode === "compare_at_price";
}

// --- 1. Percentage off compare-at price ---
function handlePercentageOff(lines, config) {
  var pct = parseFloat(config.discount_value) || 10;
  var msg = config.message || pct + "% off";
  var ca = useCA(config);
  var results = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.merchandise || !line.cost) continue;
    var p = getBasePrice(line, ca);
    if (p.base <= 0) continue;
    var amt = p.base * (pct / 100);
    var eff = calcEffective(amt, p, ca);
    var d = makeDiscount(line, eff, line.quantity, msg);
    if (d) results.push(d);
  }
  return results;
}

// --- 2. Fixed amount off compare-at price ---
function handleFixedAmountOff(lines, config) {
  var fixed = parseFloat(config.discount_value) || 5;
  var msg = config.message || "$" + fixed + " off";
  var ca = useCA(config);
  var results = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.merchandise || !line.cost) continue;
    var p = getBasePrice(line, ca);
    if (p.base <= 0) continue;
    var eff = calcEffective(fixed, p, ca);
    var d = makeDiscount(line, eff, line.quantity, msg);
    if (d) results.push(d);
  }
  return results;
}

// --- 3. BOGO Free (buy 1 get 1 free) ---
function handleBogoFree(lines, config) {
  var msg = config.message || "Buy 1 Get 1 Free";
  var ca = useCA(config);
  var results = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.merchandise || !line.cost) continue;
    var freeQty = Math.floor(line.quantity / 2);
    if (freeQty <= 0) continue;
    var p = getBasePrice(line, ca);
    if (p.selling <= 0) continue;
    var d = makeDiscount(line, p.selling, freeQty, msg);
    if (d) results.push(d);
  }
  return results;
}

// --- 4. BOGO Discounted (buy 1 get 1 at X% off) ---
function handleBogoDiscounted(lines, config) {
  var pct = parseFloat(config.bogo_discount_percent) || 50;
  var msg = config.message || "Buy 1 Get 1 at " + pct + "% off";
  var ca = useCA(config);
  var results = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.merchandise || !line.cost) continue;
    var discountedQty = Math.floor(line.quantity / 2);
    if (discountedQty <= 0) continue;
    var p = getBasePrice(line, ca);
    if (p.base <= 0) continue;
    var amt = p.base * (pct / 100);
    var eff = calcEffective(amt, p, ca);
    var d = makeDiscount(line, eff, discountedQty, msg);
    if (d) results.push(d);
  }
  return results;
}

// --- 5. Buy X Get Y Free ---
function handleBuyXGetYFree(lines, config) {
  var buyQty = parseInt(config.buy_quantity) || 2;
  var getQty = parseInt(config.get_quantity) || 1;
  var msg = config.message || "Buy " + buyQty + " Get " + getQty + " Free";
  var results = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.merchandise || !line.cost) continue;
    var sets = Math.floor(line.quantity / (buyQty + getQty));
    var freeItems = sets * getQty;
    if (freeItems <= 0) continue;
    var p = getBasePrice(line, false);
    if (p.selling <= 0) continue;
    var d = makeDiscount(line, p.selling, freeItems, msg);
    if (d) results.push(d);
  }
  return results;
}

// --- 6. Buy X Get Y at X% off ---
function handleBuyXGetYDiscounted(lines, config) {
  var buyQty = parseInt(config.buy_quantity) || 2;
  var getQty = parseInt(config.get_quantity) || 1;
  var pct = parseFloat(config.get_discount_percent) || 50;
  var msg = config.message || "Buy " + buyQty + " Get " + getQty + " at " + pct + "% off";
  var ca = useCA(config);
  var results = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.merchandise || !line.cost) continue;
    var sets = Math.floor(line.quantity / (buyQty + getQty));
    var discountedItems = sets * getQty;
    if (discountedItems <= 0) continue;
    var p = getBasePrice(line, ca);
    if (p.base <= 0) continue;
    var amt = p.base * (pct / 100);
    var eff = calcEffective(amt, p, ca);
    var d = makeDiscount(line, eff, discountedItems, msg);
    if (d) results.push(d);
  }
  return results;
}

// --- 7. Volume discount (buy 3+ get X% off) ---
function handleVolumeDiscount(lines, config) {
  var minQty = parseInt(config.min_quantity) || 3;
  var pct = parseFloat(config.discount_value) || 10;
  var msg = config.message || "Buy " + minQty + "+ get " + pct + "% off";
  var ca = useCA(config);
  var results = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.merchandise || !line.cost) continue;
    if (line.quantity < minQty) continue;
    var p = getBasePrice(line, ca);
    if (p.base <= 0) continue;
    var amt = p.base * (pct / 100);
    var eff = calcEffective(amt, p, ca);
    var d = makeDiscount(line, eff, line.quantity, msg);
    if (d) results.push(d);
  }
  return results;
}

// --- 8. Tiered pricing (different % at different quantities) ---
function handleTieredPricing(lines, config) {
  var tiers = config.tiers || [
    { min_quantity: 2, discount_percent: 5 },
    { min_quantity: 5, discount_percent: 10 },
    { min_quantity: 10, discount_percent: 15 }
  ];
  // Sort tiers descending by min_quantity so we match the highest tier first
  tiers.sort(function(a, b) { return b.min_quantity - a.min_quantity; });
  var ca = useCA(config);
  var results = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.merchandise || !line.cost) continue;
    var matchedTier = null;
    for (var t = 0; t < tiers.length; t++) {
      if (line.quantity >= tiers[t].min_quantity) {
        matchedTier = tiers[t];
        break;
      }
    }
    if (!matchedTier) continue;
    var pct = parseFloat(matchedTier.discount_percent) || 0;
    if (pct <= 0) continue;
    var p = getBasePrice(line, ca);
    if (p.base <= 0) continue;
    var amt = p.base * (pct / 100);
    var eff = calcEffective(amt, p, ca);
    var msg = config.message || pct + "% off (qty " + matchedTier.min_quantity + "+)";
    var d = makeDiscount(line, eff, line.quantity, msg);
    if (d) results.push(d);
  }
  return results;
}

// --- 9. Spend & Save (spend $X on compare-at, save Y%) ---
function handleSpendAndSave(lines, config) {
  var minSpend = parseFloat(config.min_spend) || 100;
  var pct = parseFloat(config.discount_value) || 10;
  var msg = config.message || "Spend $" + minSpend + " save " + pct + "%";
  var ca = useCA(config);

  // Calculate cart total based on compare-at or selling price
  var cartTotal = 0;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.cost) continue;
    var p = getBasePrice(line, ca);
    cartTotal += p.base * line.quantity;
  }

  if (cartTotal < minSpend) return [];

  var results = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.merchandise || !line.cost) continue;
    var p = getBasePrice(line, ca);
    if (p.base <= 0) continue;
    var amt = p.base * (pct / 100);
    var eff = calcEffective(amt, p, ca);
    var d = makeDiscount(line, eff, line.quantity, msg);
    if (d) results.push(d);
  }
  return results;
}

// --- 10. Second item discount (2nd item at X% off) ---
function handleSecondItemDiscount(lines, config) {
  var pct = parseFloat(config.second_item_percent) || 50;
  var msg = config.message || "2nd item at " + pct + "% off";
  var ca = useCA(config);
  var results = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.merchandise || !line.cost) continue;
    // Every 2 items, 1 gets the discount
    var discountedQty = Math.floor(line.quantity / 2);
    if (discountedQty <= 0) continue;
    var p = getBasePrice(line, ca);
    if (p.base <= 0) continue;
    var amt = p.base * (pct / 100);
    var eff = calcEffective(amt, p, ca);
    var d = makeDiscount(line, eff, discountedQty, msg);
    if (d) results.push(d);
  }
  return results;
}

// --- 11. Bundle discount (buy items together, save X%) ---
function handleBundleDiscount(lines, config) {
  var pct = parseFloat(config.discount_value) || 10;
  var minItems = parseInt(config.min_bundle_items) || 2;
  var msg = config.message || "Bundle & save " + pct + "%";
  var ca = useCA(config);

  // Count distinct product lines
  var qualifyingLines = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.merchandise && line.cost) qualifyingLines.push(line);
  }

  if (qualifyingLines.length < minItems) return [];

  var results = [];
  for (var i = 0; i < qualifyingLines.length; i++) {
    var line = qualifyingLines[i];
    var p = getBasePrice(line, ca);
    if (p.base <= 0) continue;
    var amt = p.base * (pct / 100);
    var eff = calcEffective(amt, p, ca);
    var d = makeDiscount(line, eff, line.quantity, msg);
    if (d) results.push(d);
  }
  return results;
}

// --- 12. Cart minimum discount (cart compare-at total > $X, get Y% off) ---
function handleCartMinimumDiscount(lines, config) {
  var minTotal = parseFloat(config.min_cart_total) || 200;
  var pct = parseFloat(config.discount_value) || 15;
  var msg = config.message || pct + "% off orders over $" + minTotal;
  var ca = useCA(config);

  var cartTotal = 0;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.cost) continue;
    var p = getBasePrice(line, ca);
    cartTotal += p.base * line.quantity;
  }

  if (cartTotal < minTotal) return [];

  var results = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.merchandise || !line.cost) continue;
    var p = getBasePrice(line, ca);
    if (p.base <= 0) continue;
    var amt = p.base * (pct / 100);
    var eff = calcEffective(amt, p, ca);
    var d = makeDiscount(line, eff, line.quantity, msg);
    if (d) results.push(d);
  }
  return results;
}
