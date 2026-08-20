export type EnvironmentName = "development" | "preview" | "production";
export type Identity = { kind: "ip" | "api_key" | "session"; value: string };
export type RequestContext = {
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  queryKeys: string[];
  identity: Identity;
  ip?: string;
  country?: string;
  userAgent?: string;
  contentType?: string;
  requestSize?: number;
  authenticated: boolean;
};
export type DetectionSignal = {
  type: string;
  value: number;
  weight: number;
  confidence: number;
  evidence: Record<string, number | string | boolean>;
};
export type SecurityDecision = {
  requestId: string;
  riskScore: number;
  severity: "safe" | "low" | "medium" | "high" | "critical";
  action: "allow" | "rate_limit" | "block";
  signals: DetectionSignal[];
};
export * from "./config";
