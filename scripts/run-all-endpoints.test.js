const fetch = require("node-fetch");

const BASE = process.env.BASE_URL || "http://localhost:3000";

function parseSetCookie(res) {
  const raw = res.headers.raw && res.headers.raw()["set-cookie"];
  if (!raw) return null;
  // return first cookie name=value
  const first = raw[0];
  return first.split(";")[0];
}

async function doFetch(method, path, { body, token, cookie } = {}) {
  const url = BASE + path;
  const headers = { Accept: "application/json" };
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (cookie) headers["Cookie"] = cookie;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const setCookie = parseSetCookie(res);
    let text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      json = text;
    }

    console.log(`\n[${method}] ${path} -> ${res.status}`);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    if (setCookie) console.log("Set-Cookie:", setCookie);
    console.log("Body:", json);

    return { status: res.status, body: json, setCookie };
  } catch (err) {
    console.error(`Fetch error ${method} ${path}:`, err);
    return { status: 0, body: null };
  }
}

async function run() {
  console.log("Starting endpoint tests against", BASE);

  // Health
  await doFetch("GET", "/api/health");
  await doFetch("GET", "/api/health/metrics");

  const ts = Date.now();

  // Register vendor
  const vendorEmail = `vendor+${ts}@example.com`;
  const vendorReg = await doFetch("POST", "/api/auth/register", {
    body: {
      email: vendorEmail,
      password: "VendorPass123!",
      userType: "vendor",
      firstName: "Vendor",
      lastName: "Tester",
      businessName: "Vendor Test Co",
    },
  });
  const vendorToken = vendorReg.body && vendorReg.body.accessToken;
  const vendorCookie = vendorReg.setCookie;
  const vendorId =
    vendorReg.body && vendorReg.body.user && vendorReg.body.user.id;

  // Create service as vendor
  const createService = await doFetch("POST", "/api/vendor/services", {
    token: vendorToken,
    body: {
      name: "Test Service",
      description: "Service description",
      price: 1500,
      duration: 60,
      category: "test",
      isActive: true,
    },
  });
  const serviceId = createService.body && createService.body.id;

  // List services (public)
  await doFetch("GET", `/api/vendor/services?vendorId=${vendorId}`);

  // Update service
  await doFetch("PUT", "/api/vendor/services", {
    token: vendorToken,
    body: { id: serviceId, price: 2000 },
  });

  // Delete service
  await doFetch("DELETE", `/api/vendor/services?id=${serviceId}`, {
    token: vendorToken,
  });

  // Register customer
  const custEmail = `cust+${ts}@example.com`;
  const custReg = await doFetch("POST", "/api/auth/register", {
    body: {
      email: custEmail,
      password: "CustomerPass123!",
      userType: "customer",
      firstName: "Customer",
      lastName: "Tester",
    },
  });
  const custToken = custReg.body && custReg.body.accessToken;
  const custId = custReg.body && custReg.body.user && custReg.body.user.id;

  // Re-create a service for booking
  const svc = await doFetch("POST", "/api/vendor/services", {
    token: vendorToken,
    body: {
      name: "Booking Service",
      description: "For booking test",
      price: 1200,
      duration: 30,
      category: "booking",
      isActive: true,
    },
  });
  const svcId = svc.body && svc.body.id;

  // Customer creates booking
  const booking = await doFetch("POST", "/api/bookings", {
    token: custToken,
    body: {
      serviceId: svcId,
      vendorId: vendorId,
      datetime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      notes: "Please confirm",
    },
  });

  // Vendor lists bookings
  await doFetch("GET", `/api/vendor/bookings?vendorId=${vendorId}`);

  // Update booking status (PUT)
  if (booking.body && booking.body.id) {
    await doFetch("PUT", "/api/vendor/bookings", {
      body: { id: booking.body.id, status: "confirmed" },
    });
  }

  // Analytics
  await doFetch("GET", `/api/vendor/analytics?vendorId=${vendorId}`);

  // Vendor profile get
  await doFetch("GET", `/api/vendor/profile?vendorId=${vendorId}`, {
    token: vendorToken,
  });

  // Vendor profile update
  await doFetch("PUT", "/api/vendor/profile", {
    token: vendorToken,
    body: { firstName: "VendorUpdated" },
  });

  // Create admin and approve vendor
  const adminEmail = `admin+${ts}@example.com`;
  const adminReg = await doFetch("POST", "/api/auth/register", {
    body: {
      email: adminEmail,
      password: "AdminPass123!",
      userType: "admin",
      firstName: "Admin",
      lastName: "User",
    },
  });
  const adminToken = adminReg.body && adminReg.body.accessToken;

  // Approve vendor
  await doFetch("POST", "/api/admin/vendor-approval", {
    token: adminToken,
    body: { vendorId: vendorId, action: "approve" },
  });
  await doFetch("GET", "/api/admin/vendor-approval", { token: adminToken });

  // Verify token endpoint
  await doFetch("POST", "/api/auth/verify", { token: custToken });

  // Refresh token (use cookie if present)
  if (custReg.setCookie) {
    const refreshed = await doFetch("POST", "/api/auth/refresh", {
      cookie: custReg.setCookie,
    });
    console.log("Refresh result:", refreshed.status);
  }

  // Signout (clear cookie)
  if (vendorReg.setCookie) {
    await doFetch("POST", "/api/auth/signout", { cookie: vendorReg.setCookie });
  }

  console.log("\nAll requests completed");
}

run().catch((e) => {
  console.error("Run script error:", e);
  process.exit(1);
});
