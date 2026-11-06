import type { Preferences } from "@/lib/domain/types";

export interface StepProps {
  value: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
}
