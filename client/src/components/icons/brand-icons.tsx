import type { IconProps } from "./types";

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** AMS logo mark — stacked folders */
export function IconAmsLogo({ className = "h-6 w-6", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden {...props}>
      <path
        d="M4 10a2 2 0 0 1 2-2h6.5l2 2H26a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10Z"
        fill="currentColor"
        fillOpacity={0.15}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 6a2 2 0 0 1 2-2h5l1.5 1.5H24a2 2 0 0 1 2 2v2H6V6Z"
        fill="currentColor"
        fillOpacity={0.25}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** Project / workspace cube */
export function IconProject({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} {...props}>
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
      <path d="m4 7 8 4 8-4M12 11v10" />
    </svg>
  );
}
