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
 *   "discount_value": 15,          // percentage or fixed amount
 *   "min_quantity": 2,             // for MIN_QUANTITY, VOLUME_TIERED, etc.
 *   "tiers": [                     // for VOLUME_TIERED / QUANTITY_BREAKS
 *     { "min_qty": 2, "discount": 10 },
 *     { "min_qty": 5, "discount": 20 }
 *   ],
 *   "buy_qty": 2,                  // for BOGO, BUY_X_GET_Y
 *   "get_qty": 1,                  // for BOGO, BUY_X_GET_Y
 *   "spend_threshold": 100,        // for SPEND_X_SAVE_Y
 *   "message": "15% off!"          // shown at checkout
 * }
 */

export function run(input) {
  const EMPTY = { discountApplicationStrategy: "FIRST", discounts: [] };

  // Parse config from metafield
  const configRaw = input?.discountNode?.metafield?.value;
  if (!configRaw) return EMPTY;

  let config;
  try {
    config = JSON.parse(configRaw);
  } catch (e) {
    return EMPTY;
  }

  const offerType = config.offer_type || "PERCENTAGE_OFF";
  const pricingMode = config.pricing_mode || "selling_price";
  const lines = input?.cart?.lines || [];

  if (lines.length === 0) return EMPTY;

  const discounts = [];

  switch (offerType) {
    case "PERCENTAGE_OFF":
      discounts.push(...applyPercentageOff(lines, config, pricingMode));
      break;
    case "FIXED_AMOUNT":
      discounts.push(...applyFixedAmount(lines, config, pricingMode));
      break;
    case "BOGO":
      discounts.push(...applyBogo(lines, config, pricingMode));
      break;
    case "BUY_X_GET_Y":
      discounts.push(...applyBuyXGetY(lines, config, pricingMode));
      break;
    case "VOLUME_TIERED":
      discounts.push(...applyVolumeTiered(lines, config, pricingMode));
      break;
    case "QUANTITY_BREAKS":
      discounts.push(...applyQuantityBreaks(lines, config, pricingMode));
      break;
    case "FREE_GIFT":
      discounts.push(...applyFreeGift(lines, config));
      break;
    case "SPEND_X_SAVE_Y":
      discounts.push(...applySpendXSaveY(lines, config, pricingMode));
      break;
    case "PRODUCT_BUNDLE":
    case "COLLECTION_BUNDLE":
    case "MIX_AND_MATCH":
      discounts.push(...applyBundle(lines, config, pricingMode));
      break;
    case "MIN_QUANTITY":
      discounts.push(...applyMinQuantity(lines, config, pricingMode));
      break;
  }

  if (discounts.length === 0) return EMPTY;

  return {
    discountApplicationStrategy: "FIRST",
    discounts,
  };
}

// ── Helpers ──────────────────────────────────────────────

function getBasePrice(variant, pricingMode) {
  if (pricingMode === "compare_at_price" && variant.compareAtPrice) {
    return parseFloat(variant.compareAtPrice.amount);
  }
  return parseFloat(variant.price.amount);
}

function getCurrency(variant) {
  return variant.price.currencyCode;
}

function makePercentageDiscount(targets, percentage, message) {
  return {
    targets,
    value: { percentage: { value: String(Math.min(percentage, 100)) } },
    message: message || `${percentage}% off`,
  };
}

function makeFixedDiscount(targets, amount, currency, message) {
  return {
    targets,
    value: { fixedAmount: { amount: String(amount), currencyCode: currency } },
    message: message || `$${amount} off`,
  };
}

function getEligibleLines(lines) {
  return lines.filter((line) => {
    const variant = line.merchandise;
    return variant && variant.__typename !== undefined;
  });
}

function lineTargets(lines) {
  return lines.map((line) => ({
    productVariant: { id: line.merchandise.id },
  }));
}

// ── Offer Type Implementations ───────────────────────────

function applyPercentageOff(lines, config, pricingMode) {
  const eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];

  const pct = parseFloat(config.discount_value) || 10;

  if (pricingMode === "compare_at_price") {
    // Calculate per-line fixed amounts based on compare-at price
    const results = [];
    for (const line of eligible) {
      const variant = line.merchandise;
      const base = getBasePrice(variant, pricingMode);
      const selling = parseFloat(variant.price.amount);
      const discountAmt = base * (pct / 100);
      // Only discount if the calculated discount > (compare_at - selling)
      const effectiveDiscount = Math.max(0, discountAmt - (base - selling));
      if (effectiveDiscount > 0) {
        results.push(
          makeFixedDiscount(
            [{ productVariant: { id: variant.id } }],
            effectiveDiscount.toFixed(2),
            getCurrency(variant),
            config.message || `${pct}% off (compare-at)`
          )
        );
      }
    }
    return results;
  }

  return [makePercentageDiscount(lineTargets(eligible), pct, config.message)];
}

