import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, AlertCircle, Zap } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function DepositPoints() {
  const { t } = useLanguage();
  const [depositAmount, setDepositAmount] = useState(500);

  const stats = {
    totalBalance: 2500,
    deposited: 1200,
    atRisk: 350,
    lost: 250,
    reclaimed: 800,
  };

  const recentTransactions = [
    { id: 1, type: "reclaim", task: "Problem Set 2", amount: 200, date: "2026-04-22" },
    { id: 2, type: "loss", task: "Lab Report 3", amount: 150, date: "2026-04-20" },
    { id: 3, type: "deposit", task: "Research Phase", amount: 150, date: "2026-04-18" },
    { id: 4, type: "reclaim", task: "Essay Draft", amount: 180, date: "2026-04-15" },
  ];

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
        <div className="text-5xl font-bold mb-1">{stats.totalBalance}</div>
        <p className="text-sm opacity-90">{t.availablePoints}</p>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white bg-opacity-20 rounded-xl p-3">
            <div className="text-2xl font-bold">{stats.deposited}</div>
            <div className="text-xs opacity-90">{t.deposited}</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-3">
            <div className="text-2xl font-bold text-orange-300">{stats.atRisk}</div>
            <div className="text-xs opacity-90">{t.atRisk}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
          <TrendingUp className="text-green-600 mx-auto mb-2" size={28} />
          <div className="text-2xl font-bold text-green-600">{stats.reclaimed}</div>
          <div className="text-xs text-green-700 mt-1">{t.reclaimed}</div>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
          <TrendingDown className="text-red-600 mx-auto mb-2" size={28} />
          <div className="text-2xl font-bold text-red-600">{stats.lost}</div>
          <div className="text-xs text-red-700 mt-1">{t.lost}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-4">{t.addPoints}</h2>

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
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>100</span>
            <span className="text-2xl font-bold text-indigo-600">{depositAmount}</span>
            <span>1000</span>
          </div>
        </div>

        <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:from-indigo-700 hover:to-purple-700 transition-all">
          <Zap size={20} />
          <span>{t.depositBtn} {depositAmount} {t.pointsSuffix}</span>
        </button>

        <div className="bg-indigo-50 rounded-lg p-3 mt-4">
          <p className="text-xs text-indigo-900">{t.depositNote}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-4">{t.recentActivity}</h2>

        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
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
                  <p className="text-xs text-gray-500">{transaction.date}</p>
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
          ))}
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
