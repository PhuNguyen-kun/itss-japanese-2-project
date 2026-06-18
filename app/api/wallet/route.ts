import { NextResponse } from "next/server";
import { loadWalletStats } from "@/lib/walletStats";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await loadWalletStats();
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "no-store" },
  });
}
