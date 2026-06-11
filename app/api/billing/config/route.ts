import { NextResponse } from "next/server";
import { isSepayConfigured } from "@/lib/sepay";
import { TOPUP_PLAN_LIST, VND_PER_POINT } from "@/lib/paymentPlans";

export async function GET() {
  return NextResponse.json({
    sepay: {
      enabled: isSepayConfigured(),
      vndPerPoint: VND_PER_POINT,
    },
    plans: TOPUP_PLAN_LIST.map((p) => ({
      id: p.id,
      points: p.points,
      amountVnd: p.amountVnd,
    })),
  });
}
