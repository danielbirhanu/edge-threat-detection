import type {
  DetectionSignal,
  IdentityBehaviorSnapshot,
  RequestContext
} from "../../contracts/src/index";

export type DetectionConfig = {
  bruteForce: {
    suspiciousFailures: number;
    criticalFailures: number;
    suspiciousWeight: number;
    criticalWeight: number;
  };
  rateAbuse: {
    suspiciousRequests: number;
    criticalRequests: number;
    suspiciousWeight: number;
    criticalWeight: number;
    authenticatedMultiplier: number;
  };
};

export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  bruteForce: {
    suspiciousFailures: 5,
    criticalFailures: 20,
    suspiciousWeight: 20,
    criticalWeight: 40
  },
  rateAbuse: {
    suspiciousRequests: 60,
    criticalRequests: 120,
    suspiciousWeight: 15,
    criticalWeight: 30,
    authenticatedMultiplier: 2
  }
};

function assertThresholds(name: string, suspicious: number, critical: number): void {
  if (!Number.isInteger(suspicious) || suspicious < 1)
    throw new Error(`${name} suspicious threshold must be a positive integer`);
  if (!Number.isInteger(critical) || critical <= suspicious)
    throw new Error(`${name} critical threshold must be greater than its suspicious threshold`);
}

export function validateDetectionConfig(config: DetectionConfig): DetectionConfig {
  assertThresholds(
    "brute force",
    config.bruteForce.suspiciousFailures,
    config.bruteForce.criticalFailures
  );
  assertThresholds(
    "rate abuse",
    config.rateAbuse.suspiciousRequests,
    config.rateAbuse.criticalRequests
  );
  if (config.rateAbuse.authenticatedMultiplier < 1)
    throw new Error("authenticated rate multiplier must be at least 1");
  return config;
}

export function detectBruteForce(
  context: RequestContext,
  behavior: IdentityBehaviorSnapshot,
  config: DetectionConfig = DEFAULT_DETECTION_CONFIG
): DetectionSignal | undefined {
  validateDetectionConfig(config);
  if (context.method !== "POST" || context.path !== "/api/login") return undefined;
  if (behavior.failedLoginCount < config.bruteForce.suspiciousFailures) return undefined;

  const critical = behavior.failedLoginCount >= config.bruteForce.criticalFailures;
  return {
    type: "brute_force",
    value: behavior.failedLoginCount,
    weight: critical ? config.bruteForce.criticalWeight : config.bruteForce.suspiciousWeight,
    confidence: critical ? 0.95 : 0.75,
    evidence: {
      failedLogins: behavior.failedLoginCount,
      successfulLogins: behavior.successfulLoginCount,
      windowSeconds: behavior.windowSeconds,
      level: critical ? "critical" : "suspicious"
    }
  };
}

export function detectRateAbuse(
  context: RequestContext,
  behavior: IdentityBehaviorSnapshot,
  config: DetectionConfig = DEFAULT_DETECTION_CONFIG
): DetectionSignal | undefined {
  validateDetectionConfig(config);
  const multiplier = context.authenticated ? config.rateAbuse.authenticatedMultiplier : 1;
  const suspiciousThreshold = Math.ceil(config.rateAbuse.suspiciousRequests * multiplier);
  const criticalThreshold = Math.ceil(config.rateAbuse.criticalRequests * multiplier);
  if (behavior.requestCount < suspiciousThreshold) return undefined;

  const critical = behavior.requestCount >= criticalThreshold;
  return {
    type: "rate_abuse",
    value: behavior.requestCount,
    weight: critical ? config.rateAbuse.criticalWeight : config.rateAbuse.suspiciousWeight,
    confidence: critical ? 0.9 : 0.65,
    evidence: {
      requests: behavior.requestCount,
      threshold: critical ? criticalThreshold : suspiciousThreshold,
      windowSeconds: behavior.windowSeconds,
      authenticated: context.authenticated,
      level: critical ? "critical" : "suspicious"
    }
  };
}

export function detectThreats(
  context: RequestContext,
  behavior: IdentityBehaviorSnapshot,
  config: DetectionConfig = DEFAULT_DETECTION_CONFIG
): DetectionSignal[] {
  return [
    detectBruteForce(context, behavior, config),
    detectRateAbuse(context, behavior, config)
  ].filter((signal): signal is DetectionSignal => signal !== undefined);
}
