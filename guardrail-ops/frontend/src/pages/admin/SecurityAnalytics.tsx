import { useEffect, useState } from "react";
import { api } from "../../api/client";
import LoadingSpinner from "../../components/LoadingSpinner";

interface Analytics {
  totalSecurityLogs: number;
  openAlerts: number;
  blockedMessages: number;
  activeUsers: number;
  riskBandCounts: { low: number; medium: number; high: number; critical: number };
}

const BAND_STYLES: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function SecurityAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/analytics")
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load security analytics. Please refresh and try again."));
  }, []);

  const cards = data
    ? [
        { label: "Security Log Events", value: data.totalSecurityLogs },
        { label: "Open Alerts", value: data.openAlerts },
        { label: "Blocked Messages", value: data.blockedMessages },
        { label: "Active Users", value: data.activeUsers },
      ]
    : [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-guard-navy">Security Analytics</h1>

      {error && <p className="mb-4 text-sm text-guard-alert">{error}</p>}
      {!data && !error && <LoadingSpinner label="Loading analytics…" />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-guard-slate">{c.label}</p>
            <p className="mt-2 text-3xl font-bold text-guard-navy">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 mt-8 text-lg font-semibold text-guard-navy">Risk Score Distribution</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data &&
          (["low", "medium", "high", "critical"] as const).map((band) => (
            <div key={band} className="rounded-xl bg-white p-6 shadow-sm">
              <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${BAND_STYLES[band]}`}>
                {band}
              </span>
              <p className="mt-3 text-3xl font-bold text-guard-navy">{data.riskBandCounts[band]}</p>
              <p className="text-xs text-guard-slate">messages scored {band} risk</p>
            </div>
          ))}
      </div>

      <p className="mt-6 text-sm text-guard-slate">
        Every message sent to the GuardBank AI Assistant is scored by the GuardRail-Ops security
        layer (prompt-injection detection, jailbreak detection, PII detection, and the policy
        engine) before a risk band of low/medium/high/critical is assigned.
      </p>
    </div>
  );
}
