"use client";

import { useState, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, AlertCircle, Zap } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getWalletStats, type WalletStats } from "@/lib/api-client";

export function DepositPoints() {
  const { t } = useLanguage();
  const [depositAmount, setDepositAmount] = useState(500);
  const [stats, setStats] = useState<WalletStats | null>(null);

  useEffect(() => {
    getWalletStats().then(setStats).catch(console.error);
  }, []);

  if (!stats) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

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
        <h2 className="font-bold text-gray-900 mb-4">{t.addPoints}</h2>
        <p className="text-sm text-gray-600 mb-4">{t.depositNote}</p>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.depositAmount}
          </label>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={depositAmount}
            onChange={(e) => setDepositAmount(parseInt(e.target.value))}
            className="w-full"
            disabled
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>100</span>
            <span className="text-2xl font-bold text-indigo-600">{depositAmount}</span>
            <span>1000</span>
          </div>
        </div>

        <button
          disabled
          className="w-full bg-gray-300 text-gray-500 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 cursor-not-allowed"
        >
          <Zap size={20} />
          <span>{t.depositBtn} {depositAmount} {t.pointsSuffix}</span>
        </button>
        <p className="text-xs text-gray-500 mt-2">{t.depositOnCreate}</p>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-4">{t.recentActivity}</h2>

        <div className="space-y-3">
          {stats.recentTransactions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No transactions yet</p>
          ) : (
            stats.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === "reclaim"
                      ? "bg-green-100"
                      : transaction.type === "loss"
                      ? "bg-red-100"
                      : "bg-blue-100"
                  }`}>
                    {transaction.type === "reclaim" ? (
                      <TrendingUp className="text-green-600" size={20} />
                    ) : transaction.type === "loss" ? (
                      <TrendingDown className="text-red-600" size={20} />
                    ) : (
                      <Wallet className="text-blue-600" size={20} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{transaction.task}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`font-bold ${
                  transaction.type === "reclaim"
                    ? "text-green-600"
                    : transaction.type === "loss"
                    ? "text-red-600"
                    : "text-blue-600"
                }`}>
                  {transaction.type === "reclaim" ? "+" : "-"}{transaction.amount}
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
