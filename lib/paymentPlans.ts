export const VND_PER_POINT = 100;

export interface TopUpPlan {
  id: string;
  points: number;
  amountVnd: number;
  description: string;
}

export const TOPUP_PLANS: Record<string, TopUpPlan> = {
  "100": {
    id: "100",
    points: 100,
    amountVnd: 10_000,
    description: "Nap 100 diem TaskCommit",
  },
  "250": {
    id: "250",
    points: 250,
    amountVnd: 25_000,
    description: "Nap 250 diem TaskCommit",
  },
  "500": {
    id: "500",
    points: 500,
    amountVnd: 50_000,
    description: "Nap 500 diem TaskCommit",
  },
  "1000": {
    id: "1000",
    points: 1000,
    amountVnd: 100_000,
    description: "Nap 1000 diem TaskCommit",
  },
};

export const TOPUP_PLAN_LIST = Object.values(TOPUP_PLANS);

export function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}
