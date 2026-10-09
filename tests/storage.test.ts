import { describe, expect, it } from "vitest";
import {
  ACCEPTED_IMAGE_TYPES,
  buildImagePath,
  isAcceptedImageType,
} from "@/lib/storage";

describe("isAcceptedImageType", () => {
  it("accepts common web image types", () => {
    for (const type of ACCEPTED_IMAGE_TYPES) {
      expect(isAcceptedImageType(type)).toBe(true);
    }
  });

  it("rejects non-image and unknown types", () => {
    expect(isAcceptedImageType("image/svg+xml")).toBe(false);
    expect(isAcceptedImageType("application/pdf")).toBe(false);
    expect(isAcceptedImageType("")).toBe(false);
  });
});

describe("buildImagePath", () => {
  it("keeps a sanitised stem and the file extension", () => {
    const path = buildImagePath("Call of Duty — MW3!.PNG", 0);
    expect(path).toMatch(/^call-of-duty-mw3-[a-z0-9]+\.png$/);
  });

  it("defaults a missing extension to png", () => {
    expect(buildImagePath("banner", 0)).toMatch(/^banner-[a-z0-9]+\.png$/);
  });

  it("never emits path separators or spaces", () => {
    const path = buildImagePath("../../etc/passwd", 0);
    expect(path).not.toContain("/");
    expect(path).not.toContain(" ");
    expect(path).not.toContain("..");
  });

  it("produces unique paths for the same file name", () => {
    const a = buildImagePath("mw3.png", 1000);
    const b = buildImagePath("mw3.png", 1000);
    expect(a).not.toBe(b);
  });
});
