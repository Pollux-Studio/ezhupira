import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AddressInput, SavedAddress } from "@/lib/api";

/** The street/city/state/PIN inputs, shared by checkout and the address book. */
export function AddressFields({ defaults, idPrefix = "" }: { defaults?: Partial<AddressInput>; idPrefix?: string }) {
  const id = (name: string) => `${idPrefix}${name}`;
  return (
    <>
      <Field>
        <FieldLabel htmlFor={id("line1")}>Address</FieldLabel>
        <Input id={id("line1")} name="line1" autoComplete="address-line1" placeholder="House no., street" defaultValue={defaults?.line1} required />
        <Input
          id={id("line2")}
          name="line2"
          autoComplete="address-line2"
          placeholder="Area, landmark (optional)"
          aria-label="Address line 2"
          defaultValue={defaults?.line2}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor={id("city")}>City</FieldLabel>
          <Input id={id("city")} name="city" autoComplete="address-level2" defaultValue={defaults?.city} required />
        </Field>
        <Field>
          <FieldLabel htmlFor={id("state")}>State</FieldLabel>
          <Input id={id("state")} name="state" autoComplete="address-level1" defaultValue={defaults?.state ?? "Tamil Nadu"} required />
        </Field>
        <Field>
          <FieldLabel htmlFor={id("pincode")}>PIN code</FieldLabel>
          <Input
            id={id("pincode")}
            name="pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            pattern="[1-9][0-9]{5}"
            maxLength={6}
            defaultValue={defaults?.pincode}
            required
          />
        </Field>
      </div>
    </>
  );
}

/** Reads the address inputs back out of a submitted form. */
export function readAddress(form: FormData) {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  return { line1: get("line1"), line2: get("line2") || undefined, city: get("city"), state: get("state"), pincode: get("pincode") };
}

/** One line for display: "12 Main St, Area, Chennai, Tamil Nadu 600001". */
export const formatAddress = (a: Pick<SavedAddress, "line1" | "line2" | "city" | "state" | "pincode">) =>
  `${[a.line1, a.line2, a.city].filter(Boolean).join(", ")}, ${a.state} ${a.pincode}`;
