import { readJson, writeJson } from "./storage";

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

const ORDERS_KEY = "data/orders.json";

async function ensureOrdersFile(): Promise<void> {
  const orders = await readJson<PaymentOrder[] | null>(ORDERS_KEY, null);
  if (orders === null) {
    await writeJson(ORDERS_KEY, []);
  }
}

export async function getAllOrders(): Promise<PaymentOrder[]> {
  await ensureOrdersFile();
  return readJson(ORDERS_KEY, []);
}

async function saveOrders(orders: PaymentOrder[]): Promise<void> {
  await ensureOrdersFile();
  await writeJson(ORDERS_KEY, orders);
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
