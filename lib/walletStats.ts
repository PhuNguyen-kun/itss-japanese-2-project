import type { WalletStats } from "./api-client";
import { getAllAssignments, sumAtRiskPoints, sumDepositedPoints } from "./db";
import { processOverdueTasks } from "./overdue";
import { getWallet, getWalletStats } from "./wallet";

export async function loadWalletStats(): Promise<WalletStats> {
  await processOverdueTasks();
  const wallet = await getWallet();
  const assignments = await getAllAssignments();

  return {
    ...getWalletStats(wallet, sumAtRiskPoints(assignments)),
    deposited: sumDepositedPoints(assignments),
  };
}
