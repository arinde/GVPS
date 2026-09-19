"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { PORTAL_ROUTES } from "@/lib/auth-redirect";
import { notify } from "@/lib/notify";
import { usePortalLoginMutation } from "@/store/api/portal-api";

/**
 * Family-portal sign-in: the phone number the school holds for the parent,
 * and the password from the school's slip. The same form as staff sign-in,
 * asking for a phone number instead of an email.
 */
export function PortalLoginView() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [login, { isLoading }] = usePortalLoginMutation();
  const router = useRouter();

  async function handleSubmit() {
    setErrorMessage(undefined);
    try {
      // The session itself is stored by the portal-auth slice as this resolves.
      const result = await login({ phone, password }).unwrap();
      if (result.mustChangePassword) {
        notify.info("Set your own password to continue", { description: "The one on the slip was temporary." });
        router.push(PORTAL_ROUTES.changePassword);
      } else {
        notify.success("Signed in");
        router.push(PORTAL_ROUTES.home);
      }
    } catch (error) {
      setErrorMessage(notify.error(error, "That phone number and password do not match.").message);
    }
  }

  return (
    <LoginForm
      identifier={phone}
      password={password}
      onIdentifierChange={setPhone}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      errorMessage={errorMessage}
      identifierLabel="Phone number"
      identifierType="tel"
      identifierHint="The number the school has for you, e.g. 0801 234 5678"
    />
  );
}
