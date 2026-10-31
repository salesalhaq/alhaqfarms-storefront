"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

/** Glass toast used for lightweight, non-blocking feedback. */
export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4"
    >
      <AnimatePresence onExitComplete={onDismiss}>
        {message ? (
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="glass pointer-events-auto max-w-sm px-5 py-3 text-center text-sm text-ink"
          >
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