function applyFixedAmount(lines, config, pricingMode) {
  const eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];

  const amount = parseFloat(config.discount_value) || 5;
  const currency = getCurrency(eligible[0].merchandise);

  if (pricingMode === "compare_at_price") {
    const results = [];
    for (const line of eligible) {
      const variant = line.merchandise;
      const base = getBasePrice(variant, pricingMode);
      const selling = parseFloat(variant.price.amount);
      const alreadyDiscounted = base - selling;
      const effectiveDiscount = Math.max(0, amount - alreadyDiscounted);
      if (effectiveDiscount > 0) {
        results.push(
          makeFixedDiscount(
            [{ productVariant: { id: variant.id } }],
            effectiveDiscount.toFixed(2),
            getCurrency(variant),
            config.message || `$${amount} off (compare-at)`
          )
        );
      }
    }
    return results;
  }

  return [
    makeFixedDiscount(lineTargets(eligible), amount, currency, config.message),
  ];
}

function applyBogo(lines, config, pricingMode) {
  return applyBuyXGetY(
    lines,
    { ...config, buy_qty: 1, get_qty: 1, discount_value: 100 },
    pricingMode
  );
}

function applyBuyXGetY(lines, config, pricingMode) {
  const eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];

  const buyQty = parseInt(config.buy_qty) || 2;
  const getQty = parseInt(config.get_qty) || 1;
  const pct = parseFloat(config.discount_value) || 100;

  const results = [];
  for (const line of eligible) {
    const totalQty = line.quantity;
    const sets = Math.floor(totalQty / (buyQty + getQty));
    if (sets > 0) {
      const freeItems = sets * getQty;
      const variant = line.merchandise;
      const base = getBasePrice(variant, pricingMode);
      const discountPerItem = base * (pct / 100);
      const totalDiscount = discountPerItem * freeItems;

      if (pricingMode === "compare_at_price") {
        const selling = parseFloat(variant.price.amount);
        const effectivePerItem = Math.min(discountPerItem, selling);
        results.push(
          makeFixedDiscount(
            [{ productVariant: { id: variant.id } }],
            (effectivePerItem * freeItems).toFixed(2),
            getCurrency(variant),
            config.message || `Buy ${buyQty} Get ${getQty} ${pct}% off`
          )
        );
      } else {
        results.push(
          makeFixedDiscount(
            [{ productVariant: { id: variant.id } }],
            totalDiscount.toFixed(2),
            getCurrency(variant),
            config.message || `Buy ${buyQty} Get ${getQty} ${pct}% off`
          )
        );
      }
    }
  }
  return results;
}

function applyVolumeTiered(lines, config, pricingMode) {
  const eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];

  const tiers = (config.tiers || []).sort(
    (a, b) => b.min_qty - a.min_qty
  );
  if (tiers.length === 0) return [];

  const results = [];
  for (const line of eligible) {
    const qty = line.quantity;
    const tier = tiers.find((t) => qty >= t.min_qty);
    if (tier) {
      const variant = line.merchandise;
      const base = getBasePrice(variant, pricingMode);
      const pct = parseFloat(tier.discount);
      const discountAmt = base * (pct / 100);

      if (pricingMode === "compare_at_price") {
        const selling = parseFloat(variant.price.amount);
        const effective = Math.min(discountAmt, selling);
        results.push(
          makeFixedDiscount(
            [{ productVariant: { id: variant.id } }],
            (effective * qty).toFixed(2),
            getCurrency(variant),
            config.message || `${pct}% off (${qty}+ items)`
          )
        );
      } else {
        results.push(
          makePercentageDiscount(
            [{ productVariant: { id: variant.id } }],
            pct,
            config.message || `${pct}% off (${qty}+ items)`
          )
        );
      }
    }
  }
  return results;
}

function applyQuantityBreaks(lines, config, pricingMode) {
  // Same as volume tiered but with fixed price per item instead of percentage
  const eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];

  const tiers = (config.tiers || []).sort(
    (a, b) => b.min_qty - a.min_qty
  );
  if (tiers.length === 0) return [];

  const results = [];
  for (const line of eligible) {
    const qty = line.quantity;
    const tier = tiers.find((t) => qty >= t.min_qty);
    if (tier && tier.price_each) {
      const variant = line.merchandise;
      const base = getBasePrice(variant, pricingMode);
      const priceEach = parseFloat(tier.price_each);
      const discountPerItem = Math.max(0, base - priceEach);

      if (discountPerItem > 0) {
        const selling = parseFloat(variant.price.amount);
        const effective =
          pricingMode === "compare_at_price"
            ? Math.min(discountPerItem, selling)
            : discountPerItem;

        results.push(
          makeFixedDiscount(
            [{ productVariant: { id: variant.id } }],
            (effective * qty).toFixed(2),
            getCurrency(variant),
            config.message || `$${priceEach} each (${qty}+)`
          )
        );
      }
    }
  }
  return results;
}

