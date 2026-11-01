import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/account/PasswordForms";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your Al-Haq Farms account.",
};

export default function ResetPasswordPage() {
  return (
    <main className="px-4 pb-20 pt-4">
      <ResetPasswordForm />
    </main>
  );
}
