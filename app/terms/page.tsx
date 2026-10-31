import type { Metadata } from "next";
import { PolicyPage } from "@/components/ui/PolicyPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you order from this storefront.",
};

export default function TermsPage() {
  return (
    <main className="pt-4">
      <PolicyPage
        eyebrow="Policy"
        title="Terms of Service"
        intro="The basics of ordering from this storefront."
        sections={[
          {
            heading: "Orders",
            body: [
              "An order is a request to buy. It becomes confirmed once we accept it and contact you. If an item is unavailable we will offer a substitute or remove it from the order.",
            ],
          },
          {
            heading: "Prices and weights",
            body: [
              "Prices are shown in Pakistani Rupees. Items sold by weight are packed to your requested quantity, so the final amount can differ slightly from the estimate if exact weights vary.",
              "We may change prices and availability without notice; the price shown when you confirm your order applies to that order.",
            ],
          },
          {
            heading: "Payments",
            body: [
              "We accept cash on delivery, EasyPaisa and JazzCash transfers, and payment at the store. Transfers are confirmed once verified against the account shown.",
            ],
          },
          {
            heading: "Use of this site",
            body: [
              "Please provide accurate contact and delivery details. We are not responsible for failed deliveries caused by incorrect information.",
            ],
          },
        ]}
        note="Draft copy for owner review. Ask your legal advisor before publishing."
      />
    </main>
  );
}
