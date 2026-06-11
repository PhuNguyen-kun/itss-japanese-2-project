import { promises as fs } from "fs";
import path from "path";

export type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "FAILED";

export interface PaymentOrder {
  orderInvoiceNumber: string;
  status: OrderStatus;
  amountVnd: number;
  points: number;
  planId: string;
  createdAt: string;
  paidAt?: string;
  metadata: {
    paymentGateway: "sepay";
    ipnAt?: string;
    syncedAt?: string;
    rawOrder?: unknown;
    rawTransaction?: unknown;
  };
}

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");

async function ensureOrdersFile(): Promise<void> {
  await fs.mkdir(path.dirname(ORDERS_FILE), { recursive: true });
  try {
    await fs.access(ORDERS_FILE);
  } catch {
    await fs.writeFile(ORDERS_FILE, "[]", "utf-8");
  }
}

export async function getAllOrders(): Promise<PaymentOrder[]> {
  await ensureOrdersFile();
  const raw = await fs.readFile(ORDERS_FILE, "utf-8");
  return JSON.parse(raw) as PaymentOrder[];
}

async function saveOrders(orders: PaymentOrder[]): Promise<void> {
  await ensureOrdersFile();
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
}

export async function getOrderByInvoiceNumber(
  orderInvoiceNumber: string
): Promise<PaymentOrder | null> {
  const orders = await getAllOrders();
  return orders.find((o) => o.orderInvoiceNumber === orderInvoiceNumber) ?? null;
}

export async function createOrder(order: PaymentOrder): Promise<PaymentOrder> {
  const orders = await getAllOrders();
  if (orders.some((o) => o.orderInvoiceNumber === order.orderInvoiceNumber)) {
    throw new Error("Order invoice number already exists");
  }
  orders.unshift(order);
  await saveOrders(orders);
  return order;
}

export async function updateOrder(
  orderInvoiceNumber: string,
  patch: Partial<PaymentOrder>
): Promise<PaymentOrder | null> {
  const orders = await getAllOrders();
  const index = orders.findIndex((o) => o.orderInvoiceNumber === orderInvoiceNumber);
  if (index === -1) return null;

  orders[index] = { ...orders[index], ...patch };
  await saveOrders(orders);
  return orders[index];
}
