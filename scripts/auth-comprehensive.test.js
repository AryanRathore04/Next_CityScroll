/**
 * COMPREHENSIVE AUTHENTICATION TEST SUITE
 *
 * This test suite covers all authentication, registration, and validation scenarios
 * for the Next.js + MongoDB CityScroll application.
 *
 * Features:
 * - 25 comprehensive test cases covering success and failure scenarios
 * - Tests match exact API responses and validation rules from the codebase
 * - Handles rate limiting with delays between tests
 * - Includes proper MongoDB cleanup and cookie management
 * - Uses native fetch (Node.js 18+) for better compatibility
 *
 * Usage: npm run test:auth
 * Note: Ensure the dev server is running (npm run dev) before running tests
 */

// Use native fetch in Node.js 18+
const fs = require("fs");
const assert = require("assert").strict;
const path = require("path");
const mongoose = require("mongoose");

// Helper to avoid rate limiting (10 requests per minute limit)
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const BASE = process.env.BASE_URL || "http://localhost:3000";
const TEST_DB = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;
const jarPath = path.resolve(__dirname, "test-cookie-jar.txt");

// Cookie management helpers
function saveCookies(setCookieHeader) {
  fs.writeFileSync(jarPath, JSON.stringify({ cookie: setCookieHeader || "" }));
}

function loadCookies() {
  if (!fs.existsSync(jarPath)) return "";
  const s = fs.readFileSync(jarPath, "utf8");
  try {
    const parsed = JSON.parse(s);
    return parsed.cookie || "";
  } catch (e) {
    return "";
  }
}

function clearCookies() {
  if (fs.existsSync(jarPath)) {
    fs.unlinkSync(jarPath);
  }
}

// HTTP request helper
async function postJson(pathname, body, sendCookie = false) {
  const headers = { "Content-Type": "application/json" };
  const cookie = sendCookie ? loadCookies() : "";
  if (cookie) headers["Cookie"] = cookie;

  const res = await fetch(BASE + pathname, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {}),
  });

  const text = await res.text();
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) saveCookies(setCookie);

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }

  return { status: res.status, body: json, setCookie };
}

// Test data generators
function generateTestEmail() {
  return `test${Date.now()}${Math.random()
    .toString(36)
    .substr(2, 9)}@example.com`;
}

function generateValidPassword() {
  return "TestPass123!@#";
}

function generateWeakPassword() {
  return "weak123";
}

// Database cleanup helper
async function cleanupTestUser(email) {
  try {
    if (!TEST_DB) {
      console.warn("Cleanup skipped: No database URI configured");
      return;
    }
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(TEST_DB);
    }
    const User = mongoose.models.User || require("../models/User").default;
    await User.deleteOne({ email: email.toLowerCase() });
  } catch (error) {
    console.warn("Cleanup warning:", error.message);
  }
}

