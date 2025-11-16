/**
 * TopicsContext
 * Provides topic actions to all descendant components
 * Avoids prop drilling for common operations
 */

import React, { createContext, useContext } from "react";
import type { TopicsContextValue } from "./types";

const TopicsContext = createContext<TopicsContextValue | null>(null);

interface TopicsProviderProps {
  readonly value: TopicsContextValue;
  readonly children: React.ReactNode;
}

export function TopicsProvider({ value, children }: TopicsProviderProps) {
  return <TopicsContext.Provider value={value}>{children}</TopicsContext.Provider>;
}

export function useTopicsContext() {
  const context = useContext(TopicsContext);
  if (!context) {
    throw new Error("useTopicsContext must be used within TopicsProvider");
  }
  return context;
}

