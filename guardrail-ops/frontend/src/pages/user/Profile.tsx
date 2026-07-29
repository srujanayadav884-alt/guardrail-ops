import { useEffect, useState } from "react";
import { api } from "../../api/client";
import LoadingSpinner from "../../components/LoadingSpinner";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  last_login_at: string | null;
  created_at: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/users/me")
      .then((res) => setProfile(res.data))
      .catch(() => setError("Could not load your profile. Please refresh and try again."));
  }, []);

  if (error) return <p className="text-sm text-guard-alert">{error}</p>;
  if (!profile) return <LoadingSpinner label="Loading profile…" />;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-guard-navy">Profile</h1>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <dl className="divide-y divide-slate-100">
          <Row label="Full name" value={profile.full_name} />
          <Row label="Email" value={profile.email} />
          <Row label="Phone" value={profile.phone || "Not provided"} />
          <Row label="Role" value={profile.role.replace("_", " ")} />
          <Row
            label="Last login"
            value={profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : "This is your first login"}
          />
          <Row label="Customer since" value={new Date(profile.created_at).toLocaleDateString()} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 text-sm">
      <dt className="text-guard-slate">{label}</dt>
      <dd className="font-medium text-guard-navy">{value}</dd>
    </div>
  );
}