// Test suite runner
async function runTests() {
  console.log("🚀 Starting Comprehensive Authentication Tests");
  console.log("=".repeat(60));

  let testCount = 0;
  let passCount = 0;

  const test = async (name, testFn) => {
    testCount++;
    try {
      console.log(`\n${testCount}. ${name}`);
      await testFn();
      console.log("   ✅ PASSED");
      passCount++;
      // Longer delay to avoid rate limiting (10 requests per minute = 6 seconds between requests)
      await delay(3000);
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      throw error;
    }
  };

  try {
    // ==================== REGISTRATION TESTS ====================
    console.log("\n🔐 REGISTRATION TESTS");
    console.log("-".repeat(40));

    // Test 1: Successful customer registration
    await test("Valid customer registration", async () => {
      const email = generateTestEmail();
      const registerData = {
        firstName: "John",
        lastName: "Doe",
        email: email,
        password: generateValidPassword(),
        userType: "customer",
      };

      const res = await postJson("/api/auth/register", registerData);

      // Debug output if test fails
      if (res.status !== 201) {
        console.log(
          "   🐛 DEBUG - Request data:",
          JSON.stringify(registerData, null, 2),
        );
        console.log("   🐛 DEBUG - Response status:", res.status);
        console.log(
          "   🐛 DEBUG - Response body:",
          JSON.stringify(res.body, null, 2),
        );
      }

      assert.equal(
        res.status,
        201,
        `Should return 201 for successful registration. Got ${
          res.status
        }: ${JSON.stringify(res.body)}`,
      );
      assert.ok(res.body.success, "Response should indicate success");
      assert.ok(res.body.user, "Should return user object");
      assert.equal(res.body.user.email, email, "Should return correct email");
      assert.equal(
        res.body.user.userType,
        "customer",
        "Should return correct userType",
      );
      assert.equal(
        res.body.user.firstName,
        "John",
        "Should return correct firstName",
      );
      assert.equal(
        res.body.user.lastName,
        "Doe",
        "Should return correct lastName",
      );
      assert.ok(res.body.accessToken, "Should return access token");
      assert.ok(res.setCookie, "Should set refresh token cookie");
      assert.equal(
        res.body.message,
        "Registration successful",
        "Should return success message",
      );

      await cleanupTestUser(email);
    });

    // Test 2: Successful vendor registration
    await test("Valid vendor registration", async () => {
      const email = generateTestEmail();
      const registerData = {
        firstName: "Jane",
        lastName: "Smith",
        email: email,
        password: generateValidPassword(),
        userType: "vendor",
        businessName: "Beauty Salon Pro",
      };

      const res = await postJson("/api/auth/register", registerData);

      assert.equal(
        res.status,
        201,
        "Should return 201 for successful registration",
      );
      assert.equal(
        res.body.user.userType,
        "vendor",
        "Should return correct userType",
      );
      assert.equal(
        res.body.user.businessName,
        "Beauty Salon Pro",
        "Should return correct businessName",
      );
      assert.equal(
        res.body.user.status,
        "pending_approval",
        "Vendor should have pending_approval status",
      );

      await cleanupTestUser(email);
    });

    // Test 3: Missing required fields
    await test("Registration with missing firstName", async () => {
      const registerData = {
        lastName: "Doe",
        email: generateTestEmail(),
        password: generateValidPassword(),
        userType: "customer",
      };

      const res = await postJson("/api/auth/register", registerData);

      // Remove debug output since test works correctly

      assert.equal(res.status, 400, "Should return 400 for missing firstName");
      assert.equal(
        res.body.error,
        "Validation failed",
        "Should return validation failed error",
      );
      assert.ok(
        res.body.message &&
          res.body.message.includes("expected string, received undefined"),
        `Should mention validation error. Got: ${JSON.stringify(res.body)}`,
      );
    });

    // Test 4: Missing lastName
    await test("Registration with missing lastName", async () => {
      const registerData = {
        firstName: "John",
        email: generateTestEmail(),
        password: generateValidPassword(),
        userType: "customer",
      };

      const res = await postJson("/api/auth/register", registerData);

      assert.equal(res.status, 400, "Should return 400 for missing lastName");
      assert.equal(
        res.body.error,
        "Validation failed",
        "Should return validation failed error",
      );
      assert.ok(
        res.body.message.includes("expected string, received undefined"),
        "Should mention validation error",
      );
    });

    // Test 5: Invalid email format
    await test("Registration with invalid email", async () => {
      const registerData = {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
        password: generateValidPassword(),
        userType: "customer",
      };

      const res = await postJson("/api/auth/register", registerData);

      assert.equal(res.status, 400, "Should return 400 for invalid email");
      assert.equal(
        res.body.error,
        "Validation failed",
        "Should return validation failed error",
      );
      assert.ok(
        res.body.message.includes("Invalid email") ||
          res.body.message.includes("email"),
        "Should mention email validation error",
      );
    });

    // Test 6: Weak password
    await test("Registration with weak password", async () => {
      const registerData = {
        firstName: "John",
        lastName: "Doe",
        email: generateTestEmail(),
        password: generateWeakPassword(),
        userType: "customer",
      };

      const res = await postJson("/api/auth/register", registerData);

      assert.equal(res.status, 400, "Should return 400 for weak password");
      assert.equal(
        res.body.error,
        "Validation failed",
        "Should return validation failed error",
      );
      assert.ok(
        res.body.message.includes("Password must be") ||
          res.body.message.includes("password"),
        "Should mention password validation error",
      );
    });

    // Test 7: Invalid userType
    await test("Registration with invalid userType", async () => {
      const registerData = {
        firstName: "John",
        lastName: "Doe",
        email: generateTestEmail(),
        password: generateValidPassword(),
        userType: "invalid_role",
      };

      const res = await postJson("/api/auth/register", registerData);

      assert.equal(res.status, 400, "Should return 400 for invalid userType");
      assert.equal(
        res.body.error,
        "Validation failed",
        "Should return validation failed error",
      );
    });

    // Test 8: Vendor without businessName
    await test("Vendor registration without businessName", async () => {
      const registerData = {
        firstName: "Jane",
        lastName: "Smith",
        email: generateTestEmail(),
        password: generateValidPassword(),
        userType: "vendor",
        // Missing businessName
      };

      const res = await postJson("/api/auth/register", registerData);

      assert.equal(
        res.status,
        400,
        "Should return 400 for vendor without businessName",
      );
      assert.equal(
        res.body.error,
        "Validation failed",
        "Should return validation failed error",
      );
      assert.ok(
        res.body.message.includes("Business name") ||
          res.body.message.includes("businessName"),
        "Should mention businessName requirement",
      );
    });

    // Test 9: Duplicate email registration
    await test("Registration with duplicate email", async () => {
      const email = generateTestEmail();
      const registerData = {
        firstName: "John",
        lastName: "Doe",
        email: email,
        password: generateValidPassword(),
        userType: "customer",
      };

      // First registration
      const res1 = await postJson("/api/auth/register", registerData);
      assert.equal(res1.status, 201, "First registration should succeed");

      // Second registration with same email
      const res2 = await postJson("/api/auth/register", registerData);
      assert.equal(res2.status, 400, "Should return 400 for duplicate email");
      assert.equal(
        res2.body.error,
        "Registration failed. Please try again.",
        "Should return generic error message",
      );

      await cleanupTestUser(email);
    });

    // Test 10: Empty request body
    await test("Registration with empty body", async () => {
      const res = await postJson("/api/auth/register", {});

      // May return 400 (validation error) or 429 (rate limit) - both are acceptable
      assert.ok(
        res.status === 400 || res.status === 429,
        `Should return 400 or 429 for empty body, got ${res.status}`,
      );
      assert.ok(res.body.error, "Should return error message");
    });

    // Test 11: Invalid JSON
    await test("Registration with invalid JSON", async () => {
      const headers = { "Content-Type": "application/json" };
      const invalidJson = '{"firstName": "John", "lastName":}'; // Invalid JSON

      const res = await fetch(BASE + "/api/auth/register", {
        method: "POST",
        headers,
        body: invalidJson,
      });

      const json = await res.json();
      // May return 400 (invalid JSON) or 429 (rate limit)
      assert.ok(
        res.status === 400 || res.status === 429,
        `Should return 400 or 429 for invalid JSON, got ${res.status}`,
      );
      if (res.status === 400) {
        assert.equal(
          json.error,
          "Invalid JSON body",
          "Should return JSON error message",
        );
      }
    });

    // ==================== SIGNIN TESTS ====================
    console.log("\n🔑 SIGNIN TESTS");
    console.log("-".repeat(40));

    // Create a test user for signin tests (with rate limit handling)
    console.log("Creating test user for signin tests...");
    const testEmail = generateTestEmail();
    const testPassword = generateValidPassword();
    const testUser = {
      firstName: "Test",
      lastName: "User",
      email: testEmail,
      password: testPassword,
      userType: "customer",
    };

    let createRes = await postJson("/api/auth/register", testUser);

    // Handle rate limiting for test user creation
    if (createRes.status === 429) {
      console.log("   ⏳ Rate limit hit, waiting 65 seconds...");
      await delay(65000);
      createRes = await postJson("/api/auth/register", testUser);
    }

    assert.ok(
      createRes.status === 201 || createRes.status === 400,
      `Test user creation should succeed or fail gracefully, got ${createRes.status}`,
    );

    // Test 12: Successful signin
    await test("Valid signin", async () => {
      clearCookies();

      const signinData = {
        email: testEmail,
        password: testPassword,
      };

      const res = await postJson("/api/auth/signin", signinData);

      assert.equal(res.status, 200, "Should return 200 for successful signin");
      assert.ok(res.body.success, "Response should indicate success");
      assert.ok(res.body.user, "Should return user object");
      assert.equal(
        res.body.user.email,
        testEmail,
        "Should return correct email",
      );
      assert.ok(res.body.accessToken, "Should return access token");
      assert.ok(res.setCookie, "Should set refresh token cookie");
      assert.equal(
        res.body.message,
        "Sign in successful",
        "Should return success message",
      );
    });

    // Test 13: Invalid email signin
    await test("Signin with invalid email", async () => {
      const signinData = {
        email: "nonexistent@example.com",
        password: testPassword,
      };

      const res = await postJson("/api/auth/signin", signinData);

      assert.equal(res.status, 401, "Should return 401 for invalid email");
      assert.equal(
        res.body.error,
        "Invalid credentials",
        "Should return generic error message",
      );
    });

    // Test 14: Invalid password signin
    await test("Signin with invalid password", async () => {
      const signinData = {
        email: testEmail,
        password: "WrongPassword123!",
      };

      const res = await postJson("/api/auth/signin", signinData);

      assert.equal(res.status, 401, "Should return 401 for invalid password");
      assert.equal(
        res.body.error,
        "Invalid credentials",
        "Should return generic error message",
      );
    });

    // Test 15: Missing email
    await test("Signin with missing email", async () => {
      const signinData = {
        password: testPassword,
      };

      const res = await postJson("/api/auth/signin", signinData);

      assert.equal(res.status, 401, "Should return 401 for missing email");
      assert.equal(
        res.body.error,
        "Invalid credentials",
        "Should return generic error message",
      );
    });

    // Test 16: Missing password
    await test("Signin with missing password", async () => {
      const signinData = {
        email: testEmail,
      };

      const res = await postJson("/api/auth/signin", signinData);

      assert.equal(res.status, 401, "Should return 401 for missing password");
      assert.equal(
        res.body.error,
        "Invalid credentials",
        "Should return generic error message",
      );
    });

    // ==================== TOKEN REFRESH TESTS ====================
    console.log("\n🔄 TOKEN REFRESH TESTS");
    console.log("-".repeat(40));

    // Test 17: Valid token refresh
    await test("Valid token refresh", async () => {
      // First signin to get cookies
      const signinRes = await postJson("/api/auth/signin", {
        email: testEmail,
        password: testPassword,
      });
      assert.equal(
        signinRes.status,
        200,
        "Signin should succeed for refresh test",
      );

      // Now test refresh
      const res = await postJson("/api/auth/refresh", {}, true);

      assert.equal(res.status, 200, "Should return 200 for valid refresh");
      assert.ok(res.body.success, "Response should indicate success");
      assert.ok(res.body.accessToken, "Should return new access token");
      assert.ok(res.body.user, "Should return user object");
    });

    // Test 18: Refresh without cookies
    await test("Refresh without cookies", async () => {
      clearCookies();

      const res = await postJson("/api/auth/refresh", {}, false);

      assert.equal(res.status, 401, "Should return 401 without refresh token");
      assert.ok(res.body.error, "Should return error message");
    });

    // ==================== SIGNOUT TESTS ====================
    console.log("\n🚪 SIGNOUT TESTS");
    console.log("-".repeat(40));

    // Test 19: Valid signout
    await test("Valid signout", async () => {
      // Signin first
      await postJson("/api/auth/signin", {
        email: testEmail,
        password: testPassword,
      });

      const res = await postJson("/api/auth/signout", {}, true);

      assert.equal(res.status, 200, "Should return 200 for signout");
      assert.ok(res.body.success, "Response should indicate success");
    });

    // Test 20: Refresh after signout should fail
    await test("Refresh after signout fails", async () => {
      // Previous test already signed out, try refresh
      const res = await postJson("/api/auth/refresh", {}, true);

      assert.equal(res.status, 401, "Refresh after signout should return 401");
    });

    // ==================== FIELD VALIDATION EDGE CASES ====================
    console.log("\n🔍 FIELD VALIDATION EDGE CASES");
    console.log("-".repeat(40));

    // Test 21: Long firstName
    await test("Registration with long firstName", async () => {
      const registerData = {
        firstName: "A".repeat(51), // Max is 50
        lastName: "Doe",
        email: generateTestEmail(),
        password: generateValidPassword(),
        userType: "customer",
      };

      const res = await postJson("/api/auth/register", registerData);

      assert.equal(res.status, 400, "Should return 400 for long firstName");
      assert.ok(
        res.body.message.includes("First name must be less than 50 characters"),
        "Should mention firstName length limit",
      );
    });

    // Test 22: Invalid characters in firstName
    await test("Registration with invalid firstName characters", async () => {
      const registerData = {
        firstName: "John123",
        lastName: "Doe",
        email: generateTestEmail(),
        password: generateValidPassword(),
        userType: "customer",
      };

      const res = await postJson("/api/auth/register", registerData);

      assert.equal(
        res.status,
        400,
        "Should return 400 for invalid firstName characters",
      );
      assert.ok(
        res.body.message.includes("First name can only contain letters"),
        "Should mention firstName character restriction",
      );
    });

    // Test 23: Password without uppercase
    await test("Registration with password missing uppercase", async () => {
      const registerData = {
        firstName: "John",
        lastName: "Doe",
        email: generateTestEmail(),
        password: "testpass123!",
        userType: "customer",
      };

      const res = await postJson("/api/auth/register", registerData);

      assert.equal(
        res.status,
        400,
        "Should return 400 for password without uppercase",
      );
      assert.ok(
        res.body.message.includes("Password must contain at least one"),
        "Should mention password requirements",
      );
    });

    // Test 24: Password without special character
    await test("Registration with password missing special character", async () => {
      const registerData = {
        firstName: "John",
        lastName: "Doe",
        email: generateTestEmail(),
        password: "TestPass123",
        userType: "customer",
      };

      const res = await postJson("/api/auth/register", registerData);

      assert.equal(
        res.status,
        400,
        "Should return 400 for password without special character",
      );
      assert.ok(
        res.body.message.includes("Password must contain at least one"),
        "Should mention password requirements",
      );
    });

    // Test 25: Long businessName
    await test("Vendor registration with long businessName", async () => {
      const registerData = {
        firstName: "Jane",
        lastName: "Smith",
        email: generateTestEmail(),
        password: generateValidPassword(),
        userType: "vendor",
        businessName: "A".repeat(101), // Max is 100
      };

      const res = await postJson("/api/auth/register", registerData);

      assert.equal(res.status, 400, "Should return 400 for long businessName");
    });

    // Cleanup test user (if creation was successful)
    if (createRes.status === 201) {
      await cleanupTestUser(testEmail);
    }

    // ==================== TEST SUMMARY ====================
    console.log("\n" + "=".repeat(60));
    console.log(`🎉 TEST SUMMARY: ${passCount}/${testCount} tests passed`);

    if (passCount === testCount) {
      console.log("✅ ALL TESTS PASSED!");
      return true;
    } else {
      console.log(`❌ ${testCount - passCount} tests failed`);
      return false;
    }
  } catch (error) {
    console.error("\n💥 Test suite failed:", error.message);
    return false;
  } finally {
    // Cleanup
    clearCookies();
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test runner error:", error);
      process.exit(2);
    });
}

module.exports = { runTests, runAuthTests: runTests };
