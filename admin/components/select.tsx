"use client";

// shadcn-style Select (Base UI) in the admin's paper + red tokens. Pass `options`; works controlled
// (value + onValueChange) or inside a form (name + defaultValue, read back through FormData).
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cx } from "@/components/ui";

export type SelectOption = { value: string; label: string };

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  className,
  disabled,
  "aria-label": ariaLabel,
}: {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <SelectPrimitive.Root
      items={options}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(v) => v != null && onValueChange?.(v as string)}
      name={name}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cx(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 text-left text-sm whitespace-nowrap outline-none transition hover:bg-bg focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50 data-popup-open:border-brand",
          className,
        )}
      >
        <SelectPrimitive.Value className="truncate capitalize" />
        <SelectPrimitive.Icon render={<ChevronDownIcon className="size-4 shrink-0 text-muted" />} />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={4} alignItemWithTrigger={false} className="isolate z-50">
          <SelectPrimitive.Popup className="max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-lg border border-line bg-surface p-1 text-sm text-ink shadow-lg transition-[opacity,transform] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <SelectPrimitive.List>
              {options.map((o) => (
                <SelectPrimitive.Item
                  key={o.value}
                  value={o.value}
                  className="relative flex cursor-default items-center rounded-md py-1.5 pr-8 pl-2.5 capitalize outline-none select-none data-disabled:opacity-50 data-highlighted:bg-bg data-selected:font-medium"
                >
                  <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2 flex text-brand">
                    <CheckIcon className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
