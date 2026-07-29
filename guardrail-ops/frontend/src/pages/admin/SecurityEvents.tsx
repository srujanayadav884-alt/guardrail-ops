import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { SecurityEvent, SecurityEventDetail } from "../../types";

const ATTACK_TYPE_LABELS: Record<string, string> = {
  prompt_injection: "Prompt Injection",
  jailbreak: "Jailbreak",
  pii_exposure: "PII Exposure",
  unauthorized_access: "Unauthorized Access",
  credential_request: "Credential Request",
  none: "None",
};

const DECISION_STYLES: Record<string, string> = {
  allow: "bg-emerald-100 text-emerald-700",
  block: "bg-red-100 text-red-700",
  sanitize: "bg-amber-100 text-amber-700",
};

const RISK_STYLES: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function SecurityEvents() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [attackType, setAttackType] = useState("");
  const [decision, setDecision] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "riskScore" | "attackType">("newest");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [selected, setSelected] = useState<SecurityEventDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  function load() {
    setLoading(true);
    setError("");
    const params: Record<string, string | number> = { sortBy, page, pageSize };
    if (search) params.search = search;
    if (attackType) params.attackType = attackType;
    if (decision) params.decision = decision;
    if (riskLevel) params.riskLevel = riskLevel;
    if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
    if (dateTo) params.dateTo = new Date(dateTo).toISOString();

    api
      .get("/admin/security-events", { params })
      .then((res) => {
        setEvents(res.data.events);
        setTotal(res.data.pagination.total);
      })
      .catch(() => setError("Could not load security events. Please try again."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [attackType, decision, riskLevel, dateFrom, dateTo, sortBy, page]);

  // Debounce free-text search so we don't fire a request on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function openDetail(id: number) {
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/security-events/${id}`);
      setSelected(res.data);
    } catch {
      setError("Could not load event details.");
    } finally {
      setDetailLoading(false);
    }
  }

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-guard-navy">Security Events</h1>
      <p className="mb-6 text-sm text-guard-slate">
        Every message the GuardRail-Ops security layer evaluated, with the attacker's original
        prompt (PII automatically masked before storage), attack type, risk score, and the
        decision taken.
      </p>

      {/* Filters */}
      <div className="mb-4 grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-guard-blue focus:outline-none"
        />
        <select
          value={attackType}
          onChange={(e) => {
            setAttackType(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-guard-blue focus:outline-none"
        >
          <option value="">All attack types</option>
          {Object.entries(ATTACK_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={decision}
          onChange={(e) => {
            setDecision(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-guard-blue focus:outline-none"
        >
          <option value="">All decisions</option>
          <option value="allow">Allow</option>
          <option value="block">Block</option>
          <option value="sanitize">Sanitize</option>
        </select>
        <select
          value={riskLevel}
          onChange={(e) => {
            setRiskLevel(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-guard-blue focus:outline-none"
        >
          <option value="">All risk levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <div className="flex items-center gap-2 text-sm">
          <label className="text-guard-slate">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="flex-1 rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-guard-blue focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-guard-slate">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="flex-1 rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-guard-blue focus:outline-none"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-guard-blue focus:outline-none"
        >
          <option value="newest">Sort: Newest first</option>
          <option value="riskScore">Sort: Highest risk score</option>
          <option value="attackType">Sort: Attack type</option>
        </select>
        <button
          onClick={() => {
            setSearch("");
            setAttackType("");
            setDecision("");
            setRiskLevel("");
            setDateFrom("");
            setDateTo("");
            setSortBy("newest");
            setPage(1);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-guard-slate hover:bg-slate-50"
        >
          Clear filters
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-guard-alert">{error}</p>}

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-guard-slate">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Attack Type</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Decision</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-guard-slate">
                  Loading security events…
                </td>
              </tr>
            )}
            {!loading && events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-guard-slate">
                  No security events match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              events.map((ev) => (
                <tr
                  key={ev.id}
                  onClick={() => openDetail(ev.id)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-guard-navy">{ev.userName}</p>
                    <p className="text-xs text-guard-slate">{ev.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{ev.userRole.replace("_", " ")}</td>
                  <td className="px-4 py-3">{ATTACK_TYPE_LABELS[ev.attackType] || ev.attackType}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${RISK_STYLES[ev.riskLevel]}`}>
                      {ev.riskLevel} {ev.riskScore !== null ? `(${ev.riskScore})` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${DECISION_STYLES[ev.decision]}`}>
                      {ev.decision}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-guard-slate">
                    {new Date(ev.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-guard-slate">
        <span>
          Page {page} of {totalPages} · {total} total events
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Detail modal */}
      {(selected || detailLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading && !selected && <p className="text-guard-slate">Loading event…</p>}
            {selected && (
              <>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-guard-navy">Security Event #{selected.id}</h2>
                    <p className="text-xs text-guard-slate">{new Date(selected.createdAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-guard-slate hover:text-guard-navy">
                    ✕
                  </button>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Field label="User Name" value={selected.userName} />
                  <Field label="Email" value={selected.userEmail} />
                  <Field label="Role" value={selected.userRole.replace("_", " ")} />
                  <Field label="IP Address" value={selected.ipAddress || "—"} />
                  <Field label="Attack Type" value={ATTACK_TYPE_LABELS[selected.attackType] || selected.attackType} />
                  <Field
                    label="Risk Score"
                    value={selected.riskScore !== null ? `${selected.riskScore} (${selected.riskLevel})` : selected.riskLevel}
                  />
                  <Field label="Decision" value={selected.decision} />
                  <Field label="Event Type" value={selected.eventType} />
                </dl>

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-guard-slate">
                    User Prompt (PII automatically masked before storage)
                  </p>
                  <p className="mt-1 rounded-md bg-slate-50 p-3 text-sm text-guard-navy">
                    {selected.originalPrompt || "—"}
                  </p>
                </div>

                {selected.riskFactors && (
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-guard-slate">
                      Risk Factors
                    </p>
                    <pre className="mt-1 overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
                      {JSON.stringify(selected.riskFactors, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-guard-slate">{label}</dt>
      <dd className="font-medium capitalize text-guard-navy">{value}</dd>
    </div>
  );
}
