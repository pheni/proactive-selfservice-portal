import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Badge({ children, tone = "blue", className = "" }: { children: ReactNode; tone?: "blue" | "green" | "amber" | "red" | "slate" | "purple"; className?: string }) {
  const colors = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  };
  return <span className={`inline-flex items-center border rounded-full px-2.5 py-1 text-xs font-bold ${colors[tone] || colors.blue} ${className}`}>{children}</span>;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  className = "",
  title
}: {
  children: ReactNode;
  onClick?: (e?: any) => void;
  variant?: "primary" | "teal" | "outline" | "danger";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  title?: string;
}) {
  const style =
    variant === "teal"
      ? "bg-teal-600 text-white hover:bg-teal-700"
      : variant === "outline"
      ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      : variant === "danger"
      ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
      : "bg-[#092E4C] text-white hover:bg-[#0E4269]";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${style} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "", ...props }: { children: ReactNode; className?: string; [key: string]: any }) {
  return <div {...props} className={`rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-xs font-black uppercase tracking-[.18em] text-teal-600">{eyebrow}</div>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl text-slate-900">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-black/5 py-3 text-sm last:border-0">
      <span className="text-slate-500 font-medium">{label}</span>
      <b className="text-right text-slate-900">{value}</b>
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
