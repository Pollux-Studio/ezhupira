"use client";

import { useState, type FormEvent } from "react";
import { MapPin, Pencil, Phone, Plus, Star, Trash2 } from "lucide-react";
import { AddressFields, formatAddress, readAddress } from "@/components/address/address-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { formatPhone } from "@/lib/phone-countries";
import { api, type SavedAddress } from "@/lib/api";
import { cn } from "@/lib/utils";

type Addresses = { addresses: SavedAddress[] };

/** Add or edit one address. */
function AddressForm({
  address,
  onSaved,
  onCancel,
}: {
  address?: SavedAddress;
  onSaved: (list: SavedAddress[]) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const prefix = address ? `edit-${address.id}-` : "new-";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const body = { name: String(f.get("name") ?? "").trim(), phone: String(f.get("phone") ?? "").trim(), ...readAddress(f) };
    setSaving(true);
    setError(null);
    try {
      const { addresses } = address
        ? await api<Addresses>(`/me/addresses/${address.id}`, { method: "PUT", body })
        : await api<Addresses>("/me/addresses", { body });
      onSaved(addresses);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 border bg-background p-4">
      <p className="font-medium">{address ? "Edit address" : "New address"}</p>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${prefix}name`}>Full name</FieldLabel>
            <Input id={`${prefix}name`} name="name" autoComplete="name" minLength={3} defaultValue={address?.name} required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${prefix}phone`}>Mobile number</FieldLabel>
            <PhoneInput id={`${prefix}phone`} defaultValue={address?.phone} required />
          </Field>
        </div>
        <AddressFields defaults={address} idPrefix={prefix} />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save address"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

function AddressCard({ address, onChange, onEdit }: { address: SavedAddress; onChange: (list: SavedAddress[]) => void; onEdit: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(path: string, method: "POST" | "DELETE") {
    setBusy(true);
    setError(null);
    try {
      onChange((await api<Addresses>(path, { method })).addresses);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <li className={cn("flex flex-col gap-3 border bg-background p-4", address.isDefault && "border-primary/60")}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{address.name}</p>
        {address.isDefault && <Badge>Default</Badge>}
      </div>
      <div className="space-y-1.5 text-sm text-muted-foreground">
        <p className="flex gap-2">
          <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{formatAddress(address)}</span>
        </p>
        <p className="flex items-center gap-2">
          <Phone aria-hidden className="size-4 shrink-0" />
          <span className="tabular-nums">{formatPhone(address.phone)}</span>
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1 border-t pt-3">
        {confirming ? (
          <>
            <span className="mr-auto text-sm">Delete this address?</span>
            <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={busy}>
              Keep
            </Button>
            <Button size="sm" variant="destructive" onClick={() => run(`/me/addresses/${address.id}`, "DELETE")} disabled={busy}>
              Delete
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={onEdit}>
              <Pencil aria-hidden />
              Edit
            </Button>
            {!address.isDefault && (
              <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => run(`/me/addresses/${address.id}/default`, "POST")} disabled={busy}>
                <Star aria-hidden />
                Make default
              </Button>
            )}
            <Button size="sm" variant="ghost" className="ml-auto gap-1.5 text-muted-foreground hover:text-destructive" onClick={() => setConfirming(true)}>
              <Trash2 aria-hidden />
              Delete
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

/**
 * The reader's saved addresses. Checkout adds each new shipping address here; the default
 * one is picked automatically on the next order.
 */
export function AddressBook({ addresses, onChange }: { addresses: SavedAddress[]; onChange: (list: SavedAddress[]) => void }) {
  // "new", an address id being edited, or null.
  const [editing, setEditing] = useState<string | null>(null);
  const saved = (list: SavedAddress[]) => {
    onChange(list);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      {addresses.length === 0 && editing !== "new" && (
        <div className="border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
          No saved addresses yet. The address you use on your first order is saved here, so next time checkout fills it in for
          you.
        </div>
      )}

      {addresses.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) =>
            editing === a.id ? (
              <li key={a.id} className="sm:col-span-2">
                <AddressForm address={a} onSaved={saved} onCancel={() => setEditing(null)} />
              </li>
            ) : (
              <AddressCard key={a.id} address={a} onChange={onChange} onEdit={() => setEditing(a.id)} />
            ),
          )}
        </ul>
      )}

      {editing === "new" ? (
        <AddressForm onSaved={saved} onCancel={() => setEditing(null)} />
      ) : (
        addresses.length < 10 && (
          <Button variant="outline" className="w-full gap-1.5 border-dashed" onClick={() => setEditing("new")}>
            <Plus aria-hidden />
            Add an address
          </Button>
        )
      )}
    </div>
  );
}
