import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CTAButtonVariant } from "@/types/ui/landing";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
type ButtonSize = VariantProps<typeof buttonVariants>["size"];

const CTA_TO_BUTTON: Record<CTAButtonVariant, ButtonVariant> = {
  primary: "default",
  secondary: "secondary",
  ghost: "ghost",
};

export function getCtaButtonClasses(
  variant: CTAButtonVariant,
  size: ButtonSize = "default",
  className?: string
): string {
  return cn(buttonVariants({ variant: CTA_TO_BUTTON[variant], size }), className);
}
