import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HouseholdTooltip from "./household-tooltip";
import { TooltipProvider } from "./ui/tooltip";

describe("HouseholdTooltip", () => {
  it("renders nothing when the value is not from the household", () => {
    const { container } = render(<HouseholdTooltip isFromHousehold={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a tooltip trigger when the value comes from the household", () => {
    render(
      <TooltipProvider>
        <HouseholdTooltip isFromHousehold />
      </TooltipProvider>
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
