"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { extractErrorMessage } from "@/lib/extract-error-message";
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
      router.push(result.mustChangePassword ? "/change-password" : "/");
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, "Invalid email or password."));
    }
  }

  return (
    <LoginForm
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      errorMessage={errorMessage}
    />
  );
}
