"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  getBillingConfig,
  createSepayCheckout,
  type BillingConfig,
} from "@/lib/api-client";
import { useWallet } from "@/context/WalletContext";
import { submitSepayCheckout } from "@/lib/sepayCheckout";
import { formatVnd } from "@/lib/paymentPlans";

export function DepositPoints() {
  const { t } = useLanguage();
  const { stats } = useWallet();
  const [billing, setBilling] = useState<BillingConfig | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("500");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBillingConfig().then(setBilling).catch(console.error);
  }, []);

  const selectedPlan = billing?.plans.find((p) => p.id === selectedPlanId);

  const handlePay = async () => {
    if (!selectedPlanId || paying) return;
    setPaying(true);
    setError(null);
    try {
      const { checkoutUrl, formFields } = await createSepayCheckout(selectedPlanId);
      submitSepayCheckout(checkoutUrl, formFields);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setPaying(false);
    }
  };

  if (!stats || !billing) {
    return <div className="p-8 text-gray-500">{t.loading}</div>;
  }

  const sepayEnabled = billing.sepay.enabled;

  return (
    <div className="p-4 space-y-6">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.pointVault}</h1>
        <p className="text-gray-600">{t.manageDeposits}</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm opacity-90">{t.totalBalance}</span>
          <Wallet size={24} />
        </div>
        <div className="text-5xl font-bold mb-1">{stats.totalBalance.toLocaleString()}</div>
        <p className="text-sm opacity-90">{t.availablePoints}</p>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white bg-opacity-20 rounded-xl p-3">
            <div className="text-2xl font-bold">{stats.deposited.toLocaleString()}</div>
            <div className="text-xs opacity-90">{t.deposited}</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-3">
            <div className="text-2xl font-bold text-orange-300">{stats.atRisk.toLocaleString()}</div>
            <div className="text-xs opacity-90">{t.atRisk}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
          <TrendingUp className="text-green-600 mx-auto mb-2" size={28} />
          <div className="text-2xl font-bold text-green-600">{stats.reclaimed.toLocaleString()}</div>
          <div className="text-xs text-green-700 mt-1">{t.reclaimed}</div>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
          <TrendingDown className="text-red-600 mx-auto mb-2" size={28} />
          <div className="text-2xl font-bold text-red-600">{stats.lost.toLocaleString()}</div>
          <div className="text-xs text-red-700 mt-1">{t.lost}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-1">{t.addPoints}</h2>
        <p className="text-sm text-gray-600 mb-4">{t.conversionRate}</p>

        {!sepayEnabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
            {t.sepayNotConfigured}
          </div>
        )}

        <p className="text-sm font-semibold text-gray-700 mb-3">{t.selectPackage}</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {billing.plans.map((plan) => {
            const selected = plan.id === selectedPlanId;
            return (
              <button
                key={plan.id}
                type="button"
                disabled={!sepayEnabled || paying}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selected
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                    : "border-gray-200 hover:border-indigo-300"
                } ${!sepayEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-indigo-600">
                    {plan.points.toLocaleString()}
                  </span>
                  {selected && <CheckCircle2 className="text-indigo-600" size={20} />}
                </div>
                <div className="text-xs text-gray-500 mt-1">{t.pointsSuffix}</div>
                <div className="text-sm font-semibold text-gray-800 mt-2">
                  {formatVnd(plan.amountVnd)}
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={!sepayEnabled || paying || !selectedPlan}
          onClick={handlePay}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:from-indigo-700 hover:to-purple-700 transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {paying ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>{t.paymentProcessing}</span>
            </>
          ) : (
            <>
              <CreditCard size={20} />
              <span>
                {t.payWithSePay}{" "}
                {selectedPlan
                  ? `— ${selectedPlan.points.toLocaleString()} ${t.pointsSuffix} (${formatVnd(selectedPlan.amountVnd)})`
                  : ""}
              </span>
            </>
          )}
        </button>

        <div className="bg-indigo-50 rounded-lg p-3 mt-4">
          <p className="text-xs text-indigo-900">{t.depositNote}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-4">{t.recentActivity}</h2>

        <div className="space-y-3">
          {stats.recentTransactions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">{t.noTransactions}</p>
          ) : (
            stats.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === "reclaim" || transaction.type === "topup" || transaction.type === "refund"
                      ? "bg-green-100"
                        : transaction.type === "loss"
                        ? "bg-red-100"
                        : "bg-blue-100"
                    }`}
                  >
                    {transaction.type === "reclaim" || transaction.type === "topup" || transaction.type === "refund" ? (
                      <TrendingUp className="text-green-600" size={20} />
                    ) : transaction.type === "loss" ? (
                      <TrendingDown className="text-red-600" size={20} />
                    ) : (
                      <Wallet className="text-blue-600" size={20} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {transaction.type === "topup" ? t.topupLabel : transaction.task}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-bold ${
                    transaction.type === "reclaim" || transaction.type === "topup" || transaction.type === "refund"
                      ? "text-green-600"
                      : transaction.type === "loss"
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {transaction.type === "reclaim" || transaction.type === "topup" || transaction.type === "refund" ? "+" : "-"}
                  {transaction.amount.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start space-x-3">
        <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-semibold text-amber-900">{t.lossAversionPsych}</p>
          <p className="text-xs text-amber-700 mt-1">{t.lossAversionPsychDesc}</p>
        </div>
      </div>
    </div>
  );
}
