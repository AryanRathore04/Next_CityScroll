// Client-side helpers to normalize unhandled promise rejections and avoid raw Event objects
export function installClientErrorHandlers() {
  if (typeof window === "undefined") return;

  window.addEventListener("unhandledrejection", (ev) => {
    try {
      const reason = (ev && (ev as any).reason) || ev;
      // If it's an Event object, stringify a small summary
      if (reason instanceof Event) {
        console.error("Unhandled rejection (Event):", {
          type: reason.type,
          isTrusted: reason.isTrusted,
        });
      } else {
        console.error("Unhandled rejection:", reason);
      }
    } catch (e) {
      console.error("Unhandled rejection (failed to normalize):", e);
    }
  });
}
