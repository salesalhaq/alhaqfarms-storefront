import type { Metadata } from "next";
import { PolicyPage } from "@/components/ui/PolicyPage";

export const metadata: Metadata = {
  title: "Return Policy",
  description: "What to do if something is wrong with a fresh order.",
};

export default function ReturnsPage() {
  return (
    <main className="pt-4">
      <PolicyPage
        eyebrow="Policy"
        title="Return Policy"
        intro="Fresh produce cannot be resold, so we handle problems by replacing or refunding rather than taking items back."
        sections={[
          {
            heading: "Quality guarantee",
            body: [
              "Every order is checked before dispatch. If an item arrives damaged, spoiled or is not what you ordered, tell us the same day and we will make it right.",
            ],
          },
          {
            heading: "Reporting a problem",
            body: [
              "Call or message us on the number on your order and tell us the order number and which item is affected. A photo helps us resolve it faster.",
            ],
          },
          {
            heading: "Replacements and refunds",
            body: [
              "Where stock allows we will replace the affected item on our next delivery route. Otherwise we will refund that item.",
              "Refunds for online transfers are returned to the account used to pay. Cash on delivery orders are refunded in cash.",
            ],
          },
        ]}
        note="Draft copy for owner review."
      />
    </main>
  );
}
