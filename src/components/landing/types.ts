/**
 * Type definitions for Landing Page components
 */

export interface Feature {
  icon: string; // Icon identifier or name (e.g., "brain", "chart-bar", "code")
  title: string; // Feature name (e.g., "AI-Generated Topics")
  description: string; // Brief description of the feature (2-3 sentences)
}

export interface ProcessStepData {
  number: number; // Step number (1, 2, 3)
  title: string; // Step name (e.g., "Create Profile")
  description: string; // Step explanation
}

export interface FooterLink {
  label: string; // Link text
  href: string; // Link destination
  external?: boolean; // Whether link opens in new tab
}
