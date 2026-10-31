import type { Metadata } from "next";
import { PolicyPage } from "@/components/ui/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What we collect when you order online, and how we use it.",
};

export default function PrivacyPage() {
  return (
    <main className="pt-4">
      <PolicyPage
        eyebrow="Policy"
        title="Privacy Policy"
        intro="We collect only what we need to prepare and deliver your order."
        sections={[
          {
            heading: "What we collect",
            body: [
              "When you place an order we collect your name, contact number, delivery address and the items you ordered. If you choose an online transfer we also record the payment details you provide so we can verify it.",
            ],
          },
          {
            heading: "How we use it",
            body: [
              "Your details are used to confirm, prepare and deliver your order, and to contact you about it. We do not sell your information.",
              "Order records are kept so you can track your order and so we can handle any problem with it later.",
            ],
          },
          {
            heading: "Payments",
            body: [
              "Payments made by EasyPaisa, JazzCash or cash on delivery are handled by us directly. We never ask for your account PIN, OTP or card details.",
            ],
          },
          {
            heading: "Your choices",
            body: [
              "You can ask us to correct or remove your contact details at any time by calling or messaging the numbers on our contact page.",
            ],
          },
        ]}
        note="Draft copy for owner review. Ask your legal advisor before publishing."
      />
    </main>
  );
}
