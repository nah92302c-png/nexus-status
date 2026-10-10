import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Dashboard } from "@/components/dashboard/dashboard";
import type { Service, ServiceStatus } from "@/lib/types";

function makeService(
  id: string,
  name: string,
  status: ServiceStatus,
  overrides: Partial<Service> = {},
): Service {
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    description: null,
    icon_url: null,
    status,
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

const SERVICES: Service[] = [
  makeService("00000000-0000-4000-8000-000000000001", "MW3", "online"),
  makeService("00000000-0000-4000-8000-000000000002", "BO6", "offline"),
  makeService("00000000-0000-4000-8000-000000000003", "Spoofer", "unknown"),
];

function renderDashboard(services: Service[] = SERVICES) {
  return render(
    <Dashboard initialServices={services} demo={false} pollIntervalMs={30000} />,
  );
}

describe("Dashboard search", () => {
  it("filters services by case-insensitive name", () => {
    renderDashboard();
    expect(screen.getAllByTestId("status-card")).toHaveLength(3);

    fireEvent.change(screen.getByLabelText("Search services"), {
      target: { value: "mw3" },
    });

    const cards = screen.getAllByTestId("status-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("MW3");
  });

  it("trims surrounding whitespace when searching", () => {
    renderDashboard();
    fireEvent.change(screen.getByLabelText("Search services"), {
      target: { value: "   BO6   " },
    });
    const cards = screen.getAllByTestId("status-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("BO6");
  });

  it("shows an empty state when nothing matches", () => {
    renderDashboard();
    fireEvent.change(screen.getByLabelText("Search services"), {
      target: { value: "does-not-exist" },
    });
    expect(screen.queryAllByTestId("status-card")).toHaveLength(0);
    expect(
      screen.getByText("No services match the current search or filter."),
    ).toBeInTheDocument();
  });
});

describe("Dashboard status filter", () => {
  it("filters cards by status while counts still reflect all visible services", () => {
    renderDashboard();

    // Counts are computed from all services, not the filtered subset.
    expect(screen.getByTestId("count-total")).toHaveTextContent("3");
    expect(screen.getByTestId("count-online")).toHaveTextContent("Online");
    expect(screen.getByTestId("count-online")).toHaveTextContent("1");
    expect(screen.getByTestId("count-updating")).toHaveTextContent("0");

    fireEvent.click(screen.getByRole("button", { name: /Online/ }));

    const cards = screen.getAllByTestId("status-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("MW3");
  });

  it("combines search and status filters", () => {
    renderDashboard();
    fireEvent.change(screen.getByLabelText("Search services"), {
      target: { value: "mw" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Online/ }));

    const cards = screen.getAllByTestId("status-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("MW3");
  });

  it("resets to all services with the All filter", () => {
    renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: /Offline/ }));
    expect(screen.getAllByTestId("status-card")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /All/ }));
    expect(screen.getAllByTestId("status-card")).toHaveLength(3);
  });
});
describe("Dashboard connection state", () => {
  it("shows a live connection indicator for real data", () => {
    renderDashboard();
    expect(screen.getByText("Live status")).toBeInTheDocument();
  });

  it("labels the connection as demo data in demo mode", () => {
    render(
      <Dashboard initialServices={SERVICES} demo pollIntervalMs={30000} />,
    );
    expect(screen.getByText("Demo data")).toBeInTheDocument();
  });
});
