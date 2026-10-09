import { describe, expect, it } from "vitest";
import {
  loginSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
} from "@/lib/validation";

describe("serviceCreateSchema", () => {
  it("accepts a minimal valid service and defaults status to unknown", () => {
    const parsed = serviceCreateSchema.parse({ name: "MW3" });
    expect(parsed.status).toBe("unknown");
    expect(parsed.is_visible).toBe(true);
    expect(parsed.status_mode).toBe("manual");
  });

  it("rejects an invalid status", () => {
    const result = serviceCreateSchema.safeParse({
      name: "MW3",
      status: "definitely-not-real",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(serviceCreateSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects a malformed icon URL", () => {
    const result = serviceCreateSchema.safeParse({
      name: "MW3",
      icon_url: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });

  it("normalises empty optional text to null", () => {
    const parsed = serviceCreateSchema.parse({
      name: "MW3",
      description: "   ",
      announcement: "",
    });
    expect(parsed.description).toBeNull();
    expect(parsed.announcement).toBeNull();
  });
});

describe("serviceUpdateSchema", () => {
  it("accepts a partial update", () => {
    expect(serviceUpdateSchema.safeParse({ status: "online" }).success).toBe(
      true,
    );
  });

  it("rejects an empty object", () => {
    expect(serviceUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a change_note-only payload", () => {
    expect(
      serviceUpdateSchema.safeParse({ change_note: "just a note" }).success,
    ).toBe(false);
  });

  it("rejects an invalid status", () => {
    expect(
      serviceUpdateSchema.safeParse({ status: "bogus" }).success,
    ).toBe(false);
  });

  it("allows explicit null to clear optional text", () => {
    const parsed = serviceUpdateSchema.parse({ description: null });
    expect(parsed.description).toBeNull();
  });
});

describe("loginSchema", () => {
  it("requires a valid email and a password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(
      true,
    );
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(
      false,
    );
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(
      false,
    );
  });
});
