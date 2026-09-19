import { AuthPage } from "@/components/auth/auth-page";
import { LoginView } from "@/components/auth/login-view";

export default function LoginPage() {
  return (
    <AuthPage title="Sign in" description="Staff accounts only. Ask the school office if you need access.">
      <LoginView />
    </AuthPage>
  );
}
