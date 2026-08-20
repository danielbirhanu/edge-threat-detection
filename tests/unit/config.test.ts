import { describe, expect, it } from "vitest";
import { loadConfig } from "../../packages/contracts/src/config";

const validConfig = {
  ENVIRONMENT: "development",
  UPSTREAM_API_URL: "http://localhost:8788",
  RISK_RATE_LIMIT_THRESHOLD: "60",
  RISK_BLOCK_THRESHOLD: "80"
};

describe("loadConfig", () => {
  it("parses valid configuration", () => {
    const config = loadConfig(validConfig);
    expect(config.rateLimitThreshold).toBe(60);
    expect(config.blockThreshold).toBe(80);
    expect(config.eventRetentionDays).toBe(30);
  });
  it("rejects reversed thresholds", () => {
    expect(() => loadConfig({ ...validConfig, RISK_RATE_LIMIT_THRESHOLD: "90" })).toThrow(
      "must be lower"
    );
  });
  it("rejects invalid URLs", () => {
    expect(() => loadConfig({ ...validConfig, UPSTREAM_API_URL: "not-a-url" })).toThrow(
      "valid absolute URL"
    );
  });
});
