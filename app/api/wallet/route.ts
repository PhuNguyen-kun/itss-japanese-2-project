import { NextResponse } from "next/server";
import { getWallet, getWalletStats } from "@/lib/wallet";
import { getAllAssignments, sumAtRiskPoints, sumDepositedPoints } from "@/lib/db";
import { processOverdueTasks } from "@/lib/overdue";

export async function GET() {
  await processOverdueTasks();
  const wallet = await getWallet();
  const assignments = await getAllAssignments();
  const stats = getWalletStats(wallet, sumAtRiskPoints(assignments));

  return NextResponse.json({
    ...stats,
    deposited: sumDepositedPoints(assignments),
  });
}
