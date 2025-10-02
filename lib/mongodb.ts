import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local",
  );
}

// Global is used here to maintain a cached connection across hot reloads in development
// This prevents connections growing exponentially during API Route usage
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

import { serverLogger as logger } from "./logger";

console.log(
  "🔵 [DATABASE] MongoDB module loaded, checking connection state...",
);
logger.debug("MongoDB connection state", {
  readyState: mongoose.connection.readyState,
});
console.log(
  "🔵 [DATABASE] Current connection readyState:",
  mongoose.connection.readyState,
);

export async function connectDB() {
  console.log(
    "🔵 [DATABASE] connectDB() called, checking cached connection...",
  );

  if (cached.conn) {
    console.log("🟢 [DATABASE] Using existing cached connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log(
      "🔵 [DATABASE] No cached connection, creating new connection to:",
      MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@"),
    );

    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log(
          "🟢 [DATABASE] MongoDB connection established successfully",
        );
        logger.info("MongoDB connected successfully");

        // Log connection details
        console.log("🟢 [DATABASE] Connection details:", {
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          readyState: mongoose.connection.readyState,
        });

        return mongoose;
      })
      .catch((error) => {
        console.error("🔴 [DATABASE] MongoDB connection failed:", error);
        throw error;
      });
  } else {
    console.log("🔵 [DATABASE] Using existing connection promise...");
  }

  try {
    console.log("🔵 [DATABASE] Awaiting connection promise...");
    cached.conn = await cached.promise;
    console.log("🟢 [DATABASE] Connection promise resolved successfully");
  } catch (e) {
    console.error("🔴 [DATABASE] Connection promise failed:", e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default mongoose;
