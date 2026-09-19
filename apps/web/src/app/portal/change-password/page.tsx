import { AuthPage } from "@/components/auth/auth-page";
import { PortalChangePasswordView } from "@/components/portal/portal-change-password-view";

export default function PortalChangePasswordPage() {
  return (
    <AuthPage
      title="Set your password"
      description="The password on your slip was temporary. Choose your own to continue."
    >
      <PortalChangePasswordView />
    </AuthPage>
  );
}
