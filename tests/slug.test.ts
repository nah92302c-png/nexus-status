import { describe, expect, it } from "vitest";
import { isValidSlug, slugify } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("ARC Raiders")).toBe("arc-raiders");
    expect(slugify("  MW3  ")).toBe("mw3");
  });

  it("produces values accepted by the DB constraint pattern", () => {
    for (const name of ["MW3", "BO6", "BO7", "MW1", "WARDOGS", "Spoofer", "MW4"]) {
      expect(isValidSlug(slugify(name))).toBe(true);
    }
  });

  it("strips leading/trailing and repeated hyphens", () => {
    expect(slugify("--Hello   World--")).toBe("hello-world");
  });

  it("removes accents", () => {
    expect(slugify("Café Déjà")).toBe("cafe-deja");
  });

  it("rejects an all-symbol name", () => {
    expect(isValidSlug(slugify("!!!"))).toBe(false);
  });
});
