import type { Metadata } from "next";
import { PolicyPage } from "@/components/ui/PolicyPage";

export const metadata: Metadata = {
  title: "Delivery Policy",
  description: "How delivery and store pickup work for online orders.",
};

export default function DeliveryPage() {
  return (
    <main className="pt-4">
      <PolicyPage
        eyebrow="Policy"
        title="Delivery Policy"
        intro="How your order reaches you, what it costs, and when to expect it."
        sections={[
          {
            heading: "Delivery options",
            body: [
              "Home delivery: we deliver to the addresses we serve within our delivery areas. Enter your address at checkout and we will confirm the coverage before dispatch.",
              "Store pickup: collect from the branch you selected at no delivery charge.",
            ],
          },
          {
            heading: "Delivery charges",
            body: [
              "Delivery charges are calculated from the branch fulfilling your order and are shown clearly at checkout before you confirm.",
              "Store pickup always has no delivery charge.",
            ],
          },
          {
            heading: "Timing",
            body: [
              "Fresh items are cut and packed close to dispatch, so same-day delivery is available where our routes allow. Orders placed outside delivery hours are delivered on the next available route.",
              "We will contact you on the phone number you provide if a route change affects your order.",
            ],
          },
          {
            heading: "Cash on delivery",
            body: [
              "Cash on delivery is available for home delivery. Please have the exact amount ready for the rider where possible.",
            ],
          },
        ]}
        note="Draft copy for owner review. Final service areas, timing and charges are set in the admin app."
      />
    </main>
  );
}
