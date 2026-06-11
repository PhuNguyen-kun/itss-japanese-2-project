import { SePayPgClient } from "sepay-pg-node";
import { createOrder, getOrderByInvoiceNumber, updateOrder } from "./orders";
import { TOPUP_PLANS } from "./paymentPlans";
import { getWallet, topUpPoints } from "./wallet";

const SEPAY_ENV = (process.env.SEPAY_ENV || "sandbox") as "sandbox" | "production";
const MERCHANT_ID = process.env.SEPAY_MERCHANT_ID || "";
const SECRET_KEY = process.env.SEPAY_SECRET_KEY || "";

function getFrontendBaseUrl(): string {
  const url = process.env.FRONTEND_URL || "http://localhost:3000";
  return url.startsWith("http") ? url.replace(/\/$/, "") : `https://${url.replace(/\/$/, "")}`;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function isSepayConfigured(): boolean {
  return Boolean(MERCHANT_ID && SECRET_KEY);
}

export function getSepayClient(): SePayPgClient {
  if (!isSepayConfigured()) {
    throw new Error("SePay is not configured");
  }
  return new SePayPgClient({
    env: SEPAY_ENV,
    merchant_id: MERCHANT_ID,
    secret_key: SECRET_KEY,
  });
}

function isSepayPaidStatus(status: string | undefined): boolean {
  if (!status) return false;
  const normalized = status.toUpperCase();
  return normalized === "CAPTURED" || normalized === "PAID" || normalized === "SUCCESS";
}

function extractSepayOrderStatus(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const data = payload as Record<string, unknown>;

  if (typeof data.order_status === "string") return data.order_status;

  const nested = data.data;
  if (nested && typeof nested === "object") {
    const nestedData = nested as Record<string, unknown>;
    if (typeof nestedData.order_status === "string") return nestedData.order_status;
    if (nestedData.order && typeof nestedData.order === "object") {
      const order = nestedData.order as Record<string, unknown>;
      if (typeof order.order_status === "string") return order.order_status;
    }
  }

  if (data.order && typeof data.order === "object") {
    const order = data.order as Record<string, unknown>;
    if (typeof order.order_status === "string") return order.order_status;
  }

  return undefined;
}

/** Idempotent: mark order PAID and credit wallet once */
export async function fulfillPaidOrder(
  orderInvoiceNumber: string,
  metadataExtra: Record<string, unknown> = {}
): Promise<boolean> {
  const order = await getOrderByInvoiceNumber(orderInvoiceNumber);
  if (!order) return false;
  if (order.status === "PAID") return true;
  if (order.status !== "PENDING") return false;

  await updateOrder(orderInvoiceNumber, {
    status: "PAID",
    paidAt: new Date().toISOString(),
    metadata: {
      ...order.metadata,
      ...metadataExtra,
    },
  });

  const wallet = await getWallet();
  const alreadyCredited = wallet.transactions.some(
    (tx) => tx.type === "topup" && tx.task === `SePay ${orderInvoiceNumber}`
  );
  if (!alreadyCredited) {
    await topUpPoints(order.points, orderInvoiceNumber);
  }

  return true;
}

export async function createSepayCheckout(planId: string) {
  const plan = TOPUP_PLANS[planId];
  if (!plan) throw new Error("Invalid plan");

  const orderInvoiceNumber = `TC-${Date.now()}-${randomId()}`;
  const baseUrl = getFrontendBaseUrl();

  await createOrder({
    orderInvoiceNumber,
    status: "PENDING",
    amountVnd: plan.amountVnd,
    points: plan.points,
    planId: plan.id,
    createdAt: new Date().toISOString(),
    metadata: { paymentGateway: "sepay" },
  });

  const client = getSepayClient();
  const checkoutUrl = client.checkout.initCheckoutUrl();
  const formFields = client.checkout.initOneTimePaymentFields({
    operation: "PURCHASE",
    payment_method: "BANK_TRANSFER",
    order_invoice_number: orderInvoiceNumber,
    order_amount: plan.amountVnd,
    currency: "VND",
    order_description: plan.description,
    success_url: `${baseUrl}/payment/sepay-success?order=${encodeURIComponent(orderInvoiceNumber)}`,
    error_url: `${baseUrl}/payment/sepay-error`,
    cancel_url: `${baseUrl}/deposit`,
  });

  return { checkoutUrl, formFields, orderId: orderInvoiceNumber };
}

export interface SepayIpnBody {
  notification_type?: string;
  order?: {
    order_invoice_number?: string;
    order_amount?: number;
    order_status?: string;
  };
  order_invoice_number?: string;
  transaction?: unknown;
}

export async function handleSepayIpn(body: SepayIpnBody): Promise<void> {
  if (body?.notification_type !== "ORDER_PAID") return;

  const orderInvoiceNumber =
    body?.order?.order_invoice_number ?? body?.order_invoice_number;
  if (!orderInvoiceNumber) return;

  await fulfillPaidOrder(orderInvoiceNumber, {
    ipnAt: new Date().toISOString(),
    rawOrder: body?.order,
    rawTransaction: body?.transaction,
  });
}

/** Fallback when IPN cannot reach localhost — query SePay API directly */
export async function syncOrderWithSepay(
  orderInvoiceNumber: string
): Promise<"paid" | "pending" | "not_found"> {
  const order = await getOrderByInvoiceNumber(orderInvoiceNumber);
  if (!order) return "not_found";
  if (order.status === "PAID") return "paid";

  const client = getSepayClient();
  const response = await client.order.retrieve(orderInvoiceNumber);
  const sepayStatus = extractSepayOrderStatus(response.data);

  if (!isSepayPaidStatus(sepayStatus)) {
    return "pending";
  }

  await fulfillPaidOrder(orderInvoiceNumber, {
    syncedAt: new Date().toISOString(),
    rawOrder: response.data,
  });

  return "paid";
}

export function verifySepayIpnAuth(headers: Headers): boolean {
  const secret = SECRET_KEY;
  const allowNoAuth = process.env.SEPAY_IPN_ALLOW_NO_AUTH === "true";

  const authHeader = headers.get("authorization");
  const keyFromHeader =
    headers.get("x-secret-key") ??
    (authHeader?.startsWith("Apikey ") ? authHeader.slice(7).trim() : undefined);

  if (keyFromHeader) {
    return Boolean(secret && keyFromHeader === secret);
  }

  return allowNoAuth;
}
