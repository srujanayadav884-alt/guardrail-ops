export interface User {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  role_id: number;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: "customer" | "admin" | "security_admin";
  description: string | null;
}

export interface BankAccount {
  id: number;
  user_id: number;
  account_number: string;
  account_type: "savings" | "current" | "fixed_deposit";
  balance: string;
  currency: string;
  status: "active" | "frozen" | "closed";
  created_at: string;
}

export interface Transaction {
  id: number;
  account_id: number;
  type: "credit" | "debit";
  channel: "UPI" | "NEFT" | "RTGS" | "IMPS" | "internal" | null;
  amount: string;
  description: string | null;
  counterparty: string | null;
  status: "success" | "pending" | "failed";
  created_at: string;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  session_id: string;
  role: "user" | "assistant" | "system";
  message: string;
  was_blocked: boolean;
  risk_score_id: number | null;
  created_at: string;
}

export interface Policy {
  id: number;
  name: string;
  category: "pii" | "prompt_injection" | "topic_restriction" | "rate_limit";
  description: string | null;
  rule_config: Record<string, unknown>;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityLog {
  id: number;
  user_id: number | null;
  event_type: string;
  severity: "low" | "medium" | "high" | "critical";
  request_snippet: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface Alert {
  id: number;
  security_log_id: number | null;
  title: string;
  description: string | null;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "acknowledged" | "resolved";
  assigned_to: number | null;
  created_at: string;
  resolved_at: string | null;
}

export interface RiskScore {
  id: number;
  user_id: number | null;
  chat_history_id: number | null;
  score: string;
  band: "low" | "medium" | "high" | "critical";
  factors: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
