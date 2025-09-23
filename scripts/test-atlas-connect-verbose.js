const fs = require("fs");
const path = require("path");

function loadEnv(filePath) {
  const txt = fs.readFileSync(filePath, "utf8");
  const lines = txt.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

(async () => {
  try {
    const envPath = path.resolve(__dirname, "..", ".env.local");
    const env = loadEnv(envPath);
    const uri = env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI not set");
      process.exit(2);
    }

    console.log(
      "URI (redacted):",
      uri.replace(/([^:@\/]+:[^:@\/]+@)/, "[REDACTED@]"),
    );

    console.log("\n1) Trying native MongoDB driver...");
    const { MongoClient } = require("mongodb");
    const clientOpts = { serverSelectionTimeoutMS: 15000, tls: true };
    const client = new MongoClient(uri, clientOpts);
    try {
      await client.connect();
      console.log("✅ Native MongoClient connected successfully");
      await client.close();
    } catch (e) {
      console.error("Native MongoClient error:");
      console.error(e && e.stack ? e.stack : e);
    }

    console.log(
      "\n1b) Trying native MongoDB driver with tlsAllowInvalidCertificates (diagnostic only)...",
    );
    try {
      const client2 = new MongoClient(uri, {
        serverSelectionTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });
      await client2.connect();
      console.log(
        "✅ Native MongoClient (allowInvalidCerts) connected successfully",
      );
      await client2.close();
    } catch (e) {
      console.error("Native MongoClient (allowInvalidCerts) error:");
      console.error(e && e.stack ? e.stack : e);
    }

    console.log(
      "\n1c) Trying native MongoDB driver forcing IPv4 (diagnostic only)...",
    );
    try {
      const client3 = new MongoClient(uri, {
        serverSelectionTimeoutMS: 15000,
        tls: true,
        family: 4,
      });
      await client3.connect();
      console.log("✅ Native MongoClient (IPv4) connected successfully");
      await client3.close();
    } catch (e) {
      console.error("Native MongoClient (IPv4) error:");
      console.error(e && e.stack ? e.stack : e);
    }

    console.log("\n2) Trying Mongoose...");
    const mongoose = require("mongoose");
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        bufferCommands: false,
      });
      console.log("✅ Mongoose connected successfully");
      await mongoose.disconnect();
    } catch (e) {
      console.error("Mongoose error:");
      console.error(e && e.stack ? e.stack : e);
    }

    process.exit(0);
  } catch (err) {
    console.error("Unexpected error:", err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
