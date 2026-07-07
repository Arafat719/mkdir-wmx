import { useEffect } from "react";

export interface UseModalBehaviorOptions {
  isOpen: boolean;
  onClose: () => void;
  closeOnEsc?: boolean;
  lockScroll?: boolean;
}

export function useModalBehavior({
  isOpen,
  onClose,
  closeOnEsc = true,
  lockScroll = true,
}: UseModalBehaviorOptions) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (lockScroll) document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, closeOnEsc, lockScroll]);
}
