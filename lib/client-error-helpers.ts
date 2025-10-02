/**
 * Client-side error handling utilities for React components
 * Prevents "[object Event]" and other unhelpful error messages
 */

/**
 * Safely extract an error message from any thrown value
 * Handles Error objects, strings, Event objects, and other edge cases
 *
 * @param error - The caught error (can be anything)
 * @returns A human-readable error message string
 *
 * @example
 * try {
 *   await someAsyncFunction();
 * } catch (error) {
 *   toast({ title: "Error", description: getErrorMessage(error) });
 * }
 */
export function getErrorMessage(error: unknown): string {
  // Handle Error objects (most common case)
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Handle Event objects (common mistake in form handlers)
  if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    "target" in error
  ) {
    console.warn(
      "[Error Handler] Caught an Event object instead of an Error. Check your error handling logic.",
      error,
    );
    return "An unexpected error occurred";
  }

  // Handle objects with a message property
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as any).message === "string"
  ) {
    return (error as any).message;
  }

  // Handle objects with an error property
  if (
    error &&
    typeof error === "object" &&
    "error" in error &&
    typeof (error as any).error === "string"
  ) {
    return (error as any).error;
  }

  // Try to stringify objects (fallback)
  if (error && typeof error === "object") {
    try {
      const json = JSON.stringify(error);
      if (json && json !== "{}" && json !== "null") {
        return json;
      }
    } catch {
      // JSON.stringify failed, continue to default
    }
  }

  // Last resort
  if (error != null) {
    const str = String(error);
    if (str && str !== "[object Object]") {
      return str;
    }
  }

  return "An unexpected error occurred";
}

/**
 * Safe wrapper for error logging that prevents Event objects from being logged
 *
 * @param message - Description of what failed
 * @param error - The error to log
 *
 * @example
 * try {
 *   await someFunction();
 * } catch (error) {
 *   logError("Failed to fetch data", error);
 * }
 */
export function logError(message: string, error: unknown): void {
  console.error(`[Error] ${message}:`, {
    message: getErrorMessage(error),
    type: error?.constructor?.name || typeof error,
    error:
      error instanceof Error
        ? error
        : error && typeof error === "object" && "type" in error
        ? "Event object"
        : error,
  });
}

/**
 * Type guard to check if an error is an Event object
 * Useful for preventing Event objects from being passed as errors
 *
 * @param value - The value to check
 * @returns true if the value is an Event object
 */
export function isEventObject(value: unknown): value is Event {
  return Boolean(
    value &&
      typeof value === "object" &&
      "type" in value &&
      "target" in value &&
      "currentTarget" in value,
  );
}

/**
 * Normalize any thrown value to an Error instance
 * Similar to the server-side normalizeError but for client-side use
 *
 * @param error - The caught error
 * @returns A proper Error object
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (isEventObject(error)) {
    console.warn(
      "[Error Handler] Event object caught as error. This is likely a bug in error handling.",
    );
    return new Error("An unexpected error occurred");
  }

  const message = getErrorMessage(error);
  return new Error(message);
}

/**
 * Install global error handlers to catch unhandled promise rejections and Event objects
 */
export function installClientErrorHandlers() {
  if (typeof window === "undefined") return;

  window.addEventListener("unhandledrejection", (ev) => {
    try {
      // Prevent default to stop the error from propagating
      ev.preventDefault();

      const reason = (ev && (ev as any).reason) || ev;

      // If it's an Event object, it's likely from PWA/service worker events
      // These are often harmless and expected, so we log them at debug level only
      if (isEventObject(reason)) {
        // Only log in development mode to reduce noise
        if (process.env.NODE_ENV === "development") {
          console.debug("[PWA Event] Unhandled event rejection:", {
            type: reason.type,
            isTrusted: reason.isTrusted,
          });
        }
        return; // Don't log as error
      }

      // For actual errors, log them properly
      if (reason) {
        logError("Unhandled promise rejection", reason);
      }
    } catch (e) {
      console.error("Unhandled rejection (failed to normalize):", e);
    }
  });

  // Also catch global errors
  window.addEventListener("error", (ev) => {
    try {
      if (isEventObject(ev.error)) {
        if (process.env.NODE_ENV === "development") {
          console.debug("[PWA Event] Error event:", {
            type: ev.type,
            message: ev.message,
          });
        }
        return;
      }

      if (ev.error) {
        logError("Uncaught error", ev.error);
      }
    } catch (e) {
      console.error("Failed to handle global error:", e);
    }
  });
}
