import { StudentRegistrationView } from "@/components/students/student-registration-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterStudentPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Register student</CardTitle>
          <CardDescription>
            The admission number is allocated automatically on save. Photographs are captured in a second pass and are
            not needed now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentRegistrationView />
        </CardContent>
      </Card>
    </div>
  );
}
