import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { SecurityLog } from "../../types";

export default function AuditLogs() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/audit-logs")
      .then((res) => setLogs(res.data))
      .catch(() => setError("Could not load audit logs. Please refresh and try again."));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-guard-navy">Audit Logs</h1>
      {error && <p className="mb-3 text-sm text-guard-alert">{error}</p>}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-guard-slate">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Risk Score</th>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-guard-slate">
                  No security events recorded yet.
                </td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{new Date(l.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">{l.event_type}</td>
                <td className="px-4 py-3 capitalize">{l.severity}</td>
                <td className="px-4 py-3">
                  {typeof l.details?.riskScore === "number" ? l.details.riskScore : "—"}
                </td>
                <td className="px-4 py-3">{l.user_id ?? "—"}</td>
                <td className="px-4 py-3">{l.ip_address ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
