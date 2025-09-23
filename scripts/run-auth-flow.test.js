const fetch = require("node-fetch");
const fs = require("fs");
const assert = require("assert").strict;
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const jarPath = path.resolve(__dirname, "test-cookie-jar.txt");

// tiny cookie jar helpers using curl-format file
function saveCookies(setCookieHeader) {
  // append a simple cookie line for curl to use; we will manage via fetch headers for simplicity
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

async function postJson(pathname, body, sendCookie) {
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

(async () => {
  try {
    console.log("Registering test user...");
    const reg = await postJson(
      "/api/auth/register",
      {
        firstName: "Palak",
        lastName: "Rakheja",
        email: `palak+test${Date.now()}@example.com`,
        password: "Weak@098",
        userType: "customer",
      },
      false,
    );
    assert.equal(reg.status, 201, "Register should return 201");
    assert.ok(reg.setCookie, "Register should set refresh cookie");
    console.log("Register OK");

    console.log("Signing in...");
    const signin = await postJson(
      "/api/auth/signin",
      {
        email: reg.body.user.email,
        password: "Weak@098",
      },
      true,
    );
    assert.equal(signin.status, 200, "Signin should return 200");
    assert.ok(signin.body.accessToken, "Signin should return accessToken");
    console.log("Signin OK");

    console.log("Refreshing token...");
    const refresh = await postJson("/api/auth/refresh", {}, true);
    assert.equal(refresh.status, 200, "Refresh should return 200");
    assert.ok(refresh.body.accessToken, "Refresh should return accessToken");
    console.log("Refresh OK");

    console.log("Signing out...");
    const signout = await postJson("/api/auth/signout", {}, true);
    assert.equal(signout.status, 200, "Signout should return 200");
    console.log("Signout OK");

    console.log("Verifying refresh post-signout fails...");
    const refreshAfter = await postJson("/api/auth/refresh", {}, true);
    assert.equal(
      refreshAfter.status,
      401,
      "Refresh after signout should return 401",
    );

    console.log("\nALL TESTS PASSED");
    process.exit(0);
  } catch (err) {
    console.error("\nTEST FAILED:", err && err.message ? err.message : err);
    process.exit(2);
  }
})();
