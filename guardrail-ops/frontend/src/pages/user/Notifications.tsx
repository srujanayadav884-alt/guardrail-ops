import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { AppNotification } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function Notifications() {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/notifications")
      .then((res) => setItems(res.data))
      .catch(() => setError("Could not load notifications. Please refresh and try again."));
  }, []);

  async function markRead(id: number) {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((prev) => (prev ? prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)) : prev));
    } catch {
      setError("Could not update this notification. Please try again.");
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-guard-navy">Notifications</h1>

      {error && <p className="mb-3 text-sm text-guard-alert">{error}</p>}
      {items === null && !error && <LoadingSpinner label="Loading notifications…" />}

      <div className="space-y-3">
        {items?.length === 0 && <p className="text-guard-slate">You're all caught up.</p>}
        {items?.map((n) => (
          <div
            key={n.id}
            className={`rounded-xl border p-4 shadow-sm ${
              n.is_read ? "border-slate-100 bg-white" : "border-guard-blue/30 bg-blue-50/40"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-guard-navy">{n.title}</p>
                <p className="mt-1 text-sm text-guard-slate">{n.message}</p>
                <p className="mt-2 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="whitespace-nowrap rounded-md border border-guard-blue px-3 py-1 text-xs font-medium text-guard-blue hover:bg-guard-blue hover:text-white"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
