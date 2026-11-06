"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "../actions";

/** Tombol keluar (server action signOut). */

function SubmitButton({ compact }: { compact?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={compact ? "ghost" : "outline"}
      size={compact ? "sm" : "default"}
      disabled={pending}
      className={compact ? "gap-1 px-2" : "w-full"}
    >
      <LogOut className="h-4 w-4" aria-hidden />
      {pending ? "Keluar..." : compact ? null : "Keluar dari Akun"}
    </Button>
  );
}

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={logoutAction}>
      <SubmitButton compact={compact} />
    </form>
  );
}
