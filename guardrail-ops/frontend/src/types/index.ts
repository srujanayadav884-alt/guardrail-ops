export type Role = "customer" | "admin" | "security_admin";

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface BankAccount {
  id: number;
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
  channel: string | null;
  amount: string;
  description: string | null;
  counterparty: string | null;
  status: string;
  created_at: string;
}

export interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  message: string;
  was_blocked?: boolean;
  riskBand?: string;
  created_at?: string;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SecurityLog {
  id: number;
  user_id: number | null;
  event_type: string;
  severity: string;
  request_snippet: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export type AttackType =
  | "prompt_injection"
  | "jailbreak"
  | "pii_exposure"
  | "unauthorized_access"
  | "credential_request"
  | "none";

export type SecurityDecision = "allow" | "block" | "sanitize";

export interface SecurityEvent {
  id: number;
  userId: number | null;
  userName: string;
  userEmail: string;
  userRole: string;
  originalPrompt: string | null;
  attackType: AttackType;
  riskScore: number | null;
  riskLevel: "low" | "medium" | "high" | "critical";
  decision: SecurityDecision;
  eventType: string;
  ipAddress: string | null;
  createdAt: string;
}

export interface SecurityEventDetail extends SecurityEvent {
  details: Record<string, unknown>;
  riskFactors: Record<string, unknown> | null;
}

export interface Policy {
  id: number;
  name: string;
  category: string;
  description: string | null;
  rule_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface AdminUserRow {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  role: Role;
}
