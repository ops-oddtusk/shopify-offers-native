// @ts-check

/**
 * Offer Product Discount Function
 * Supports 12 discount types with compare-at price option.
 *
 * Config is read from discountNode.metafield (namespace: "offer-config", key: "settings").
 * JSON shape:
 * {
 *   "offer_type": "PERCENTAGE_OFF" | "FIXED_AMOUNT" | "BOGO" | "BUY_X_GET_Y" |
 *                 "VOLUME_TIERED" | "QUANTITY_BREAKS" | "FREE_GIFT" | "SPEND_X_SAVE_Y" |
 *                 "PRODUCT_BUNDLE" | "COLLECTION_BUNDLE" | "MIX_AND_MATCH" | "MIN_QUANTITY",
 *   "pricing_mode": "selling_price" | "compare_at_price",
 *   "discount_value": 15,
 *   "min_quantity": 2,
 *   "tiers": [{ "min_qty": 2, "discount": 10 }, { "min_qty": 5, "discount": 20 }],
 *   "buy_qty": 2,
 *   "get_qty": 1,
 *   "spend_threshold": 100,
 *   "message": "15% off!"
 * }
 */

var EMPTY = { discountApplicationStrategy: "FIRST", discounts: [] };

function run(input) {
  var configRaw = input && input.discountNode && input.discountNode.metafield
    ? input.discountNode.metafield.value : null;
  if (!configRaw) return EMPTY;

  var config;
  try { config = JSON.parse(configRaw); } catch (e) { return EMPTY; }

  var offerType = config.offer_type || "PERCENTAGE_OFF";
  var pricingMode = config.pricing_mode || "selling_price";
  var lines = (input && input.cart && input.cart.lines) ? input.cart.lines : [];
  if (lines.length === 0) return EMPTY;

  var discounts = [];

  if (offerType === "PERCENTAGE_OFF") discounts = applyPercentageOff(lines, config, pricingMode);
  else if (offerType === "FIXED_AMOUNT") discounts = applyFixedAmount(lines, config, pricingMode);
  else if (offerType === "BOGO") discounts = applyBogo(lines, config, pricingMode);
  else if (offerType === "BUY_X_GET_Y") discounts = applyBuyXGetY(lines, config, pricingMode);
  else if (offerType === "VOLUME_TIERED") discounts = applyVolumeTiered(lines, config, pricingMode);
  else if (offerType === "QUANTITY_BREAKS") discounts = applyQuantityBreaks(lines, config, pricingMode);
  else if (offerType === "FREE_GIFT") discounts = applyFreeGift(lines, config);
  else if (offerType === "SPEND_X_SAVE_Y") discounts = applySpendXSaveY(lines, config, pricingMode);
  else if (offerType === "PRODUCT_BUNDLE" || offerType === "COLLECTION_BUNDLE" || offerType === "MIX_AND_MATCH") discounts = applyBundle(lines, config, pricingMode);
  else if (offerType === "MIN_QUANTITY") discounts = applyMinQuantity(lines, config, pricingMode);

  if (discounts.length === 0) return EMPTY;
  return { discountApplicationStrategy: "FIRST", discounts: discounts };
}

// ── Helpers ──────────────────────────────────────────────

function getSellingPrice(line) {
  return parseFloat(line.cost.amountPerQuantity.amount);
}

function getBasePrice(line, pricingMode) {
  if (pricingMode === "compare_at_price" && line.cost.compareAtAmountPerQuantity) {
    return parseFloat(line.cost.compareAtAmountPerQuantity.amount);
  }
  return getSellingPrice(line);
}

function getCurrency(line) {
  return line.cost.amountPerQuantity.currencyCode;
}

function makePercentageDiscount(targets, percentage, message) {
  return {
    targets: targets,
    value: { percentage: { value: String(Math.min(percentage, 100)) } },
    message: message || percentage + "% off"
  };
}

function makeFixedDiscount(targets, amount, currency, message) {
  return {
    targets: targets,
    value: { fixedAmount: { amount: String(amount) } },
    message: message || "$" + amount + " off"
  };
}

function getEligibleLines(lines) {
  var result = [];
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].merchandise && lines[i].cost) result.push(lines[i]);
  }
  return result;
}

function lineTargets(lines) {
  var targets = [];
  for (var i = 0; i < lines.length; i++) {
    targets.push({ productVariant: { id: lines[i].merchandise.id } });
  }
  return targets;
}

// ── Offer Type Implementations ───────────────────────────

