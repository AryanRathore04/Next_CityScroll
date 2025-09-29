import { serverLogger as logger } from "./logger";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // Maintain proper stack trace for where our error was thrown (Node.js)
    Error.captureStackTrace(this, this.constructor);

    // Log the error
    logger.error("AppError created", {
      message: this.message,
      statusCode: this.statusCode,
      stack: this.stack,
      isOperational: this.isOperational,
    });
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Invalid input data") {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429);
  }
}

// Global error handler for API routes
export function handleApiError(error: unknown): {
  message: string;
  statusCode: number;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  // Log unexpected errors
  logger.error("Unexpected error in API route", {
    error: error instanceof Error ? error.stack : String(error),
  });

  // Don't expose internal errors to clients
  return {
    message: "Internal server error",
    statusCode: 500,
  };
}

// Type for API error responses
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}
