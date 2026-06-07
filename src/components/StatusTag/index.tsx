import React from "react";
import { Check, Clock3, LockKeyhole } from "lucide-react";
import "./index.less";

export type StatusTagVariant =
  | "planning"
  | "active"
  | "locked"
  | "pending"
  | "completed"
  | "expired"
  | "member"
  | "owner"
  | "admin"
  | "neutral";

type StatusTagProps = {
  children: React.ReactNode;
  className?: string;
  variant?: StatusTagVariant;
};

const iconByVariant: Partial<Record<StatusTagVariant, React.ReactNode>> = {
  locked: <LockKeyhole size={15} />,
  completed: <Check size={15} />,
  expired: <Clock3 size={15} />,
};

const dotVariants = new Set<StatusTagVariant>(["planning", "active", "pending"]);

export function StatusTag({ children, className = "", variant = "neutral" }: StatusTagProps) {
  const icon = iconByVariant[variant];
  const dotClassName = dotVariants.has(variant) ? " tt-status-tag--dot" : "";

  return (
    <span className={`tt-status-tag tt-status-tag--${variant}${dotClassName} ${className}`.trim()}>
      {icon}
      {children}
    </span>
  );
}
