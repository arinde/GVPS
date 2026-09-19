"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { notify } from "@/lib/notify";
import { useLoginMutation } from "@/store/api/auth-api";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/auth-slice";

/** Container: wires the login mutation and session state to LoginForm (AGENTS.md §1). */
export function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();

  async function handleSubmit() {
    setErrorMessage(undefined);
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials(result));
      if (result.mustChangePassword) {
        notify.info("Set your own password to continue", {
          description: "The one you signed in with was temporary.",
        });
        router.push("/change-password");
      } else {
        notify.success("Signed in");
        router.push("/dashboard");
      }
    } catch (error) {
      setErrorMessage(notify.error(error, "Invalid email or password.").message);
    }
  }

  return (
    <LoginForm
      identifier={email}
      password={password}
      onIdentifierChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      errorMessage={errorMessage}
    />
  );
}
