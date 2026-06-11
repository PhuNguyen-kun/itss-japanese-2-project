import { NextResponse } from "next/server";
import { createSepayCheckout, isSepayConfigured } from "@/lib/sepay";

export async function POST(request: Request) {
  if (!isSepayConfigured()) {
    return NextResponse.json({ error: "SePay is not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const planId = body?.planId as string;
    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    const result = await createSepayCheckout(planId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create checkout";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
