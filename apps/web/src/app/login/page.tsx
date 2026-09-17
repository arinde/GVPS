import { LoginView } from "@/components/auth/login-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Staff accounts only — ask your administrator if you need access.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginView />
        </CardContent>
      </Card>
    </div>
  );
}
