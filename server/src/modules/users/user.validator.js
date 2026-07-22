import { z } from "zod/v4";

const passwordSchema = z
  .string()
  .min(8, "Password should be at least 8 characters")
  .max(100, "Password can be at most 100 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^a-zA-Z0-9]/,
    "Password must contain at least one special character"
  )
  .regex(/^\S+$/, "Password must not contain spaces");

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name should be at least 3 characters")
    .max(100, "Name can be at most 100 characters"),
  email: z.email("Please enter a valid email").trim().toLowerCase(),
  password: passwordSchema,
});

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Name should be at least 3 characters")
      .max(100, "Name can be at most 100 characters")
      .optional(),
    email: z.email("Please enter a valid email").trim().toLowerCase().optional(),
    password: passwordSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update",
  });

export const setUserDisabledSchema = z.object({
  isDisabled: z.boolean(),
});
