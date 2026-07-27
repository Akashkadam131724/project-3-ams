import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: React.ReactNode;
  wrapperClassName?: string;
};

export function TextField({
  label,
  hint,
  id,
  wrapperClassName = "",
  className = "",
  ...props
}: TextFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={wrapperClassName}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <input id={fieldId} className={`ams-input mt-1.5 ${className}`} {...props} />
      {hint}
    </div>
  );
}
