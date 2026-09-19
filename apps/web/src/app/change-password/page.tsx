import { AuthPage } from "@/components/auth/auth-page";
import { ChangePasswordView } from "@/components/auth/change-password-view";

export default function ChangePasswordPage() {
  return (
    <AuthPage
      title="Set your password"
      description="The password you signed in with was temporary. Choose your own to continue."
    >
      <ChangePasswordView />
    </AuthPage>
  );
}
