const fetch = require("node-fetch");

const BASE = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  console.log("Running vendor services integration test against", BASE);

  // NOTE: This script assumes a vendor account already exists and you have credentials
  // For convenience in dev, you can register a test vendor first using /api/auth/register
  // Here we try to register a vendor with a randomized email to avoid conflicts

  const rand = Math.random().toString(36).slice(2, 8);
  const vendorEmail = `test-vendor-${rand}@example.com`;
  const password = "Testpass123!";

  // Register (if already exists we'll fall back to signin)
  let res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: vendorEmail,
      password,
      userType: "vendor",
      firstName: "Test",
      lastName: "Vendor",
    }),
  });

  let accessToken = null;
  let registerBody = null;

  if ([200, 201].includes(res.status)) {
    registerBody = await res.json();
    console.log("Registered vendor", registerBody.user?.email || vendorEmail);

    // Sign in to get access token (server returns token on signin)
    res = await fetch(`${BASE}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: vendorEmail, password }),
    });

    if (res.status !== 200) {
      const txt = await res.text();
      throw new Error(`Signin after register failed: ${res.status} ${txt}`);
    }

    const signinBody = await res.json();
    accessToken = signinBody.accessToken;
    if (!accessToken) throw new Error("No access token returned from signin");
  } else {
    // Registration failed (likely duplicate). Try signing in with same creds and continue.
    const txt = await res.text();
    console.warn(
      `Register returned ${res.status}: ${txt}. Attempting signin instead.`,
    );

    res = await fetch(`${BASE}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: vendorEmail, password }),
    });

    if (res.status !== 200) {
      const signinTxt = await res.text();
      throw new Error(`Signin fallback failed: ${res.status} ${signinTxt}`);
    }

    const signinBody = await res.json();
    accessToken = signinBody.accessToken;
    if (!accessToken)
      throw new Error("No access token returned from signin fallback");

    // try to obtain vendor id from verify endpoint or reuse an earlier field — we'll use /api/auth/verify
    try {
      const verifyRes = await fetch(`${BASE}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (verifyRes.ok) {
        const verifyBody = await verifyRes.json();
        registerBody = { user: verifyBody.user };
      }
    } catch (e) {
      // ignore
    }
  }

  const authHeader = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // Create service
  const newService = {
    name: "Integration Test Service",
    description: "Service created by integration test",
    price: 1999,
    duration: 45,
    category: "test",
    isActive: true,
  };

  res = await fetch(`${BASE}/api/vendor/services`, {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify(newService),
  });

  if (res.status !== 200) {
    const txt = await res.text();
    throw new Error(`Create service failed: ${res.status} ${txt}`);
  }
  const created = await res.json();
  console.log("Created service id", created.id);

  // List services for vendor (using vendorId = returned user id)
  const vendorId = registerBody.user?.id;
  if (!vendorId)
    throw new Error("Vendor id not available from registration response");

  res = await fetch(`${BASE}/api/vendor/services?vendorId=${vendorId}`);
  if (res.status !== 200) {
    const txt = await res.text();
    throw new Error(`List services failed: ${res.status} ${txt}`);
  }
  const list = await res.json();
  console.log(`Found ${list.length} services for vendor ${vendorId}`);

  // Update the service
  const updates = {
    id: created.id,
    name: "Updated Integration Service",
    price: 2499,
  };
  res = await fetch(`${BASE}/api/vendor/services`, {
    method: "PUT",
    headers: authHeader,
    body: JSON.stringify(updates),
  });
  if (res.status !== 200) {
    const txt = await res.text();
    throw new Error(`Update service failed: ${res.status} ${txt}`);
  }
  console.log("Updated service", created.id);

  // Delete the service
  res = await fetch(`${BASE}/api/vendor/services?id=${created.id}`, {
    method: "DELETE",
    headers: authHeader,
  });
  if (res.status !== 200) {
    const txt = await res.text();
    throw new Error(`Delete service failed: ${res.status} ${txt}`);
  }
  console.log("Deleted service", created.id);

  console.log("ALL SERVICE TESTS PASSED");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
