"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authClient } from "@/server/auth/client";

// Type for the session data
// You may want to refine this type based on your actual session shape
export type Session = NonNullable<ReturnType<typeof authClient.useSession>>["data"] | null;

const AuthContext = createContext<Session>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const sessionQuery = authClient.useSession?.() ?? {};
  const [session, setSession] = useState<Session>(null);

  useEffect(() => {
    if (sessionQuery.data) setSession(sessionQuery.data);
    if (sessionQuery.error) setSession(null);
  }, [sessionQuery.data, sessionQuery.error]);

  return (
    <AuthContext.Provider value={session}>
      {children}
    </AuthContext.Provider>
  );
}

export function useCurrentUser() {
  const session = useContext(AuthContext);
  return session?.user ?? null;
} 