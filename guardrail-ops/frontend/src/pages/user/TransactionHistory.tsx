import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { Transaction } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/transactions")
      .then((res) => setTransactions(res.data))
      .catch(() => setError("Could not load your transactions. Please refresh and try again."));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-guard-navy">Transaction History</h1>

      {error && <p className="mb-3 text-sm text-guard-alert">{error}</p>}
      {transactions === null && !error && <LoadingSpinner label="Loading transactions…" />}

      {(transactions !== null || error) && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-guard-slate">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-guard-slate">
                    No transactions yet.
                  </td>
                </tr>
              )}
              {transactions?.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{t.description || t.counterparty || "—"}</td>
                  <td className="px-4 py-3">{t.channel || "—"}</td>
                  <td className={`px-4 py-3 font-medium ${t.type === "credit" ? "text-emerald-600" : "text-guard-alert"}`}>
                    {t.type}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{Number(t.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 capitalize">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
