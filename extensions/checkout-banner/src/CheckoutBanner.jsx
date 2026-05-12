import {
  Banner,
  useSettings,
  useCartLines,
  useTotalAmount,
} from "@shopify/ui-extensions-react/checkout";

/**
 * Checkout Banner Extension
 *
 * Shows a confirmation banner at checkout when an offer/bundle discount
 * has been applied. Reinforces the value right before payment.
 *
 * Examples:
 *  - "Bundle discount applied — you're saving ₹300!"
 *  - "BOGO deal active — your free item is included!"
 *  - "You unlocked free shipping!"
 */
export default function CheckoutBanner() {
  const settings = useSettings();
  const cartLines = useCartLines();
  const totalAmount = useTotalAmount();

  const bannerTitle = settings.banner_title || "Offer Applied!";
  const bannerMessage = settings.banner_message || "Your discount has been applied to this order.";
  const bannerStatus = settings.banner_status || "success";
  const minCartValue = parseFloat(settings.min_cart_value || "0");

  // Only show if cart meets minimum value (if configured)
  if (minCartValue > 0 && totalAmount.amount < minCartValue) {
    return null;
  }

  // Check if any discount lines exist
  const hasDiscounts = cartLines.some(
    (line) => line.discountAllocations && line.discountAllocations.length > 0
  );

  // Show banner if there are discounts OR if configured to always show
  const alwaysShow = settings.always_show === "true";
  if (!hasDiscounts && !alwaysShow) {
    return null;
  }

  // Calculate total savings
  let totalSavings = 0;
  cartLines.forEach((line) => {
    if (line.discountAllocations) {
      line.discountAllocations.forEach((alloc) => {
        totalSavings += parseFloat(alloc.amount?.amount || 0);
      });
    }
  });

  // Replace template variables in message
  const formattedMessage = bannerMessage
    .replace("{{savings}}", totalSavings.toFixed(2))
    .replace("{{total}}", totalAmount.amount.toFixed(2))
    .replace("{{items}}", String(cartLines.length));

  return (
    <Banner status={bannerStatus} title={bannerTitle}>
      {formattedMessage}
    </Banner>
  );
}
