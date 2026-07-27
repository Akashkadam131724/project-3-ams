import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "primaryPill";

const variantClass: Record<ButtonVariant, string> = {
  primary: "ams-btn-primary",
  primaryPill: "ams-btn-primary-pill",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${variantClass[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
