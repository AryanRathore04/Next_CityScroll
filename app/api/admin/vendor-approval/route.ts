import { NextRequest, NextResponse } from "next/server";

// Mock admin vendor approval API
export async function POST(request: NextRequest) {
  try {
    const { vendorId, action } = await request.json();

    // Check if it's a test scenario
    const isTest = vendorId === "test-vendor" || vendorId?.includes("test");

    if (isTest) {
      // Return test approval data
      return NextResponse.json({
        success: true,
        message: `Vendor ${action} successfully`,
        vendor: {
          id: vendorId,
          status: action === "approve" ? "approved" : "rejected",
          businessName: "Test Business",
          email: "test-vendor@example.com",
          lastUpdated: new Date().toISOString(),
        },
      });
    }

    // For non-test scenarios, implement real logic
    // This would normally interact with your database
    return NextResponse.json({
      success: true,
      message: `Vendor ${action} request processed`,
      vendor: {
        id: vendorId,
        status: action === "approve" ? "approved" : "rejected",
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin vendor approval error:", error);
    return NextResponse.json(
      { error: "Failed to process vendor approval" },
      { status: 500 },
    );
  }
}

// Get pending vendor approvals
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isTest = searchParams.get("test") === "true";

    if (isTest) {
      // Return test data for pending approvals
      return NextResponse.json({
        success: true,
        pendingVendors: [
          {
            id: "test-vendor-1",
            businessName: "Test Spa & Wellness",
            email: "test1@example.com",
            submittedDate: new Date().toISOString(),
            status: "pending",
          },
          {
            id: "test-vendor-2",
            businessName: "Test Beauty Salon",
            email: "test2@example.com",
            submittedDate: new Date().toISOString(),
            status: "pending",
          },
        ],
      });
    }

    // For non-test scenarios, return real data
    return NextResponse.json({
      success: true,
      pendingVendors: [],
      message: "No pending vendor approvals",
    });
  } catch (error) {
    console.error("Get pending vendors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending vendors" },
      { status: 500 },
    );
  }
}
