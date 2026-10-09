import { describe, expect, it } from "vitest";
import { countByStatus, overallStatus } from "@/lib/status";
import { STATUS_META, type ServiceStatus } from "@/lib/types";

const svc = (status: ServiceStatus) => ({ status });

describe("overallStatus", () => {
  it("reports 'No Services' for an empty list", () => {
    expect(overallStatus([]).key).toBe("empty");
  });

  it("reports operational only when every service is online", () => {
    expect(overallStatus([svc("online"), svc("online")]).key).toBe(
      "operational",
    );
  });

  it("never reports operational when a service is unknown", () => {
    const result = overallStatus([svc("online"), svc("unknown")]);
    expect(result.key).toBe("unknown");
    expect(result.label).toBe("Status Partially Unknown");
  });

  it("prioritises offline above every other status", () => {
    const result = overallStatus([
      svc("online"),
      svc("unknown"),
      svc("maintenance"),
      svc("updating"),
      svc("degraded"),
      svc("offline"),
    ]);
    expect(result.key).toBe("outage");
  });

  it("prioritises degraded above updating/maintenance/unknown", () => {
    expect(overallStatus([svc("updating"), svc("degraded"), svc("unknown")]).key).toBe(
      "degraded",
    );
  });

  it("prioritises updating above maintenance and unknown", () => {
    expect(overallStatus([svc("maintenance"), svc("updating"), svc("unknown")]).key).toBe(
      "updating",
    );
  });

  it("prioritises maintenance above unknown", () => {
    expect(overallStatus([svc("unknown"), svc("maintenance")]).key).toBe(
      "maintenance",
    );
  });

  it("returns a non-colour symbol via STATUS_META (checked in component tests)", () => {
    // Guard: every status has a label so colour is never the only signal.
    for (const meta of Object.values(STATUS_META)) {
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.symbol.length).toBeGreaterThan(0);
    }
  });
});

describe("countByStatus", () => {
  it("counts each status and the visible total", () => {
    const counts = countByStatus([
      svc("online"),
      svc("online"),
      svc("offline"),
      svc("unknown"),
    ]);
    expect(counts.online).toBe(2);
    expect(counts.offline).toBe(1);
    expect(counts.unknown).toBe(1);
    expect(counts.updating).toBe(0);
    expect(counts.total).toBe(4);
  });
});
