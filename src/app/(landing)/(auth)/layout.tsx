"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCurrentUser } from "@/context/AuthContext";
import ClientLandingFooter from "../ClientLandingFooter";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user]);

  return (
    <html>
      <body>
        <ClientLandingFooter />
        <div className="container flex h-[calc(100vh-var(--header-height))] w-full items-center justify-center">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </body>
    </html>
  );
}
