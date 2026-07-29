import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { AdminUserRow } from "../../types";

export default function UserMonitoring() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState("");

  function load() {
    api
      .get("/admin/users")
      .then((res) => setUsers(res.data))
      .catch(() => setError("Could not load users. Please refresh and try again."));
  }

  useEffect(load, []);

  async function toggleStatus(id: number, current: boolean) {
    try {
      await api.patch(`/admin/users/${id}/status`, { isActive: !current });
      load();
    } catch {
      setError("Could not update this user's status. Please try again.");
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-guard-navy">User Monitoring</h1>
      {error && <p className="mb-3 text-sm text-guard-alert">{error}</p>}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-guard-slate">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{u.full_name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "Never"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {u.is_active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleStatus(u.id, u.is_active)}
                    className="text-xs font-medium text-guard-blue hover:underline"
                  >
                    {u.is_active ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
