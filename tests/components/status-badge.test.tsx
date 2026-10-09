import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/shared/status-badge";
import { STATUS_META, SERVICE_STATUSES } from "@/lib/types";

describe("StatusBadge", () => {
  it("renders a symbol and a text label for every status (never colour-only)", () => {
    for (const status of SERVICE_STATUSES) {
      const { unmount } = render(<StatusBadge status={status} />);
      const badge = screen.getByRole("status");
      const meta = STATUS_META[status];
      expect(badge).toHaveTextContent(meta.label);
      expect(badge).toHaveTextContent(meta.symbol);
      expect(badge).toHaveAttribute("data-tone", meta.tone);
      unmount();
    }
  });
});