function applyFreeGift(lines, config) {
  // Free gift: 100% off items tagged with offer-discount when threshold is met
  const eligible = getEligibleLines(lines);
  const giftLines = eligible.filter(
    (l) => l.merchandise.product && l.merchandise.product.hasAnyTag
  );

  if (giftLines.length === 0) return [];

  const threshold = parseFloat(config.spend_threshold) || 0;
  const nonGiftTotal = eligible
    .filter((l) => !l.merchandise.product?.hasAnyTag)
    .reduce(
      (sum, l) => sum + parseFloat(l.merchandise.price.amount) * l.quantity,
      0
    );

  if (threshold > 0 && nonGiftTotal < threshold) return [];

  return [
    makePercentageDiscount(
      lineTargets(giftLines),
      100,
      config.message || "Free gift!"
    ),
  ];
}

function applySpendXSaveY(lines, config, pricingMode) {
  const eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];

  const threshold = parseFloat(config.spend_threshold) || 100;
  const cartTotal = eligible.reduce((sum, l) => {
    const base = getBasePrice(l.merchandise, pricingMode);
    return sum + base * l.quantity;
  }, 0);

  if (cartTotal < threshold) return [];

  const pct = parseFloat(config.discount_value) || 10;
  const currency = getCurrency(eligible[0].merchandise);

  if (pricingMode === "compare_at_price") {
    const results = [];
    for (const line of eligible) {
      const variant = line.merchandise;
      const base = getBasePrice(variant, pricingMode);
      const selling = parseFloat(variant.price.amount);
      const discountAmt = base * (pct / 100);
      const effective = Math.min(discountAmt, selling);
      if (effective > 0) {
        results.push(
          makeFixedDiscount(
            [{ productVariant: { id: variant.id } }],
            (effective * line.quantity).toFixed(2),
            getCurrency(variant),
            config.message ||
              `Spend $${threshold}+, save ${pct}% (compare-at)`
          )
        );
      }
    }
    return results;
  }

  return [
    makePercentageDiscount(
      lineTargets(eligible),
      pct,
      config.message || `Spend $${threshold}+, save ${pct}%`
    ),
  ];
}

function applyBundle(lines, config, pricingMode) {
  // Bundle discount: all items in cart get percentage off
  const eligible = getEligibleLines(lines);
  const minItems = parseInt(config.min_quantity) || 2;
  const totalQty = eligible.reduce((sum, l) => sum + l.quantity, 0);

  if (totalQty < minItems) return [];

  const pct = parseFloat(config.discount_value) || 10;

  if (pricingMode === "compare_at_price") {
    const results = [];
    for (const line of eligible) {
      const variant = line.merchandise;
      const base = getBasePrice(variant, pricingMode);
      const selling = parseFloat(variant.price.amount);
      const discountAmt = base * (pct / 100);
      const effective = Math.min(discountAmt, selling);
      if (effective > 0) {
        results.push(
          makeFixedDiscount(
            [{ productVariant: { id: variant.id } }],
            (effective * line.quantity).toFixed(2),
            getCurrency(variant),
            config.message || `Bundle ${pct}% off`
          )
        );
      }
    }
    return results;
  }

  return [
    makePercentageDiscount(
      lineTargets(eligible),
      pct,
      config.message || `Bundle ${pct}% off`
    ),
  ];
}

function applyMinQuantity(lines, config, pricingMode) {
  const eligible = getEligibleLines(lines);
  if (eligible.length === 0) return [];

  const minQty = parseInt(config.min_quantity) || 2;
  const pct = parseFloat(config.discount_value) || 10;

  const qualifying = eligible.filter((l) => l.quantity >= minQty);
  if (qualifying.length === 0) return [];

  if (pricingMode === "compare_at_price") {
    const results = [];
    for (const line of qualifying) {
      const variant = line.merchandise;
      const base = getBasePrice(variant, pricingMode);
      const selling = parseFloat(variant.price.amount);
      const discountAmt = base * (pct / 100);
      const effective = Math.min(discountAmt, selling);
      if (effective > 0) {
        results.push(
          makeFixedDiscount(
            [{ productVariant: { id: variant.id } }],
            (effective * line.quantity).toFixed(2),
            getCurrency(variant),
            config.message || `${pct}% off (min ${minQty})`
          )
        );
      }
    }
    return results;
  }

  return [
    makePercentageDiscount(
      lineTargets(qualifying),
      pct,
      config.message || `${pct}% off (min ${minQty})`
    ),
  ];
}
