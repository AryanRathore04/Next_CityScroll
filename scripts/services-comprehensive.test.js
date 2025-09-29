/**
 * COMPREHENSIVE SERVICES API TEST SUITE
 *
 * Tests all service-related functionality including:
 * - CRUD operations on services
 * - Vendor authorization and access control
 * - Service validation and data integrity
 * - Public service retrieval
 *
 * Usage: npm run test:services
 * Prerequisites: npm run dev (server running)
 */

const fs = require("fs");
const assert = require("assert").strict;
const path = require("path");
const mongoose = require("mongoose");

// Helper functions
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const BASE = process.env.BASE_URL || "http://localhost:3000";
const TEST_DB = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;
const jarPath = path.resolve(__dirname, "services-test-cookie-jar.txt");

// HTTP request helpers
async function makeRequest(
  pathname,
  method = "GET",
  body = null,
  bearerToken = null,
) {
  const headers = { "Content-Type": "application/json" };

  if (bearerToken) {
    headers["Authorization"] = `Bearer ${bearerToken}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(BASE + pathname, options);
  const text = await res.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }

  return { status: res.status, body: json };
}

// Test data generators
function generateTestEmail() {
  return `servicetest${Date.now()}${Math.random()
    .toString(36)
    .substr(2, 9)}@example.com`;
}

function generateValidPassword() {
  return "TestPass123!@#";
}

function generateServiceData(overrides = {}) {
  return {
    name: "Professional Haircut",
    description: "Expert haircut with styling and consultation",
    category: "haircare",
    duration: 60,
    price: 3500,
    isActive: true,
    ...overrides,
  };
}

// Database cleanup helper
async function cleanupTestData(emails = [], serviceIds = []) {
  try {
    if (!TEST_DB) {
      console.warn("Cleanup skipped: No database URI configured");
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(TEST_DB);
    }

    const User = mongoose.models.User || require("../models/User").default;
    const Service =
      mongoose.models.Service || require("../models/Service").default;

    if (emails.length > 0) {
      await User.deleteMany({
        email: { $in: emails.map((e) => e.toLowerCase()) },
      });
    }

    if (serviceIds.length > 0) {
      await Service.deleteMany({ _id: { $in: serviceIds } });
    }
  } catch (error) {
    console.warn("Cleanup warning:", error.message);
  }
}

// Authentication helper
async function createAuthenticatedUser(
  userType = "vendor",
  businessName = "Test Business",
) {
  const email = generateTestEmail();
  const password = generateValidPassword();

  const userData = {
    firstName: "Test",
    lastName: "User",
    email,
    password,
    userType,
  };

  if (userType === "vendor") {
    userData.businessName = businessName;
  }

  const registerRes = await makeRequest("/api/auth/register", "POST", userData);

  if (registerRes.status === 429) {
    console.log("   ⏳ Rate limit hit during user creation, waiting...");
    await delay(65000);
    const retryRes = await makeRequest("/api/auth/register", "POST", userData);
    if (retryRes.status !== 201) {
      throw new Error(
        `User creation failed: ${retryRes.status} ${JSON.stringify(
          retryRes.body,
        )}`,
      );
    }
    return { ...retryRes.body, email, password };
  }

  if (registerRes.status !== 201) {
    throw new Error(
      `User creation failed: ${registerRes.status} ${JSON.stringify(
        registerRes.body,
      )}`,
    );
  }

  return { ...registerRes.body, email, password };
}

// Test suite runner
async function runServicesTests() {
  console.log("🚀 Starting Comprehensive Services API Tests");
  console.log("=".repeat(60));

  let testCount = 0;
  let passCount = 0;
  const testData = {
    emails: [],
    serviceIds: [],
  };

  const test = async (name, testFn) => {
    testCount++;
    try {
      console.log(`\n${testCount}. ${name}`);
      await testFn();
      console.log("   ✅ PASSED");
      passCount++;
      await delay(3000); // Rate limiting protection
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      throw error;
    }
  };

  try {
    // ==================== SETUP PHASE ====================
    console.log("\n🔧 SETUP PHASE");
    console.log("-".repeat(40));

    let vendorUser1, vendorUser2, customerUser;
    let vendorToken1, vendorToken2, customerToken;

    console.log("Creating test users...");

    // Create vendor users
    vendorUser1 = await createAuthenticatedUser("vendor", "Salon One");
    vendorToken1 = vendorUser1.accessToken;
    testData.emails.push(vendorUser1.email);

    await delay(3000);

    vendorUser2 = await createAuthenticatedUser("vendor", "Salon Two");
    vendorToken2 = vendorUser2.accessToken;
    testData.emails.push(vendorUser2.email);

    await delay(3000);

    // Create customer user
    customerUser = await createAuthenticatedUser("customer");
    customerToken = customerUser.accessToken;
    testData.emails.push(customerUser.email);

    console.log("✅ Setup completed successfully");

    // ==================== SERVICE CREATION TESTS ====================
    console.log("\n🔨 SERVICE CREATION TESTS");
    console.log("-".repeat(40));

    let testServiceId;

    // Test 1: Valid service creation
    await test("Create valid service", async () => {
      const serviceData = generateServiceData();
      const res = await makeRequest(
        "/api/vendor/services",
        "POST",
        serviceData,
        vendorToken1,
      );

      assert.equal(
        res.status,
        200,
        `Should return 200 for valid service creation. Got ${
          res.status
        }: ${JSON.stringify(res.body)}`,
      );
      assert.ok(res.body.success, "Response should indicate success");
      assert.ok(res.body.id, "Should return service ID");

      testServiceId = res.body.id;
      testData.serviceIds.push(testServiceId);
    });

    // Test 2: Service creation without authentication
    await test("Create service without authentication", async () => {
      const serviceData = generateServiceData();
      const res = await makeRequest(
        "/api/vendor/services",
        "POST",
        serviceData,
      );

      assert.equal(
        res.status,
        401,
        "Should return 401 for unauthenticated request",
      );
      assert.ok(res.body.error, "Should return error message");
    });

    // Test 3: Service creation by customer (should fail)
    await test("Create service as customer", async () => {
      const serviceData = generateServiceData();
      const res = await makeRequest(
        "/api/vendor/services",
        "POST",
        serviceData,
        customerToken,
      );

      assert.equal(res.status, 403, "Should return 403 for customer user");
      assert.ok(res.body.error, "Should return error message");
    });

    // Test 4: Service creation with invalid data
    await test("Create service with invalid data", async () => {
      const invalidData = {
        name: "", // Empty name
        description: "Test",
        category: "test",
        duration: -10, // Negative duration
        price: -100, // Negative price
      };

      const res = await makeRequest(
        "/api/vendor/services",
        "POST",
        invalidData,
        vendorToken1,
      );

      assert.equal(res.status, 400, "Should return 400 for invalid data");
      assert.equal(
        res.body.error,
        "Invalid input",
        "Should return validation error",
      );
    });

    // Test 5: Service creation with missing required fields
    await test("Create service with missing fields", async () => {
      const incompleteData = {
        description: "Missing name and other required fields",
      };

      const res = await makeRequest(
        "/api/vendor/services",
        "POST",
        incompleteData,
        vendorToken1,
      );

      assert.equal(res.status, 400, "Should return 400 for missing fields");
      assert.equal(
        res.body.error,
        "Invalid input",
        "Should return validation error",
      );
    });

    // ==================== SERVICE RETRIEVAL TESTS ====================
    console.log("\n📋 SERVICE RETRIEVAL TESTS");
    console.log("-".repeat(40));

    // Test 6: Get vendor services (public endpoint)
    await test("Get vendor services publicly", async () => {
      const res = await makeRequest(
        `/api/vendor/services?vendorId=${vendorUser1.user.id}`,
        "GET",
      );

      assert.equal(
        res.status,
        200,
        `Should return 200 for public service retrieval. Got ${
          res.status
        }: ${JSON.stringify(res.body)}`,
      );
      assert.ok(Array.isArray(res.body), "Should return array of services");

      if (res.body.length > 0) {
        const service = res.body[0];
        assert.ok(service.id, "Service should have ID");
        assert.ok(service.name, "Service should have name");
        assert.ok(service.price !== undefined, "Service should have price");
      }
    });

    // Test 7: Get services for non-existent vendor
    await test("Get services for non-existent vendor", async () => {
      const res = await makeRequest(
        "/api/vendor/services?vendorId=nonexistent123",
        "GET",
      );

      assert.equal(
        res.status,
        200,
        "Should return 200 even for non-existent vendor",
      );
      assert.ok(Array.isArray(res.body), "Should return empty array");
      assert.equal(
        res.body.length,
        0,
        "Should return empty array for non-existent vendor",
      );
    });

    // Test 8: Get services without vendorId parameter
    await test("Get services without vendorId", async () => {
      const res = await makeRequest("/api/vendor/services", "GET");

      assert.equal(res.status, 400, "Should return 400 for missing vendorId");
      assert.ok(res.body.error, "Should return error message");
    });

    // Test 9: Get services for test vendor (should return test data)
    await test("Get services for test vendor", async () => {
      const res = await makeRequest(
        "/api/vendor/services?vendorId=test",
        "GET",
      );

      assert.equal(res.status, 200, "Should return 200 for test vendor");
      assert.ok(
        Array.isArray(res.body),
        "Should return array of test services",
      );

      if (res.body.length > 0) {
        const service = res.body[0];
        assert.equal(service.id, "service-1", "Should return test service");
        assert.equal(
          service.name,
          "Relaxing Massage",
          "Should return test service name",
        );
      }
    });

    // ==================== SERVICE UPDATE TESTS ====================
    console.log("\n✏️ SERVICE UPDATE TESTS");
    console.log("-".repeat(40));

    // Test 10: Valid service update
    await test("Update own service", async () => {
      const updateData = {
        id: testServiceId,
        name: "Updated Professional Haircut",
        price: 4000,
      };

      const res = await makeRequest(
        "/api/vendor/services",
        "PUT",
        updateData,
        vendorToken1,
      );

      assert.equal(
        res.status,
        200,
        `Should return 200 for valid service update. Got ${
          res.status
        }: ${JSON.stringify(res.body)}`,
      );
      assert.ok(res.body.ok, "Response should indicate success");
    });

    // Test 11: Update service without authentication
    await test("Update service without authentication", async () => {
      const updateData = {
        id: testServiceId,
        name: "Unauthorized Update",
      };

      const res = await makeRequest("/api/vendor/services", "PUT", updateData);

      assert.equal(
        res.status,
        401,
        "Should return 401 for unauthenticated request",
      );
    });

    // Test 12: Update someone else's service
    await test("Update another vendor's service", async () => {
      const updateData = {
        id: testServiceId,
        name: "Unauthorized Update",
      };

      const res = await makeRequest(
        "/api/vendor/services",
        "PUT",
        updateData,
        vendorToken2,
      );

      assert.equal(
        res.status,
        403,
        "Should return 403 for unauthorized update",
      );
      assert.ok(res.body.error, "Should return access denied error");
    });

    // Test 13: Update non-existent service
    await test("Update non-existent service", async () => {
      const updateData = {
        id: "507f1f77bcf86cd799439011", // Valid ObjectId format but non-existent
        name: "Non-existent Service",
      };

      const res = await makeRequest(
        "/api/vendor/services",
        "PUT",
        updateData,
        vendorToken1,
      );

      assert.equal(
        res.status,
        404,
        "Should return 404 for non-existent service",
      );
    });

    // ==================== SERVICE DELETION TESTS ====================
    console.log("\n🗑️ SERVICE DELETION TESTS");
    console.log("-".repeat(40));

    // Create a service to delete
    let serviceToDelete;
    const createRes = await makeRequest(
      "/api/vendor/services",
      "POST",
      generateServiceData({ name: "Service To Delete" }),
      vendorToken1,
    );
    if (createRes.status === 200) {
      serviceToDelete = createRes.body.id;
      testData.serviceIds.push(serviceToDelete);
    }

    await delay(3000);

    // Test 14: Delete own service
    await test("Delete own service", async () => {
      if (!serviceToDelete) {
        throw new Error("No service to delete - setup failed");
      }

      const res = await makeRequest(
        `/api/vendor/services?id=${serviceToDelete}`,
        "DELETE",
        null,
        vendorToken1,
      );

      assert.equal(
        res.status,
        200,
        `Should return 200 for valid service deletion. Got ${
          res.status
        }: ${JSON.stringify(res.body)}`,
      );
      assert.ok(res.body.ok, "Response should indicate success");
    });

    // Test 15: Delete service without authentication
    await test("Delete service without authentication", async () => {
      const res = await makeRequest(
        `/api/vendor/services?id=${testServiceId}`,
        "DELETE",
      );

      assert.equal(
        res.status,
        401,
        "Should return 401 for unauthenticated request",
      );
    });

    // Test 16: Delete someone else's service
    await test("Delete another vendor's service", async () => {
      const res = await makeRequest(
        `/api/vendor/services?id=${testServiceId}`,
        "DELETE",
        null,
        vendorToken2,
      );

      assert.equal(
        res.status,
        403,
        "Should return 403 for unauthorized deletion",
      );
    });

    // Test 17: Delete non-existent service
    await test("Delete non-existent service", async () => {
      const res = await makeRequest(
        "/api/vendor/services?id=507f1f77bcf86cd799439013",
        "DELETE",
        null,
        vendorToken1,
      );

      assert.equal(
        res.status,
        404,
        "Should return 404 for non-existent service",
      );
    });

    // Test 18: Delete service without ID parameter
    await test("Delete service without ID", async () => {
      const res = await makeRequest(
        "/api/vendor/services",
        "DELETE",
        null,
        vendorToken1,
      );

      assert.equal(
        res.status,
        400,
        "Should return 400 for missing ID parameter",
      );
    });

    // ==================== TEST SUMMARY ====================
    console.log("\n" + "=".repeat(60));
    console.log(
      `🎉 SERVICES TESTS SUMMARY: ${passCount}/${testCount} tests passed`,
    );

    if (passCount === testCount) {
      console.log("✅ ALL SERVICES TESTS PASSED!");
      return true;
    } else {
      console.log(`❌ ${testCount - passCount} tests failed`);
      return false;
    }
  } catch (error) {
    console.error("\n💥 Services test suite failed:", error.message);
    return false;
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await cleanupTestData(testData.emails, testData.serviceIds);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    console.log("✅ Cleanup completed");
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runServicesTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Services test runner error:", error);
      process.exit(2);
    });
}

module.exports = { runServicesTests };
