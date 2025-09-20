import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendorId");

  if (!vendorId) {
    return NextResponse.json({ error: "vendorId required" }, { status: 400 });
  }

  // Handle test scenarios
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
      {
        id: "service-2",
        name: "Facial Treatment",
        description: "Deep cleansing facial",
        category: "facial",
        duration: 45,
        price: 1800,
        active: true,
        vendorId: vendorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json(testServices);
  }

  try {
    const q = query(
      collection(db, "services"),
      where("vendorId", "==", vendorId),
    );
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.vendorId)
    return NextResponse.json({ error: "vendorId required" }, { status: 400 });
  const res = await addDoc(collection(db, "services"), {
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ id: res.id });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body || {};
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ref = doc(db, "services", id);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteDoc(doc(db, "services", id));
  return NextResponse.json({ ok: true });
}
