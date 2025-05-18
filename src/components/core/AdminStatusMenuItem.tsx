import { Shield } from "lucide-react";
import { CommonMenuItem } from "@/components/CommonMenuItem";
import { useCurrentUser } from "@/context/AuthContext";

export function AdminStatusMenuItem() {
  const user = useCurrentUser();
  const isAdmin = user?.role === "admin";

  if (!isAdmin) return null;

  return (
    <CommonMenuItem href="/admin" leftIcon={Shield}>
      Admin Dashboard
    </CommonMenuItem>
  );
}
