import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});
