import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Table: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <table className={cn("min-w-full", className)}>{children}</table>
);

export const TableHeader: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <thead className={className}>{children}</thead>
);

export const TableBody: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <tbody className={className}>{children}</tbody>
);

export const TableRow: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <tr className={className}>{children}</tr>
);

export const TableCell: React.FC<{ children?: ReactNode; isHeader?: boolean; className?: string }> = ({
  children,
  isHeader = false,
  className,
}) => {
  const Tag = isHeader ? "th" : "td";
  return <Tag className={cn(className)}>{children}</Tag>;
};
