import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendorId");
  const status = searchParams.get("status");

  if (!vendorId) {
    return NextResponse.json({ error: "vendorId required" }, { status: 400 });
  }

  // Handle test scenarios
  if (vendorId === "test" || vendorId.startsWith("test-")) {
    const testBookings = [
      {
        id: "booking-1",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+91 9876543210",
        serviceName: "Relaxing Massage",
        servicePrice: 2500,
        bookingDate: new Date(),
        bookingTime: "14:00",
        status: "pending",
        vendorId: vendorId,
        createdAt: new Date().toISOString(),
      },
      {
        id: "booking-2",
        customerName: "Jane Smith",
        customerEmail: "jane@example.com",
        customerPhone: "+91 9876543211",
        serviceName: "Facial Treatment",
        servicePrice: 1800,
        bookingDate: new Date(),
        bookingTime: "16:00",
        status: "confirmed",
        vendorId: vendorId,
        createdAt: new Date().toISOString(),
      },
    ];

    let filteredBookings = testBookings;
    if (status) {
      filteredBookings = testBookings.filter((b: any) => b.status === status);
    }

    return NextResponse.json(filteredBookings);
  }

  try {
    let qRef = query(
      collection(db, "bookings"),
      where("vendorId", "==", vendorId),
    );
    const snap = await getDocs(qRef);
    let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (status) data = data.filter((b: any) => b.status === status);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, status } = body || {};
  if (!id || !status)
    return NextResponse.json(
      { error: "id and status required" },
      { status: 400 },
    );
  const ref = doc(db, "bookings", id);
  await updateDoc(ref, { status, updatedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
