import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/auth/AdminLogin";

import ProtectedRoute from "./components/ProtectedRoute";
import UserLayout from "./components/Layout/UserLayout";
import AdminLayout from "./components/Layout/AdminLayout";

import Profile from "./pages/user/Profile";
import AccountDetails from "./pages/user/AccountDetails";
import BankingAssistant from "./pages/user/BankingAssistant";
import TransactionHistory from "./pages/user/TransactionHistory";
import Notifications from "./pages/user/Notifications";

import SecurityAnalytics from "./pages/admin/SecurityAnalytics";
import SecurityEvents from "./pages/admin/SecurityEvents";
import AuditLogs from "./pages/admin/AuditLogs";
import BlockedRequests from "./pages/admin/BlockedRequests";
import PolicyManagement from "./pages/admin/PolicyManagement";
import UserMonitoring from "./pages/admin/UserMonitoring";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
        <Route element={<UserLayout />}>
          <Route path="/" element={<Profile />} />
          <Route path="/accounts" element={<AccountDetails />} />
          <Route path="/assistant" element={<BankingAssistant />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin", "security_admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<SecurityAnalytics />} />
          <Route path="/admin/security-events" element={<SecurityEvents />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
          <Route path="/admin/blocked-requests" element={<BlockedRequests />} />
          <Route path="/admin/policies" element={<PolicyManagement />} />
          <Route path="/admin/users" element={<UserMonitoring />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
