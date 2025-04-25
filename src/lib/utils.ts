import { clsx, type ClassValue } from "clsx";
import { PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { LucideIcon } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ReactFC<T> = React.FC<PropsWithChildren & T>;

export function formatDate(date: Date | string | number): string {
  return format(new Date(date), "MMMM d, yyyy");
}

export type Size = "xs" | "sm" | "md" | "lg" | "xl";

export interface SelectOption {
  value: string;
  label?: string;
  emoji?: string;
  icon?: LucideIcon;
  closeOnClick?: boolean;
}

export const processColor = (c: string | undefined): string | undefined => {
  if (!c) return undefined;
  return c.startsWith("bg-") ? c.substring(3) : c;
};
