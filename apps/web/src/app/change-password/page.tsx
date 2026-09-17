import { ChangePasswordView } from "@/components/auth/change-password-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChangePasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Change your password</CardTitle>
          <CardDescription>Required before continuing — this is your first login.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordView />
        </CardContent>
      </Card>
    </div>
  );
}
