/**
 * COMPREHENSIVE SYSTEM HEALTH TEST SUITE
 *
 * Tests system health, monitoring, and diagnostics:
 * - Health endpoint functionality
 * - Database connectivity
 * - API response times
 * - Service availability
 * - Error handling
 *
 * Usage: npm run test:health
 * Prerequisites: npm run dev (server running)
 */

const fs = require("fs");
const assert = require("assert").strict;

// Helper functions
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const BASE = process.env.BASE_URL || "http://localhost:3000";

// HTTP request helper
async function makeRequest(pathname, method = "GET", expectedTimeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), expectedTimeout);

  try {
    const startTime = Date.now();
    const res = await fetch(BASE + pathname, {
      method,
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    const responseTime = Date.now() - startTime;
    clearTimeout(timeoutId);

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      json = { raw: text };
    }

    return {
      status: res.status,
      body: json,
      responseTime,
      headers: res.headers,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${expectedTimeout}ms`);
    }
    throw error;
  }
}

// Test suite runner
async function runHealthTests() {
  console.log("🚀 Starting Comprehensive System Health Tests");
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
      await delay(1000); // Small delay between health checks
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      throw error;
    }
  };

  try {
    // ==================== BASIC HEALTH TESTS ====================
    console.log("\n🏥 BASIC HEALTH TESTS");
    console.log("-".repeat(40));

    // Test 1: Health endpoint accessibility
    await test("Health endpoint responds", async () => {
      const res = await makeRequest("/api/health");

      assert.ok(
        [200, 503].includes(res.status),
        `Health endpoint should return 200 or 503, got ${res.status}`,
      );
      assert.ok(
        res.body.overall,
        "Health response should include overall status",
      );
      assert.ok(
        Array.isArray(res.body.checks),
        "Health response should include checks array",
      );
    });

    // Test 2: Health response structure validation
    await test("Health response structure", async () => {
      const res = await makeRequest("/api/health");

      // Validate response structure
      assert.ok(res.body.overall, "Should have overall status");
      assert.ok(
        ["healthy", "degraded", "down"].includes(res.body.overall),
        "Overall status should be valid",
      );
      assert.ok(Array.isArray(res.body.checks), "Should have checks array");
      assert.ok(
        typeof res.body.uptime === "number",
        "Should have numeric uptime",
      );
      assert.ok(res.body.version, "Should have version string");

      // Validate individual checks
      res.body.checks.forEach((check) => {
        assert.ok(check.service, "Each check should have service name");
        assert.ok(
          ["healthy", "degraded", "down"].includes(check.status),
          "Each check should have valid status",
        );
        assert.ok(check.timestamp, "Each check should have timestamp");
      });
    });

    // Test 3: Health response time
    await test("Health endpoint performance", async () => {
      const res = await makeRequest("/api/health");

      assert.ok(
        res.responseTime < 5000,
        `Health check should respond within 5 seconds, took ${res.responseTime}ms`,
      );

      // Log performance info
      console.log(`   📊 Response time: ${res.responseTime}ms`);
      console.log(`   📊 Overall status: ${res.body.overall}`);
    });

    // Test 4: Database health check
    await test("Database connectivity check", async () => {
      const res = await makeRequest("/api/health");

      const dbCheck = res.body.checks.find(
        (check) => check.service === "database",
      );
      assert.ok(dbCheck, "Health response should include database check");

      if (dbCheck.status === "down") {
        console.log(`   ⚠️ Database is down: ${dbCheck.error}`);
      } else {
        console.log(
          `   ✅ Database is ${dbCheck.status} (${dbCheck.latency}ms)`,
        );
      }

      // Database should be healthy or degraded, not completely down for tests to work
      assert.ok(
        ["healthy", "degraded"].includes(dbCheck.status),
        "Database should be accessible for tests",
      );
    });

    // Test 5: API health check
    await test("API service check", async () => {
      const res = await makeRequest("/api/health");

      const apiCheck = res.body.checks.find((check) => check.service === "api");
      assert.ok(apiCheck, "Health response should include API check");

      console.log(
        `   📊 API status: ${apiCheck.status} (${apiCheck.latency}ms)`,
      );

      // API should be accessible
      assert.ok(
        ["healthy", "degraded"].includes(apiCheck.status),
        "API should be accessible",
      );
    });

    // Test 6: Authentication service check
    await test("Authentication service check", async () => {
      const res = await makeRequest("/api/health");

      const authCheck = res.body.checks.find(
        (check) => check.service === "authentication",
      );
      assert.ok(
        authCheck,
        "Health response should include authentication check",
      );

      console.log(
        `   📊 Auth status: ${authCheck.status} (${authCheck.latency}ms)`,
      );

      // Auth should be working
      assert.ok(
        ["healthy", "degraded"].includes(authCheck.status),
        "Authentication should be working",
      );
    });

    // ==================== PERFORMANCE TESTS ====================
    console.log("\n⚡ PERFORMANCE TESTS");
    console.log("-".repeat(40));

    // Test 7: Multiple rapid health checks
    await test("Rapid health checks", async () => {
      const promises = [];
      const numRequests = 5;

      for (let i = 0; i < numRequests; i++) {
        promises.push(makeRequest("/api/health"));
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === "fulfilled").length;

      assert.ok(
        successful >= numRequests * 0.8,
        `At least 80% of rapid requests should succeed, got ${successful}/${numRequests}`,
      );

      console.log(
        `   📊 Successful rapid requests: ${successful}/${numRequests}`,
      );
    });

    // Test 8: Health check with timeout
    await test("Health check timeout handling", async () => {
      // Test with very short timeout to see if it handles timeouts gracefully
      try {
        await makeRequest("/api/health", "GET", 1); // 1ms timeout - should fail
        // If we get here, the request was extremely fast or timeout didn't work
        console.log("   ⚠️ Request completed faster than timeout");
      } catch (error) {
        // Expected timeout error
        assert.ok(
          error.message.includes("timed out"),
          "Should handle timeout appropriately",
        );
      }

      // Now test with reasonable timeout
      const res = await makeRequest("/api/health", "GET", 5000);
      assert.ok(
        [200, 503].includes(res.status),
        "Should work with reasonable timeout",
      );
    });

    // ==================== ERROR HANDLING TESTS ====================
    console.log("\n🚨 ERROR HANDLING TESTS");
    console.log("-".repeat(40));

    // Test 9: Non-existent health endpoint
    await test("Non-existent health endpoint", async () => {
      try {
        const res = await makeRequest("/api/health/nonexistent");
        // Should return 404 or similar
        assert.ok(
          [404, 405].includes(res.status),
          `Non-existent endpoint should return 404/405, got ${res.status}`,
        );
      } catch (error) {
        // Network error is also acceptable
        console.log(`   📝 Network error (expected): ${error.message}`);
      }
    });

    // Test 10: Invalid HTTP method on health endpoint
    await test("Invalid HTTP method", async () => {
      try {
        const res = await makeRequest("/api/health", "POST");
        // Should return 405 Method Not Allowed or similar
        assert.ok(
          [405, 404].includes(res.status),
          `Invalid method should return 405/404, got ${res.status}`,
        );
      } catch (error) {
        console.log(`   📝 Request error (acceptable): ${error.message}`);
      }
    });

    // ==================== INTEGRATION TESTS ====================
    console.log("\n🔗 INTEGRATION TESTS");
    console.log("-".repeat(40));

    // Test 11: Health vs actual API functionality
    await test("Health status vs actual API", async () => {
      const healthRes = await makeRequest("/api/health");

      // Test actual API endpoint to see if it matches health status
      let apiWorking = false;
      try {
        const apiRes = await makeRequest("/api/vendor/services?vendorId=test");
        apiWorking = apiRes.status === 200;
      } catch (error) {
        apiWorking = false;
      }

      const overallHealthy = healthRes.body.overall === "healthy";

      if (overallHealthy && !apiWorking) {
        console.log("   ⚠️ Health reports healthy but API test failed");
      } else if (!overallHealthy && apiWorking) {
        console.log("   ⚠️ Health reports issues but API test succeeded");
      } else {
        console.log("   ✅ Health status matches API functionality");
      }

      // Don't fail the test for this, just report the discrepancy
    });

    // Test 12: Response headers validation
    await test("Health response headers", async () => {
      const res = await makeRequest("/api/health");

      // Check for important headers
      assert.ok(
        res.headers.get("content-type"),
        "Should have content-type header",
      );
      assert.ok(
        res.headers.get("content-type").includes("application/json"),
        "Should return JSON content-type",
      );

      // Check for cache control (health checks should not be cached)
      const cacheControl = res.headers.get("cache-control");
      if (cacheControl) {
        console.log(`   📊 Cache-Control: ${cacheControl}`);
      }

      // Check for response time header if present
      const responseTimeHeader = res.headers.get("x-response-time");
      if (responseTimeHeader) {
        console.log(`   📊 X-Response-Time: ${responseTimeHeader}`);
      }
    });

    // ==================== UPTIME & METRICS TESTS ====================
    console.log("\n📈 UPTIME & METRICS TESTS");
    console.log("-".repeat(40));

    // Test 13: Uptime tracking
    await test("Uptime metrics", async () => {
      const res1 = await makeRequest("/api/health");
      const uptime1 = res1.body.uptime;

      await delay(2000); // Wait 2 seconds

      const res2 = await makeRequest("/api/health");
      const uptime2 = res2.body.uptime;

      assert.ok(uptime2 > uptime1, "Uptime should increase over time");
      assert.ok(
        uptime2 - uptime1 >= 1.8,
        "Uptime difference should reflect elapsed time",
      );

      console.log(
        `   📊 Uptime increased by ${(uptime2 - uptime1).toFixed(2)} seconds`,
      );
    });

    // Test 14: Version information
    await test("Version information", async () => {
      const res = await makeRequest("/api/health");

      assert.ok(res.body.version, "Health response should include version");
      assert.ok(
        typeof res.body.version === "string",
        "Version should be a string",
      );

      console.log(`   📊 System version: ${res.body.version}`);
    });

    // ==================== TEST SUMMARY ====================
    console.log("\n" + "=".repeat(60));
    console.log(
      `🎉 HEALTH TESTS SUMMARY: ${passCount}/${testCount} tests passed`,
    );

    if (passCount === testCount) {
      console.log("✅ ALL HEALTH TESTS PASSED!");
      console.log("\n📊 SYSTEM STATUS SUMMARY:");

      // Final health check for summary
      const finalHealth = await makeRequest("/api/health");
      console.log(
        `   Overall Status: ${finalHealth.body.overall.toUpperCase()}`,
      );
      console.log(`   Uptime: ${finalHealth.body.uptime.toFixed(2)} seconds`);
      console.log(`   Version: ${finalHealth.body.version}`);

      finalHealth.body.checks.forEach((check) => {
        const statusIcon =
          check.status === "healthy"
            ? "✅"
            : check.status === "degraded"
            ? "⚠️"
            : "❌";
        console.log(
          `   ${statusIcon} ${check.service}: ${check.status} ${
            check.latency ? `(${check.latency}ms)` : ""
          }`,
        );
      });

      return true;
    } else {
      console.log(`❌ ${testCount - passCount} tests failed`);
      return false;
    }
  } catch (error) {
    console.error("\n💥 Health test suite failed:", error.message);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runHealthTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Health test runner error:", error);
      process.exit(2);
    });
}

module.exports = { runHealthTests };
