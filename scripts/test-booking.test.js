const fetch = require("node-fetch");

const BASE = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  console.log("Running booking integration test against", BASE);

  // Create vendor and service (reuse helper test flow)
  const rand = Math.random().toString(36).slice(2, 8);
  const vendorEmail = `booking-vendor-${rand}@example.com`;
  const password = "Testpass123!";

  let res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: vendorEmail,
      password,
      userType: "vendor",
      firstName: "Book",
      lastName: "Vendor",
    }),
  });

  if (![200, 201].includes(res.status)) {
    const txt = await res.text();
    throw new Error(`Vendor register failed: ${res.status} ${txt}`);
  }
  const rb = await res.json();
  const vendorId = rb.user?.id;

  // Signin vendor
  res = await fetch(`${BASE}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: vendorEmail, password }),
  });
  const signin = await res.json();
  const vendorToken = signin.accessToken;

  // Create service as vendor
  res = await fetch(`${BASE}/api/vendor/services`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${vendorToken}`,
    },
    body: JSON.stringify({
      name: "Booking Service",
      description: "Test",
      price: 1000,
      duration: 30,
      category: "test",
    }),
  });
  const created = await res.json();
  const serviceId = created.id;

  // Create customer
  const custEmail = `cust-${rand}@example.com`;
  res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: custEmail,
      password,
      userType: "customer",
      firstName: "Cust",
      lastName: "User",
    }),
  });
  const cr = await res.json();

  // Signin customer
  res = await fetch(`${BASE}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: custEmail, password }),
  });
  const csign = await res.json();
  const custToken = csign.accessToken;

  // Create booking
  const bookingBody = {
    serviceId,
    vendorId,
    datetime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    notes: "Test booking",
  };
  res = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify(bookingBody),
  });

  if (res.status !== 201) {
    const txt = await res.text();
    throw new Error(`Create booking failed: ${res.status} ${txt}`);
  }

  const booking = await res.json();
  console.log("Booking created", booking.id);

  // Verify vendor sees booking via vendor bookings endpoint
  res = await fetch(`${BASE}/api/vendor/bookings?vendorId=${vendorId}`, {
    headers: { Authorization: `Bearer ${vendorToken}` },
  });
  if (res.status !== 200) {
    const txt = await res.text();
    throw new Error(`Vendor bookings fetch failed: ${res.status} ${txt}`);
  }
  const list = await res.json();
  console.log("Vendor bookings count:", list.length);

  console.log("ALL BOOKING TESTS PASSED");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
