import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import { Policy } from "../../types";

const CATEGORIES = ["pii", "prompt_injection", "topic_restriction", "rate_limit"];

export default function PolicyManagement() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api
      .get("/admin/policies")
      .then((res) => setPolicies(res.data))
      .catch(() => setError("Could not load policies. Please refresh and try again."));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/admin/policies", { name, category, description });
      setName("");
      setDescription("");
      load();
    } catch {
      setError("Could not create the policy. Please check the fields and try again.");
    } finally {
      setCreating(false);
    }
  }

  async function toggle(id: number) {
    await api.patch(`/admin/policies/${id}/toggle`);
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-guard-navy">Policy Management</h1>
      {error && <p className="mb-3 text-sm text-guard-alert">{error}</p>}

      <form onSubmit={handleCreate} className="mb-8 grid gap-3 rounded-xl bg-white p-6 shadow-sm md:grid-cols-2">
        <input
          required
          placeholder="Policy name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-guard-blue focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-guard-blue focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ")}
            </option>
          ))}
        </select>
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2 focus:border-guard-blue focus:outline-none"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-guard-blue px-4 py-2 text-sm font-medium text-white hover:bg-guard-navy disabled:opacity-60 md:col-span-2"
        >
          {creating ? "Adding…" : "Add policy"}
        </button>
      </form>

      <div className="space-y-3">
        {policies.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
            <div>
              <p className="font-medium text-guard-navy">{p.name}</p>
              <p className="text-xs uppercase tracking-wide text-guard-blue">{p.category.replace("_", " ")}</p>
              {p.description && <p className="mt-1 text-sm text-guard-slate">{p.description}</p>}
            </div>
            <button
              onClick={() => toggle(p.id)}
              className={`rounded-full px-4 py-1 text-xs font-medium ${
                p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
              }`}
            >
              {p.is_active ? "Active" : "Inactive"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
