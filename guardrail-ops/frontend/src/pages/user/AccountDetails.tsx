import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { BankAccount } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function AccountDetails() {
  const [accounts, setAccounts] = useState<BankAccount[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/accounts")
      .then((res) => setAccounts(res.data))
      .catch(() => setError("Could not load your accounts. Please refresh and try again."));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-guard-navy">Account Details</h1>

      {error && <p className="text-sm text-guard-alert">{error}</p>}
      {!error && accounts === null && <LoadingSpinner label="Loading accounts…" />}
      {!error && accounts !== null && accounts.length === 0 && (
        <p className="text-guard-slate">No accounts found for this profile yet.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {accounts?.map((acct) => (
          <div key={acct.id} className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-guard-blue">
              {acct.account_type.replace("_", " ")}
            </p>
            <p className="mt-1 font-mono text-lg text-guard-navy">{acct.account_number}</p>
            <p className="mt-4 text-3xl font-bold text-guard-navy">
              {acct.currency} {Number(acct.balance).toLocaleString()}
            </p>
            <span
              className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                acct.status === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {acct.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
