import type { Metadata } from "next";
import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";

export const metadata: Metadata = { title: "Tu primer plan" };

export default function Page() {
  return <OnboardingFlow />;
}
