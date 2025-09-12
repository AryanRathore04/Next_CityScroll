import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendorId");
  const status = searchParams.get("status");
  if (!vendorId) return NextResponse.json({ error: "vendorId required" }, { status: 400 });
  let qRef = query(collection(db, "bookings"), where("vendorId", "==", vendorId));
  // Optional status filter would normally create additional where; for simplicity, we filter client-side or require a single equality
  const snap = await getDocs(qRef);
  let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (status) data = data.filter((b: any) => b.status === status);
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, status } = body || {};
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
  const ref = doc(db, "bookings", id);
  await updateDoc(ref, { status, updatedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
