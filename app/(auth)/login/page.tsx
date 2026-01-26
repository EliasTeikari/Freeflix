import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md mx-auto h-96 skeleton rounded-lg" />}>
      <LoginForm />
    </Suspense>
  );
}
