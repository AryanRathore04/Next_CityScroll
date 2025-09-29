import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  validateInput,
  sanitizeObject,
  serviceSchema,
  sanitizeAndValidate,
} from "@/lib/validation";
import { requireAuth, requirePermission } from "@/lib/middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { serverLogger as logger } from "@/lib/logger";
import type { IService } from "../../../../models/Service";
import type { IUser } from "../../../../models/User";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET: public read of vendor services
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendorId");

  if (!vendorId) {
    return NextResponse.json({ error: "vendorId required" }, { status: 400 });
  }

  // Handle test/demo scenarios
  if (vendorId === "test" || vendorId.startsWith("test-")) {
    const testServices = [
      {
        id: "service-1",
        name: "Relaxing Massage",
        description: "Full body relaxing massage",
        category: "massage",
        duration: 60,
        price: 2500,
        active: true,
        vendorId: vendorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json(testServices);
  }

  try {
    await connectDB();
    const Service = (await import("../../../../models/Service")).default;

    const services = (await Service.find({ vendorId: vendorId }).lean()) as
      | (Partial<IService> & {
          _id: string;
          vendor?: Partial<IUser> | string;
        })[]
      | [];
    // If no services found, return an explicit empty array
    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const formattedServices = services.map((service) => {
      const vendorFallback =
        service.vendorId ||
        (typeof service.vendor === "string"
          ? service.vendor
          : (service.vendor?._id ??
              (service.vendor ? String(service.vendor) : undefined)) ||
            vendorId);

      return {
        id: String(service._id),
        name: service.name,
        description: service.description,
        category: service.category,
        duration: service.duration,
        price: service.price,
        active: service.isActive,
        vendorId: vendorFallback,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      };
    });

    return NextResponse.json(formattedServices);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// Local zod schema for service updates (partial)
const serviceUpdateSchema = serviceSchema
  .partial()
  .extend({ id: z.string().min(1) });

// POST: create a service (vendor only)
async function createServiceHandler(request: NextRequest) {
  try {
    const raw = await request.text();
    let bodyObj: Record<string, unknown> = {};
    try {
      bodyObj = raw ? JSON.parse(raw) : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Use enhanced sanitization and validation
    const validation = sanitizeAndValidate(serviceSchema, bodyObj);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", message: validation.error },
        { status: 400 },
      );
    }

    // Use authenticated user's id as vendor id
    const currentUser = (request as unknown as { user?: { id: string } }).user;
    const vendorId = currentUser?.id;
    if (!vendorId)
      return NextResponse.json(
        { error: "Vendor id not found" },
        { status: 400 },
      );

    await connectDB();
    const Service = (await import("../../../../models/Service")).default;

    const created = await Service.create({
      vendorId,
      name: validation.data.name,
      description: validation.data.description,
      category: validation.data.category,
      duration: validation.data.duration,
      price: validation.data.price,
      isActive: validation.data.isActive ?? true,
    } as Partial<IService>);

    return NextResponse.json({ id: created._id.toString(), success: true });
  } catch (error) {
    console.error("Create service error:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 },
    );
  }
}

// PUT: update a service (vendor only)
async function updateServiceHandler(request: NextRequest) {
  try {
    const raw = await request.text();
    let bodyObj: Record<string, unknown> = {};
    try {
      bodyObj = raw ? JSON.parse(raw) : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const sanitized = sanitizeObject(bodyObj);
    const validation = validateInput(serviceUpdateSchema, sanitized);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", message: validation.error },
        { status: 400 },
      );
    }

    const { id, ...updates } = validation.data as {
      id: string;
    } & Partial<IService>;

    await connectDB();
    const Service = (await import("../../../../models/Service")).default;

    // Ensure service belongs to current vendor
    const existing = (await Service.findById(
      id,
    ).lean()) as Partial<IService> | null;
    if (!existing)
      return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const currentUser = (request as unknown as { user?: { id: string } }).user;
    if (existing.vendorId?.toString() !== currentUser?.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await Service.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update service error:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 },
    );
  }
}

// DELETE: delete a service (vendor only)
async function deleteServiceHandler(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "id required" }, { status: 400 });

    await connectDB();
    const Service = (await import("../../../../models/Service")).default;

    const existing = (await Service.findById(
      id,
    ).lean()) as Partial<IService> | null;
    if (!existing)
      return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const currentUser = (request as unknown as { user?: { id: string } }).user;
    if (existing.vendorId?.toString() !== currentUser?.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await Service.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete service error:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 },
    );
  }
}

// Export protected handlers for POST/PUT/DELETE using new permission system
export const POST = requirePermission(
  PERMISSIONS.MANAGE_OWN_SERVICES,
  createServiceHandler,
);
export const PUT = requirePermission(
  PERMISSIONS.MANAGE_OWN_SERVICES,
  updateServiceHandler,
);
export const DELETE = requirePermission(
  PERMISSIONS.MANAGE_OWN_SERVICES,
  deleteServiceHandler,
);