function applyPercentageOff(lines, config, pricingMode) {
  var eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];
  var pct = parseFloat(config.discount_value) || 10;

  if (pricingMode === "compare_at_price") {
    var results = [];
    for (var i = 0; i < eligible.length; i++) {
      var base = getBasePrice(eligible[i], pricingMode);
      var selling = getSellingPrice(eligible[i]);
      var discountAmt = base * (pct / 100);
      var effective = Math.max(0, discountAmt - (base - selling));
      if (effective > 0) {
        results.push(makeFixedDiscount(
          [{ productVariant: { id: eligible[i].merchandise.id } }],
          effective.toFixed(2), getCurrency(eligible[i]),
          config.message || pct + "% off (compare-at)"
        ));
      }
    }
    return results;
  }
  return [makePercentageDiscount(lineTargets(eligible), pct, config.message)];
}

function applyFixedAmount(lines, config, pricingMode) {
  var eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];
  var amount = parseFloat(config.discount_value) || 5;

  if (pricingMode === "compare_at_price") {
    var results = [];
    for (var i = 0; i < eligible.length; i++) {
      var base = getBasePrice(eligible[i], pricingMode);
      var selling = getSellingPrice(eligible[i]);
      var already = base - selling;
      var effective = Math.max(0, amount - already);
      if (effective > 0) {
        results.push(makeFixedDiscount(
          [{ productVariant: { id: eligible[i].merchandise.id } }],
          effective.toFixed(2), getCurrency(eligible[i]),
          config.message || "$" + amount + " off (compare-at)"
        ));
      }
    }
    return results;
  }
  return [makeFixedDiscount(lineTargets(eligible), amount, getCurrency(eligible[0]), config.message)];
}

function applyBogo(lines, config, pricingMode) {
  return applyBuyXGetY(lines, { offer_type: config.offer_type, pricing_mode: config.pricing_mode, discount_value: 100, buy_qty: 1, get_qty: 1, message: config.message }, pricingMode);
}

function applyBuyXGetY(lines, config, pricingMode) {
  var eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];
  var buyQty = parseInt(config.buy_qty) || 2;
  var getQty = parseInt(config.get_qty) || 1;
  var pct = parseFloat(config.discount_value) || 100;
  var results = [];

  for (var i = 0; i < eligible.length; i++) {
    var sets = Math.floor(eligible[i].quantity / (buyQty + getQty));
    if (sets > 0) {
      var freeItems = sets * getQty;
      var base = getBasePrice(eligible[i], pricingMode);
      var selling = getSellingPrice(eligible[i]);
      var discountPerItem = base * (pct / 100);
      var effectivePerItem = pricingMode === "compare_at_price" ? Math.min(discountPerItem, selling) : discountPerItem;
      results.push(makeFixedDiscount(
        [{ productVariant: { id: eligible[i].merchandise.id } }],
        (effectivePerItem * freeItems).toFixed(2), getCurrency(eligible[i]),
        config.message || "Buy " + buyQty + " Get " + getQty + " " + pct + "% off"
      ));
    }
  }
  return results;
}

function applyVolumeTiered(lines, config, pricingMode) {
  var eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];
  var tiers = (config.tiers || []).slice().sort(function(a, b) { return b.min_qty - a.min_qty; });
  if (tiers.length === 0) return [];
  var results = [];

  for (var i = 0; i < eligible.length; i++) {
    var qty = eligible[i].quantity;
    var tier = null;
    for (var t = 0; t < tiers.length; t++) { if (qty >= tiers[t].min_qty) { tier = tiers[t]; break; } }
    if (tier) {
      var pct = parseFloat(tier.discount);
      if (pricingMode === "compare_at_price") {
        var base = getBasePrice(eligible[i], pricingMode);
        var selling = getSellingPrice(eligible[i]);
        var effective = Math.min(base * (pct / 100), selling);
        results.push(makeFixedDiscount(
          [{ productVariant: { id: eligible[i].merchandise.id } }],
          (effective * qty).toFixed(2), getCurrency(eligible[i]),
          config.message || pct + "% off (" + qty + "+ items)"
        ));
      } else {
        results.push(makePercentageDiscount(
          [{ productVariant: { id: eligible[i].merchandise.id } }],
          pct, config.message || pct + "% off (" + qty + "+ items)"
        ));
      }
    }
  }
  return results;
}

function applyQuantityBreaks(lines, config, pricingMode) {
  var eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];
  var tiers = (config.tiers || []).slice().sort(function(a, b) { return b.min_qty - a.min_qty; });
  if (tiers.length === 0) return [];
  var results = [];

  for (var i = 0; i < eligible.length; i++) {
    var qty = eligible[i].quantity;
    var tier = null;
    for (var t = 0; t < tiers.length; t++) { if (qty >= tiers[t].min_qty) { tier = tiers[t]; break; } }
    if (tier && tier.price_each) {
      var base = getBasePrice(eligible[i], pricingMode);
      var selling = getSellingPrice(eligible[i]);
      var priceEach = parseFloat(tier.price_each);
      var discountPerItem = Math.max(0, base - priceEach);
      var effective = pricingMode === "compare_at_price" ? Math.min(discountPerItem, selling) : discountPerItem;
      if (effective > 0) {
        results.push(makeFixedDiscount(
          [{ productVariant: { id: eligible[i].merchandise.id } }],
          (effective * qty).toFixed(2), getCurrency(eligible[i]),
          config.message || "$" + priceEach + " each (" + qty + "+)"
        ));
      }
    }
  }
  return results;
}

