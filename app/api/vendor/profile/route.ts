import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendorId");
  if (!vendorId) return NextResponse.json({ error: "vendorId required" }, { status: 400 });
  const ref = doc(db, "vendors", vendorId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return NextResponse.json(null);
  return NextResponse.json({ id: snap.id, ...snap.data() });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const vendorId = body.vendorId;
  if (!vendorId) return NextResponse.json({ error: "vendorId required" }, { status: 400 });
  const ref = doc(db, "vendors", vendorId);
  await setDoc(ref, { ...body, updatedAt: new Date().toISOString() }, { merge: true });
  return NextResponse.json({ ok: true });
}
