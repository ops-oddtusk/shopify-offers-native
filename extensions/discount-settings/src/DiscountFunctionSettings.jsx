import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState } from "preact/hooks";

export default async function main(root) {
  render(<App />, document.body);
}

function App() {
  const [pricingMode, setPricingMode] = useState("compare_at_price");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("10");
  const [message, setMessage] = useState("Special offer!");

  return (
    <s-section heading="Compare At Price Discount Settings">
      <s-stack gap="base">
        <s-select
          label="Pricing Mode"
          name="pricing_mode"
          value={pricingMode}
          onChange={(e) => setPricingMode(e.currentTarget.value)}
        >
          <s-option value="compare_at_price">Compare-at Price</s-option>
          <s-option value="selling_price">Selling Price</s-option>
        </s-select>

        <s-select
          label="Discount Type"
          name="discount_type"
          value={discountType}
          onChange={(e) => setDiscountType(e.currentTarget.value)}
        >
          <s-option value="percentage">Percentage</s-option>
          <s-option value="fixed">Fixed Amount</s-option>
        </s-select>

        <s-number-field
          label="Discount Value"
          name="discount_value"
          value={discountValue}
          min={0}
          max={100}
          onChange={(e) => setDiscountValue(e.currentTarget.value)}
        />

        <s-text-field
          label="Discount Message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
        />

        <s-text variant="bodyMd">
          This discount uses the compare-at price to calculate savings.
          Products with a compare-at price will receive the configured discount.
        </s-text>
      </s-stack>
    </s-section>
  );
}
