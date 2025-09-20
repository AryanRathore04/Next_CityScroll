import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  limit,
  where,
  orderBy,
} from "firebase/firestore";

export const dynamic = "force-dynamic";

interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  status: "normal" | "warning" | "critical";
}

interface PerformanceMetrics {
  api_response_times: MetricData[];
  database_performance: MetricData[];
  user_activity: MetricData[];
  error_rates: MetricData[];
  system_resources: MetricData[];
}

export async function GET() {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Simulate performance metrics (in a real app, these would come from monitoring tools)
    const metrics: PerformanceMetrics = {
      api_response_times: [
        {
          name: "Average Response Time",
          value: Math.random() * 300 + 100,
          unit: "ms",
          timestamp: now.toISOString(),
          status: "normal",
        },
        {
          name: "95th Percentile",
          value: Math.random() * 800 + 200,
          unit: "ms",
          timestamp: now.toISOString(),
          status: "normal",
        },
      ],
      database_performance: [
        {
          name: "Query Latency",
          value: Math.random() * 100 + 20,
          unit: "ms",
          timestamp: now.toISOString(),
          status: "normal",
        },
        {
          name: "Connection Pool Usage",
          value: Math.random() * 80 + 10,
          unit: "%",
          timestamp: now.toISOString(),
          status: "normal",
        },
      ],
      user_activity: [
        {
          name: "Active Users",
          value: Math.floor(Math.random() * 500 + 100),
          unit: "users",
          timestamp: now.toISOString(),
          status: "normal",
        },
        {
          name: "Requests per Minute",
          value: Math.floor(Math.random() * 1000 + 200),
          unit: "req/min",
          timestamp: now.toISOString(),
          status: "normal",
        },
      ],
      error_rates: [
        {
          name: "Error Rate",
          value: Math.random() * 2,
          unit: "%",
          timestamp: now.toISOString(),
          status: "normal",
        },
        {
          name: "Failed Logins",
          value: Math.floor(Math.random() * 20),
          unit: "count",
          timestamp: now.toISOString(),
          status: "normal",
        },
      ],
      system_resources: [
        {
          name: "CPU Usage",
          value: Math.random() * 60 + 20,
          unit: "%",
          timestamp: now.toISOString(),
          status: "normal",
        },
        {
          name: "Memory Usage",
          value: Math.random() * 70 + 30,
          unit: "%",
          timestamp: now.toISOString(),
          status: "normal",
        },
      ],
    };

    // Get real data from Firebase where available
    try {
      const vendorsSnap = await getDocs(
        query(collection(db, "vendors"), limit(10)),
      );
      const bookingsSnap = await getDocs(
        query(collection(db, "bookings"), limit(10)),
      );

      metrics.user_activity.push({
        name: "Total Vendors",
        value: vendorsSnap.size,
        unit: "count",
        timestamp: now.toISOString(),
        status: "normal",
      });

      metrics.user_activity.push({
        name: "Recent Bookings",
        value: bookingsSnap.size,
        unit: "count",
        timestamp: now.toISOString(),
        status: "normal",
      });
    } catch (error) {
      console.error("Error fetching real metrics:", error);
    }

    // Set status based on thresholds
    metrics.api_response_times.forEach((metric) => {
      if (metric.name.includes("Response Time") && metric.value > 1000) {
        metric.status = "critical";
      } else if (metric.name.includes("Response Time") && metric.value > 500) {
        metric.status = "warning";
      }
    });

    metrics.error_rates.forEach((metric) => {
      if (metric.name === "Error Rate" && metric.value > 5) {
        metric.status = "critical";
      } else if (metric.name === "Error Rate" && metric.value > 2) {
        metric.status = "warning";
      }
    });

    metrics.system_resources.forEach((metric) => {
      if (metric.value > 90) {
        metric.status = "critical";
      } else if (metric.value > 75) {
        metric.status = "warning";
      }
    });

    return NextResponse.json(metrics, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch metrics", message: (error as Error).message },
      { status: 500 },
    );
  }
}
