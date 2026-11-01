import type { Metadata } from "next";
import { SignUpForm } from "@/components/account/SignUpForm";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create an Al-Haq Farms account to manage your profile and delivery details.",
};

export default function SignUpPage() {
  return (
    <main className="px-4 pb-20 pt-4">
      <SignUpForm />
    </main>
  );
}
