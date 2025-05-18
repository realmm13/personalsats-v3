"use client";

import { useState } from "react";
import { UserX, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCurrentUser } from "@/context/AuthContext";
import { authClient } from "@/server/auth/client";

export function AdminStatus() {
  const user = useCurrentUser();
  const role = user?.role;
  const isAdmin = role === "admin";

  if (!user || !isAdmin) return null;

  return (
    <div className="flex items-center space-x-2">
      <Link href="/admin">
        <Shield className="h-5 w-5 text-yellow-600" />
      </Link>
    </div>
  );
}
