import { NextResponse } from "next/server";
import { handleSepayIpn, verifySepayIpnAuth } from "@/lib/sepay";

export async function POST(request: Request) {
  if (!verifySepayIpnAuth(request.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    await handleSepayIpn(body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SePay IPN error:", err);
    return NextResponse.json({ error: "IPN processing failed" }, { status: 500 });
  }
}
