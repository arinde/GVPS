import Link from "next/link";
import { AuthPage } from "@/components/auth/auth-page";
import { PortalLoginView } from "@/components/portal/portal-login-view";

export default function PortalLoginPage() {
  return (
    <AuthPage
      title="Family portal"
      description="For parents and guardians. Use the phone number the school has for you and the password on your slip."
      footer={
        <>
          School staff?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Staff sign-in
          </Link>
        </>
      }
    >
      <PortalLoginView />
    </AuthPage>
  );
}
