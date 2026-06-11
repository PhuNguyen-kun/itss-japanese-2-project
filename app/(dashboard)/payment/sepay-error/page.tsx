"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function SepayErrorPage() {
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace("/deposit"), 8000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="p-6 max-w-md mx-auto text-center space-y-6 pt-16">
      <XCircle className="mx-auto text-red-500" size={64} />
      <h1 className="text-2xl font-bold text-gray-900">{t.paymentError}</h1>
      <p className="text-gray-600">{t.paymentErrorDesc}</p>
      <button
        type="button"
        onClick={() => router.replace("/deposit")}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700"
      >
        {t.backToWallet}
      </button>
    </div>
  );
}
