import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "@/modules/auth/components/sign-in-form";

export default function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-[clamp(1rem,4vw,2rem)]">
      <Card className="w-full max-w-[24rem]">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </div>
  );
}
