import { useCallback, useEffect, useRef, useState } from "react";

interface UseMobileMenuResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useMobileMenu(): UseMobileMenuResult {
  const [isOpen, setIsOpen] = useState(false);
  const previousOverflow = useRef<string>("");

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const { body } = document;
    if (!body) {
      return;
    }

    if (isOpen) {
      previousOverflow.current = body.style.overflow;
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = previousOverflow.current || "";
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (typeof document === "undefined") {
        return;
      }
      document.body.style.overflow = previousOverflow.current || "";
    };
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
