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
