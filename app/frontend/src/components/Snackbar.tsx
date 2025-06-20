/**
 * Snackbar Component
 * 
 * This component displays temporary notifications to users, commonly known as "toasts".
 * It appears at the bottom of the screen and automatically dismisses after a configurable duration.
 * 
 * Key features:
 * - Configurable display duration
 * - Smooth fade in/out transitions
 * - Accessibility support with aria-live
 * - Non-blocking UI (pointer-events-none)
 * - Customizable close callback
 * - Support for different types (success, error)
 * - Custom className support for styling
 * 
 * Used throughout the application to provide non-intrusive feedback to users,
 * such as confirming form submissions or notifying of background operations.
 */

import React from "react";
import { SOCKET_EVENTS } from '@shared/types/socket/events';

interface SnackbarProps {
  open: boolean;
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
  duration?: number; // in ms
  className?: string; // Add support for custom className
}

const Snackbar: React.FC<SnackbarProps> = ({
  open,
  message,
  type = "success",
  onClose,
  duration = 2000,
  className = "" // Default to empty string
}) => {
  React.useEffect(() => {
    if (open && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
    // Return empty cleanup function for consistency
    return () => { };
  }, [open, onClose, duration]);

  // Determine background color based on type
  const bgColorClass = type === "error"
    ? "bg-red-600"
    : "bg-[color:var(--navbar)]";

  return (
    <div
      className={`fixed bottom-5 right-6 z-50 transition-all pointer-events-none ${open ? 'opacity-100' : 'opacity-0'} ${className}`}
      aria-live="polite"
    >
      <div className={`${bgColorClass} text-white px-4 py-2 rounded shadow-lg flex items-center gap-2`}>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Snackbar;
