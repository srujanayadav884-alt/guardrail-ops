import { useEffect, useState } from "react";
import { api } from "../../api/client";

interface BlockedItem {
  id: number;
  user_id: number;
  session_id: string;
  message: string;
  created_at: string;
}

export default function BlockedRequests() {
  const [items, setItems] = useState<BlockedItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/blocked-requests")
      .then((res) => setItems(res.data))
      .catch(() => setError("Could not load blocked requests. Please refresh and try again."));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-guard-navy">Blocked Requests</h1>
      {error && <p className="mb-3 text-sm text-guard-alert">{error}</p>}
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-guard-slate">No requests have been blocked yet.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex justify-between text-xs text-amber-700">
              <span>User #{item.user_id}</span>
              <span>{new Date(item.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-guard-navy">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
