import { promises as fs } from "fs";
import path from "path";
import type { Wallet, WalletTransaction } from "./types";

const WALLET_FILE = path.join(process.cwd(), "data", "wallet.json");

const DEFAULT_WALLET: Wallet = {
  balance: 2500,
  lost: 0,
  reclaimed: 0,
  transactions: [],
};

async function ensureWalletFile(): Promise<void> {
  await fs.mkdir(path.dirname(WALLET_FILE), { recursive: true });
  try {
    await fs.access(WALLET_FILE);
  } catch {
    await fs.writeFile(WALLET_FILE, JSON.stringify(DEFAULT_WALLET, null, 2), "utf-8");
  }
}

export async function getWallet(): Promise<Wallet> {
  await ensureWalletFile();
  const raw = await fs.readFile(WALLET_FILE, "utf-8");
  return JSON.parse(raw) as Wallet;
}

export async function saveWallet(wallet: Wallet): Promise<void> {
  await ensureWalletFile();
  await fs.writeFile(WALLET_FILE, JSON.stringify(wallet, null, 2), "utf-8");
}

function nextTxId(wallet: Wallet): number {
  return wallet.transactions.length > 0
    ? Math.max(...wallet.transactions.map((t) => t.id)) + 1
    : 1;
}

export async function deductDeposit(
  amount: number,
  label: string
): Promise<Wallet> {
  const wallet = await getWallet();
  if (wallet.balance < amount) {
    throw new Error("Insufficient balance");
  }
  wallet.balance -= amount;
  wallet.transactions.unshift({
    id: nextTxId(wallet),
    type: "deposit",
    task: label,
    amount,
    date: new Date().toISOString(),
  });
  await saveWallet(wallet);
  return wallet;
}

export async function reclaimPoints(
  amount: number,
  taskTitle: string
): Promise<Wallet> {
  const wallet = await getWallet();
  wallet.balance += amount;
  wallet.reclaimed += amount;
  wallet.transactions.unshift({
    id: nextTxId(wallet),
    type: "reclaim",
    task: taskTitle,
    amount,
    date: new Date().toISOString(),
  });
  await saveWallet(wallet);
  return wallet;
}

export async function forfeitPoints(
  amount: number,
  taskTitle: string
): Promise<Wallet> {
  const wallet = await getWallet();
  wallet.lost += amount;
  wallet.transactions.unshift({
    id: nextTxId(wallet),
    type: "loss",
    task: taskTitle,
    amount,
    date: new Date().toISOString(),
  });
  await saveWallet(wallet);
  return wallet;
}

export async function topUpPoints(
  amount: number,
  orderInvoiceNumber: string
): Promise<Wallet> {
  const wallet = await getWallet();
  wallet.balance += amount;
  wallet.transactions.unshift({
    id: nextTxId(wallet),
    type: "topup",
    task: `SePay ${orderInvoiceNumber}`,
    amount,
    date: new Date().toISOString(),
  });
  await saveWallet(wallet);
  return wallet;
}

export async function refundPoints(amount: number, label: string): Promise<Wallet> {
  const wallet = await getWallet();
  wallet.balance += amount;
  wallet.transactions.unshift({
    id: nextTxId(wallet),
    type: "refund",
    task: label,
    amount,
    date: new Date().toISOString(),
  });
  await saveWallet(wallet);
  return wallet;
}

export function getWalletStats(wallet: Wallet, assignmentsAtRisk: number) {
  return {
    totalBalance: wallet.balance,
    deposited: assignmentsAtRisk,
    atRisk: assignmentsAtRisk,
    lost: wallet.lost,
    reclaimed: wallet.reclaimed,
    recentTransactions: wallet.transactions.slice(0, 10),
  };
}
