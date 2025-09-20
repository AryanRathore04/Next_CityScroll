/**
 * Automated Test Utilities for BeautyBook
 * Provides functions to automate common testing scenarios
 */

export interface TestUser {
  email: string;
  password: string;
  userType: "customer" | "vendor" | "admin";
  firstName?: string;
  lastName?: string;
  businessName?: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  duration: number;
  error?: string;
  data?: any;
}

export class TestAutomation {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl;
  }

  /**
   * Test user registration flow
   */
  async testUserRegistration(userData: TestUser): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Navigate to signup page
      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const duration = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: "User registration successful",
          duration,
          data,
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          message: "User registration failed",
          duration,
          error,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "User registration failed with exception",
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Test user login flow
   */
  async testUserLogin(email: string, password: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const duration = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: "User login successful",
          duration,
          data,
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          message: "User login failed",
          duration,
          error,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "User login failed with exception",
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Test API endpoint
   */
  async testApiEndpoint(
    endpoint: string,
    method: string = "GET",
    body?: any,
    headers?: any,
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const config: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      if (body && method !== "GET") {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const duration = Date.now() - startTime;

      const data = await response.json().catch(() => null);

      return {
        success: response.ok,
        message: response.ok
          ? "API endpoint test successful"
          : `API endpoint test failed: ${response.status}`,
        duration,
        error: !response.ok
          ? `HTTP ${response.status}: ${response.statusText}`
          : undefined,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: "API endpoint test failed with exception",
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Test page load performance
   */
  async testPageLoad(path: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}${path}`);
      const duration = Date.now() - startTime;

      if (response.ok) {
        const content = await response.text();
        const isValidHtml =
          content.includes("<html") || content.includes("<!DOCTYPE");

        return {
          success: isValidHtml && duration < 3000,
          message: `Page loaded in ${duration}ms`,
          duration,
          error: !isValidHtml
            ? "Invalid HTML response"
            : duration >= 3000
            ? "Page load too slow"
            : undefined,
          data: { contentLength: content.length, isValidHtml },
        };
      } else {
        return {
          success: false,
          message: "Page load failed",
          duration,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Page load failed with exception",
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Test search functionality
   */
  async testSearchFunctionality(searchParams: {
    location?: string;
    service?: string;
    date?: string;
    duration?: string;
  }): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const params = new URLSearchParams();
      if (searchParams.location) params.set("location", searchParams.location);
      if (searchParams.service) params.set("service", searchParams.service);
      if (searchParams.date) params.set("date", searchParams.date);
      if (searchParams.duration) params.set("duration", searchParams.duration);

      const response = await fetch(
        `${this.baseUrl}/salons?${params.toString()}`,
      );
      const duration = Date.now() - startTime;

      if (response.ok) {
        const content = await response.text();
        const hasResults =
          content.includes("ServiceCard") || content.includes("salon");

        return {
          success: true,
          message: "Search functionality test successful",
          duration,
          data: { hasResults, paramCount: params.toString().split("&").length },
        };
      } else {
        return {
          success: false,
          message: "Search functionality test failed",
          duration,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Search functionality test failed with exception",
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Test vendor dashboard access
   */
  async testVendorDashboard(authToken?: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const headers: any = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`${this.baseUrl}/vendor-dashboard`, {
        headers,
      });
      const duration = Date.now() - startTime;

      if (response.ok) {
        const content = await response.text();
        const hasVendorContent =
          content.includes("vendor") || content.includes("dashboard");

        return {
          success: hasVendorContent,
          message: "Vendor dashboard test successful",
          duration,
          data: { hasVendorContent },
        };
      } else {
        return {
          success: false,
          message: "Vendor dashboard test failed",
          duration,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Vendor dashboard test failed with exception",
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Test admin dashboard access
   */
  async testAdminDashboard(authToken?: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const headers: any = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`${this.baseUrl}/admin`, { headers });
      const duration = Date.now() - startTime;

      if (response.ok) {
        const content = await response.text();
        const hasAdminContent =
          content.includes("admin") || content.includes("Dashboard Overview");

        return {
          success: hasAdminContent,
          message: "Admin dashboard test successful",
          duration,
          data: { hasAdminContent },
        };
      } else {
        return {
          success: false,
          message: "Admin dashboard test failed",
          duration,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Admin dashboard test failed with exception",
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Test system health
   */
  async testSystemHealth(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const duration = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const isHealthy = data.overall === "healthy";

        return {
          success: isHealthy,
          message: `System health: ${data.overall}`,
          duration,
          data,
          error: !isHealthy ? "System health is not optimal" : undefined,
        };
      } else {
        return {
          success: false,
          message: "System health check failed",
          duration,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "System health check failed with exception",
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runComprehensiveTests(): Promise<{
    results: TestResult[];
    summary: any;
  }> {
    const results: TestResult[] = [];

    console.log("Starting comprehensive test suite...");

    // Test page loads
    const pageTests = [
      { name: "Homepage", path: "/" },
      { name: "Salons", path: "/salons" },
      { name: "Signin", path: "/signin" },
      { name: "Signup", path: "/signup" },
      { name: "About", path: "/about" },
    ];

    for (const test of pageTests) {
      console.log(`Testing ${test.name} page...`);
      const result = await this.testPageLoad(test.path);
      result.message = `${test.name}: ${result.message}`;
      results.push(result);
    }

    // Test API endpoints
    const apiTests = [
      {
        name: "Vendor Profile API",
        endpoint: "/api/vendor/profile?vendorId=test",
      },
      {
        name: "Vendor Bookings API",
        endpoint: "/api/vendor/bookings?vendorId=test",
      },
      {
        name: "Vendor Services API",
        endpoint: "/api/vendor/services?vendorId=test",
      },
      {
        name: "Vendor Analytics API",
        endpoint: "/api/vendor/analytics?vendorId=test",
      },
    ];

    for (const test of apiTests) {
      console.log(`Testing ${test.name}...`);
      const result = await this.testApiEndpoint(test.endpoint);
      result.message = `${test.name}: ${result.message}`;
      results.push(result);
    }

    // Test search functionality
    console.log("Testing search functionality...");
    const searchResult = await this.testSearchFunctionality({
      location: "Mumbai",
      service: "Spa",
      duration: "2hours",
    });
    searchResult.message = `Search: ${searchResult.message}`;
    results.push(searchResult);

    // Test system health
    console.log("Testing system health...");
    const healthResult = await this.testSystemHealth();
    healthResult.message = `Health: ${healthResult.message}`;
    results.push(healthResult);

    // Generate summary
    const summary = {
      total: results.length,
      passed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      averageDuration:
        results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
    };

    console.log("Test suite completed!");
    console.log(`Results: ${summary.passed}/${summary.total} tests passed`);

    return { results, summary };
  }
}

// Test data generators
export const generateTestUser = (
  userType: "customer" | "vendor" | "admin" = "customer",
): TestUser => {
  const timestamp = Date.now();

  return {
    email: `test-${userType}-${timestamp}@example.com`,
    password: "TestPassword123!",
    userType,
    firstName: "Test",
    lastName: "User",
    businessName:
      userType === "vendor" ? `Test Business ${timestamp}` : undefined,
  };
};

export const generateTestBooking = () => {
  return {
    customerName: "Test Customer",
    customerEmail: "customer@test.com",
    customerPhone: "+91 9876543210",
    serviceName: "Test Service",
    servicePrice: 2500,
    bookingDate: new Date(),
    bookingTime: "14:00",
    vendorId: "test-vendor",
    status: "pending",
  };
};

export const generateTestService = () => {
  return {
    name: "Test Service",
    description: "A test service for automated testing",
    category: "spa",
    duration: 60,
    price: 2000,
    active: true,
    vendorId: "test-vendor",
  };
};

// Usage example:
/*
const automation = new TestAutomation('http://localhost:3000');

// Run individual tests
const loginResult = await automation.testUserLogin('test@example.com', 'password');
console.log(loginResult);

// Run comprehensive test suite
const { results, summary } = await automation.runComprehensiveTests();
console.log('Test Summary:', summary);
console.log('Failed Tests:', results.filter(r => !r.success));
*/
