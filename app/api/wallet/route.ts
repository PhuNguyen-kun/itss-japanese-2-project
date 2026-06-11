import { NextResponse } from "next/server";
import { loadWalletStats } from "@/lib/walletStats";

export async function GET() {
  const stats = await loadWalletStats();
  return NextResponse.json(stats);
}
