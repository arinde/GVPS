import Link from "next/link";
import { AuthPage } from "@/components/auth/auth-page";
import { LoginView } from "@/components/auth/login-view";

export default function LoginPage() {
  return (
    <AuthPage
      title="Sign in"
      description="Staff accounts only. Ask the school office if you need access."
      footer={
        <>
          Parent or guardian?{" "}
          <Link href="/portal/login" className="text-primary font-medium hover:underline">
            Go to the family portal
          </Link>
        </>
      }
    >
      <LoginView />
    </AuthPage>
  );
}
