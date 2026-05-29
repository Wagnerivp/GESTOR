import { cn } from "@/lib/utils";
import React from "react";

export function Button({ className, variant = "primary", size = "md", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost", size?: "sm" | "md" | "lg" }) {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 border-none",
    secondary: "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700 border-none",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700"
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2 text-[13px]",
    lg: "h-12 px-8 text-sm"
  };

  return (
    <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props} />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm", className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
}

export function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: "default" | "success" | "warning" | "danger", className?: string }) {
  const variants = {
    default: "bg-slate-100 text-slate-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-blue-100 text-blue-800",
    danger: "bg-red-100 text-red-800"
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider", variants[variant], className)}>
      {children}
    </span>
  );
}
