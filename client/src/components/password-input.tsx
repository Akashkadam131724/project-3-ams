"use client";

import { useState } from "react";
import { IconEye, IconEyeOff } from "@/components/icons";

type PasswordInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  className?: string;
};

export function PasswordInput({
  id,
  value,
  onChange,
  required,
  autoComplete,
  className = "",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border border-zinc-300 bg-white py-2 pl-3 pr-10 text-sm outline-none transition-shadow placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <IconEyeOff className="h-5 w-5" />
        ) : (
          <IconEye className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
