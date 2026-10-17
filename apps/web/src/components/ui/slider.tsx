"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

function getDefaultValues(
  value: unknown,
  defaultValue: unknown,
  min: number,
  max: number
): number[] {
  if (Array.isArray(value)) {
    return value as number[];
  }
  if (Array.isArray(defaultValue)) {
    return defaultValue as number[];
  }
  return [min, max];
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = useMemo(
    () => getDefaultValues(value, defaultValue, min, max),
    [value, defaultValue, min, max]
  );

  return (
    <SliderPrimitive.Root
      className="data-horizontal:w-full data-vertical:h-full"
      data-slot="slider"
      defaultValue={defaultValue}
      max={max}
      min={min}
      thumbAlignment="edge"
      value={value}
      {...props}
    >
      <SliderPrimitive.Control
        className={cn(
          "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
          className
        )}
      >
        <SliderPrimitive.Track
          className="relative overflow-hidden rounded-4xl bg-muted select-none data-horizontal:h-3 data-horizontal:w-full data-vertical:h-full data-vertical:w-3"
          data-slot="slider-track"
        >
          <SliderPrimitive.Indicator
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
            data-slot="slider-range"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            className="block size-4 shrink-0 rounded-4xl border border-primary bg-white shadow-sm ring-ring/50 transition-colors select-none hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
            data-slot="slider-thumb"
            key={`slider-thumb-${index.toString()}`}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
