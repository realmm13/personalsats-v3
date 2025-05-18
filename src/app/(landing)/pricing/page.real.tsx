import { type Metadata } from "next";
import { APP_NAME } from "@/config/config";
import PricingPageClient from "./PricingPageClient";

export const metadata: Metadata = {
  title: `Pricing - ${APP_NAME}`,
  description: "Choose the plan that's right for you.",
};

export default function PricingPage() {
  return <PricingPageClient />;
}
