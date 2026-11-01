import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/account/PasswordForms";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a secure password reset link for your Al-Haq Farms account.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="px-4 pb-20 pt-4">
      <ForgotPasswordForm />
    </main>
  );
}
