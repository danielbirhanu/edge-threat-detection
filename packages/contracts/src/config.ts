import type { EnvironmentName } from "./index";

export type RawConfig = {
  ENVIRONMENT: string;
  UPSTREAM_API_URL: string;
  RISK_RATE_LIMIT_THRESHOLD: string;
  RISK_BLOCK_THRESHOLD: string;
  EVENT_RETENTION_DAYS?: string;
};
export type AppConfig = {
  environment: EnvironmentName;
  upstreamApiUrl: URL;
  rateLimitThreshold: number;
  blockThreshold: number;
  eventRetentionDays: number;
};

function integerInRange(name: string, raw: string, minimum: number, maximum: number): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum)
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  return value;
}

export function loadConfig(raw: RawConfig): AppConfig {
  const environments: EnvironmentName[] = ["development", "preview", "production"];
  if (!environments.includes(raw.ENVIRONMENT as EnvironmentName))
    throw new Error("ENVIRONMENT must be development, preview, or production");
  let upstreamApiUrl: URL;
  try {
    upstreamApiUrl = new URL(raw.UPSTREAM_API_URL);
  } catch {
    throw new Error("UPSTREAM_API_URL must be a valid absolute URL");
  }
  const rateLimitThreshold = integerInRange(
    "RISK_RATE_LIMIT_THRESHOLD",
    raw.RISK_RATE_LIMIT_THRESHOLD,
    0,
    100
  );
  const blockThreshold = integerInRange("RISK_BLOCK_THRESHOLD", raw.RISK_BLOCK_THRESHOLD, 0, 100);
  if (rateLimitThreshold >= blockThreshold)
    throw new Error("RISK_RATE_LIMIT_THRESHOLD must be lower than RISK_BLOCK_THRESHOLD");
  return {
    environment: raw.ENVIRONMENT as EnvironmentName,
    upstreamApiUrl,
    rateLimitThreshold,
    blockThreshold,
    eventRetentionDays: integerInRange(
      "EVENT_RETENTION_DAYS",
      raw.EVENT_RETENTION_DAYS ?? "30",
      1,
      365
    )
  };
}
