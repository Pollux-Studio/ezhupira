"use client";

import { useState, useSyncExternalStore } from "react";
import { Flag } from "@/components/flags/flag";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { DEFAULT_COUNTRY, PHONE_COUNTRIES, countryByIso, detectCountry, parsePhone, type PhoneCountry } from "@/lib/phone-countries";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};

/** Searching matches the name or the code: "sri", "lanka", "94" and "+94" all find Sri Lanka. */
const label = (c: PhoneCountry) => `${c.name} +${c.dial}`;

/**
 * A phone field with a country code picker (flag + code; opens a searchable list). The code
 * starts from the stored number, else a guess from the computer's time zone (no location
 * permission), else +91. The form gets one value under `name`, in international form
 * ("+919876543210"); the API stores Indian numbers as 10 digits.
 */
export function PhoneInput({
  id,
  name = "phone",
  defaultValue,
  required,
  className,
}: {
  id: string;
  name?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  // Time zone lives only in the browser; the server renders India and the browser corrects it.
  const detected = useSyncExternalStore(noSubscribe, detectCountry, () => DEFAULT_COUNTRY);
  const parsed = parsePhone(defaultValue, detected);
  const [chosen, setChosen] = useState<string | null>(parsed?.iso ?? null);
  const [national, setNational] = useState(parsed?.national ?? "");

  const country = countryByIso(chosen ?? detected);
  const india = country.iso === "IN";
  const digits = national.replace(/\D/g, "");

  return (
    <div className={cn("flex gap-1.5", className)}>
      <Combobox
        items={PHONE_COUNTRIES}
        value={country}
        onValueChange={(c) => c && setChosen(c.iso)}
        itemToStringLabel={label}
        isItemEqualToValue={(a, b) => a.iso === b.iso}
        autoHighlight
      >
        <ComboboxTrigger
          render={<Button type="button" variant="outline" className="h-7 shrink-0 gap-1.5 px-2 font-normal tabular-nums" />}
          aria-label={`Country code: ${country.name} +${country.dial}`}
        >
          <Flag code={country.iso} width={20} decorative loading="eager" className="h-3.5 w-auto rounded-[2px] ring-1 ring-foreground/10" />
          <span>+{country.dial}</span>
        </ComboboxTrigger>
        <ComboboxContent className="w-72">
          <ComboboxInput placeholder="Search country or code" showTrigger={false} aria-label="Search countries" />
          <ComboboxEmpty>No country found.</ComboboxEmpty>
          <ComboboxList>
            {(c: PhoneCountry) => (
              <ComboboxItem key={c.iso} value={c} className="pr-7">
                <Flag code={c.iso} width={20} decorative className="h-3.5 w-auto shrink-0 rounded-[2px] ring-1 ring-foreground/10" />
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                <span className="text-muted-foreground tabular-nums">+{c.dial}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={india ? "98765 43210" : "Phone number"}
        value={national}
        onChange={(e) => setNational(e.target.value)}
        // Indian mobiles: 10 digits starting 6–9. Elsewhere: 4–14 digits after the code.
        pattern={india ? "[\\s\\-]*[6-9](?:[\\s\\-]*\\d){9}[\\s\\-]*" : "[\\s\\-\\d()]{4,20}"}
        title={india ? "10-digit mobile number" : "Phone number without the country code"}
        required={required}
        className="min-w-0 flex-1"
      />
      <input type="hidden" name={name} value={digits ? `+${country.dial}${digits}` : ""} />
    </div>
  );
}
