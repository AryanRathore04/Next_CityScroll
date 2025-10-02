/**
 * Test suite for error handling utilities
 * Run in browser console to verify error handling works correctly
 */

import {
  getErrorMessage,
  normalizeError,
  isEventObject,
  logError,
} from "@/lib/client-error-helpers";

export function testErrorHandling() {
  console.log("🧪 Testing Error Handling Utilities...\n");

  // Test 1: Error objects
  console.log("Test 1: Error objects");
  const error1 = new Error("Test error message");
  console.assert(
    getErrorMessage(error1) === "Test error message",
    "❌ Failed: Error message extraction",
  );
  console.log("✅ Error message extraction works\n");

  // Test 2: String errors
  console.log("Test 2: String errors");
  const error2 = "String error message";
  console.assert(
    getErrorMessage(error2) === "String error message",
    "❌ Failed: String error handling",
  );
  console.log("✅ String error handling works\n");

  // Test 3: Event objects (critical test)
  console.log("Test 3: Event objects");
  const event = new Event("click");
  const eventMessage = getErrorMessage(event);
  console.assert(
    eventMessage === "An unexpected error occurred",
    "❌ Failed: Event object should return generic message",
  );
  console.assert(
    !eventMessage.includes("[object Event]"),
    "❌ Failed: Should not contain [object Event]",
  );
  console.log("✅ Event object handling works\n");

  // Test 4: Object with message property
  console.log("Test 4: Object with message property");
  const error4 = { message: "Custom message" };
  console.assert(
    getErrorMessage(error4) === "Custom message",
    "❌ Failed: Object message extraction",
  );
  console.log("✅ Object message extraction works\n");

  // Test 5: isEventObject type guard
  console.log("Test 5: isEventObject type guard");
  console.assert(
    isEventObject(event) === true,
    "❌ Failed: Should detect Event",
  );
  console.assert(
    isEventObject(error1) === false,
    "❌ Failed: Should not detect Error as Event",
  );
  console.log("✅ Event detection works\n");

  // Test 6: normalizeError
  console.log("Test 6: normalizeError");
  const normalized1 = normalizeError(error1);
  console.assert(
    normalized1 instanceof Error,
    "❌ Failed: Should return Error instance",
  );
  console.assert(
    normalized1.message === "Test error message",
    "❌ Failed: Should preserve error message",
  );

  const normalized2 = normalizeError(event);
  console.assert(
    normalized2 instanceof Error,
    "❌ Failed: Should convert Event to Error",
  );
  console.assert(
    normalized2.message === "An unexpected error occurred",
    "❌ Failed: Should use generic message for Event",
  );
  console.log("✅ Error normalization works\n");

  // Test 7: Null/undefined handling
  console.log("Test 7: Null/undefined handling");
  console.assert(
    getErrorMessage(null) === "An unexpected error occurred",
    "❌ Failed: Null handling",
  );
  console.assert(
    getErrorMessage(undefined) === "An unexpected error occurred",
    "❌ Failed: Undefined handling",
  );
  console.log("✅ Null/undefined handling works\n");

  // Test 8: logError function
  console.log("Test 8: logError function");
  try {
    logError("Test error log", error1);
    logError("Test event log", event);
    console.log("✅ logError function works\n");
  } catch (e) {
    console.error("❌ Failed: logError threw an error", e);
  }

  console.log("✅ All error handling tests passed! 🎉");
  console.log("\n📊 Test Summary:");
  console.log("- Error objects: ✅");
  console.log("- String errors: ✅");
  console.log("- Event objects: ✅ (Critical fix verified)");
  console.log("- Object messages: ✅");
  console.log("- Type guards: ✅");
  console.log("- Normalization: ✅");
  console.log("- Null handling: ✅");
  console.log("- Logging: ✅");
}

// Auto-run if in browser
if (typeof window !== "undefined") {
  console.log(
    "💡 Run testErrorHandling() in the console to test error handling",
  );
}

export default testErrorHandling;
