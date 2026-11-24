import { HomeIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const HouseholdTooltip = ({
  isFromHousehold,
}: {
  isFromHousehold: boolean;
}) => {
  if (!isFromHousehold) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <HomeIcon className="size-3 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent>
        <p>Info from household</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default HouseholdTooltip;
