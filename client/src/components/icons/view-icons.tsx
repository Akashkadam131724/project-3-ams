import type { IconProps } from "./types";

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconList({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconGrid({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconSortInactive({ className = "h-3.5 w-3.5 shrink-0", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`opacity-0 group-hover/sort:opacity-40 ${className}`}
      aria-hidden
      {...stroke}
      {...props}
    >
      <path d="M8 9h8M8 15h8" />
    </svg>
  );
}

export function IconSortAsc({ className = "h-3.5 w-3.5 shrink-0", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} {...props}>
      <path d="M12 5v14M5 12l7-7 7 7" />
    </svg>
  );
}

export function IconSortDesc({ className = "h-3.5 w-3.5 shrink-0", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} {...props}>
      <path d="M12 19V5M5 12l7 7 7-7" />
    </svg>
  );
}