function applyFreeGift(lines, config) {
  var eligible = getEligibleLines(lines);
  var giftLines = [];
  for (var i = 0; i < eligible.length; i++) {
    if (eligible[i].merchandise.product && eligible[i].merchandise.product.hasAnyTag) giftLines.push(eligible[i]);
  }
  if (giftLines.length === 0) return [];

  var threshold = parseFloat(config.spend_threshold) || 0;
  var nonGiftTotal = 0;
  for (var i = 0; i < eligible.length; i++) {
    if (!(eligible[i].merchandise.product && eligible[i].merchandise.product.hasAnyTag)) {
      nonGiftTotal += getSellingPrice(eligible[i]) * eligible[i].quantity;
    }
  }
  if (threshold > 0 && nonGiftTotal < threshold) return [];
  return [makePercentageDiscount(lineTargets(giftLines), 100, config.message || "Free gift!")];
}

function applySpendXSaveY(lines, config, pricingMode) {
  var eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];
  var threshold = parseFloat(config.spend_threshold) || 100;
  var cartTotal = 0;
  for (var i = 0; i < eligible.length; i++) {
    cartTotal += getBasePrice(eligible[i], pricingMode) * eligible[i].quantity;
  }
  if (cartTotal < threshold) return [];
  var pct = parseFloat(config.discount_value) || 10;

  if (pricingMode === "compare_at_price") {
    var results = [];
    for (var i = 0; i < eligible.length; i++) {
      var base = getBasePrice(eligible[i], pricingMode);
      var selling = getSellingPrice(eligible[i]);
      var effective = Math.min(base * (pct / 100), selling);
      if (effective > 0) {
        results.push(makeFixedDiscount(
          [{ productVariant: { id: eligible[i].merchandise.id } }],
          (effective * eligible[i].quantity).toFixed(2), getCurrency(eligible[i]),
          config.message || "Spend $" + threshold + "+, save " + pct + "%"
        ));
      }
    }
    return results;
  }
  return [makePercentageDiscount(lineTargets(eligible), pct, config.message || "Spend $" + threshold + "+, save " + pct + "%")];
}

function applyBundle(lines, config, pricingMode) {
  var eligible = getEligibleLines(lines);
  var minItems = parseInt(config.min_quantity) || 2;
  var totalQty = 0;
  for (var i = 0; i < eligible.length; i++) totalQty += eligible[i].quantity;
  if (totalQty < minItems) return [];
  var pct = parseFloat(config.discount_value) || 10;

  if (pricingMode === "compare_at_price") {
    var results = [];
    for (var i = 0; i < eligible.length; i++) {
      var base = getBasePrice(eligible[i], pricingMode);
      var selling = getSellingPrice(eligible[i]);
      var effective = Math.min(base * (pct / 100), selling);
      if (effective > 0) {
        results.push(makeFixedDiscount(
          [{ productVariant: { id: eligible[i].merchandise.id } }],
          (effective * eligible[i].quantity).toFixed(2), getCurrency(eligible[i]),
          config.message || "Bundle " + pct + "% off"
        ));
      }
    }
    return results;
  }
  return [makePercentageDiscount(lineTargets(eligible), pct, config.message || "Bundle " + pct + "% off")];
}

function applyMinQuantity(lines, config, pricingMode) {
  var eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];
  var minQty = parseInt(config.min_quantity) || 2;
  var pct = parseFloat(config.discount_value) || 10;
  var qualifying = [];
  for (var i = 0; i < eligible.length; i++) {
    if (eligible[i].quantity >= minQty) qualifying.push(eligible[i]);
  }
  if (qualifying.length === 0) return [];

  if (pricingMode === "compare_at_price") {
    var results = [];
    for (var i = 0; i < qualifying.length; i++) {
      var base = getBasePrice(qualifying[i], pricingMode);
      var selling = getSellingPrice(qualifying[i]);
      var effective = Math.min(base * (pct / 100), selling);
      if (effective > 0) {
        results.push(makeFixedDiscount(
          [{ productVariant: { id: qualifying[i].merchandise.id } }],
          (effective * qualifying[i].quantity).toFixed(2), getCurrency(qualifying[i]),
          config.message || pct + "% off (min " + minQty + ")"
        ));
      }
    }
    return results;
  }
  return [makePercentageDiscount(lineTargets(qualifying), pct, config.message || pct + "% off (min " + minQty + ")")];
}
