// --- SERVER-SIDE LOGGER ---
// We avoid importing 'winston' at module top-level so bundlers don't include
// Node-only modules like 'fs' into client bundles. Winston is required at
// runtime only when running on the server.
let serverLogger: any = undefined;
if (typeof window === "undefined") {
  try {
    // Use eval('require') to prevent bundlers from statically analyzing this
    // require and including 'winston' (and its dependency on 'fs') in client
    // bundles.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const winston = eval("require")("winston");

    const transports = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
    ];

    // Only add file transport in development (avoid writing files in serverless prod)
    if (process.env.NODE_ENV === "development") {
      transports.push(
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
      );
      transports.push(
        new winston.transports.File({ filename: "logs/combined.log" }),
      );
    }

    serverLogger = winston.createLogger({
      level: process.env.NODE_ENV === "development" ? "debug" : "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports,
    });
  } catch (err) {
    // If winston cannot be required for any reason, fall back to a no-op logger.
    serverLogger = {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
      log: () => {},
    };
  }
}

// --- CLIENT-SIDE LOGGER ---
// This is a lightweight, browser-safe logger.
// It simply uses the browser's console and adds labels.
const clientLogger = {
  log: (message: string, ...args: any[]) =>
    console.log(`[LOG] ${message}`, ...args),
  info: (message: string, ...args: any[]) =>
    console.info(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: any[]) =>
    console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) =>
    console.error(`[ERROR] ${message}`, ...args),
  debug: (message: string, ...args: any[]) =>
    console.debug(`[DEBUG] ${message}`, ...args),
};

export { serverLogger, clientLogger };
