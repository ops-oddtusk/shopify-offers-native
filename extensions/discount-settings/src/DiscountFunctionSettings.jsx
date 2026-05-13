import { useState, useEffect } from "react";
import {
  reactExtension,
  useApi,
  TextField,
  Select,
  BlockStack,
  Text,
  Section,
  Divider,
  InlineStack,
  Badge,
} from "@shopify/ui-extensions-react/admin";

export default reactExtension(
  "admin.discount-details.function-settings.render",
  () => <App />
);

var OFFER_TYPES = [
  { label: "Percentage Off (Compare-at)", value: "percentage_off" },
  { label: "Fixed Amount Off (Compare-at)", value: "fixed_amount_off" },
  { label: "Buy 1 Get 1 Free", value: "bogo_free" },
  { label: "Buy 1 Get 1 Discounted", value: "bogo_discounted" },
  { label: "Buy X Get Y Free", value: "buy_x_get_y_free" },
  { label: "Buy X Get Y Discounted", value: "buy_x_get_y_discounted" },
  { label: "Volume Discount (Qty Threshold)", value: "volume_discount" },
  { label: "Tiered Pricing (Multiple Tiers)", value: "tiered_pricing" },
  { label: "Spend & Save", value: "spend_and_save" },
  { label: "2nd Item Discount", value: "second_item_discount" },
  { label: "Bundle Discount", value: "bundle_discount" },
  { label: "Cart Minimum Discount", value: "cart_minimum_discount" },
];

