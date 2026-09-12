import { AddStaffView } from "@/components/auth/add-staff-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewStaffPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add staff account</CardTitle>
          <CardDescription>Superadmin only. The new account gets a one-time temporary password.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddStaffView />
        </CardContent>
      </Card>
    </div>
  );
}
