/**
 * COMPREHENSIVE API TEST RUNNER
 *
 * Orchestrates all API test suites with detailed reporting
 *
 * Features:
 * - Sequential execution of all test suites
 * - Detailed progress tracking
 * - Unified success/failure reporting
 * - Performance metrics
 * - Environment validation
 *
 * Usage: node scripts/run-all-tests.js
 * Prerequisites: npm run dev (server running on localhost:3000)
 */

const fs = require("fs");
const path = require("path");

// Import all test suites
const { runAuthTests } = require("./auth-comprehensive.test.js");
const { runBookingTests } = require("./bookings-comprehensive.test.js");
const { runServicesTests } = require("./services-comprehensive.test.js");
const { runHealthTests } = require("./system-health.test.js");

const BASE = process.env.BASE_URL || "http://localhost:3000";

// Helper functions
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkServerHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(BASE + "/api/health", {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const health = await res.json();
    return {
      accessible: true,
      status: res.status,
      health: health,
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message,
    };
  }
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

async function runAllTests() {
  console.log("🚀 COMPREHENSIVE API TESTING SUITE");
  console.log("=".repeat(80));
  console.log(`🌐 Target Server: ${BASE}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);

  const startTime = Date.now();
  const results = [];

  // ==================== ENVIRONMENT CHECK ====================
  console.log("\n🔍 ENVIRONMENT VALIDATION");
  console.log("-".repeat(50));

  console.log("1. Checking server accessibility...");
  const healthCheck = await checkServerHealth();

  if (!healthCheck.accessible) {
    console.log("❌ SERVER NOT ACCESSIBLE");
    console.log(`   Error: ${healthCheck.error}`);
    console.log("\n💡 Make sure the Next.js development server is running:");
    console.log("   npm run dev");
    process.exit(1);
  }

  console.log("✅ Server is accessible");
  console.log(`   Status: ${healthCheck.status}`);
  console.log(`   Overall Health: ${healthCheck.health.overall}`);

  // Check environment variables
  console.log("\n2. Checking environment variables...");
  const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    console.log(`⚠️ Missing environment variables: ${missingVars.join(", ")}`);
    console.log("   Tests may fail without proper environment setup");
  } else {
    console.log("✅ Required environment variables present");
  }

  console.log("\n3. Validating test files...");
  const testFiles = [
    "./auth-comprehensive.test.js",
    "./bookings-comprehensive.test.js",
    "./services-comprehensive.test.js",
    "./system-health.test.js",
  ];

  const missingFiles = testFiles.filter(
    (file) => !fs.existsSync(path.resolve(__dirname, file)),
  );
  if (missingFiles.length > 0) {
    console.log(`❌ Missing test files: ${missingFiles.join(", ")}`);
    process.exit(1);
  }

  console.log("✅ All test files present");

  // ==================== TEST EXECUTION ====================
  console.log("\n🧪 EXECUTING TEST SUITES");
  console.log("=".repeat(80));

  const testSuites = [
    {
      name: "System Health Tests",
      description: "Health endpoints, performance, system status",
      runner: runHealthTests,
      icon: "🏥",
    },
    {
      name: "Authentication Tests",
      description: "Signup, signin, token management, session handling",
      runner: runAuthTests,
      icon: "🔐",
    },
    {
      name: "Services API Tests",
      description: "Service CRUD operations, vendor management",
      runner: runServicesTests,
      icon: "⚙️",
    },
    {
      name: "Booking System Tests",
      description: "Booking creation, validation, staff assignment",
      runner: runBookingTests,
      icon: "📅",
    },
  ];

  for (let i = 0; i < testSuites.length; i++) {
    const suite = testSuites[i];
    const suiteStartTime = Date.now();

    console.log(
      `\n${suite.icon} TEST SUITE ${i + 1}/${testSuites.length}: ${suite.name}`,
    );
    console.log(`📝 ${suite.description}`);
    console.log("-".repeat(60));

    try {
      console.log("▶️ Starting test suite...");
      const success = await suite.runner();
      const duration = Date.now() - suiteStartTime;

      results.push({
        name: suite.name,
        success: success,
        duration: duration,
        error: null,
      });

      if (success) {
        console.log(`✅ ${suite.name} COMPLETED SUCCESSFULLY`);
        console.log(`⏱️ Duration: ${formatDuration(duration)}`);
      } else {
        console.log(`❌ ${suite.name} FAILED`);
        console.log(`⏱️ Duration: ${formatDuration(duration)}`);
      }
    } catch (error) {
      const duration = Date.now() - suiteStartTime;

      results.push({
        name: suite.name,
        success: false,
        duration: duration,
        error: error.message,
      });

      console.log(`💥 ${suite.name} CRASHED`);
      console.log(`❌ Error: ${error.message}`);
      console.log(`⏱️ Duration: ${formatDuration(duration)}`);
    }

    // Delay between test suites to avoid overwhelming the system
    if (i < testSuites.length - 1) {
      console.log("\n⏳ Preparing next test suite...");
      await delay(3000);
    }
  }

  // ==================== FINAL REPORT ====================
  const totalDuration = Date.now() - startTime;
  console.log("\n" + "=".repeat(80));
  console.log("📊 COMPREHENSIVE TEST REPORT");
  console.log("=".repeat(80));

  console.log(`⏱️ Total Execution Time: ${formatDuration(totalDuration)}`);
  console.log(`📅 Completed at: ${new Date().toISOString()}`);
  console.log(`🌐 Server: ${BASE}`);

  console.log("\n📋 SUITE RESULTS:");
  console.log("-".repeat(50));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  results.forEach((result, index) => {
    const icon = result.success ? "✅" : "❌";
    const duration = formatDuration(result.duration);
    console.log(`${icon} ${index + 1}. ${result.name} (${duration})`);

    if (result.error) {
      console.log(`   💥 Error: ${result.error}`);
    }
  });

  console.log("\n" + "-".repeat(50));
  console.log(
    `📊 Success Rate: ${successful.length}/${results.length} (${Math.round(
      (successful.length / results.length) * 100,
    )}%)`,
  );

  if (successful.length === results.length) {
    console.log("\n🎉 ALL TEST SUITES PASSED!");
    console.log("✅ Your CityScroll application is running perfectly!");
    console.log("\n🚀 SYSTEM STATUS: FULLY OPERATIONAL");

    // Performance summary
    const avgDuration =
      results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    console.log(`\n⚡ PERFORMANCE METRICS:`);
    console.log(`   Average suite duration: ${formatDuration(avgDuration)}`);
    console.log(
      `   Fastest suite: ${formatDuration(
        Math.min(...results.map((r) => r.duration)),
      )}`,
    );
    console.log(
      `   Slowest suite: ${formatDuration(
        Math.max(...results.map((r) => r.duration)),
      )}`,
    );
  } else {
    console.log(`\n⚠️ ${failed.length} TEST SUITE(S) FAILED`);
    console.log("❌ Your application may have issues that need attention");

    console.log("\n🔧 FAILED SUITES:");
    failed.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.name}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    console.log("\n💡 NEXT STEPS:");
    console.log("   1. Review the detailed logs above");
    console.log("   2. Fix any failing tests");
    console.log("   3. Re-run individual test suites");
    console.log("   4. Run this comprehensive test again");
  }

  // Save results to file
  const reportPath = path.resolve(__dirname, "../logs/test-results.json");
  const report = {
    timestamp: new Date().toISOString(),
    server: BASE,
    duration: totalDuration,
    totalSuites: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: successful.length / results.length,
    results: results,
    environment: {
      mongoUri: process.env.MONGODB_URI ? "✅ Set" : "❌ Missing",
      jwtSecret: process.env.JWT_SECRET ? "✅ Set" : "❌ Missing",
      baseUrl: BASE,
    },
  };

  try {
    // Ensure logs directory exists
    const logsDir = path.dirname(reportPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Test report saved to: logs/test-results.json`);
  } catch (error) {
    console.log(`\n⚠️ Could not save test report: ${error.message}`);
  }

  console.log("\n" + "=".repeat(80));

  return successful.length === results.length;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test runner error:", error);
      process.exit(2);
    });
}

module.exports = { runAllTests };
