import { useState } from "react";
import { reactExtension, TextField, Select, BlockStack, Text, Section } from "@shopify/ui-extensions-react/admin";

export default reactExtension("admin.discount-details.function-settings.render", () => <App />);

function App() {
  const [pricingMode, setPricingMode] = useState("compare_at_price");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("10");
  const [message, setMessage] = useState("Special offer!");

  return (
    <Section heading="Compare At Price Discount Settings">
      <BlockStack gap="base">
        <Select
          label="Pricing Mode"
          name="pricing_mode"
          value={pricingMode}
          onChange={setPricingMode}
          options={[
            { label: "Compare-at Price", value: "compare_at_price" },
            { label: "Selling Price", value: "selling_price" }
          ]}
        />
        <Select
          label="Discount Type"
          name="discount_type"
          value={discountType}
          onChange={setDiscountType}
          options={[
            { label: "Percentage", value: "percentage" },
            { label: "Fixed Amount", value: "fixed" }
          ]}
        />
        <TextField
          label="Discount Value"
          name="discount_value"
          value={discountValue}
          onChange={setDiscountValue}
          type="number"
        />
        <TextField
          label="Discount Message"
          name="message"
          value={message}
          onChange={setMessage}
        />
        <Text>Products with a compare-at price will receive the configured discount.</Text>
      </BlockStack>
    </Section>
  );
}
