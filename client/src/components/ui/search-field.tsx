import { IconSearch } from "@/components/icons";

type SearchFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  compact?: boolean;
  className?: string;
  inputClassName?: string;
};

export function SearchField({
  id,
  value,
  onChange,
  placeholder = "Search",
  label = "Search",
  compact = false,
  className = "",
  inputClassName = "",
}: SearchFieldProps) {
  const iconClass = compact
    ? "pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
    : "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400";

  const inputPad = compact ? "py-1.5 pl-8 pr-2" : "py-2 pl-9 pr-3";
  const shape = compact ? "rounded-lg" : "rounded-full";

  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{label}</span>
      <IconSearch className={iconClass} />
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-zinc-300 bg-white text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 ${shape} ${inputPad} ${inputClassName}`}
      />
    </label>
  );
}