function App() {
  var [offerType, setOfferType] = useState("percentage_off");
  var [pricingMode, setPricingMode] = useState("compare_at_price");
  var [discountValue, setDiscountValue] = useState("10");
  var [message, setMessage] = useState("");

  // BOGO Discounted
  var [bogoDiscountPercent, setBogoDiscountPercent] = useState("50");

  // Buy X Get Y
  var [buyQuantity, setBuyQuantity] = useState("2");
  var [getQuantity, setGetQuantity] = useState("1");
  var [getDiscountPercent, setGetDiscountPercent] = useState("50");

  // Volume
  var [minQuantity, setMinQuantity] = useState("3");

  // Tiered - 3 tiers
  var [tier1Qty, setTier1Qty] = useState("2");
  var [tier1Pct, setTier1Pct] = useState("5");
  var [tier2Qty, setTier2Qty] = useState("5");
  var [tier2Pct, setTier2Pct] = useState("10");
  var [tier3Qty, setTier3Qty] = useState("10");
  var [tier3Pct, setTier3Pct] = useState("15");

  // Spend & Save
  var [minSpend, setMinSpend] = useState("100");

  // Second item
  var [secondItemPercent, setSecondItemPercent] = useState("50");

  // Bundle
  var [minBundleItems, setMinBundleItems] = useState("2");

  // Cart minimum
  var [minCartTotal, setMinCartTotal] = useState("200");

  return (
    <Section heading="Offer Configuration">
      <BlockStack gap="base">
        <Select
          label="Offer Type"
          name="offer_type"
          value={offerType}
          onChange={setOfferType}
          options={OFFER_TYPES}
        />

        <Select
          label="Pricing Mode"
          name="pricing_mode"
          value={pricingMode}
          onChange={setPricingMode}
          options={[
            { label: "Compare-at Price", value: "compare_at_price" },
            { label: "Selling Price", value: "selling_price" },
          ]}
        />

        <Divider />

        {/* Percentage Off / Fixed Amount Off / Volume / Spend&Save / Bundle / Cart Min */}
        {(offerType === "percentage_off" ||
          offerType === "fixed_amount_off" ||
          offerType === "volume_discount" ||
          offerType === "spend_and_save" ||
          offerType === "bundle_discount" ||
          offerType === "cart_minimum_discount") && (
          <TextField
            label={
              offerType === "percentage_off" || offerType === "volume_discount" || offerType === "spend_and_save" || offerType === "bundle_discount" || offerType === "cart_minimum_discount"
                ? "Discount Percentage (%)"
                : "Discount Amount ($)"
            }
            name="discount_value"
            value={discountValue}
            onChange={setDiscountValue}
            type="number"
          />
        )}

        {/* BOGO Discounted */}
        {offerType === "bogo_discounted" && (
          <TextField
            label="Discount on 2nd Item (%)"
            name="bogo_discount_percent"
            value={bogoDiscountPercent}
            onChange={setBogoDiscountPercent}
            type="number"
          />
        )}

        {/* Buy X Get Y fields */}
        {(offerType === "buy_x_get_y_free" ||
          offerType === "buy_x_get_y_discounted") && (
          <BlockStack gap="base">
            <TextField
              label="Buy Quantity"
              name="buy_quantity"
              value={buyQuantity}
              onChange={setBuyQuantity}
              type="number"
            />
            <TextField
              label="Get Quantity"
              name="get_quantity"
              value={getQuantity}
              onChange={setGetQuantity}
              type="number"
            />
            {offerType === "buy_x_get_y_discounted" && (
              <TextField
                label="Discount on Free Items (%)"
                name="get_discount_percent"
                value={getDiscountPercent}
                onChange={setGetDiscountPercent}
                type="number"
              />
            )}
          </BlockStack>
        )}

        {/* Volume discount min qty */}
        {offerType === "volume_discount" && (
          <TextField
            label="Minimum Quantity"
            name="min_quantity"
            value={minQuantity}
            onChange={setMinQuantity}
            type="number"
          />
        )}

        {/* Tiered pricing */}
        {offerType === "tiered_pricing" && (
          <BlockStack gap="base">
            <Text appearance="subdued">Tier 1</Text>
            <InlineStack gap="base">
              <TextField label="Min Qty" name="tier1_qty" value={tier1Qty} onChange={setTier1Qty} type="number" />
              <TextField label="Discount %" name="tier1_pct" value={tier1Pct} onChange={setTier1Pct} type="number" />
            </InlineStack>
            <Text appearance="subdued">Tier 2</Text>
            <InlineStack gap="base">
              <TextField label="Min Qty" name="tier2_qty" value={tier2Qty} onChange={setTier2Qty} type="number" />
              <TextField label="Discount %" name="tier2_pct" value={tier2Pct} onChange={setTier2Pct} type="number" />
            </InlineStack>
            <Text appearance="subdued">Tier 3</Text>
            <InlineStack gap="base">
              <TextField label="Min Qty" name="tier3_qty" value={tier3Qty} onChange={setTier3Qty} type="number" />
              <TextField label="Discount %" name="tier3_pct" value={tier3Pct} onChange={setTier3Pct} type="number" />
            </InlineStack>
          </BlockStack>
        )}

        {/* Spend & Save min spend */}
        {offerType === "spend_and_save" && (
          <TextField
            label="Minimum Spend ($)"
            name="min_spend"
            value={minSpend}
            onChange={setMinSpend}
            type="number"
          />
        )}

        {/* Second item discount */}
        {offerType === "second_item_discount" && (
          <TextField
            label="2nd Item Discount (%)"
            name="second_item_percent"
            value={secondItemPercent}
            onChange={setSecondItemPercent}
            type="number"
          />
        )}

        {/* Bundle min items */}
        {offerType === "bundle_discount" && (
          <TextField
            label="Min Items in Bundle"
            name="min_bundle_items"
            value={minBundleItems}
            onChange={setMinBundleItems}
            type="number"
          />
        )}

        {/* Cart minimum */}
        {offerType === "cart_minimum_discount" && (
          <TextField
            label="Minimum Cart Total ($)"
            name="min_cart_total"
            value={minCartTotal}
            onChange={setMinCartTotal}
            type="number"
          />
        )}

        <Divider />

        <TextField
          label="Discount Message (shown to customer)"
          name="message"
          value={message}
          onChange={setMessage}
        />

        <Text appearance="subdued">
          All offers use the compare-at price as the baseline for calculating discounts.
          Products without a compare-at price use the selling price instead.
        </Text>
      </BlockStack>
    </Section>
  );
}
