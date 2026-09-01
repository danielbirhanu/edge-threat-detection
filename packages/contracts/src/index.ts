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
  type: "brute_force" | "rate_abuse" | "endpoint_scanning" | "request_anomaly";
  value: number;
  weight: number;
  confidence: number;
  evidence: Record<string, number | string | boolean>;
};
export type IdentityBehaviorSnapshot = {
  windowSeconds: number;
  requestCount: number;
  failedLoginCount: number;
  successfulLoginCount: number;
  uniquePathCount: number;
  notFoundCount: number;
};
export type SecurityDecision = {
  requestId: string;
  riskScore: number;
  severity: "safe" | "low" | "medium" | "high" | "critical";
  action: "allow" | "rate_limit" | "block";
  signals: DetectionSignal[];
};
export * from "./config";
