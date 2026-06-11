import { NextResponse } from "next/server";
import { getOrderByInvoiceNumber } from "@/lib/orders";
import { isSepayConfigured, syncOrderWithSepay } from "@/lib/sepay";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderInvoiceNumber: string }> }
) {
  const { orderInvoiceNumber } = await params;
  const decoded = decodeURIComponent(orderInvoiceNumber);
  const order = await getOrderByInvoiceNumber(decoded);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    orderInvoiceNumber: order.orderInvoiceNumber,
    status: order.status,
    points: order.points,
    amountVnd: order.amountVnd,
    paidAt: order.paidAt ?? null,
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderInvoiceNumber: string }> }
) {
  if (!isSepayConfigured()) {
    return NextResponse.json({ error: "SePay is not configured" }, { status: 503 });
  }

  const { orderInvoiceNumber } = await params;
  const decoded = decodeURIComponent(orderInvoiceNumber);

  try {
    const result = await syncOrderWithSepay(decoded);
    if (result === "not_found") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = await getOrderByInvoiceNumber(decoded);
    return NextResponse.json({
      syncResult: result,
      orderInvoiceNumber: order?.orderInvoiceNumber,
      status: order?.status,
      points: order?.points,
      amountVnd: order?.amountVnd,
      paidAt: order?.paidAt ?? null,
    });
  } catch (err) {
    console.error("SePay sync error:", err);
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
