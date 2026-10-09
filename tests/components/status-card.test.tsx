import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StatusCard } from "@/components/dashboard/status-card";
import { monogramFor } from "@/components/dashboard/service-icon";
import type { Service } from "@/lib/types";

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    name: "MW3",
    slug: "mw3",
    description: null,
    icon_url: null,
    status: "unknown",
    status_mode: "manual",
    status_source: "manual",
    announcement: null,
    sort_order: 1,
    is_visible: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    last_checked_at: null,
    ...overrides,
  };
}

describe("monogramFor", () => {
  it("uses up to three alphanumeric characters", () => {
    expect(monogramFor("MW3")).toBe("MW3");
    expect(monogramFor("ARC Raiders")).toBe("ARC");
    expect(monogramFor("????")).toBe("?");
  });
});

describe("StatusCard image", () => {
  it("shows a monogram fallback when no image is set", () => {
    const { container } = render(
      <ul>
        <StatusCard service={makeService({ name: "ARC Raiders" })} />
      </ul>,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByTestId("status-card")).toHaveTextContent("ARC");
  });

  it("renders the uploaded image when an icon URL is set", () => {
    const { container } = render(
      <ul>
        <StatusCard
          service={makeService({
            name: "MW3",
            icon_url: "https://cdn.example.com/mw3.png",
          })}
        />
      </ul>,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "https://cdn.example.com/mw3.png");
  });

  it("falls back to the monogram when the image fails to load", () => {
    const { container } = render(
      <ul>
        <StatusCard
          service={makeService({
            name: "MW3",
            icon_url: "https://cdn.example.com/missing.png",
          })}
        />
      </ul>,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    fireEvent.error(img as HTMLImageElement);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByTestId("status-card")).toHaveTextContent("MW");
  });
});
