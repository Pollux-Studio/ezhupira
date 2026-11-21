// Small UI kit for the admin, styled with the site's paper + red tokens (app/globals.css).
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Variant = "primary" | "outline" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-brand-ink hover:opacity-90",
  outline: "border border-line bg-surface hover:bg-bg",
  ghost: "hover:bg-bg text-muted hover:text-ink",
  danger: "bg-brand-soft text-brand hover:opacity-90",
};

export function Button({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-medium whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        VARIANTS[variant],
        className,
      )}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-lg border border-line bg-surface", className)}>{children}</div>;
}

export function PageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const field = "w-full rounded-md border border-line bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(field, "h-9", className)} />;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={cx(field, "py-2 leading-relaxed", className)} />
);

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("grid gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

const TONES = {
  neutral: "bg-bg text-muted border-line",
  brand: "bg-brand-soft text-brand border-transparent",
  ok: "border-transparent bg-ok/15 text-ok",
  warn: "border-transparent bg-warn/15 text-warn",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone])}>{children}</span>;
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return <p role="alert" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand">{error}</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-line p-10 text-center text-sm text-muted">{children}</div>;
}

export function Loading() {
  return <div className="h-40 animate-pulse rounded-lg bg-line/50" aria-label="Loading" />;
}

/** Status pill for orders: money-in states green, waiting amber, problems red. */
export function OrderStatusBadge({ status }: { status: string }) {
  const tone = ["paid", "shipped", "delivered"].includes(status) ? "ok" : status === "pending" ? "warn" : status === "refunded" ? "neutral" : "brand";
  return <Badge tone={tone}>{status}</Badge>;
}
