"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { syncPaymentOrder } from "@/lib/api-client";
import { useWallet } from "@/context/WalletContext";
import { formatVnd } from "@/lib/paymentPlans";
import { PageLoading } from "@/components/Loading";

function SepaySuccessContent() {
  const { t } = useLanguage();
  const { refreshWallet } = useWallet();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">("loading");
  const [points, setPoints] = useState(0);
  const [amountVnd, setAmountVnd] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8;

    const verify = async () => {
      try {
        const order = await syncPaymentOrder(orderId);
        if (cancelled) return;

        setPoints(order.points);
        setAmountVnd(order.amountVnd);

        if (order.status === "PAID") {
          await refreshWallet();
          setStatus("paid");
          return;
        }

        attempts += 1;
        if (attempts < maxAttempts) {
          setStatus("pending");
          setTimeout(verify, 2000);
        } else {
          setStatus("pending");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [orderId, refreshWallet]);

  return (
    <div className="p-6 max-w-md mx-auto text-center space-y-6 pt-16">
      {status === "loading" && (
        <>
          <Loader2 className="mx-auto text-indigo-600 animate-spin" size={48} />
          <p className="text-gray-600">{t.paymentVerifying}</p>
        </>
      )}

      {status === "paid" && (
        <>
          <CheckCircle2 className="mx-auto text-green-500" size={64} />
          <h1 className="text-2xl font-bold text-gray-900">{t.paymentSuccess}</h1>
          <p className="text-gray-600">
            +{points.toLocaleString()} {t.pointsSuffix} ({formatVnd(amountVnd)})
          </p>
          <button
            type="button"
            onClick={() => router.replace("/deposit")}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700"
          >
            {t.backToWallet}
          </button>
        </>
      )}

      {status === "pending" && (
        <>
          <Loader2 className="mx-auto text-amber-500 animate-spin" size={48} />
          <h1 className="text-xl font-bold text-gray-900">{t.paymentPendingTitle}</h1>
          <p className="text-sm text-gray-600">{t.paymentPendingDesc}</p>
          <button
            type="button"
            onClick={() => router.replace("/deposit")}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700"
          >
            {t.backToWallet}
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-xl font-bold text-red-600">{t.paymentError}</h1>
          <button
            type="button"
            onClick={() => router.replace("/deposit")}
            className="w-full bg-gray-600 text-white py-3 rounded-xl font-bold hover:bg-gray-700"
          >
            {t.backToWallet}
          </button>
        </>
      )}
    </div>
  );
}

export default function SepaySuccessPage() {
  return (
    <Suspense fallback={<PageLoading variant="spinner" />}>
      <SepaySuccessContent />
    </Suspense>
  );
}
